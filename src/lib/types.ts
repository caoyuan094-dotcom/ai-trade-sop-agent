export type BuyerType =
  | "distributor"
  | "wholesaler"
  | "importer"
  | "retailer"
  | "brand"
  | "project buyer";

export type EvidenceKind = "fact" | "assumption";

export type Evidence = {
  kind: EvidenceKind;
  label: string;
  source: string;
};

export type LeadSearchInput = {
  productKeyword: string;
  countries: string[];
  buyerType: BuyerType;
  targetCount?: number;
};

export type SdrCustomerType = "importer" | "brand" | "offline_dealer" | "ecommerce_seller" | "distributor" | "wholesaler";

export type SdrBaseInfo = {
  productCategory: string;
  productParameters: string;
  targetCountries: string[];
  targetCustomerTypes: SdrCustomerType[];
  coreAdvantages: string;
  certifications: string;
  moq: string;
  priceRange: string;
  productLink?: string;
};

export type CandidateContact = {
  id: string;
  name: string;
  title: string;
  email: string;
  emailVerifiedStatus: "verified" | "suspected" | "unknown";
  phone?: string;
  linkedinUrl?: string;
};

export type CandidateCompany = {
  id: string;
  companyName: string;
  country: string;
  city: string;
  website: string;
  websiteSummary: string;
  industryGuess: string;
  employeeEstimate: string;
  foundedYear: number;
  sourceUrl: string;
  sourceType: "mock-search" | "google-custom-search" | "google-maps" | "directory";
  scrapedAt: string;
  contact: CandidateContact;
  score: number;
  purchaseProbability: "high" | "medium" | "low";
  recommendedStrategy: string;
  evidence: Evidence[];
  riskTags: string[];
  stage: "candidate" | "private-crm" | "public-pool";
  nextFollowUpAt: string;
};

export type SearchTaskResult = {
  taskId: string;
  status: "done";
  resultCount: number;
  costEstimateUsd: number;
  startedAt: string;
  finishedAt: string;
  candidates: CandidateCompany[];
  workflowLogs: string[];
};

export type KeywordLibrary = {
  productCore: string[];
  industryScenario: string[];
  customerIdentity: string[];
  competitorBenchmark: string[];
  googleQueries: string[];
  linkedInQueries: string[];
};

export type MarketResearch = {
  demandAnalysis: string[];
  competitorPainPoints: string[];
  buyerConcerns: string[];
  priceBand: string;
  hotStyles: string[];
  complianceWarnings: string[];
};

export type LeadGrade = "A" | "B" | "C";

export type LeadDossier = {
  candidateId: string;
  companyName: string;
  businessProfile: string;
  mainCategories: string;
  businessScale: string;
  cooperationSignals: string[];
  purchaseNeeds: string[];
  businessRegions: string[];
  potentialLabel: string;
  grade: LeadGrade;
  gradeReason: string;
  riskItems: string[];
  optimizationAdvice: string[];
};

export type OutreachBundle = {
  candidateId: string;
  companyName: string;
  shortProspectingEmail: string;
  deepPartnershipEmail: string;
  newProductCrowdfundingEmail: string;
  whatsappMessage: string;
  linkedinMessage: string;
};

export type FollowUpStep = {
  day: number;
  channel: "Email" | "LinkedIn" | "WhatsApp";
  purpose: string;
  copy: string;
  nextAction: string;
};

export type SdrPlanRow = {
  candidateId: string;
  companyName: string;
  website: string;
  email: string;
  mainCategory: string;
  grade: LeadGrade;
  matchPoint: string;
  firstEmail: string;
  firstSendAt: string;
  nextFollowUpAt: string;
  sourceUrl?: string;
  linkedinUrl?: string;
  phone?: string;
  riskItems?: string;
  optimizationAdvice?: string;
};

export type SdrSopResult = {
  taskId: string;
  status: "done";
  baseInfo: SdrBaseInfo;
  missingFields: string[];
  marketResearch: MarketResearch;
  keywordLibrary: KeywordLibrary;
  searchTask: SearchTaskResult;
  dossiers: LeadDossier[];
  outreachBundles: OutreachBundle[];
  followUpPlan: FollowUpStep[];
  planRows: SdrPlanRow[];
  reportSections: {
    marketAnalysis: string;
    keywordLibrary: string;
    leadList: string;
    customerDossiers: string;
    gradingResult: string;
    outreachCollection: string;
    thirtyDayFollowUpSop: string;
  };
  complianceNotes: string[];
  exportCsv: string;
  workflowLogs: string[];
};

export type FactoryProfile = {
  companyName: string;
  productLine: string;
  targetMarket: string;
  sellingPoints: string;
  certifications: string;
  moq: string;
  leadTime: string;
  website: string;
};

export type ContentTone = "formal" | "friendly" | "direct";

export type GeneratedContent = {
  subject: string;
  email: string;
  whatsapp: string;
  linkedin: string;
  followUp: string;
  socialCalendar: Array<{
    day: string;
    channel: string;
    copy: string;
  }>;
  aiTrace: {
    provider: "mock" | "openai";
    model: string;
    promptVersion: string;
    estimatedCostUsd: number;
    warning?: string;
  };
};
