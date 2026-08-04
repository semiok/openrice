import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const changeLanguage = vi.fn();
  const getSystemLocale = vi.fn();
  const i18n = {
    changeLanguage,
    init: vi.fn(),
    use: vi.fn(),
  };
  i18n.use.mockReturnValue(i18n);

  return { changeLanguage, getSystemLocale, i18n };
});

vi.mock("i18next", () => ({ default: mocks.i18n }));
vi.mock("i18next-browser-languagedetector", () => ({
  default: class LanguageDetector {},
}));
vi.mock("react-i18next", () => ({ initReactI18next: {} }));
vi.mock("@/lib/tauri", () => ({
  getSystemLocale: mocks.getSystemLocale,
}));

import {
  detectAndSetLanguage,
  isLanguageUserSelected,
  saveLanguage,
} from "@/i18n";

const createStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() {
      return values.size;
    },
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  } as Storage;
};

describe("i18n storage fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.changeLanguage.mockResolvedValue(undefined);
    mocks.getSystemLocale.mockResolvedValue(null);
    vi.stubGlobal("navigator", { language: "zh-CN" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the browser language when localStorage access is denied", async () => {
    const restrictedWindow = {};
    Object.defineProperty(restrictedWindow, "localStorage", {
      configurable: true,
      get() {
        const error = new Error("Access is denied for this document");
        error.name = "SecurityError";
        throw error;
      },
    });
    vi.stubGlobal("window", restrictedWindow);

    await expect(detectAndSetLanguage()).resolves.toBeUndefined();

    expect(mocks.getSystemLocale).toHaveBeenCalledOnce();
    expect(mocks.changeLanguage).toHaveBeenCalledWith("zh-Hans");
    expect(isLanguageUserSelected()).toBe(false);
    expect(() => saveLanguage("en-US")).not.toThrow();
  });

  it("keeps an explicit saved language when storage is available", async () => {
    const storage = createStorage({
      langbot_language: "zh-Hans",
      langbot_language_user_selected: "true",
    });
    vi.stubGlobal("window", { localStorage: storage });

    await detectAndSetLanguage();

    expect(mocks.getSystemLocale).not.toHaveBeenCalled();
    expect(mocks.changeLanguage).toHaveBeenCalledWith("zh-Hans");
    expect(isLanguageUserSelected()).toBe(true);
  });

  it("does not throw when storage methods reject persistence", async () => {
    const storage = createStorage();
    vi.mocked(storage.getItem).mockImplementation(() => {
      throw new Error("Storage access denied");
    });
    vi.mocked(storage.setItem).mockImplementation(() => {
      throw new Error("Storage access denied");
    });
    vi.stubGlobal("window", { localStorage: storage });

    await expect(detectAndSetLanguage()).resolves.toBeUndefined();
    expect(() => saveLanguage("system")).not.toThrow();
    expect(mocks.changeLanguage).toHaveBeenCalledWith("zh-Hans");
  });
});
