import {
  buyerTypeLabels,
  companyPrefixes,
  contactFirstNames,
  contactLastNames,
  countryCities,
  titlesByBuyerType,
} from "@/lib/mock-data";
import type { BuyerType, CandidateCompany, LeadSearchInput, SearchTaskResult } from "@/lib/types";

const defaultCountries = ["Germany"];
const validBuyerTypes: BuyerType[] = ["distributor", "wholesaler", "importer", "retailer", "brand", "project buyer"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54);
}

function numberFromText(value: string) {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeLeadSearchInput(input: Partial<LeadSearchInput>): LeadSearchInput {
  const productKeyword = input.productKeyword?.trim() || "LED display screen";
  const rawCountries = Array.isArray(input.countries) ? input.countries : defaultCountries;
  const countries = rawCountries.map((country) => String(country).trim()).filter(Boolean);
  const buyerType = validBuyerTypes.includes(input.buyerType as BuyerType) ? (input.buyerType as BuyerType) : "distributor";
  const requestedCount = Number(input.targetCount ?? 50);
  const targetCount = Number.isFinite(requestedCount) ? clamp(requestedCount, 5, 80) : 50;

  return {
    productKeyword,
    countries: countries?.length ? countries : defaultCountries,
    buyerType,
    targetCount,
  };
}

function getCity(country: string, index: number) {
  const cities = countryCities[country] || ["Capital City", "Trade Zone", "Industrial Park"];
  return cities[index % cities.length];
}

function getContactName(index: number) {
  const first = contactFirstNames[index % contactFirstNames.length];
  const last = contactLastNames[(index * 3) % contactLastNames.length];
  return `${first} ${last}`;
}

function getPurchaseProbability(score: number): CandidateCompany["purchaseProbability"] {
  if (score >= 82) return "high";
  if (score >= 68) return "medium";
  return "low";
}

function getStrategy(score: number, buyerType: BuyerType) {
  if (score >= 84) {
    return `优先发送定制开发信，并在 2 天后补一条 ${buyerType === "project buyer" ? "项目案例" : "产品目录"} 跟进。`;
  }

  if (score >= 70) {
    return "先发送简短开发信，观察打开与点击，再决定是否进入重点跟进队列。";
  }

  return "暂放公海，等官网或联系人信息补全后再触达。";
}

export function buildCandidateCompanies(input: Partial<LeadSearchInput>): CandidateCompany[] {
  const normalized = normalizeLeadSearchInput(input);
  const targetCount = normalized.targetCount || 50;
  const productSlug = slugify(normalized.productKeyword);

  return Array.from({ length: targetCount }, (_, index) => {
    const country = normalized.countries[index % normalized.countries.length];
    const city = getCity(country, index);
    const prefix = companyPrefixes[index % companyPrefixes.length];
    const typeLabel = buyerTypeLabels[normalized.buyerType];
    const companyName = `${prefix} ${typeLabel} ${index + 1}`;
    const companySlug = slugify(`${companyName}-${country}`);
    const scoreSeed = numberFromText(`${companyName}-${normalized.productKeyword}-${country}`);
    const score = clamp(62 + (scoreSeed % 35), 58, 96);
    const contactName = getContactName(index);
    const titlePool = titlesByBuyerType[normalized.buyerType];
    const scrapedAt = new Date(Date.now() - index * 1000 * 60 * 9).toISOString();

    const candidate: CandidateCompany = {
      id: `cand_${productSlug}_${index + 1}`,
      companyName,
      country,
      city,
      website: `https://www.${companySlug}.example`,
      websiteSummary: `${companyName} 在 ${country} 经营 ${normalized.productKeyword} 相关采购与渠道业务，官网展示了进口、分销和项目交付线索。`,
      industryGuess: normalized.productKeyword,
      employeeEstimate: `${30 + (scoreSeed % 170)}-${220 + (scoreSeed % 560)}`,
      foundedYear: 1998 + (scoreSeed % 24),
      sourceUrl: `https://search.example.com/${slugify(country)}/${productSlug}/${index + 1}`,
      sourceType: "mock-search" as const,
      scrapedAt,
      contact: {
        id: `contact_${productSlug}_${index + 1}`,
        name: contactName,
        title: titlePool[index % titlePool.length],
        email: `${contactName.toLowerCase().replace(/[^a-z]+/g, ".")}@${companySlug}.example`,
        emailVerifiedStatus: index % 3 === 0 ? ("verified" as const) : index % 3 === 1 ? ("suspected" as const) : ("unknown" as const),
        phone: `+${40 + (scoreSeed % 50)} ${100000 + (scoreSeed % 899999)}`,
        linkedinUrl: `https://www.linkedin.com/company/${companySlug}`,
      },
      score,
      purchaseProbability: getPurchaseProbability(score),
      recommendedStrategy: getStrategy(score, normalized.buyerType),
      evidence: [
        {
          kind: "fact",
          label: `官网关键词匹配：${normalized.productKeyword}`,
          source: `mock source ${index + 1}`,
        },
        {
          kind: "fact",
          label: `客户类型判断：${typeLabel}`,
          source: `mock source ${index + 1}`,
        },
        {
          kind: "assumption",
          label: score >= 78 ? "疑似有稳定进口需求" : "采购意愿需要人工复核",
          source: "AI scoring rule v0.1",
        },
      ],
      riskTags: [
        index % 7 === 0 ? "邮箱待复核" : "公开来源",
        index % 11 === 0 ? "疑似中间商" : "低风险",
      ],
      stage: "candidate" as const,
      nextFollowUpAt: new Date(Date.now() + (index + 1) * 1000 * 60 * 60 * 18).toISOString(),
    };
    return candidate;
  }).sort((left, right) => right.score - left.score);
}

export function createSearchTask(input: Partial<LeadSearchInput>): SearchTaskResult {
  const normalized = normalizeLeadSearchInput(input);
  const candidates = buildCandidateCompanies(normalized);
  const now = new Date();
  const finishedAt = new Date(now.getTime() + 4200);

  return {
    taskId: `search_${slugify(normalized.productKeyword)}_${now.getTime()}`,
    status: "done",
    resultCount: candidates.length,
    costEstimateUsd: Number((candidates.length * 0.002).toFixed(3)),
    startedAt: now.toISOString(),
    finishedAt: finishedAt.toISOString(),
    candidates,
    workflowLogs: [
      "客户搜索 Agent 已读取产品、国家、客户类型",
      "合规数据源检查通过：当前体验版使用 mock-search",
      "AI 客户分析 Agent 已完成评分与风险标签",
      "人工确认节点已开启：不会自动发送邮件",
    ],
  };
}
