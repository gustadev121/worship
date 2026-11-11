import { describe, expect, test } from "bun:test";
import {
  applyThemeToDocument,
  parseThemeCookie,
  serializeThemeCookie,
} from "@/presentation/hooks/use-theme";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/presentation/theme/tokens";

describe("useTheme token and cookie utilities", () => {
  test("DEFAULT_THEME defaults strictly to dark mode", () => {
    expect(DEFAULT_THEME).toBe("dark");
  });

  test("THEME_STORAGE_KEY is worshipflow_theme", () => {
    expect(THEME_STORAGE_KEY).toBe("worshipflow_theme");
  });

  describe("parseThemeCookie", () => {
    test("parses dark theme from single cookie", () => {
      expect(parseThemeCookie("worshipflow_theme=dark")).toBe("dark");
    });

    test("parses light theme from multiple cookies", () => {
      const cookieStr =
        "session=abc123xyz; worshipflow_theme=light; other_pref=true";
      expect(parseThemeCookie(cookieStr)).toBe("light");
    });

    test("returns null when cookie key is absent", () => {
      expect(parseThemeCookie("session=abc123xyz; pref=1")).toBeNull();
      expect(parseThemeCookie("")).toBeNull();
    });

    test("returns null when cookie value is unrecognized", () => {
      expect(parseThemeCookie("worshipflow_theme=sepia")).toBeNull();
      expect(parseThemeCookie("worshipflow_theme=auto")).toBeNull();
    });
  });

  describe("serializeThemeCookie", () => {
    test("serializes dark theme with standard security flags", () => {
      const cookie = serializeThemeCookie("dark", false);
      expect(cookie).toContain("worshipflow_theme=dark");
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("Max-Age=31536000");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).not.toContain("Secure");
    });

    test("includes Secure flag when HTTPS is active", () => {
      const cookie = serializeThemeCookie("light", true);
      expect(cookie).toContain("worshipflow_theme=light");
      expect(cookie).toContain("Secure");
    });
  });

  describe("applyThemeToDocument", () => {
    test("applies light theme attributes to mock document root", () => {
      const classList = new Set<string>();
      const attributes = new Map<string, string>();
      const style: Record<string, string> = {};

      const mockDocument = {
        documentElement: {
          classList: {
            add: (c: string) => classList.add(c),
            remove: (c: string) => classList.delete(c),
            contains: (c: string) => classList.has(c),
          },
          setAttribute: (k: string, v: string) => attributes.set(k, v),
          style,
        },
      };

      const originalDoc = globalThis.document;
      // @ts-expect-error mock assignment for testing
      globalThis.document = mockDocument;

      try {
        applyThemeToDocument("light");
        expect(classList.has("light")).toBe(true);
        expect(attributes.get("data-theme")).toBe("light");
        expect(style.colorScheme).toBe("light");

        applyThemeToDocument("dark");
        expect(classList.has("light")).toBe(false);
        expect(attributes.get("data-theme")).toBe("dark");
        expect(style.colorScheme).toBe("dark");
      } finally {
        globalThis.document = originalDoc;
      }
    });
  });
});
