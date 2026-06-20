"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Globe2,
  Mail,
  Paperclip,
  Play,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { LeadGrade, SdrBaseInfo, SdrCustomerType, SdrSopResult } from "@/lib/types";

const agents = [
  { id: "lead", name: "外贸获客员工", role: "客户搜索 / 背调 / 开发信", status: "在线", enabled: true },
  { id: "analysis", name: "客户分析员工", role: "客户画像 / 风险判断", status: "预览", enabled: false },
  { id: "email", name: "邮件营销员工", role: "跟进节奏 / 邮件触达", status: "第二阶段", enabled: false },
  { id: "social", name: "社媒运营员工", role: "LinkedIn / Facebook", status: "第三阶段", enabled: false },
];

const customerTypeOptions: Array<{ value: SdrCustomerType; label: string }> = [
  { value: "importer", label: "进口商" },
  { value: "brand", label: "品牌商" },
  { value: "offline_dealer", label: "线下经销商" },
  { value: "ecommerce_seller", label: "电商卖家" },
  { value: "distributor", label: "分销商" },
  { value: "wholesaler", label: "批发商" },
];

const sopSteps = ["信息校验", "市场调研", "关键词", "线索抓取", "客户背调", "分级", "开发信", "跟进", "导出"];

const reportLabels: Array<[keyof SdrSopResult["reportSections"], string]> = [
  ["marketAnalysis", "市场分析"],
  ["keywordLibrary", "关键词库"],
  ["leadList", "客户线索清单"],
  ["customerDossiers", "客户背调档案"],
  ["gradingResult", "分级结果"],
  ["outreachCollection", "开发信合集"],
  ["thirtyDayFollowUpSop", "30天跟进SOP"],
];

const ebikeExample: SdrBaseInfo = {
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

const emptyBaseInfo: SdrBaseInfo = {
  productCategory: "",
  productParameters: "",
  targetCountries: ["United States"],
  targetCustomerTypes: ["importer", "offline_dealer"],
  coreAdvantages: "",
  certifications: "",
  moq: "",
  priceRange: "",
  productLink: "",
};

function parseCountries(value: string) {
  return value
    .split(/[,，/、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    productCategory: "产品品类",
    productParameters: "产品参数",
    targetCountries: "目标国家",
    targetCustomerTypes: "目标客户类型",
    coreAdvantages: "核心优势",
    certifications: "认证资质",
    moq: "起订量",
    priceRange: "价格区间",
  };
  return labels[field] || field;
}

function gradeText(grade: LeadGrade) {
  if (grade === "A") return "高意向";
  if (grade === "B") return "中意向";
  return "低意向";
}

export function DemoWorkspace() {
  const [activeAgentId, setActiveAgentId] = useState("lead");
  const activeAgent = agents.find((agent) => agent.id === activeAgentId) || agents[0];
  const [instruction, setInstruction] = useState("@外贸获客员工 跑一遍美国 eBike 客户开发 SOP，优先进口商、经销商、电商卖家");
  const [baseInfo, setBaseInfo] = useState<SdrBaseInfo>(ebikeExample);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [result, setResult] = useState<SdrSopResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState("等待任务。填写产品与目标市场后，外贸获客员工会生成完整客户开发包。");

  const activeLead = result?.searchTask.candidates[0];
  const activeOutreach = result?.outreachBundles[0];
  const selectedDossier = result?.dossiers[0];
  const gradeStats = useMemo(() => {
    const stats = { A: 0, B: 0, C: 0 };
    result?.dossiers.forEach((item) => {
      stats[item.grade] += 1;
    });
    return stats;
  }, [result]);
  const missingLabels = result?.missingFields.map(fieldLabel) || [];

  function updateBaseInfo<K extends keyof SdrBaseInfo>(key: K, value: SdrBaseInfo[K]) {
    setBaseInfo((current) => ({ ...current, [key]: value }));
  }

  function toggleCustomerType(value: SdrCustomerType) {
    setBaseInfo((current) => {
      const exists = current.targetCustomerTypes.includes(value);
      return {
        ...current,
        targetCustomerTypes: exists
          ? current.targetCustomerTypes.filter((item) => item !== value)
          : [...current.targetCustomerTypes, value],
      };
    });
  }

  function useExample() {
    setBaseInfo(ebikeExample);
    setInstruction("@外贸获客员工 跑一遍美国 eBike 客户开发 SOP，优先进口商、经销商、电商卖家");
    setFeedback("已载入 eBike 美国市场示例。");
  }

  function clearForm() {
    setBaseInfo(emptyBaseInfo);
    setResult(null);
    setFeedback("已清空，输入新产品后再执行。");
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const names = Array.from(files).map((file) => file.name);
    setUploadedFiles((current) => [...names, ...current].slice(0, 5));
    setFeedback(`已加入资料：${names.join("、")}`);
  }

  async function runSop() {
    if (!activeAgent.enabled) {
      setFeedback(`${activeAgent.name} 还未开放。第一阶段请使用 @外贸获客员工。`);
      return;
    }

    setIsRunning(true);
    setFeedback("执行中：市场调研、关键词生成、线索抓取、背调分级、开发信和跟进计划。");

    const response = await fetch("/api/sdr/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseInfo, targetCount: 25 }),
    });
    const data = (await response.json()) as SdrSopResult;
    setResult(data);
    setFeedback(
      data.missingFields.length
        ? `已生成结果，但建议补全：${data.missingFields.map(fieldLabel).join("、")}`
        : `已完成：${data.searchTask.resultCount} 条线索，A类 ${data.dossiers.filter((item) => item.grade === "A").length} 条。`,
    );
    setIsRunning(false);
  }

  async function downloadExcel() {
    if (!result) return;
    const response = await fetch("/api/sdr/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseInfo: result.baseInfo, targetCount: Math.max(result.searchTask.resultCount, 5) }),
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `AI外贸客户开发SOP-${Date.now()}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="sdrApp">
      <aside className="sdrSidebar" aria-label="数字员工">
        <div className="sdrBrand">
          <div className="brandMark">AI</div>
          <div>
            <strong>AI Trade Agent</strong>
            <span>B2B 外贸获客</span>
          </div>
        </div>

        <section className="sideSection">
          <p className="sideLabel">数字员工</p>
          <div className="agentList">
            {agents.map((agent) => (
              <button
                className={agent.id === activeAgentId ? "agentItem active" : "agentItem"}
                key={agent.id}
                type="button"
                onClick={() => {
                  setActiveAgentId(agent.id);
                  setInstruction(`@${agent.name} ${instruction.replace(/@\S+\s*/, "")}`);
                }}
              >
                <Bot size={17} />
                <span>
                  <strong>{agent.name}</strong>
                  <small>{agent.role}</small>
                </span>
                <em>{agent.status}</em>
              </button>
            ))}
          </div>
        </section>

        <section className="sideSection">
          <p className="sideLabel">模板</p>
          <button className="templateButton" type="button" onClick={useExample}>
            美国 eBike 客户开发
          </button>
          <button className="templateButton" type="button" onClick={() => updateBaseInfo("productCategory", "outdoor camping chair")}>
            户外用品批发商
          </button>
          <button className="templateButton" type="button" onClick={() => updateBaseInfo("productCategory", "baby stroller")}>
            母婴用品进口商
          </button>
        </section>

        <section className="quotaBox">
          <ShieldCheck size={17} />
          <div>
            <strong>人工确认边界</strong>
            <span>生成开发信和跟进计划，不自动群发。</span>
          </div>
        </section>
      </aside>

      <section className="sdrMain">
        <header className="workHeader">
          <div>
            <span className="eyebrow">AI SDR Employee</span>
            <h1>让外贸获客员工跑完整客户开发 SOP</h1>
          </div>
          <button className="ghostButton" type="button" onClick={useExample}>
            <Sparkles size={16} />
            eBike 示例
          </button>
        </header>

        <section className="commandPanel">
          <div className="commandTop">
            <span className="mention">@{activeAgent.name}</span>
            <span className={activeAgent.enabled ? "statePill online" : "statePill"}>{activeAgent.status}</span>
          </div>
          <textarea
            aria-label="给数字员工下指令"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="@外贸获客员工 帮我找美国 eBike 经销商，并生成客户背调、开发信和跟进表"
          />
          <div className="commandActions">
            <label className="softControl">
              <Paperclip size={16} />
              上传资料
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                onChange={(event) => handleFiles(event.target.files)}
              />
            </label>
            <div className="softControl linkControl">
              <Globe2 size={16} />
              <input
                aria-label="产品链接"
                value={baseInfo.productLink || ""}
                onChange={(event) => updateBaseInfo("productLink", event.target.value)}
                placeholder="产品链接"
              />
            </div>
            <button className="primaryButton" type="button" onClick={runSop} disabled={isRunning}>
              {isRunning ? <Sparkles size={17} /> : <Send size={17} />}
              {isRunning ? "执行中" : "开始执行"}
            </button>
          </div>
        </section>

        {uploadedFiles.length ? (
          <div className="uploadedStrip">
            <FileText size={15} />
            {uploadedFiles.map((name) => <span key={name}>{name}</span>)}
          </div>
        ) : null}

        <section className="infoPanel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Input</span>
              <h2>基础信息</h2>
            </div>
            <button type="button" onClick={clearForm}>清空</button>
          </div>

          <div className="compactGrid">
            <label>
              产品品类
              <input value={baseInfo.productCategory} onChange={(event) => updateBaseInfo("productCategory", event.target.value)} />
            </label>
            <label>
              目标国家
              <input value={baseInfo.targetCountries.join(", ")} onChange={(event) => updateBaseInfo("targetCountries", parseCountries(event.target.value))} />
            </label>
            <label>
              起订量
              <input value={baseInfo.moq} onChange={(event) => updateBaseInfo("moq", event.target.value)} />
            </label>
            <label>
              价格区间
              <input value={baseInfo.priceRange} onChange={(event) => updateBaseInfo("priceRange", event.target.value)} />
            </label>
          </div>

          <div className="textareaGrid">
            <label>
              产品参数
              <textarea value={baseInfo.productParameters} onChange={(event) => updateBaseInfo("productParameters", event.target.value)} />
            </label>
            <label>
              核心优势
              <textarea value={baseInfo.coreAdvantages} onChange={(event) => updateBaseInfo("coreAdvantages", event.target.value)} />
            </label>
          </div>

          <label className="fullField">
            认证资质
            <input value={baseInfo.certifications} onChange={(event) => updateBaseInfo("certifications", event.target.value)} />
          </label>

          <div className="customerChips">
            {customerTypeOptions.map((option) => (
              <button
                className={baseInfo.targetCustomerTypes.includes(option.value) ? "active" : ""}
                key={option.value}
                type="button"
                onClick={() => toggleCustomerType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="statusPanel">
          <div className="statusLine">
            <MessageIcon />
            <p>{feedback}</p>
          </div>
          <div className="stepRail">
            {sopSteps.map((step, index) => (
              <span className={result || isRunning ? "done" : ""} key={step}>
                <b>{index + 1}</b>
                {step}
              </span>
            ))}
          </div>
        </section>

        {result ? (
          <section className="reportArea">
            <div className="panelHeader">
              <div>
                <span className="eyebrow">Report</span>
                <h2>完整拓客方案</h2>
              </div>
              {missingLabels.length ? (
                <span className="warningText">
                  <AlertTriangle size={15} />
                  建议补全：{missingLabels.join("、")}
                </span>
              ) : (
                <span className="successText">
                  <CheckCircle2 size={15} />
                  信息完整
                </span>
              )}
            </div>

            <div className="reportCards">
              {reportLabels.map(([key, label], index) => (
                <details open={index < 2} key={key}>
                  <summary>{label}</summary>
                  <pre>{result.reportSections[key]}</pre>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <aside className="resultDock" aria-label="结果">
        <section className="metricPanel">
          <span className="eyebrow">Result</span>
          <h2>{result ? `${result.searchTask.resultCount} 条线索` : "等待执行"}</h2>
          <div className="metricGrid">
            <span><b>{gradeStats.A}</b>A类</span>
            <span><b>{gradeStats.B}</b>B类</span>
            <span><b>{gradeStats.C}</b>C类</span>
          </div>
          <button className="exportButton" type="button" onClick={() => void downloadExcel()} disabled={!result}>
            <Download size={16} />
            导出 Excel
          </button>
        </section>

        {activeLead && activeOutreach && selectedDossier ? (
          <>
            <section className="focusLead">
              <div className="focusHeader">
                <span className={`gradeBadge grade${selectedDossier.grade}`}>{selectedDossier.grade}</span>
                <div>
                  <strong>{activeLead.companyName}</strong>
                  <small>{activeLead.country} · {gradeText(selectedDossier.grade)} · {activeLead.score}分</small>
                </div>
              </div>
              <p>{activeLead.websiteSummary}</p>
              <div className="miniLinkGrid">
                <a href={activeLead.website} target="_blank" rel="noreferrer">官网</a>
                <span>{activeLead.contact.email}</span>
              </div>
              <div className="riskList">
                {selectedDossier.riskItems.map((risk) => <em key={risk}>{risk}</em>)}
              </div>
            </section>

            <section className="leadList">
              <div className="dockTitle">
                <Users size={16} />
                <strong>线索队列</strong>
              </div>
              {result?.searchTask.candidates.slice(0, 8).map((candidate) => {
                const dossier = result.dossiers.find((item) => item.candidateId === candidate.id);
                return (
                  <article key={candidate.id}>
                    <span className={`gradeDot grade${dossier?.grade || "C"}`}>{dossier?.grade || "C"}</span>
                    <div>
                      <strong>{candidate.companyName}</strong>
                      <small>{candidate.country} · {candidate.contact.email}</small>
                    </div>
                    <b>{candidate.score}</b>
                  </article>
                );
              })}
            </section>

            <section className="draftBox">
              <div className="dockTitle">
                <Mail size={16} />
                <strong>首封开发信</strong>
              </div>
              <pre>{activeOutreach.shortProspectingEmail}</pre>
            </section>

            <section className="followBox">
              <div className="dockTitle">
                <ClipboardList size={16} />
                <strong>30天跟进</strong>
              </div>
              {result?.followUpPlan.map((step) => (
                <p key={`${step.day}-${step.channel}`}>
                  <b>Day {step.day}</b>
                  <span>{step.channel}</span>
                  <em>{step.purpose}</em>
                </p>
              ))}
            </section>
          </>
        ) : (
          <section className="emptyDock">
            <Search size={24} />
            <strong>结果会显示在这里</strong>
            <p>执行后生成客户列表、分级、开发信和 Excel 数据包。</p>
          </section>
        )}

        <section className="integrationStrip">
          <span><FileSpreadsheet size={14} /> 聚水潭字段</span>
          <span><Target size={14} /> RPA预留</span>
          <span><ShieldCheck size={14} /> 合规提醒</span>
        </section>
      </aside>
    </main>
  );
}

function MessageIcon() {
  return (
    <span className="messageIcon">
      <Play size={14} />
    </span>
  );
}
