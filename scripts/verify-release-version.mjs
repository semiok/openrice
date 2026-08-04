import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readCargoVersion(relativePath) {
  const contents = fs.readFileSync(path.join(root, relativePath), "utf8");
  const match = contents.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error(`No package version found in ${relativePath}`);
  }
  return match[1];
}

const versions = new Map([
  ["package.json", readJson("package.json").version],
  ["apps/web/package.json", readJson("apps/web/package.json").version],
  [
    "apps/web/src-tauri/Cargo.toml",
    readCargoVersion("apps/web/src-tauri/Cargo.toml"),
  ],
  [
    "apps/web/src-tauri/tauri.conf.json",
    readJson("apps/web/src-tauri/tauri.conf.json").version,
  ],
  [
    "apps/web/src-tauri/tauri.conf.dev.json",
    readJson("apps/web/src-tauri/tauri.conf.dev.json").version,
  ],
]);

const uniqueVersions = new Set(versions.values());
if (uniqueVersions.size !== 1) {
  for (const [file, version] of versions) {
    console.error(`${file}: ${version}`);
  }
  throw new Error("Release version sources do not agree");
}

const [version] = uniqueVersions;
const refName = process.env.GITHUB_REF_NAME || "";
const isReleaseTag =
  process.env.GITHUB_REF_TYPE === "tag" && refName.startsWith("v");
if (isReleaseTag && refName.slice(1) !== version) {
  throw new Error(
    `Release tag ${refName} does not match application version ${version}`,
  );
}

console.log(`OpenRice release version verified: ${version}`);
