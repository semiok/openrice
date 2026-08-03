import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = JSON.parse(
  await readFile(path.join(root, "branding/openrice.json"), "utf8"),
);

const displayOnlyFiles = [
  "apps/web/app/(auth)/auth.config.ts",
  "apps/web/app/(chat)/api/preferences/embeddings/route.ts",
  "apps/web/app/(chat)/files/page.tsx",
  "apps/web/app/api/ai/v1/chat/completions/route.ts",
  "apps/web/app/api/ai/v1/images/lifestyle/intent/route.ts",
  "apps/web/components/add-platform-dialog.tsx",
  "apps/web/components/agent/focus-table-view.tsx",
  "apps/web/components/agent/insight-empty-state.tsx",
  "apps/web/components/agent/insight-tips-card.tsx",
  "apps/web/components/contact-us.tsx",
  "apps/web/components/dingtalk-auth-form.tsx",
  "apps/web/components/dingtalk-connect-success-alert.tsx",
  "apps/web/components/dingtalk-steps-dialog.tsx",
  "apps/web/components/feishu-auth-form.tsx",
  "apps/web/components/feishu-connect-success-alert.tsx",
  "apps/web/components/feishu-steps-dialog.tsx",
  "apps/web/components/imessage-auth-form.tsx",
  "apps/web/components/insight-detail-footer/hooks/use-reply-ai-assist.ts",
  "apps/web/components/integration-icon.tsx",
  "apps/web/components/loop/probe-error-callout.tsx",
  "apps/web/components/messenger-auth-form.tsx",
  "apps/web/components/personalization/personalization-avatar-settings.tsx",
  "apps/web/components/qqbot-auth-form.tsx",
  "apps/web/components/rss-integrations.tsx",
  "apps/web/components/rss-opml-import.tsx",
  "apps/web/components/saved-files.tsx",
  "apps/web/hooks/use-insight-avatar.ts",
  "apps/web/hooks/use-insight-refresh.ts",
  "apps/web/lib/loop/brief.ts",
  "apps/web/lib/loop/composio-bridge.ts",
  "apps/web/lib/loop/modules/ai-news-digest.ts",
  "apps/web/lib/loop/modules/memory-resurface.ts",
  "apps/web/lib/loop/runner.ts",
  "apps/web/lib/loop/wrap.ts",
  "packages/ai/src/agent/base.ts",
  "packages/shared/src/soul.ts",
  "apps/web/lib/ai/mcp/tools/chat-insight.ts",
  "apps/web/lib/ai/mcp/tools/insight-crud.ts",
  "apps/web/lib/ai/mcp/tools/raw-messages.ts",
  "apps/web/lib/ai/subagents/insights.ts",
  "apps/web/tests/api/image-generation.route.test.ts",
  "apps/web/tests/unit/lifestyle-image-intent-route.test.ts",
  "apps/web/tests/unit/shared-soul.test.ts",
];

const exactFileReplacements = {
  "apps/web/src-tauri/Cargo.toml": [
    [
      'description = "openloomi AI Assistant - Your Personal Productivity Tool"',
      'description = "OpenRice AI Assistant - Your Personal Productivity Tool"',
    ],
    ['authors = ["OpenLoomi Team"]', 'authors = ["OpenRice Team"]'],
  ],
  "apps/web/src-tauri/src/cli.rs": [
    ["No OpenLoomi auth token found.", "No OpenRice auth token found."],
    ["the OpenLoomi desktop app", "the OpenRice desktop app"],
    ["OpenLoomi agent API", "OpenRice agent API"],
    ["Start the OpenLoomi app", "Start the OpenRice app"],
  ],
  "apps/web/src-tauri/src/main.rs": [
    ["openloomi Tauri App", "OpenRice Tauri App"],
  ],
  "apps/web/src-tauri/src/system.rs": [
    [
      "Enable openloomi under System Settings",
      "Enable openrice under System Settings",
    ],
    ['"name": "openloomi"', '"name": "OpenRice"'],
  ],
  "apps/web/src-tauri/scripts/beautify-dmg.js": [
    ['appName: "openloomi"', 'appName: "openrice"'],
  ],
  "apps/web/lib/ai/extensions/agent/claude/index.ts": [
    ["restart openloomi", "restart OpenRice"],
    [
      "queries about openloomi's first-party",
      "queries about OpenRice's first-party",
    ],
    ["platforms that openloomi does NOT", "platforms that OpenRice does NOT"],
    ["the openloomi Desktop UI", "the OpenRice Desktop UI"],
  ],
  "apps/web/lib/ai/extensions/agent/codex/runtime-preflight.ts": [
    ["restart OpenLoomi", "restart OpenRice"],
    ["OpenLoomi could not determine", "OpenRice could not determine"],
    ['title: "OpenLoomi"', 'title: "OpenRice"'],
    [
      "Unsupported OpenLoomi preflight method",
      "Unsupported OpenRice preflight method",
    ],
  ],
  "apps/web/lib/ai/image-generation/service.ts": [
    ['title: "OpenLoomi"', 'title: "OpenRice"'],
  ],
  "apps/web/lib/ai/memory/chat-sync.ts": [['"🤖 openloomi"', '"🤖 OpenRice"']],
  "apps/web/lib/bots/send-reply.ts": [
    ["(By openloomi AI)", "(By OpenRice AI)"],
  ],
  "apps/web/lib/integrations/dingtalk/handler.ts": [
    ["You are the openloomi assistant.", "You are the OpenRice assistant."],
  ],
  "apps/web/lib/integrations/email/index.ts": [
    ["Image(s) attached via openloomi.", "Image(s) attached via OpenRice."],
  ],
  "apps/web/lib/integrations/feishu/handler.ts": [
    ["You are the openloomi assistant.", "You are the OpenRice assistant."],
  ],
  "apps/web/lib/integrations/imessage/self-message-listener.ts": [
    ["(By openloomi AI)", "(By OpenRice AI)"],
  ],
  "apps/web/lib/integrations/qqbot/handler.ts": [
    ["You are the openloomi assistant.", "You are the OpenRice assistant."],
  ],
  "apps/web/lib/integrations/telegram/user-listener.ts": [
    ["(By openloomi AI)", "(By OpenRice AI)"],
  ],
  "apps/web/lib/integrations/weixin/complete-weixin-integration.ts": [
    ["Chat with openloomi via Weixin", "Chat with OpenRice via Weixin"],
  ],
  "apps/web/lib/integrations/weixin/handler.ts": [
    ["You are the openloomi assistant.", "You are the OpenRice assistant."],
  ],
  "apps/web/lib/integrations/whatsapp/self-message-listener.ts": [
    ["(By openloomi AI)", "(By OpenRice AI)"],
  ],
  "apps/web/public/loomi-card.html": [
    ["Loop decision for openloomi", "Loop decision for OpenRice"],
    ["restarted OpenLoomi", "restarted OpenRice"],
  ],
  "packages/ai/rag/src/embedding-provider.ts": [
    [
      'headers["X-Title"] = "OpenLoomi AI"',
      'headers["X-Title"] = "OpenRice AI"',
    ],
  ],
  "packages/ai/rag/src/embeddings.ts": [
    ['"X-Title": "OpenLoomi AI"', '"X-Title": "OpenRice AI"'],
  ],
  "packages/rag/src/embeddings.ts": [
    ['"X-Title": "openloomi AI"', '"X-Title": "OpenRice AI"'],
  ],
  "packages/rag/src/universal-embeddings.ts": [
    [
      'headers["X-Title"] = "openloomi AI"',
      'headers["X-Title"] = "OpenRice AI"',
    ],
  ],
  "packages/integrations/dingtalk/src/index.ts": [
    ['title: "openloomi"', 'title: "OpenRice"'],
  ],
  "packages/integrations/imessage/src/adapter.ts": [
    [
      "such as Terminal, Node, or openloomi",
      "such as Terminal, Node, or OpenRice",
    ],
  ],
  "packages/integrations/whatsapp/src/adapter.ts": [
    ['browser: ["openloomi", "Desktop"', 'browser: ["OpenRice", "Desktop"'],
  ],
};

const jsonFiles = {
  "plugins/codex/.codex-plugin/plugin.json": (data) => {
    data.description = data.description.replace(/OpenLoomi/g, brand.name);
    data.author.name = brand.name;
    data.homepage = brand.webUrl;
    data.interface.displayName = brand.name;
    data.interface.shortDescription = data.interface.shortDescription.replace(
      /OpenLoomi/g,
      brand.name,
    );
    data.interface.longDescription = data.interface.longDescription.replace(
      /OpenLoomi/g,
      brand.name,
    );
    data.interface.developerName = brand.name;
    data.interface.defaultPrompt = data.interface.defaultPrompt.map((prompt) =>
      prompt.replace(/OpenLoomi/g, brand.name),
    );
    return data;
  },
  ".agents/plugins/marketplace.json": (data) => {
    data.interface.displayName = brand.name;
    return data;
  },
  ".claude-plugin/marketplace.json": (data) => {
    data.owner.name = brand.name;
    delete data.owner.email;
    data.metadata.description = `${brand.name} local-first runtime plugins for Claude`;
    data.metadata.homepage = brand.webUrl;
    data.metadata.repository = brand.repository;
    const plugin = data.plugins[0];
    plugin.description = plugin.description.replace(/OpenLoomi/g, brand.name);
    plugin.author.name = brand.name;
    plugin.homepage = brand.webUrl;
    plugin.repository = `${brand.repository}/tree/main/plugins/claude`;
    return data;
  },
};

const readmeFiles = ["README.md", "README-zh.md", "README-ja.md"];
const pluginDocRoots = ["plugins/codex", "plugins/claude", "skills"];
const quotedDisplayRoots = ["packages/ai/mcp/src/tools"];
const quotedDisplayFiles = [
  "apps/web/lib/ai/extensions/agent/codex/metadata.ts",
  "apps/web/lib/ai/extensions/agent/opencode/metadata.ts",
  "apps/web/lib/ai/extensions/agent/claude/runtime/supplemental-hooks.ts",
];

const assetCopies = [
  ["branding/assets/openrice-256.png", "apps/web/public/images/logo_web.png"],
  ["branding/assets/openrice-256.png", "apps/web/public/images/logo_tauri.png"],
  ["branding/assets/openrice-256.png", "plugins/codex/assets/logo.png"],
  ["branding/assets/openrice-1024.png", "apps/web/app/icon.png"],
];

function replaceDisplayBrand(source) {
  const compatibilityCorrections = [
    ["@OpenRice/", `${brand.compatibility.packageScope}/`],
    ["OpenRice-lifestyle-image", "openloomi-lifestyle-image"],
    ["OpenRice_ai_reply_cache_", "openloomi_ai_reply_cache_"],
  ];
  const protectedValues = [
    brand.compatibility.packageScope,
    brand.compatibility.environmentPrefix,
    brand.compatibility.eventPrefix,
    brand.compatibility.cli,
    ".openloomi",
    "openloomi.",
    "openloomi_",
    "openloomi-",
  ];
  const placeholders = protectedValues.map((value, index) => [
    value,
    `__OPENRICE_COMPAT_${index}__`,
  ]);
  let branded = source;
  for (const [from, to] of compatibilityCorrections) {
    branded = branded.replaceAll(from, to);
  }
  for (const [value, placeholder] of placeholders) {
    branded = branded.replaceAll(value, placeholder);
  }
  branded = branded
    .replaceAll("OpenLoomi", brand.name)
    .replaceAll("openloomi", brand.name);
  for (const [value, placeholder] of placeholders) {
    branded = branded.replaceAll(placeholder, value);
  }
  return branded;
}

function replaceBrandInQuotedStrings(source) {
  return source
    .replace(/"(?:\\.|[^"\\])*"/g, (value) =>
      value.replaceAll("OpenLoomi", brand.name),
    )
    .replace(/'(?:\\.|[^'\\])*'/g, (value) =>
      value.replaceAll("OpenLoomi", brand.name),
    );
}

async function writeTextIfChanged(relativePath, next) {
  const absolutePath = path.join(root, relativePath);
  const current = await readFile(absolutePath, "utf8");
  if (current !== next) {
    await writeFile(absolutePath, next);
    process.stdout.write(`updated ${relativePath}\n`);
  }
}

async function applyBranding() {
  for (const relativePath of displayOnlyFiles) {
    const source = await readFile(path.join(root, relativePath), "utf8");
    await writeTextIfChanged(relativePath, replaceDisplayBrand(source));
  }

  for (const [relativePath, replacements] of Object.entries(
    exactFileReplacements,
  )) {
    let source = await readFile(path.join(root, relativePath), "utf8");
    for (const [from, to] of replacements) {
      source = source.replaceAll(from, to);
    }
    await writeTextIfChanged(relativePath, source);
  }

  for (const [relativePath, transform] of Object.entries(jsonFiles)) {
    const source = await readFile(path.join(root, relativePath), "utf8");
    const data = transform(JSON.parse(source));
    await writeTextIfChanged(
      relativePath,
      `${JSON.stringify(data, null, 2)}\n`,
    );
  }

  for (const relativePath of readmeFiles) {
    let source = await readFile(path.join(root, relativePath), "utf8");
    source = source.replaceAll("OpenLoomi", brand.name);
    source = source
      .replaceAll("upstream OpenRice data", "upstream OpenLoomi data")
      .replaceAll("上游 OpenRice 的", "上游 OpenLoomi 的")
      .replaceAll("上流 OpenRice の", "上流 OpenLoomi の");
    await writeTextIfChanged(relativePath, source);
  }

  for (const relativeRoot of pluginDocRoots) {
    const absoluteRoot = path.join(root, relativeRoot);
    const entries = await readdir(absoluteRoot, { recursive: true });
    for (const entry of entries) {
      if (!entry.endsWith("SKILL.md") && !entry.endsWith("README.md")) {
        continue;
      }
      const relativePath = path.join(relativeRoot, entry);
      let source = await readFile(path.join(root, relativePath), "utf8");
      source = source
        .replaceAll("OpenLoomi", brand.name)
        .replace(/^description: "openloomi/m, 'description: "OpenRice');
      await writeTextIfChanged(relativePath, source);
    }
  }

  for (const relativeRoot of quotedDisplayRoots) {
    const absoluteRoot = path.join(root, relativeRoot);
    const entries = await readdir(absoluteRoot, { recursive: true });
    for (const entry of entries) {
      if (!entry.endsWith(".ts") && !entry.endsWith(".tsx")) {
        continue;
      }
      const relativePath = path.join(relativeRoot, entry);
      const source = await readFile(path.join(root, relativePath), "utf8");
      await writeTextIfChanged(
        relativePath,
        replaceBrandInQuotedStrings(source),
      );
    }
  }

  for (const relativePath of quotedDisplayFiles) {
    const source = await readFile(path.join(root, relativePath), "utf8");
    await writeTextIfChanged(relativePath, replaceBrandInQuotedStrings(source));
  }

  for (const [from, to] of assetCopies) {
    const destination = path.join(root, to);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(root, from), destination);
  }
}

async function sha256(relativePath) {
  const contents = await readFile(path.join(root, relativePath));
  return createHash("sha256").update(contents).digest("hex");
}

async function checkBranding() {
  const failures = [];

  for (const relativePath of displayOnlyFiles) {
    const source = await readFile(path.join(root, relativePath), "utf8");
    const displaySource = source
      .replaceAll(brand.compatibility.packageScope, "")
      .replaceAll(brand.compatibility.environmentPrefix, "")
      .replaceAll(brand.compatibility.eventPrefix, "")
      .replaceAll(brand.compatibility.cli, "")
      .replaceAll(".openloomi", "")
      .replaceAll("openloomi.", "")
      .replaceAll("openloomi_", "")
      .replaceAll("openloomi-", "");
    if (/OpenLoomi|openloomi/.test(displaySource)) {
      failures.push(
        `${relativePath}: old brand remains in a display-only file`,
      );
    }
    if (source.includes("@OpenRice/")) {
      failures.push(`${relativePath}: package scope was incorrectly rebranded`);
    }
  }

  for (const [relativePath, replacements] of Object.entries(
    exactFileReplacements,
  )) {
    const source = await readFile(path.join(root, relativePath), "utf8");
    for (const [from, to] of replacements) {
      if (source.includes(from) || !source.includes(to)) {
        failures.push(
          `${relativePath}: expected branded text is missing: ${to}`,
        );
      }
    }
  }

  const codexManifest = JSON.parse(
    await readFile(
      path.join(root, "plugins/codex/.codex-plugin/plugin.json"),
      "utf8",
    ),
  );
  if (codexManifest.name !== brand.compatibility.pluginId) {
    failures.push("Codex plugin compatibility ID changed");
  }
  if (codexManifest.interface.displayName !== brand.name) {
    failures.push("Codex plugin display name is not OpenRice");
  }

  for (const relativePath of readmeFiles) {
    const source = await readFile(path.join(root, relativePath), "utf8");
    if (!source.includes("## OpenRice")) {
      failures.push(`${relativePath}: OpenRice heading is missing`);
    }
    if (
      source.includes("logo-text.png") ||
      source.includes("logo-text-dark.png")
    ) {
      failures.push(`${relativePath}: legacy text logo is still referenced`);
    }
  }

  for (const relativeRoot of pluginDocRoots) {
    const absoluteRoot = path.join(root, relativeRoot);
    const entries = await readdir(absoluteRoot, { recursive: true });
    for (const entry of entries) {
      if (!entry.endsWith("SKILL.md") && !entry.endsWith("README.md")) {
        continue;
      }
      const relativePath = path.join(relativeRoot, entry);
      const source = await readFile(path.join(root, relativePath), "utf8");
      if (source.includes("OpenLoomi")) {
        failures.push(`${relativePath}: old display brand remains`);
      }
      if (/^description: "openloomi/m.test(source)) {
        failures.push(`${relativePath}: skill description uses the old brand`);
      }
    }
  }

  for (const relativeRoot of quotedDisplayRoots) {
    const absoluteRoot = path.join(root, relativeRoot);
    const entries = await readdir(absoluteRoot, { recursive: true });
    for (const entry of entries) {
      if (!entry.endsWith(".ts") && !entry.endsWith(".tsx")) {
        continue;
      }
      const relativePath = path.join(relativeRoot, entry);
      const source = await readFile(path.join(root, relativePath), "utf8");
      if (replaceBrandInQuotedStrings(source) !== source) {
        failures.push(`${relativePath}: old brand remains in a quoted string`);
      }
    }
  }

  for (const relativePath of quotedDisplayFiles) {
    const source = await readFile(path.join(root, relativePath), "utf8");
    if (replaceBrandInQuotedStrings(source) !== source) {
      failures.push(`${relativePath}: old brand remains in a quoted string`);
    }
  }

  for (const [source, destination] of assetCopies) {
    if ((await sha256(source)) !== (await sha256(destination))) {
      failures.push(`${destination}: brand asset differs from ${source}`);
    }
  }

  if (failures.length > 0) {
    process.stderr.write(
      `OpenRice brand check failed:\n- ${failures.join("\n- ")}\n`,
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    "OpenRice brand check passed; compatibility identifiers remain unchanged.\n",
  );
}

const mode = process.argv[2];
if (mode === "--apply") {
  await applyBranding();
  await checkBranding();
} else if (mode === "--check") {
  await checkBranding();
} else {
  process.stderr.write(
    "Usage: node scripts/openrice-branding.mjs --apply|--check\n",
  );
  process.exitCode = 2;
}
