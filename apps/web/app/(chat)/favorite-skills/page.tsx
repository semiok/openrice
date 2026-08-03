"use client";

import { PageSectionHeader } from "@openloomi/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SkillsPanel, type Skill } from "@/components/skills-panel";
import { isTauri } from "@/lib/tauri";
import "../../../i18n";

/**
 * Favorite Skills reuses the library card surface and keeps only skills that
 * are both favorited and enabled. Favorite state lives in the shared skill
 * metadata file, keyed by the stable skill ID.
 */
export default function FavoriteSkillsPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [directories, setDirectories] = useState<{
    agent: string;
    openloomi: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadSkills = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/workspace/skills");
      const data = await response.json();
      if (data.success) {
        setSkills(data.skills ?? []);
        setDirectories(data.directories ?? null);
      }
    } catch (error) {
      console.error("[FavoriteSkillsPage] Failed to load skills:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && isTauri()) {
      loadSkills();
    }
  }, [mounted, loadSkills]);

  const favoriteSkills = useMemo(
    () =>
      skills.filter(
        (skill) => skill.favorite === true && skill.enabled !== false,
      ),
    [skills],
  );

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-muted-foreground">
        <p className="text-sm">{t("common.loading", "Loading...")}</p>
      </div>
    );
  }

  if (!isTauri()) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-8">
        <h1 className="text-2xl font-semibold">
          {t("nav.favoriteSkills", "Favorite Skills")}
        </h1>
        <p className="text-muted-foreground">
          {t(
            "agent.panels.workspacePanel.skillsTauriOnly",
            "Skills are only available in the OpenRice desktop app.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-[60vh] h-full min-h-0 flex-col">
      <PageSectionHeader title={t("nav.favoriteSkills", "Favorite Skills")} />
      <SkillsPanel
        className="flex-1"
        skills={favoriteSkills}
        directories={directories}
        isLoading={isLoading}
        onRefresh={loadSkills}
        onOpenLocalFolder={() => {}}
        onCreateSkill={() => {}}
        hideEmptyStateAddSkill
        emptyTitle={t(
          "personalization.skillsSettings.noFavoriteSkills",
          "No favorite skills yet",
        )}
        emptyDescription={t(
          "personalization.skillsSettings.favoriteSkillsHint",
          "Mark a skill as favorite from its options menu.",
        )}
      />
    </div>
  );
}
