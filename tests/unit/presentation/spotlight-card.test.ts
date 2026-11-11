import { describe, expect, test } from "bun:test";
import {
  calculateSpotlightCoordinates,
  shouldEnableSpotlight,
} from "@/presentation/components/reactbits/spotlight-card";

describe("SpotlightCard React Bits Micro-Interaction", () => {
  describe("calculateSpotlightCoordinates", () => {
    test("calculates coordinates when pointer is at element top-left origin", () => {
      const rect = { left: 100, top: 150 };
      const result = calculateSpotlightCoordinates(100, 150, rect);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    test("calculates relative (x, y) coordinates within element boundary", () => {
      const rect = { left: 200, top: 300 };
      const result = calculateSpotlightCoordinates(285, 340, rect);
      expect(result).toEqual({ x: 85, y: 40 });
    });

    test("rounds floating point subpixel coordinates to integer pixels", () => {
      const rect = { left: 50.4, top: 60.8 };
      const result = calculateSpotlightCoordinates(120.7, 95.2, rect);
      // 120.7 - 50.4 = 70.3 -> 70
      // 95.2 - 60.8 = 34.4 -> 34
      expect(result).toEqual({ x: 70, y: 34 });
    });

    test("handles coordinates outside top/left bounds with negative values", () => {
      const rect = { left: 100, top: 100 };
      const result = calculateSpotlightCoordinates(80, 70, rect);
      expect(result).toEqual({ x: -20, y: -30 });
    });
  });

  describe("shouldEnableSpotlight (Touch & Reduced-Motion Fallbacks)", () => {
    test("enables dynamic spotlight tracking when motion is allowed and pointer is fine (desktop mouse)", () => {
      const isReducedMotion = false;
      const isCoarsePointer = false;
      expect(shouldEnableSpotlight(isReducedMotion, isCoarsePointer)).toBe(
        true,
      );
    });

    test("bypasses spotlight tracking when user prefers reduced motion", () => {
      const isReducedMotion = true;
      const isCoarsePointer = false;
      expect(shouldEnableSpotlight(isReducedMotion, isCoarsePointer)).toBe(
        false,
      );
    });

    test("bypasses spotlight tracking on touchscreen devices (pointer: coarse)", () => {
      const isReducedMotion = false;
      const isCoarsePointer = true;
      expect(shouldEnableSpotlight(isReducedMotion, isCoarsePointer)).toBe(
        false,
      );
    });

    test("bypasses spotlight tracking when both reduced motion and coarse pointer are active", () => {
      const isReducedMotion = true;
      const isCoarsePointer = true;
      expect(shouldEnableSpotlight(isReducedMotion, isCoarsePointer)).toBe(
        false,
      );
    });
  });

  describe("Simulated DOM Event Handling", () => {
    test("sets CSS custom properties --mouse-x and --mouse-y on target element style when active", () => {
      const styleMap = new Map<string, string>();
      const mockElement = {
        getBoundingClientRect: () => ({ left: 50, top: 80 }),
        style: {
          setProperty: (key: string, value: string) => styleMap.set(key, value),
        },
      };

      const rect = mockElement.getBoundingClientRect();
      const clientX = 175;
      const clientY = 220;

      if (shouldEnableSpotlight(false, false)) {
        const { x, y } = calculateSpotlightCoordinates(clientX, clientY, rect);
        mockElement.style.setProperty("--mouse-x", `${x}px`);
        mockElement.style.setProperty("--mouse-y", `${y}px`);
      }

      expect(styleMap.get("--mouse-x")).toBe("125px");
      expect(styleMap.get("--mouse-y")).toBe("140px");
    });

    test("does not set CSS custom properties when reduced motion is preferred", () => {
      const styleMap = new Map<string, string>();
      const mockElement = {
        getBoundingClientRect: () => ({ left: 50, top: 80 }),
        style: {
          setProperty: (key: string, value: string) => styleMap.set(key, value),
        },
      };

      const isReducedMotion = true;
      const isCoarsePointer = false;

      if (shouldEnableSpotlight(isReducedMotion, isCoarsePointer)) {
        const { x, y } = calculateSpotlightCoordinates(
          100,
          100,
          mockElement.getBoundingClientRect(),
        );
        mockElement.style.setProperty("--mouse-x", `${x}px`);
        mockElement.style.setProperty("--mouse-y", `${y}px`);
      }

      expect(styleMap.get("--mouse-x")).toBeUndefined();
      expect(styleMap.get("--mouse-y")).toBeUndefined();
    });
  });
});
