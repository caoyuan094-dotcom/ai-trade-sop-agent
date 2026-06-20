import * as XLSX from "xlsx";
import { createSdrSop } from "@/lib/sdr-sop-engine";
import type { SdrBaseInfo } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

type ExportRequest = {
  baseInfo?: Partial<SdrBaseInfo>;
  targetCount?: number;
};

function rowsToSheet(rows: Record<string, unknown>[]) {
  return XLSX.utils.json_to_sheet(rows.length ? rows : [{ status: "暂无数据" }]);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ExportRequest | null;

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createSdrSop(body.baseInfo || {}, body.targetCount || 25);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(
      result.planRows.map((row) => ({
        客户公司名: row.companyName,
        官网: row.website,
        邮箱: row.email,
        电话: row.phone || "",
        LinkedIn: row.linkedinUrl || "",
        主营品类: row.mainCategory,
        意向等级: row.grade,
        核心匹配点: row.matchPoint,
        风险项: row.riskItems || "",
        优化建议: row.optimizationAdvice || "",
        开发信内容: row.firstEmail,
        首次发送时间: row.firstSendAt,
        下次跟进日期: row.nextFollowUpAt,
        来源链接: row.sourceUrl || "",
      })),
    ),
    "客户线索清单",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet([
      ...result.keywordLibrary.productCore.map((value) => ({ 类型: "产品核心词", 关键词: value })),
      ...result.keywordLibrary.industryScenario.map((value) => ({ 类型: "行业场景词", 关键词: value })),
      ...result.keywordLibrary.customerIdentity.map((value) => ({ 类型: "客户身份词", 关键词: value })),
      ...result.keywordLibrary.competitorBenchmark.map((value) => ({ 类型: "竞品对标词", 关键词: value })),
      ...result.keywordLibrary.googleQueries.map((value) => ({ 类型: "Google检索式", 关键词: value })),
      ...result.keywordLibrary.linkedInQueries.map((value) => ({ 类型: "LinkedIn检索式", 关键词: value })),
    ]),
    "关键词库",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(
      result.dossiers.map((item) => ({
        客户公司名: item.companyName,
        业务简介: item.businessProfile,
        主营品类: item.mainCategories,
        业务规模: item.businessScale,
        合作信号: item.cooperationSignals.join("；"),
        采购需求: item.purchaseNeeds.join("；"),
        业务区域: item.businessRegions.join("；"),
        采购潜力: item.potentialLabel,
        意向等级: item.grade,
        分级原因: item.gradeReason,
        风险项: item.riskItems.join("；"),
        优化建议: item.optimizationAdvice.join("；"),
      })),
    ),
    "客户背调档案",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(
      result.outreachBundles.map((item) => ({
        客户公司名: item.companyName,
        简短拓客版: item.shortProspectingEmail,
        深度合作代理版: item.deepPartnershipEmail,
        新品众筹供货版: item.newProductCrowdfundingEmail,
        WhatsApp消息: item.whatsappMessage,
        LinkedIn私信: item.linkedinMessage,
      })),
    ),
    "开发信合集",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(
      result.followUpPlan.map((item) => ({
        天数: `Day ${item.day}`,
        渠道: item.channel,
        跟进目的: item.purpose,
        跟进文案: item.copy,
        下一步动作: item.nextAction,
      })),
    ),
    "30天跟进SOP",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet([
      ...result.marketResearch.demandAnalysis.map((value) => ({ 板块: "市场需求", 内容: value })),
      ...result.marketResearch.competitorPainPoints.map((value) => ({ 板块: "竞品痛点", 内容: value })),
      ...result.marketResearch.buyerConcerns.map((value) => ({ 板块: "采购关注点", 内容: value })),
      { 板块: "市场价格带", 内容: result.marketResearch.priceBand },
      ...result.marketResearch.hotStyles.map((value) => ({ 板块: "热销款式", 内容: value })),
      ...result.marketResearch.complianceWarnings.map((value) => ({ 板块: "合规提醒", 内容: value })),
      ...result.complianceNotes.map((value) => ({ 板块: "系统约束", 内容: value })),
    ]),
    "市场分析与合规",
  );

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const workbookBody = new Uint8Array(buffer).buffer;
  const encodedName = encodeURIComponent(`AI外贸客户开发SOP-${Date.now()}.xlsx`);

  return new Response(workbookBody, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
    },
  });
}
