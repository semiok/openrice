import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const operatingSystemMocks = vi.hoisted(() => ({
  home: "",
}));

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    homedir: () => operatingSystemMocks.home,
  };
});

const { PATCH } = await import("@/app/api/workspace/skills/metadata/route");
const { GET } = await import("@/app/api/workspace/skills/route");
const { DELETE } = await import("@/app/api/workspace/skills/[skillId]/route");

function metadataPath(): string {
  return join(operatingSystemMocks.home, ".openloomi", "skill-metadata.json");
}

function patchMetadata(body: unknown): Promise<Response> {
  return PATCH(
    new NextRequest("http://localhost/api/workspace/skills/metadata", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("favorite skill metadata", () => {
  beforeEach(() => {
    operatingSystemMocks.home = mkdtempSync(
      join(tmpdir(), "openrice-skills-favorites-"),
    );
  });

  afterEach(() => {
    rmSync(operatingSystemMocks.home, { recursive: true, force: true });
  });

  it("persists favorite state by stable skill ID without losing avatar metadata", async () => {
    mkdirSync(join(operatingSystemMocks.home, ".openloomi"), {
      recursive: true,
    });
    writeFileSync(
      metadataPath(),
      JSON.stringify({ "skill-alpha": { avatar: "🎯" } }),
      "utf8",
    );

    const response = await patchMetadata({
      skillId: "skill-alpha",
      favorite: true,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      favorite: true,
    });
    expect(JSON.parse(readFileSync(metadataPath(), "utf8"))).toEqual({
      "skill-alpha": { avatar: "🎯", favorite: true },
    });
  });

  it("returns favorite state with discovered skills and defaults new skills off", async () => {
    const skillsDir = join(operatingSystemMocks.home, ".openloomi", "skills");
    mkdirSync(join(skillsDir, "skill-alpha"), { recursive: true });
    mkdirSync(join(skillsDir, "skill-beta"), { recursive: true });
    writeFileSync(
      join(skillsDir, "skill-alpha", "SKILL.md"),
      "---\nname: Alpha\nenabled: true\n---\n",
      "utf8",
    );
    writeFileSync(
      join(skillsDir, "skill-beta", "SKILL.md"),
      "---\nname: Beta\nenabled: true\n---\n",
      "utf8",
    );
    writeFileSync(
      metadataPath(),
      JSON.stringify({ "skill-alpha": { favorite: true } }),
      "utf8",
    );

    const response = await GET();
    const data = await response.json();

    expect(data.skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "skill-alpha", favorite: true }),
        expect.objectContaining({ id: "skill-beta", favorite: false }),
      ]),
    );
  });

  it("removes only favorite state when the switch is turned off", async () => {
    mkdirSync(join(operatingSystemMocks.home, ".openloomi"), {
      recursive: true,
    });
    writeFileSync(
      metadataPath(),
      JSON.stringify({
        "skill-alpha": { avatar: "🎯", favorite: true },
      }),
      "utf8",
    );

    const response = await patchMetadata({
      skillId: "skill-alpha",
      favorite: false,
    });

    expect(response.status).toBe(200);
    expect(JSON.parse(readFileSync(metadataPath(), "utf8"))).toEqual({
      "skill-alpha": { avatar: "🎯" },
    });
  });

  it("cleans favorite metadata when a local skill is deleted", async () => {
    const skillPath = join(
      operatingSystemMocks.home,
      ".openloomi",
      "skills",
      "skill-alpha",
    );
    mkdirSync(skillPath, { recursive: true });
    writeFileSync(
      join(skillPath, "SKILL.md"),
      "---\nname: Alpha\n---\n",
      "utf8",
    );
    writeFileSync(
      metadataPath(),
      JSON.stringify({ "skill-alpha": { favorite: true } }),
      "utf8",
    );

    const response = await DELETE(
      new NextRequest("http://localhost/api/workspace/skills/skill-alpha", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ skillId: "skill-alpha" }) },
    );

    expect(response.status).toBe(200);
    expect(existsSync(skillPath)).toBe(false);
    expect(JSON.parse(readFileSync(metadataPath(), "utf8"))).toEqual({});
  });
});
