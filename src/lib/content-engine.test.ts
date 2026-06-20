import { describe, expect, it } from "vitest";
import { buildMockDevelopmentContent, buildPrompt } from "@/lib/content-engine";
import type { CandidateCompany, FactoryProfile } from "@/lib/types";

const factory: FactoryProfile = {
  companyName: "Test Factory",
  productLine: "LED display screen",
  targetMarket: "Germany",
  sellingPoints: "fast delivery, OEM support",
  certifications: "CE, RoHS",
  moq: "10 square meters",
  leadTime: "15 days",
  website: "https://factory.example",
};

const candidate: CandidateCompany = {
  id: "cand_1",
  companyName: "Berlin Display Distributor",
  country: "Germany",
  city: "Berlin",
  website: "https://buyer.example",
  websiteSummary: "Public profile shows LED display distribution in Germany.",
  industryGuess: "LED display screen",
  employeeEstimate: "50-200",
  foundedYear: 2011,
  sourceUrl: "https://source.example",
  sourceType: "mock-search",
  scrapedAt: "2026-05-12T00:00:00.000Z",
  contact: {
    id: "contact_1",
    name: "Anna Muller",
    title: "Purchasing Director",
    email: "anna@example.com",
    emailVerifiedStatus: "verified",
  },
  score: 88,
  purchaseProbability: "high",
  recommendedStrategy: "Send a custom intro.",
  evidence: [
    {
      kind: "fact",
      label: "官网关键词匹配：LED display screen",
      source: "mock source",
    },
  ],
  riskTags: ["公开来源"],
  stage: "candidate",
  nextFollowUpAt: "2026-05-13T00:00:00.000Z",
};

describe("content engine", () => {
  it("builds a grounded prompt from factory and customer facts", () => {
    const prompt = buildPrompt(factory, candidate, "friendly");

    expect(prompt).toContain("Test Factory");
    expect(prompt).toContain("Berlin Display Distributor");
    expect(prompt).toContain("Do not invent unverifiable claims");
  });

  it("generates multi-channel content with a trace", () => {
    const content = buildMockDevelopmentContent(factory, candidate, "direct");

    expect(content.subject).toContain("Berlin Display Distributor");
    expect(content.email).toContain("LED display screen");
    expect(content.whatsapp).toContain("Anna");
    expect(content.linkedin).toContain("Germany");
    expect(content.followUp).toContain("following up");
    expect(content.socialCalendar).toHaveLength(3);
    expect(content.aiTrace.provider).toBe("mock");
  });
});
