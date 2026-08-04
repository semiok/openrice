"use client";

import { useEffect } from "react";
import i18n, {
  detectAndSetLanguage,
  getSystemLanguage,
  isLanguageUserSelected,
} from "@/i18n";

// Ensure i18n config is imported and initialized
import "@/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only detect and set language after client mount
    void detectAndSetLanguage().catch((error) => {
      console.warn("[i18n] Failed to detect the startup language:", error);
    });

    /**
     * Keep UI language synced with OS/browser language when user enabled follow-system mode.
     */
    const handleSystemLanguageChange = () => {
      if (isLanguageUserSelected()) return;
      void i18n.changeLanguage(getSystemLanguage()).catch((error) => {
        console.warn("[i18n] Failed to apply the system language:", error);
      });
    };

    window.addEventListener("languagechange", handleSystemLanguageChange);
    return () => {
      window.removeEventListener("languagechange", handleSystemLanguageChange);
    };
  }, []);

  return <>{children}</>;
}
