import { describe, expect, it } from "vitest";
import { buildKeywordLibrary, createEbikesUsExample, createSdrSop, validateBaseInfo } from "@/lib/sdr-sop-engine";

describe("sdr sop engine", () => {
  it("validates missing required base info fields", () => {
    const missing = validateBaseInfo({ productCategory: "eBike", targetCountries: ["United States"] });

    expect(missing).toContain("productParameters");
    expect(missing).toContain("targetCustomerTypes");
    expect(missing).toContain("coreAdvantages");
  });

  it("builds eBike-specific keyword libraries", () => {
    const keywords = buildKeywordLibrary(createEbikesUsExample());

    expect(keywords.productCore).toContain("fat tire eBike");
    expect(keywords.googleQueries.some((query) => query.includes("United States"))).toBe(true);
    expect(keywords.linkedInQueries.some((query) => query.includes("site:linkedin.com/company"))).toBe(true);
  });

  it("builds category-specific keyword libraries for mother and baby products", () => {
    const keywords = buildKeywordLibrary({
      ...createEbikesUsExample(),
      productCategory: "baby stroller",
    });

    expect(keywords.productCore).toContain("baby stroller");
    expect(keywords.industryScenario).toContain("baby product importer");
    expect(keywords.competitorBenchmark).toContain("UPPAbaby distributor");
  });

  it("runs the full nine-step SOP and returns exportable rows", async () => {
    const result = await createSdrSop(createEbikesUsExample(), 8);

    expect(result.status).toBe("done");
    expect(result.workflowLogs).toContain("Step9 标准 CSV 数据包已生成，可用 Excel 打开");
    expect(result.searchTask.candidates.length).toBeGreaterThan(0);
    expect(result.dossiers[0].grade).toMatch(/[ABC]/);
    expect(result.outreachBundles[0].shortProspectingEmail).toContain("Subject:");
    expect(result.followUpPlan).toHaveLength(7);
    expect(result.exportCsv).toContain("客户公司名");
    expect(result.planRows[0].riskItems).toBeTruthy();
  });
});
