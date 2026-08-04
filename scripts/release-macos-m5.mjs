#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function fail(message) {
  console.error(`[release:m5] ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  console.log(`\n[release:m5] ${command} ${args.join(" ")}`);
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: { ...process.env, ...options.env },
  });
}

function capture(command, args) {
  return run(command, args, { capture: true }).trim();
}

function parseArgs(argv) {
  const options = {
    allowDirty: false,
    allowNonMain: false,
    checkOnly: false,
    createDraft: false,
    dispatchIntel: false,
    skipInstall: false,
    unsigned: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    else if (argument === "--allow-dirty") options.allowDirty = true;
    else if (argument === "--allow-non-main") options.allowNonMain = true;
    else if (argument === "--check-only") options.checkOnly = true;
    else if (argument === "--create-draft") options.createDraft = true;
    else if (argument === "--dispatch-intel") options.dispatchIntel = true;
    else if (argument === "--skip-install") options.skipInstall = true;
    else if (argument === "--unsigned") options.unsigned = true;
    else if (argument === "--notary-profile") {
      options.notaryProfile = argv[++index];
    } else if (argument === "--signing-identity") {
      options.signingIdentity = argv[++index];
    } else {
      fail(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function readVersion() {
  return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
    .version;
}

function detectSigningIdentity() {
  const identities = capture("security", [
    "find-identity",
    "-v",
    "-p",
    "codesigning",
  ]);
  const match = identities.match(/"(Developer ID Application:[^"]+)"/);
  return match?.[1] ?? "";
}

function verifyHost() {
  if (process.platform !== "darwin" || process.arch !== "arm64") {
    fail("Apple Silicon releases must run on the designated macOS ARM64 host");
  }

  const cpu = capture("sysctl", ["-n", "machdep.cpu.brand_string"]);
  console.log(`[release:m5] Host: ${os.hostname()} (${cpu})`);
}

function verifyRepository(options) {
  run("node", ["scripts/verify-release-version.mjs"]);

  const branch = capture("git", ["branch", "--show-current"]);
  const commit = capture("git", ["rev-parse", "HEAD"]);
  const status = capture("git", ["status", "--porcelain"]);

  if (!options.allowDirty && status) {
    fail("Working tree is not clean; commit or stash changes before release");
  }
  if (!options.unsigned && !options.allowNonMain && branch !== "main") {
    fail(
      `Signed releases must be built from main, not ${branch || "detached HEAD"}`,
    );
  }

  return { branch, commit, version: readVersion() };
}

function verifyTools() {
  run("pnpm", ["--version"], { capture: true });
  run("rustup", ["show", "active-toolchain"], { capture: true });
  for (const command of [
    "codesign",
    "xcrun",
    "hdiutil",
    "security",
    "shasum",
  ]) {
    run("which", [command], { capture: true });
  }
}

function createDraftRelease({ commit, version }, dmgPath) {
  const tag = `v${version}`;
  const notesPath = path.join(root, "docs", "releases", `${tag}.md`);
  const commonArgs = ["--repo", "semiok/openrice"];

  try {
    const state = JSON.parse(
      capture("gh", [
        "release",
        "view",
        tag,
        ...commonArgs,
        "--json",
        "isDraft",
      ]),
    );
    if (!state.isDraft)
      fail(`${tag} already exists and is not a draft release`);
    run("gh", ["release", "upload", tag, dmgPath, "--clobber", ...commonArgs]);
  } catch (error) {
    if (error?.status === 1) {
      const args = [
        "release",
        "create",
        tag,
        dmgPath,
        "--draft",
        "--target",
        commit,
        "--title",
        `OpenRice ${tag}`,
        ...commonArgs,
      ];
      if (fs.existsSync(notesPath)) args.push("--notes-file", notesPath);
      else args.push("--generate-notes");
      run("gh", args);
    } else {
      throw error;
    }
  }

  return tag;
}

function prepareLocalBuildFiles() {
  const envPath = path.join(root, "apps/web/.env");
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, "API_TIMEOUT_MS=3000000\nIS_TAURI=true\n");
    console.log(
      `[release:m5] Created minimal local build environment: ${envPath}`,
    );
  }

  const nativeSource = path.join(
    root,
    "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
  );
  const nativeTarget = path.join(
    root,
    "node_modules/@photon-ai/imessage-kit/node_modules/better-sqlite3/build/better_sqlite3.node",
  );
  if (!fs.existsSync(nativeSource)) {
    fail(`Native better-sqlite3 module was not generated: ${nativeSource}`);
  }
  fs.mkdirSync(path.dirname(nativeTarget), { recursive: true });
  fs.copyFileSync(nativeSource, nativeTarget);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.unsigned && (options.createDraft || options.dispatchIntel)) {
    fail("Unsigned RCs cannot create or populate a GitHub draft release");
  }
  if (options.dispatchIntel && !options.createDraft) {
    fail("--dispatch-intel requires --create-draft");
  }
  verifyHost();
  verifyTools();
  const release = verifyRepository(options);

  let signingIdentity = options.signingIdentity;
  if (!options.unsigned) {
    signingIdentity ||= detectSigningIdentity();
    if (!signingIdentity)
      fail("No Developer ID Application identity was found");
    if (!options.notaryProfile) {
      fail(
        "Signed releases require --notary-profile stored in the macOS Keychain",
      );
    }
  }

  console.log(
    `[release:m5] ${release.version} @ ${release.commit} (${release.branch || "detached"})`,
  );
  console.log(
    `[release:m5] Mode: ${options.unsigned ? "internal unsigned RC" : "signed and notarized RC"}`,
  );

  if (options.checkOnly) return;

  if (!options.skipInstall) run("pnpm", ["install", "--frozen-lockfile"]);
  run("pnpm", ["rebuild", "better-sqlite3"]);
  prepareLocalBuildFiles();

  const buildEnv = options.unsigned
    ? { SKIP_SIGNING: "true", SKIP_RENDER_ENGINE_PREFLIGHT: "true" }
    : {
        APPLE_SIGNING_IDENTITY: signingIdentity,
        SIGNING_IDENTITY: signingIdentity,
        SKIP_SIGNING: "false",
        SKIP_RENDER_ENGINE_PREFLIGHT: "true",
      };
  run("pnpm", ["tauri:build"], { env: buildEnv });

  const appPath = path.join(
    root,
    "apps/web/src-tauri/target/release/bundle/macos/openrice.app",
  );
  if (!fs.existsSync(appPath)) fail(`App bundle was not generated: ${appPath}`);

  if (options.unsigned) {
    run("codesign", [
      "--force",
      "--deep",
      "--sign",
      "-",
      "--identifier",
      "ai.traditionow.openrice",
      appPath,
    ]);
  }

  run("node", [
    "apps/web/scripts/check-cli-bundled.js",
    appPath,
    "--platform",
    "macos",
  ]);
  run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);

  const dmgPath = path.join(
    root,
    options.unsigned
      ? `apps/web/src-tauri/target/release/bundle/dmg/openrice_${release.version}_macOS_aarch64-internal-rc.dmg`
      : `apps/web/src-tauri/target/release/bundle/dmg/openrice_${release.version}_macOS_aarch64.dmg`,
  );
  fs.mkdirSync(path.dirname(dmgPath), { recursive: true });
  fs.rmSync(dmgPath, { force: true });
  run("node", [
    "apps/web/src-tauri/scripts/beautify-dmg.js",
    appPath,
    dmgPath,
    "--app-name",
    "openrice",
    "--bg",
    "apps/web/src-tauri/icons/dmg-background@2x.png",
  ]);

  if (!options.unsigned) {
    run("xcrun", [
      "notarytool",
      "submit",
      dmgPath,
      "--keychain-profile",
      options.notaryProfile,
      "--wait",
    ]);
    run("xcrun", ["stapler", "staple", dmgPath]);
    run("xcrun", ["stapler", "validate", dmgPath]);
  }

  run("hdiutil", ["verify", dmgPath]);
  const checksum = capture("shasum", ["-a", "256", dmgPath]).split(/\s+/)[0];
  console.log(`\n[release:m5] DMG: ${dmgPath}`);
  console.log(`[release:m5] SHA-256: ${checksum}`);

  let draftTag = "";
  if (options.createDraft) draftTag = createDraftRelease(release, dmgPath);
  if (options.dispatchIntel) {
    run("gh", [
      "workflow",
      "run",
      "release.yml",
      "--repo",
      "semiok/openrice",
      "--ref",
      "main",
      "-f",
      `commit_sha=${release.commit}`,
      "-f",
      "target=macos-intel",
      "-f",
      "unsigned_macos=false",
      "-f",
      `draft_tag=${draftTag}`,
    ]);
  }
}

main();
