import type { CandidateCompany, ContentTone, FactoryProfile, GeneratedContent } from "@/lib/types";

const toneMap: Record<ContentTone, string> = {
  formal: "professional and concise",
  friendly: "warm and practical",
  direct: "direct and ROI-focused",
};

export function buildPrompt(factory: FactoryProfile, candidate: CandidateCompany, tone: ContentTone) {
  return [
    "You are an AI export sales assistant for a Chinese manufacturing factory.",
    `Tone: ${toneMap[tone]}.`,
    `Factory: ${factory.companyName}.`,
    `Product line: ${factory.productLine}.`,
    `Selling points: ${factory.sellingPoints}.`,
    `Certifications: ${factory.certifications}.`,
    `MOQ: ${factory.moq}. Lead time: ${factory.leadTime}.`,
    `Target customer: ${candidate.companyName}, ${candidate.country}, ${candidate.websiteSummary}.`,
    "Write one personalized B2B cold email with subject, short WhatsApp message, LinkedIn intro, and one follow-up.",
    "Do not invent unverifiable claims. Mark assumptions plainly.",
  ].join("\n");
}

export function buildMockDevelopmentContent(
  factory: FactoryProfile,
  candidate: CandidateCompany,
  tone: ContentTone = "friendly",
): GeneratedContent {
  const product = factory.productLine || candidate.industryGuess;
  const country = candidate.country;
  const firstEvidence = candidate.evidence[0]?.label || "public company profile matched the product line";
  const cta =
    tone === "direct"
      ? "Could you reply with your current sourcing volume this week?"
      : "Would it make sense to exchange a short product catalog and discuss your next project pipeline?";

  return {
    subject: `${product} supplier option for ${candidate.companyName}`,
    email: `Hi ${candidate.contact.name.split(" ")[0]},

I noticed ${candidate.companyName} is active in ${country}, and your public profile suggests a match with ${product}. ${firstEvidence}.

${factory.companyName} supports ${product} with ${factory.sellingPoints}. Our usual MOQ is ${factory.moq}, and lead time is ${factory.leadTime}. Certifications available: ${factory.certifications}.

${cta}

Best regards,
AI Export Agent Demo
${factory.website}`,
    whatsapp: `Hi ${candidate.contact.name.split(" ")[0]}, this is ${factory.companyName}. We make ${product}. I saw ${candidate.companyName} handles similar products in ${country}. Can I send a short catalog?`,
    linkedin: `Hi ${candidate.contact.name.split(" ")[0]}, I found ${candidate.companyName} while researching ${product} channels in ${country}. Open to connecting and exchanging market notes?`,
    followUp: `Hi ${candidate.contact.name.split(" ")[0]}, just following up on the ${product} note. If now is not the right time, I can send a one-page catalog for your later review.`,
    socialCalendar: [
      {
        day: "Day 1",
        channel: "LinkedIn",
        copy: `${factory.companyName} is preparing ${product} supply options for ${country} distributors. Focus: ${factory.sellingPoints}.`,
      },
      {
        day: "Day 3",
        channel: "Facebook",
        copy: `Factory update: ${product} orders can start from ${factory.moq}, with typical lead time of ${factory.leadTime}.`,
      },
      {
        day: "Day 5",
        channel: "X",
        copy: `${product} buyer checklist: supplier proof, lead time, MOQ, and after-sales response. We keep all four visible before quotation.`,
      },
    ],
    aiTrace: {
      provider: "mock",
      model: "local-template-v0.1",
      promptVersion: "export-dev-content-v0.1",
      estimatedCostUsd: 0,
    },
  };
}

export function coerceGeneratedContent(
  rawText: string,
  factory: FactoryProfile,
  candidate: CandidateCompany,
  tone: ContentTone,
): GeneratedContent {
  const fallback = buildMockDevelopmentContent(factory, candidate, tone);

  return {
    ...fallback,
    email: rawText.trim() || fallback.email,
    aiTrace: {
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      promptVersion: "export-dev-content-v0.1",
      estimatedCostUsd: 0.01,
    },
  };
}
