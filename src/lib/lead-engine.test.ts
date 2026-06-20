import { describe, expect, it } from "vitest";
import { buildCandidateCompanies, createSearchTask, normalizeLeadSearchInput } from "@/lib/lead-engine";

describe("lead engine", () => {
  it("normalizes an empty search into the PRD default scenario", () => {
    const input = normalizeLeadSearchInput({});

    expect(input.productKeyword).toBe("LED display screen");
    expect(input.countries).toEqual(["Germany"]);
    expect(input.buyerType).toBe("distributor");
    expect(input.targetCount).toBe(50);
  });

  it("returns scored candidates with required PRD fields", () => {
    const candidates = buildCandidateCompanies({
      productKeyword: "CNC machining parts",
      countries: ["Germany", "United States"],
      buyerType: "importer",
      targetCount: 12,
    });

    expect(candidates).toHaveLength(12);
    expect(candidates[0]).toMatchObject({
      sourceType: "mock-search",
      stage: "candidate",
    });
    expect(candidates[0].companyName).toBeTruthy();
    expect(candidates[0].website).toContain("https://");
    expect(candidates[0].contact.email).toContain("@");
    expect(candidates[0].score).toBeGreaterThanOrEqual(candidates[1].score);
    expect(candidates[0].evidence.some((item) => item.kind === "fact")).toBe(true);
  });

  it("creates an auditable search task with workflow logs", () => {
    const task = createSearchTask({
      productKeyword: "packaging machine",
      countries: ["France"],
      buyerType: "distributor",
      targetCount: 50,
    });

    expect(task.status).toBe("done");
    expect(task.resultCount).toBe(50);
    expect(task.workflowLogs).toContain("人工确认节点已开启：不会自动发送邮件");
  });
});
