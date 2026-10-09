import { expect, it } from "vitest";
import { validatePhoto } from "./photo";
it("accepts raster photos, rejects SVG and oversized uploads", () => {
  expect(() => validatePhoto({ type: "image/png", size: 5000 })).not.toThrow();
  expect(() => validatePhoto({ type: "image/svg+xml", size: 20 })).toThrow();
  expect(() => validatePhoto({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toThrow();
});
