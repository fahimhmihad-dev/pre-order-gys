import { describe, expect, it } from "vitest";
import { resolveAssetUrl } from "@/lib/asset-url";

describe("Portable logo URLs", () => {
  it("resolves the existing logo through its asset host rather than the Vercel domain", () => {
    expect(resolveAssetUrl("/__l5e/assets-v1/4f2211f5-6ddb-4dc3-895e-9043889c9298/logo.png"))
      .toBe("https://pre-order-gys.lovable.app/__l5e/assets-v1/4f2211f5-6ddb-4dc3-895e-9043889c9298/logo.png");
  });

  it("preserves uploaded logos with absolute signed URLs", () => {
    const url = "https://media.example.com/storage/logo.png?token=example";
    expect(resolveAssetUrl(url)).toBe(url);
  });

  it("preserves ordinary local assets and an intentionally removed logo", () => {
    expect(resolveAssetUrl("/favicon.png")).toBe("/favicon.png");
    expect(resolveAssetUrl("")).toBe("");
  });
});