/**
 * Skills Metadata API Route
 * PATCH: Update single skill metadata (e.g. avatar or favorite state)
 * Read/write ~/.openloomi/skill-metadata.json, only allows .openloomi path under homedir
 */

import { type NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { APP_DIR_NAME } from "@/lib/env/config/constants";

function getopenloomiDir(): string {
  return join(homedir(), APP_DIR_NAME);
}

function getSkillMetadataPath(): string {
  return join(getopenloomiDir(), "skill-metadata.json");
}

/** Ensure metadata file directory exists and write JSON */
type SkillMetadata = {
  avatar?: string;
  favorite?: boolean;
};

function writeSkillMetadata(
  data: Record<string, SkillMetadata>,
): { success: boolean; error?: string } {
  try {
    const dir = getopenloomiDir();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const path = getSkillMetadataPath();
    writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
    return { success: true };
  } catch (e) {
    console.error("[SkillsMetadata] Write error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Write failed",
    };
  }
}

function readSkillMetadata(): Record<string, SkillMetadata> {
  const path = getSkillMetadataPath();
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return {};
    return data as Record<string, SkillMetadata>;
  } catch {
    return {};
  }
}

/**
 * PATCH /api/workspace/skills/metadata
 * Body: { skillId: string, avatar?: string, favorite?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillId, avatar, favorite } = body;

    if (typeof skillId !== "string" || !skillId.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid skillId" },
        { status: 400 },
      );
    }

    if (avatar === undefined && favorite === undefined) {
      return NextResponse.json(
        { success: false, error: "No metadata fields provided" },
        { status: 400 },
      );
    }

    if (favorite !== undefined && typeof favorite !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid favorite value" },
        { status: 400 },
      );
    }

    const metadata = readSkillMetadata();
    if (avatar !== undefined && (avatar === null || avatar === "")) {
      if (metadata[skillId]) {
        metadata[skillId].avatar = undefined;
      }
    } else if (avatar !== undefined) {
      metadata[skillId] = { ...metadata[skillId], avatar: String(avatar) };
    }

    if (favorite === true) {
      metadata[skillId] = { ...metadata[skillId], favorite: true };
    } else if (favorite === false && metadata[skillId]) {
      metadata[skillId].favorite = undefined;
    }

    const entry = metadata[skillId];
    if (
      entry &&
      (Object.keys(entry) as (keyof SkillMetadata)[]).every(
        (key) => entry[key] === undefined,
      )
    ) {
      delete metadata[skillId];
    }

    const result = writeSkillMetadata(metadata);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatar: metadata[skillId]?.avatar,
      favorite: metadata[skillId]?.favorite ?? false,
    });
  } catch (e) {
    console.error("[SkillsMetadata] PATCH error:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Update failed",
      },
      { status: 500 },
    );
  }
}
