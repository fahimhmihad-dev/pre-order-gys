import { describe, expect, it } from "vitest";
import { formatDate, money, toBanglaDigits, toEnglishDigits } from "@/lib/format";

describe("bangla format", () => {
  it("converts digits both ways", () => {
    expect(toBanglaDigits("347 / 500")).toBe("৩৪৭ / ৫০০");
    expect(toEnglishDigits("০১৭১২৩৪৫৬৭৮")).toBe("01712345678");
  });
  it("formats dates dd-mm-yyyy", () => {
    expect(formatDate(new Date(2026, 9, 9))).toBe("09-10-2026");
    expect(formatDate(new Date(2026, 9, 9, 14, 5), true)).toBe("09-10-2026 02:05 PM");
  });
  it("prefixes taka", () => {
    expect(money(1250)).toBe("৳১,২৫০");
  });
});
