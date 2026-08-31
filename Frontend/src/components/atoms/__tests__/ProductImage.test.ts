import { getLaqqLogoFallback } from "@/components/atoms/ProductImage";

describe("getLaqqLogoFallback", () => {
  it("usa un logo distinto en tema oscuro y en claro", () => {
    const dark = getLaqqLogoFallback("dark");
    const light = getLaqqLogoFallback("light");
    expect(dark).toBeTruthy();
    expect(light).toBeTruthy();
    expect(dark).not.toEqual(light);
  });
});
