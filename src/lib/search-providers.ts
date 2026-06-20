import { buyerTypeLabels, titlesByBuyerType } from "@/lib/mock-data";
import { normalizeLeadSearchInput } from "@/lib/lead-engine";
import type { CandidateCompany, LeadSearchInput, SearchTaskResult } from "@/lib/types";

type GoogleSearchItem = {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
};

type GoogleSearchResponse = {
  items?: GoogleSearchItem[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function domainFromUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function originFromUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return value;
  }
}

function companyNameFromItem(item: GoogleSearchItem) {
  const title = item.title?.split(/[|-]/)[0]?.trim();
  if (title && title.length > 2) return title.slice(0, 80);
  const domain = domainFromUrl(item.link || "");
  return domain
    .split(".")[0]
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildQueries(input: LeadSearchInput) {
  const buyerLabel = buyerTypeLabels[input.buyerType] || input.buyerType;
  return input.countries.flatMap((country) => [
    `${country} ${input.productKeyword} ${input.buyerType}`,
    `${country} ${input.productKeyword} ${buyerLabel}`,
    `${country} ${input.productKeyword} wholesale distributor contact`,
  ]);
}

function scoreSearchResult(item: GoogleSearchItem, input: LeadSearchInput, hasEmail: boolean) {
  const haystack = `${item.title || ""} ${item.snippet || ""} ${item.displayLink || ""}`.toLowerCase();
  const productHits = input.productKeyword
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length > 2 && haystack.includes(part)).length;
  const buyerHits = ["distributor", "wholesale", "importer", "supplier", "brand", "contact"].filter((part) =>
    haystack.includes(part),
  ).length;

  return clamp(56 + productHits * 7 + buyerHits * 5 + (hasEmail ? 8 : 0), 52, 96);
}

function extractEmails(html: string) {
  return Array.from(
    new Set(
      html
        .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)
        ?.map((email) => email.toLowerCase())
        .filter((email) => !email.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) || [],
    ),
  ).slice(0, 3);
}

function extractPhone(html: string) {
  return html.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,5}\d{3,4}/)?.[0]?.trim();
}

async function fetchHomepageSignals(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(originFromUrl(url), {
      headers: {
        "User-Agent": "AI-Trade-Agent-MVP/0.1 lead research bot",
      },
      signal: controller.signal,
    });
    const html = await response.text();
    return {
      emails: extractEmails(html),
      phone: extractPhone(html),
    };
  } catch {
    return {
      emails: [],
      phone: "",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function googleSearch(query: string, key: string, cx: string) {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "10");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Custom Search failed: ${response.status}`);
  }

  return (await response.json()) as GoogleSearchResponse;
}

export async function createGoogleCustomSearchTask(input: Partial<LeadSearchInput>): Promise<SearchTaskResult> {
  const normalized = normalizeLeadSearchInput(input);
  const key = process.env.GOOGLE_CUSTOM_SEARCH_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;

  if (!key || !cx) {
    throw new Error("GOOGLE_CUSTOM_SEARCH_KEY and GOOGLE_CUSTOM_SEARCH_CX are required");
  }

  const now = new Date();
  const queries = buildQueries(normalized);
  const seenDomains = new Set<string>();
  const candidates: CandidateCompany[] = [];

  for (const query of queries) {
    if (candidates.length >= (normalized.targetCount || 25)) break;
    const data = await googleSearch(query, key, cx);

    for (const item of data.items || []) {
      if (!item.link || candidates.length >= (normalized.targetCount || 25)) continue;
      const domain = domainFromUrl(item.link);
      if (!domain || seenDomains.has(domain)) continue;
      seenDomains.add(domain);

      const signals = await fetchHomepageSignals(item.link);
      const email = signals.emails[0] || `contact@${domain}`;
      const score = scoreSearchResult(item, normalized, Boolean(signals.emails[0]));
      const country = normalized.countries.find((itemCountry) => query.includes(itemCountry)) || normalized.countries[0];
      const titlePool = titlesByBuyerType[normalized.buyerType];

      candidates.push({
        id: `real_${slugify(domain)}_${candidates.length + 1}`,
        companyName: companyNameFromItem(item),
        country,
        city: "Unknown",
        website: originFromUrl(item.link),
        websiteSummary: item.snippet || `${companyNameFromItem(item)} 出现在 ${normalized.productKeyword} 相关公开搜索结果中，需要进一步人工复核。`,
        industryGuess: normalized.productKeyword,
        employeeEstimate: "Unknown",
        foundedYear: 0,
        sourceUrl: item.link,
        sourceType: "google-custom-search",
        scrapedAt: new Date().toISOString(),
        contact: {
          id: `real_contact_${slugify(domain)}`,
          name: "Unknown",
          title: titlePool[0] || "Purchasing Manager",
          email,
          emailVerifiedStatus: signals.emails[0] ? "suspected" : "unknown",
          phone: signals.phone,
          linkedinUrl: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyNameFromItem(item))}`,
        },
        score,
        purchaseProbability: score >= 82 ? "high" : score >= 68 ? "medium" : "low",
        recommendedStrategy:
          score >= 82
            ? "优先联系：官网与关键词匹配度高，先发个性化开发信，再用 LinkedIn 补充触达。"
            : "进入复核队列：先检查官网业务范围和联系人，再决定是否触达。",
        evidence: [
          {
            kind: "fact",
            label: `Google 搜索命中：${query}`,
            source: item.link,
          },
          {
            kind: signals.emails[0] ? "fact" : "assumption",
            label: signals.emails[0] ? `官网提取邮箱：${signals.emails[0]}` : `未抓到公开邮箱，使用 contact@${domain} 作为待验证邮箱`,
            source: originFromUrl(item.link),
          },
          {
            kind: "assumption",
            label: `疑似 ${buyerTypeLabels[normalized.buyerType]} 或相关采购商`,
            source: "AI scoring rule v0.2",
          },
        ],
        riskTags: [signals.emails[0] ? "邮箱待验证" : "邮箱需人工确认", "公开搜索结果"],
        stage: "candidate",
        nextFollowUpAt: new Date(Date.now() + (candidates.length + 1) * 1000 * 60 * 60 * 24).toISOString(),
      });
    }
  }

  const finishedAt = new Date();

  return {
    taskId: `google_${slugify(normalized.productKeyword)}_${now.getTime()}`,
    status: "done",
    resultCount: candidates.length,
    costEstimateUsd: Number((queries.length * 0.005).toFixed(3)),
    startedAt: now.toISOString(),
    finishedAt: finishedAt.toISOString(),
    candidates: candidates.sort((left, right) => right.score - left.score),
    workflowLogs: [
      "外贸获客员工已生成国家 + 产品 + 客户类型搜索词",
      "Google Custom Search 已返回公开网页结果",
      "系统已抓取官网首页并尝试提取邮箱/电话",
      "AI 客户评分已完成，所有邮箱默认需要人工复核",
    ],
  };
}
