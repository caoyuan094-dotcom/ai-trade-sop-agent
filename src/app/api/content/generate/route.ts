import { buildMockDevelopmentContent, buildPrompt, coerceGeneratedContent } from "@/lib/content-engine";
import type { CandidateCompany, ContentTone, FactoryProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 10;

type GenerateRequest = {
  factory: FactoryProfile;
  candidate: CandidateCompany;
  tone?: ContentTone;
};

function parseTextFromOpenAIResponse(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = Array.isArray(record.output) ? record.output : [];
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as Record<string, unknown>).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const recordItem = item as Record<string, unknown>;
      return typeof recordItem.text === "string" ? recordItem.text : "";
    })
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as GenerateRequest | null;

  if (!body?.factory || !body?.candidate) {
    return Response.json({ error: "factory and candidate are required" }, { status: 400 });
  }

  const tone = body.tone || "friendly";
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY;

  if (provider === "openai" && apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          input: buildPrompt(body.factory, body.candidate, tone),
          temperature: 0.6,
          max_output_tokens: 900,
        }),
      });

      if (!response.ok) {
        const fallback = buildMockDevelopmentContent(body.factory, body.candidate, tone);
        return Response.json({
          content: {
            ...fallback,
            aiTrace: {
              ...fallback.aiTrace,
              warning: `OpenAI request failed with ${response.status}; mock content returned.`,
            },
          },
        });
      }

      const data = await response.json();
      return Response.json({
        content: coerceGeneratedContent(parseTextFromOpenAIResponse(data), body.factory, body.candidate, tone),
      });
    } catch (error) {
      const fallback = buildMockDevelopmentContent(body.factory, body.candidate, tone);
      return Response.json({
        content: {
          ...fallback,
          aiTrace: {
            ...fallback.aiTrace,
            warning: error instanceof Error ? error.message : "OpenAI request failed; mock content returned.",
          },
        },
      });
    }
  }

  return Response.json({
    content: buildMockDevelopmentContent(body.factory, body.candidate, tone),
  });
}
