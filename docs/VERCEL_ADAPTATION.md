# Vercel 适配说明

## 适配目标

这版不是完整生产 MVP，而是面向客户演示和线上可点击测试的 Vercel 体验版。核心原则是：能部署、能打开、能跑通 PRD 主链路，不引入自建服务器、容器、队列或复杂数据库。

## 项目结构

```text
.
├── src/app                  # Next.js App Router 页面和 Serverless API
│   ├── api/health           # 部署健康检查
│   ├── api/leads/search     # 客户搜索 Agent mock API
│   ├── api/content/generate # 开发内容生成 API，可选 OpenAI
│   ├── layout.tsx
│   └── page.tsx
├── src/components           # 前端体验台
├── src/lib                  # 业务类型、mock 数据、搜索和内容生成逻辑
├── docs                     # Vercel 部署与改造说明
├── vercel.json              # Vercel 项目配置
└── .env.example             # 环境变量模板
```

## 架构调整

| PRD 完整版 | Vercel 体验版 |
| --- | --- |
| 前端 Web 控制台 | `src/app/page.tsx` + `src/components/demo-workspace.tsx` |
| FastAPI/NestJS 后端 | Next.js Route Handlers，也就是 Vercel Serverless Functions |
| PostgreSQL/Redis/队列 | 浏览器 localStorage + mock 任务结果 |
| Google Search/Maps/官网抓取 | `mock-search` 数据生成器 |
| 邮件发送与追踪 | 模拟发送日志，不实际发信 |
| OpenAI/Claude LLM Gateway | 可选 `AI_PROVIDER=openai`，默认 mock |
| 工作流引擎 | 固定 4 步工作流日志 |

## 保留的 PRD 主流程

- 工厂资料字段：公司、产品线、卖点、认证、MOQ、交期、官网。
- 客户搜索三要素：产品关键词、国家、客户类型。
- 候选客户字段：公司、国家、城市、官网、摘要、联系人、邮箱、评分、证据、风险标签。
- AI 客户分析：综合评分、采购概率、推荐策略、事实/推测区分。
- 内容生成：开发信、WhatsApp、LinkedIn、跟进内容、社媒排期。
- 轻 CRM：私海客户、阶段、下次跟进时间。
- 自动化：每次搜索和发送动作记录到工作流日志。

## 后续升级到真实 MVP

1. 数据库：接入 Vercel Postgres、Neon 或 Supabase，把 localStorage 替换成真实 `Organization`、`Customer`、`Interaction` 表。
2. 搜索：把 `src/lib/lead-engine.ts` 中的 mock 生成器替换为 Google Custom Search API、Google Maps API 或合规第三方数据服务。
3. AI：把 `AI_PROVIDER` 设为 `openai`，并逐步增加 Prompt 版本管理、AI 调用日志和成本统计表。
4. 邮件：接 SendGrid、Mailgun 或 Amazon SES；发送前继续保留人工确认节点。
5. 追踪：增加打开追踪 pixel、链接重写和退订页。
6. 登录：接入 Clerk、Auth.js 或 Vercel Marketplace 中的认证服务。
