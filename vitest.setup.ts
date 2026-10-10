import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { setLanguage } from "@/lib/i18n";
import { cleanup } from "@testing-library/react";
// Existing fixture assertions cover Chinese; English coverage explicitly switches.
beforeEach(() => {
  setLanguage("zh-CN");
});

afterEach(() => {
  cleanup();
});

// jsdom 没有实现这些 API，预览层的缩放/测量会用到
if (typeof globalThis.matchMedia !== "function") {
  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (typeof globalThis.ResizeObserver !== "function") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
