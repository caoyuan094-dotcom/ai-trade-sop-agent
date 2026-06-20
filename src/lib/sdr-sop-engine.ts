import { createSearchTask, normalizeLeadSearchInput } from "@/lib/lead-engine";
import { createGoogleCustomSearchTask } from "@/lib/search-providers";
import type {
  BuyerType,
  CandidateCompany,
  FollowUpStep,
  KeywordLibrary,
  LeadDossier,
  LeadGrade,
  MarketResearch,
  OutreachBundle,
  SdrBaseInfo,
  SdrPlanRow,
  SdrSopResult,
} from "@/lib/types";

const customerTypeLabels: Record<string, string> = {
  importer: "importer",
  brand: "brand owner",
  offline_dealer: "offline dealer",
  ecommerce_seller: "e-commerce seller",
  distributor: "distributor",
  wholesaler: "wholesaler",
};

const requiredFields: Array<keyof SdrBaseInfo> = [
  "productCategory",
  "productParameters",
  "targetCountries",
  "targetCustomerTypes",
  "coreAdvantages",
  "certifications",
  "moq",
  "priceRange",
];

type CategoryTemplate = {
  match: string[];
  productCore: string[];
  industryScenario: string[];
  competitorBenchmark: string[];
  demandAnalysis: string[];
  competitorPainPoints: string[];
  buyerConcerns: string[];
  hotStyles: string[];
  complianceWarnings: string[];
};

const categoryTemplates: CategoryTemplate[] = [
  {
    match: ["ebike", "electric bicycle", "电动自行车", "电助力"],
    productCore: ["electric bicycle", "eBike", "fat tire eBike", "commuter eBike", "folding electric bike", "cargo eBike"],
    industryScenario: ["bike shop", "electric bike dealer", "micromobility distributor", "outdoor mobility retailer", "urban commuting store"],
    competitorBenchmark: ["Rad Power Bikes dealer", "Aventon distributor", "Lectric eBike reseller", "Himiway dealer", "Velotric retailer"],
    demandAnalysis: [
      "目标市场对通勤、城市配送、户外休闲类 eBike 有持续需求，B 端客户更关心稳定补货和售后配件。",
      "经销商通常需要差异化外观、可控 MOQ、样车支持和清晰的电池/充电器合规资料。",
      "线上卖家更关注毛利空间、包装破损率、售后件供应和产品页面素材完整度。",
    ],
    competitorPainPoints: ["同质化车型多，低价竞品容易压缩渠道利润。", "电池安全、售后维修和备件交付是采购商最担心的风险。", "部分供应商夸大续航，导致终端差评和退货。"],
    buyerConcerns: ["UL 2849 / FCC / CE / charger safety 文件是否齐全。", "MOQ、样品周期、备件包、质保政策和美国本地退换货支持。", "是否支持 OEM 颜色、品牌贴牌、说明书和产品图片素材。"],
    hotStyles: ["fat tire eBike", "commuter step-through eBike", "folding eBike", "cargo eBike", "city trekking eBike"],
    complianceWarnings: ["美国市场需重点核查 UL 2849 / UL 2271 电池系统、FCC 电磁兼容、州级 eBike 分类规则。", "欧盟市场需关注 CE、EN 15194、电池运输与 WEEE/EPR 相关义务。", "开发信不得承诺未验证续航、认证或本地售后能力。"],
  },
  {
    match: ["home", "furniture", "家居", "家具", "chair", "sofa", "table"],
    productCore: ["home furniture", "outdoor furniture", "commercial chair", "sofa set", "dining table", "furniture OEM"],
    industryScenario: ["furniture wholesaler", "home decor distributor", "hospitality furniture supplier", "retail furniture chain", "interior project buyer"],
    competitorBenchmark: ["IKEA supplier alternative", "Wayfair seller", "Ashley Furniture dealer", "commercial furniture importer"],
    demandAnalysis: ["家居类 B2B 客户重视款式迭代、稳定交期、包装破损率和整柜出货能力。", "欧美客户通常会要求材料、阻燃、环保和包装测试文件。", "酒店、公寓、户外空间和电商渠道适合做不同开发信角度。"],
    competitorPainPoints: ["低价产品同质化严重。", "大件运输破损和售后补件成本高。", "色差、材质说明不清容易造成退货。"],
    buyerConcerns: ["材料安全与环保文件。", "包装跌落测试和补件响应。", "是否支持 OEM、混柜和系列化上新。"],
    hotStyles: ["modular sofa", "outdoor patio set", "folding camping chair", "ergonomic office chair", "minimalist dining set"],
    complianceWarnings: ["欧美市场需核查 CA Prop 65、REACH、阻燃要求、木制品熏蒸和包装标签。"],
  },
  {
    match: ["baby", "maternal", "stroller", "母婴", "婴儿", "童车"],
    productCore: ["baby stroller", "baby carrier", "infant product", "nursery product", "baby safety product"],
    industryScenario: ["baby product importer", "nursery distributor", "mother and baby store", "baby gear wholesaler", "kids product retailer"],
    competitorBenchmark: ["UPPAbaby distributor", "Graco retailer", "Chicco dealer", "baby gear private label"],
    demandAnalysis: ["母婴类采购商高度关注安全标准、材料证明、召回风险和长期稳定供货。", "渠道客户更偏好有检测报告、英文说明书、包装合规和售后备件的供应商。", "品牌商和电商卖家适合用新品差异化、轻量化和安全卖点开发。"],
    competitorPainPoints: ["安全认证不完整会直接阻断采购。", "中式参数表达难以转化为欧美买家语言。", "包装、说明书和警示语不合规会增加平台风险。"],
    buyerConcerns: ["CPSIA / ASTM / EN1888 等标准。", "材料安全、承重测试、年龄段标识。", "产品责任险和召回应对能力。"],
    hotStyles: ["lightweight stroller", "travel stroller", "baby carrier", "convertible stroller", "nursery storage"],
    complianceWarnings: ["美国母婴产品需重点核查 CPSIA、ASTM、CPSC、铅/邻苯要求和年龄警示；欧盟需核查 EN 标准与 CE 相关义务。"],
  },
  {
    match: ["outdoor", "camping", "户外", "露营", "hiking"],
    productCore: ["camping gear", "outdoor equipment", "camping chair", "portable power station", "hiking accessory"],
    industryScenario: ["outdoor gear distributor", "camping wholesaler", "sporting goods retailer", "outdoor brand", "Amazon outdoor seller"],
    competitorBenchmark: ["REI supplier", "Decathlon supplier", "Coleman dealer", "camping gear private label"],
    demandAnalysis: ["户外品类季节性明显，采购商重视上新速度、轻量化、耐用测试和包装体积。", "品牌商会关注差异化设计与内容素材，批发商关注价格带和供货稳定。", "适合按露营、徒步、房车、庭院和应急场景拆分开发。"],
    competitorPainPoints: ["旺季断货影响渠道信任。", "低价竞品容易牺牲材料和耐用性。", "缺少真实场景图片会影响电商转化。"],
    buyerConcerns: ["耐用性测试、材料说明、包装体积、备件和季节交期。", "是否支持小批量试单和快速补货。"],
    hotStyles: ["ultralight camping chair", "folding wagon", "portable camping table", "outdoor storage", "solar camping light"],
    complianceWarnings: ["户外电器需核查 FCC/CE/UL/电池运输；纺织和接触材料需核查 REACH、Prop 65、阻燃或标签要求。"],
  },
];

function getCategoryTemplate(product: string) {
  const lower = product.toLowerCase();
  return categoryTemplates.find((template) => template.match.some((keyword) => lower.includes(keyword.toLowerCase())));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54);
}

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function createEbikesUsExample(): SdrBaseInfo {
  return {
    productCategory: "eBike / electric bicycle",
    productParameters: "750W rear hub motor, 48V 15Ah removable battery, fat tire option, UL 2849-ready electrical system",
    targetCountries: ["United States"],
    targetCustomerTypes: ["importer", "offline_dealer", "ecommerce_seller"],
    coreAdvantages: "factory direct supply, OEM logo and color, stable battery sourcing, spare parts package, fast sample support",
    certifications: "CE, FCC, UL 2849 component documentation available",
    moq: "20 units per model",
    priceRange: "USD 520-780 FOB Shenzhen",
    productLink: "https://example.com/ebike-catalog",
  };
}

export function validateBaseInfo(baseInfo: Partial<SdrBaseInfo>) {
  return requiredFields.filter((field) => {
    const value = baseInfo[field];
    if (Array.isArray(value)) return value.length === 0;
    return !String(value || "").trim();
  });
}

function primaryBuyerType(baseInfo: SdrBaseInfo): BuyerType {
  const first = baseInfo.targetCustomerTypes[0];
  if (first === "offline_dealer") return "distributor";
  if (first === "ecommerce_seller") return "retailer";
  if (first === "importer" || first === "brand" || first === "distributor" || first === "wholesaler") return first;
  return "distributor";
}

export function buildMarketResearch(baseInfo: SdrBaseInfo): MarketResearch {
  const product = baseInfo.productCategory;
  const countries = baseInfo.targetCountries.join(" / ");
  const template = getCategoryTemplate(product);

  if (template) {
    return {
      demandAnalysis: template.demandAnalysis.map((item, index) => (index === 0 ? `${countries} ${item}` : item)),
      competitorPainPoints: template.competitorPainPoints,
      buyerConcerns: template.buyerConcerns,
      priceBand: baseInfo.priceRange || "mid-range B2B wholesale price band",
      hotStyles: template.hotStyles,
      complianceWarnings: template.complianceWarnings,
    };
  }

  return {
    demandAnalysis: [
      `${countries} 市场存在 ${product} 的渠道补货、进口分销和品牌 OEM 需求。`,
      "B2B 买家更关注稳定交期、认证文件、长期供货价格和售后响应。",
      "适合优先开发进口商、经销商、品牌商和垂直电商卖家。",
    ],
    competitorPainPoints: ["产品同质化", "交付不稳定", "认证资料不透明", "沟通响应慢"],
    buyerConcerns: ["价格带", "MOQ", "交期", "认证", "售后和备件", "是否能贴牌"],
    priceBand: baseInfo.priceRange || "mid-to-high B2B price band",
    hotStyles: [`${product} OEM`, `${product} wholesale`, `${product} private label`, `${product} distributor supply`],
    complianceWarnings: ["欧美市场需逐项核查 FCC、CE、UL、进口关税和行业准入要求。"],
  };
}

export function buildKeywordLibrary(baseInfo: SdrBaseInfo): KeywordLibrary {
  const product = baseInfo.productCategory;
  const countries = baseInfo.targetCountries.length ? baseInfo.targetCountries : ["United States"];
  const customerTypes = baseInfo.targetCustomerTypes.map((type) => customerTypeLabels[type] || type);
  const template = getCategoryTemplate(product);
  const productCore = template?.productCore || [product, `${product} OEM`, `${product} wholesale`, `${product} supplier`, `${product} manufacturer`];
  const industryScenario = template?.industryScenario || [`${product} distributor`, `${product} channel partner`, `${product} project supplier`, `${product} wholesale buyer`];
  const customerIdentity = customerTypes.flatMap((type) => [`${product} ${type}`, `${type} ${product} supplier`, `${type} looking for ${product}`]);
  const competitorBenchmark = template?.competitorBenchmark || [`${product} alternative supplier`, `${product} private label brand`, `${product} top distributor`];
  const googleQueries = countries.flatMap((country) =>
    customerTypes.slice(0, 3).map((type) => `${country} ${product} ${type} contact email`),
  );
  const linkedInQueries = countries.flatMap((country) =>
    customerTypes.slice(0, 3).map((type) => `site:linkedin.com/company ${country} ${product} ${type}`),
  );

  return { productCore, industryScenario, customerIdentity, competitorBenchmark, googleQueries, linkedInQueries };
}

function gradeCandidate(candidate: CandidateCompany): { grade: LeadGrade; reason: string } {
  const hasUsefulEmail = candidate.contact.emailVerifiedStatus !== "unknown";
  const hasRisk = candidate.riskTags.some((tag) => tag.includes("零售") || tag.includes("无关") || tag.includes("待复核"));
  if (candidate.score >= 82 && hasUsefulEmail && !hasRisk) {
    return {
      grade: "A",
      reason: "主营或公开描述与产品高度相关，存在进口/分销/采购信号，且联系方式可优先验证。",
    };
  }
  if (candidate.score >= 70) {
    return {
      grade: "B",
      reason: "行业相关或客户类型匹配，但采购需求、联系人或业务规模需要进一步确认。",
    };
  }
  return {
    grade: "C",
    reason: "匹配度偏低或公开信息不足，暂不作为首批重点跟进对象。",
  };
}

export function buildLeadDossier(candidate: CandidateCompany, baseInfo: SdrBaseInfo): LeadDossier {
  const grading = gradeCandidate(candidate);
  const risks = [...new Set(candidate.riskTags.filter(Boolean))];
  const isVerified = candidate.contact.emailVerifiedStatus === "verified";
  return {
    candidateId: candidate.id,
    companyName: candidate.companyName,
    businessProfile: candidate.websiteSummary,
    mainCategories: candidate.industryGuess || baseInfo.productCategory,
    businessScale: `${candidate.employeeEstimate} employees estimate, founded around ${candidate.foundedYear}`,
    cooperationSignals: candidate.evidence.map((item) => item.label).slice(0, 3),
    purchaseNeeds: [
      `Potential sourcing need for ${baseInfo.productCategory}`,
      `May compare ${baseInfo.priceRange || "B2B wholesale"} supplier options`,
      "Needs verified compliance documents before ordering",
    ],
    businessRegions: [candidate.country, candidate.city],
    potentialLabel: candidate.purchaseProbability === "high" ? "高采购潜力" : candidate.purchaseProbability === "medium" ? "中等采购潜力" : "低优先级",
    grade: grading.grade,
    gradeReason: grading.reason,
    riskItems: risks.length ? risks : ["公开资料有限，需人工复核"],
    optimizationAdvice: [
      isVerified ? "优先用公开邮箱发送短开发信，并在 2 天后 LinkedIn 跟进。" : "先通过官网 Contact 页面或 LinkedIn 验证联系人。",
      "首封邮件只提出目录/样品沟通，不自动群发，不夸大认证和续航参数。",
    ],
  };
}

function firstName(candidate: CandidateCompany) {
  return candidate.contact.name.split(" ")[0] || "there";
}

export function buildOutreachBundle(candidate: CandidateCompany, dossier: LeadDossier, baseInfo: SdrBaseInfo): OutreachBundle {
  const product = baseInfo.productCategory;
  const greeting = firstName(candidate);
  const matchPoint = dossier.cooperationSignals[0] || `your business appears relevant to ${product}`;
  const signature = "Best regards,\nAI Trade Agent";

  return {
    candidateId: candidate.id,
    companyName: candidate.companyName,
    shortProspectingEmail: `Subject: ${product} supplier option for ${candidate.companyName}

Hi ${greeting},

I found ${candidate.companyName} while researching ${candidate.country} B2B channels for ${product}. ${matchPoint}.

We supply ${product} with ${baseInfo.coreAdvantages}. MOQ is ${baseInfo.moq}, and the current reference price range is ${baseInfo.priceRange}. Compliance documents available: ${baseInfo.certifications}.

Would you be open to reviewing a short catalog and sample terms?

${signature}`,
    deepPartnershipEmail: `Subject: OEM cooperation idea for ${candidate.companyName}

Hi ${greeting},

Based on your public profile, ${candidate.companyName} may be a fit for a structured ${product} supply partnership in ${candidate.country}.

Our factory can support OEM branding, stable production planning, spare parts preparation, and documentation for buyer review. For your team, the practical value would be fewer supplier coordination issues, clearer landed-cost evaluation, and faster sample validation.

If you are currently comparing suppliers, I can prepare a concise quotation sheet with MOQ, lead time, packaging, and compliance notes.

${signature}`,
    newProductCrowdfundingEmail: `Subject: New ${product} supply option for campaign or launch planning

Hi ${greeting},

If ${candidate.companyName} is evaluating new product launches or campaign inventory, we can support ${product} supply with sample preparation, OEM visuals, and early batch planning.

The main points: ${baseInfo.productParameters}. We avoid inflated claims and can share only the compliance and performance documents that are actually available.

Could I send a one-page launch supply sheet for your review?

${signature}`,
    whatsappMessage: `Hi ${greeting}, this is AI Trade Agent on behalf of a ${product} factory. I found ${candidate.companyName} while checking ${candidate.country} B2B buyers. Can I send a short catalog and MOQ sheet?`,
    linkedinMessage: `Hi ${greeting}, I noticed ${candidate.companyName} may be relevant to ${product} channels in ${candidate.country}. Open to connecting and exchanging supplier notes?`,
  };
}

export function buildThirtyDayFollowUp(candidate: CandidateCompany, baseInfo: SdrBaseInfo): FollowUpStep[] {
  const product = baseInfo.productCategory;
  const greeting = firstName(candidate);
  return [
    { day: 1, channel: "Email", purpose: "首次触达", copy: `Hi ${greeting}, sharing a concise ${product} supplier option with MOQ, price band and compliance notes.`, nextAction: "等待回复或 48 小时后 LinkedIn 轻跟进" },
    { day: 3, channel: "LinkedIn", purpose: "建立弱连接", copy: `Hi ${greeting}, I sent a short note about ${product} supply. Happy to send only the catalog if now is not a purchase window.`, nextAction: "若接受连接，补发目录摘要" },
    { day: 6, channel: "Email", purpose: "补充卖点", copy: `Following up with the key points buyers usually check: ${baseInfo.certifications}, MOQ ${baseInfo.moq}, and ${baseInfo.coreAdvantages}.`, nextAction: "观察打开/点击，标记兴趣" },
    { day: 10, channel: "WhatsApp", purpose: "短消息确认", copy: `Hi ${greeting}, quick check: should I send the ${product} catalog to you or a colleague responsible for sourcing?`, nextAction: "请求采购负责人邮箱" },
    { day: 15, channel: "Email", purpose: "案例/样品引导", copy: `If useful, I can prepare sample terms and packaging options for ${candidate.country} channel testing.`, nextAction: "提供样品或报价表" },
    { day: 22, channel: "LinkedIn", purpose: "低压复联", copy: `Keeping this brief: do you currently source ${product}, or should I reconnect in the next buying season?`, nextAction: "根据回复更新 A/B/C 标签" },
    { day: 30, channel: "Email", purpose: "最后一次礼貌收尾", copy: `I will close the loop for now. If ${product} sourcing becomes relevant, I can send a verified catalog, MOQ and compliance file.`, nextAction: "无回复则移入长期培育池" },
  ];
}

function buildReportSections(
  baseInfo: SdrBaseInfo,
  market: MarketResearch,
  keywords: KeywordLibrary,
  candidates: CandidateCompany[],
  dossiers: LeadDossier[],
  outreach: OutreachBundle[],
  followUp: FollowUpStep[],
) {
  const leadLines = candidates
    .slice(0, 12)
    .map((item) => `${item.companyName} | ${item.country} | ${item.contact.email} | score ${item.score}`)
    .join("\n");
  const gradeLines = dossiers
    .slice(0, 12)
    .map((item) => `${item.companyName}: ${item.grade} - ${item.gradeReason}`)
    .join("\n");
  return {
    marketAnalysis: `Product: ${baseInfo.productCategory}\nTarget: ${baseInfo.targetCountries.join(", ")}\n\nDemand:\n${market.demandAnalysis.join("\n")}\n\nBuyer concerns:\n${market.buyerConcerns.join(" / ")}\n\nCompliance:\n${market.complianceWarnings.join("\n")}`,
    keywordLibrary: `Product core:\n${keywords.productCore.join(", ")}\n\nGoogle queries:\n${keywords.googleQueries.join("\n")}\n\nLinkedIn queries:\n${keywords.linkedInQueries.join("\n")}`,
    leadList: leadLines,
    customerDossiers: dossiers
      .slice(0, 8)
      .map((item) => `${item.companyName}\n${item.businessProfile}\nPotential: ${item.potentialLabel}\nRisks: ${item.riskItems.join(", ")}`)
      .join("\n\n"),
    gradingResult: gradeLines,
    outreachCollection: outreach
      .slice(0, 3)
      .map((item) => `${item.companyName}\n${item.shortProspectingEmail}`)
      .join("\n\n---\n\n"),
    thirtyDayFollowUpSop: followUp.map((item) => `Day ${item.day} ${item.channel}: ${item.purpose} - ${item.copy}`).join("\n"),
  };
}

function buildPlanRows(candidates: CandidateCompany[], dossiers: LeadDossier[], outreach: OutreachBundle[]): SdrPlanRow[] {
  const dossierById = new Map(dossiers.map((item) => [item.candidateId, item]));
  const outreachById = new Map(outreach.map((item) => [item.candidateId, item]));
  return candidates.map((candidate, index) => {
    const dossier = dossierById.get(candidate.id);
    const bundle = outreachById.get(candidate.id);
    const firstSend = new Date(Date.now() + index * 1000 * 60 * 9);
    const nextFollowUp = new Date(firstSend.getTime() + 2 * 24 * 60 * 60 * 1000);
    return {
      candidateId: candidate.id,
      companyName: candidate.companyName,
      website: candidate.website,
      email: candidate.contact.email,
      mainCategory: dossier?.mainCategories || candidate.industryGuess,
      grade: dossier?.grade || "C",
      matchPoint: dossier?.cooperationSignals[0] || candidate.websiteSummary,
      firstEmail: bundle?.shortProspectingEmail || "",
      firstSendAt: firstSend.toISOString(),
      nextFollowUpAt: nextFollowUp.toISOString(),
      sourceUrl: candidate.sourceUrl,
      linkedinUrl: candidate.contact.linkedinUrl,
      phone: candidate.contact.phone,
      riskItems: dossier?.riskItems.join("；") || "",
      optimizationAdvice: dossier?.optimizationAdvice.join("；") || "",
    };
  });
}

function buildCsv(rows: SdrPlanRow[]) {
  const headers = ["客户公司名", "官网", "邮箱", "主营品类", "意向等级", "核心匹配点", "开发信内容", "首次发送时间", "下次跟进日期"];
  const body = rows.map((row) =>
    [
      row.companyName,
      row.website,
      row.email,
      row.mainCategory,
      row.grade,
      row.matchPoint,
      row.firstEmail,
      row.firstSendAt,
      row.nextFollowUpAt,
    ]
      .map(escapeCsv)
      .join(","),
  );
  return [headers.map(escapeCsv).join(","), ...body].join("\n");
}

async function runSearch(baseInfo: SdrBaseInfo, targetCount: number) {
  const input = normalizeLeadSearchInput({
    productKeyword: baseInfo.productCategory,
    countries: baseInfo.targetCountries,
    buyerType: primaryBuyerType(baseInfo),
    targetCount,
  });
  const provider = (process.env.SEARCH_PROVIDER || "mock").toLowerCase();
  if (provider === "google-cse" || provider === "google-custom-search") {
    try {
      return await createGoogleCustomSearchTask(input);
    } catch (error) {
      const fallback = createSearchTask(input);
      return {
        ...fallback,
        workflowLogs: [
          `真实搜索失败，已回退到 mock：${error instanceof Error ? error.message : "unknown error"}`,
          ...fallback.workflowLogs,
        ],
      };
    }
  }
  return createSearchTask(input);
}

export async function createSdrSop(baseInfoInput: Partial<SdrBaseInfo>, targetCount = 25): Promise<SdrSopResult> {
  const fallback = createEbikesUsExample();
  const baseInfo: SdrBaseInfo = {
    ...fallback,
    ...baseInfoInput,
    targetCountries: baseInfoInput.targetCountries?.length ? baseInfoInput.targetCountries : fallback.targetCountries,
    targetCustomerTypes: baseInfoInput.targetCustomerTypes?.length ? baseInfoInput.targetCustomerTypes : fallback.targetCustomerTypes,
  };
  const missingFields = validateBaseInfo(baseInfoInput);
  const marketResearch = buildMarketResearch(baseInfo);
  const keywordLibrary = buildKeywordLibrary(baseInfo);
  const searchTask = await runSearch(baseInfo, targetCount);
  const b2bCandidates = searchTask.candidates.filter((candidate) => !candidate.riskTags.some((tag) => tag.includes("零售小店")));
  const dossiers = b2bCandidates.map((candidate) => buildLeadDossier(candidate, baseInfo));
  const outreachBundles = b2bCandidates.map((candidate, index) => buildOutreachBundle(candidate, dossiers[index], baseInfo));
  const followUpPlan = buildThirtyDayFollowUp(b2bCandidates[0] || searchTask.candidates[0], baseInfo);
  const planRows = buildPlanRows(b2bCandidates, dossiers, outreachBundles);

  return {
    taskId: `sdr_${slugify(baseInfo.productCategory)}_${Date.now()}`,
    status: "done",
    baseInfo,
    missingFields,
    marketResearch,
    keywordLibrary,
    searchTask: {
      ...searchTask,
      candidates: b2bCandidates,
      resultCount: b2bCandidates.length,
    },
    dossiers,
    outreachBundles,
    followUpPlan,
    planRows,
    reportSections: buildReportSections(baseInfo, marketResearch, keywordLibrary, b2bCandidates, dossiers, outreachBundles, followUpPlan),
    complianceNotes: [
      "系统只服务 B2B 批发外贸拓客，不面向 C 端消费者抓取。",
      "客户信息仅用于人工确认后的商务开发；不自动群发邮件，不绕过网站条款。",
      "欧美市场需先核查 FCC、CE、UL、进口关税、品类准入和本地责任主体要求。",
      "开发信不得生成虚假认证、虚假客户案例或夸大性能承诺。",
      "当前版本默认本地存储；如接入第三方 API，应在部署环境中单独配置密钥。",
    ],
    exportCsv: buildCsv(planRows),
    workflowLogs: [
      "Step1 基础信息校验完成",
      "Step2 目标市场调研报告已生成",
      "Step3 Google / LinkedIn 关键词库已生成",
      "Step4 公开来源线索抓取与 B2B 清洗完成",
      "Step5 客户背调档案已生成",
      "Step6 A/B/C 意向分级完成",
      "Step7 三套英文开发信已生成",
      "Step8 30 天 7 次跟进 SOP 已生成",
      "Step9 标准 CSV 数据包已生成，可用 Excel 打开",
    ],
  };
}
