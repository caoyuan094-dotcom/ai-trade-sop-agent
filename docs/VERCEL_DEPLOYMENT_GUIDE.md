# AI 外贸业务员 Vercel 部署小白手册

这份手册按“本地代码调整 -> 上传 GitHub -> 关联 Vercel -> 一键上线 -> 打开公开链接测试”的顺序写。当前项目已经按 Vercel 标准改成 Next.js + Serverless API，不需要自建服务器、不需要 Docker、不需要备案。

## 1. 现在代码已经调整了什么

已经新增这些关键文件：

| 文件 | 用途 |
| --- | --- |
| `package.json` | 告诉 Vercel 这是一个 Next.js 项目，定义安装、构建、测试命令 |
| `src/app/page.tsx` | 首页入口 |
| `src/components/demo-workspace.tsx` | 可点击的 AI 外贸业务员体验台 |
| `src/app/api/leads/search/route.ts` | 客户搜索 Serverless API |
| `src/app/api/content/generate/route.ts` | 开发信生成 Serverless API |
| `src/app/api/health/route.ts` | 线上健康检查 API |
| `src/lib/*` | 业务类型、模拟客户搜索、内容生成逻辑 |
| `.env.example` | 环境变量模板 |
| `vercel.json` | Vercel 部署配置 |

这版为了最快上线测试，默认使用模拟客户搜索和模拟 AI 内容。页面能完整跑通：填写工厂资料 -> 生成候选客户 -> 查看评分 -> 生成开发信 -> 加入 CRM -> 模拟发送。

## 2. 本地先跑一下

在项目根目录执行：

```bash
npm install
cp .env.example .env.local
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

如果看到“AI 外贸业务员”控制台，说明本地没问题。

## 3. 环境变量怎么填

本项目最少不填任何密钥也能部署，因为默认是体验模式。

在 Vercel 后台的 `Settings -> Environment Variables` 里添加：

| 变量名 | 值 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `AI_PROVIDER` | `mock` | 必填 | 体验版用 mock，最稳 |
| `NEXT_PUBLIC_APP_NAME` | `AI Export Agent` | 必填 | 页面和健康检查显示的应用名 |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | 必填 | 标记当前是演示模式 |
| `OPENAI_API_KEY` | 你的 OpenAI key | 可选 | 只有 `AI_PROVIDER=openai` 才需要 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 可选 | OpenAI 内容生成模型 |
| `SEARCH_PROVIDER` | `mock` | 可选 | 后续接真实搜索时再改 |
| `SENDGRID_API_KEY` | 留空 | 可选 | 后续真实发信再填 |
| `SENDGRID_FROM_EMAIL` | 留空 | 可选 | 后续真实发信再填 |
| `TRACKING_BASE_URL` | 留空 | 可选 | 后续邮件追踪再填 |

小白建议：第一次部署只填前三个变量，先确认页面能打开。

## 4. 上传到 GitHub

如果你还没有 GitHub 仓库：

1. 打开 [GitHub](https://github.com)。
2. 点右上角 `+`。
3. 点 `New repository`。
4. Repository name 填：`ai-export-agent-vercel-demo`。
5. 选择 `Private` 或 `Public` 都可以。
6. 不要勾选 README、.gitignore、license，因为本地已经有文件。
7. 点 `Create repository`。

然后回到本地终端，按 GitHub 页面给你的地址替换下面命令里的 URL：

```bash
git add .
git commit -m "feat: add vercel demo for ai export agent"
git branch -M main
git remote add origin https://github.com/你的用户名/ai-export-agent-vercel-demo.git
git push -u origin main
```

如果提示 `remote origin already exists`，说明以前加过远程仓库，改用：

```bash
git remote set-url origin https://github.com/你的用户名/ai-export-agent-vercel-demo.git
git push -u origin main
```

## 5. 关联 Vercel

1. 打开 [Vercel](https://vercel.com)。
2. 用 GitHub 登录。
3. 点 `Add New...`。
4. 点 `Project`。
5. 找到刚才的 GitHub 仓库 `ai-export-agent-vercel-demo`。
6. 点 `Import`。

Vercel 通常会自动识别：

| 配置项 | 应该显示 |
| --- | --- |
| Framework Preset | `Next.js` |
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Output Directory | 留空或 `.next` |

不要改复杂配置，保持默认即可。

## 6. 在 Vercel 填环境变量

在导入项目页面找到 `Environment Variables`，添加：

```text
AI_PROVIDER=mock
NEXT_PUBLIC_APP_NAME=AI Export Agent
NEXT_PUBLIC_DEMO_MODE=true
```

然后点 `Deploy`。

## 7. 获取公开访问链接

部署成功后，Vercel 会给你一个公开链接，格式大概是：

```text
https://ai-export-agent-vercel-demo-xxx.vercel.app
```

点这个链接就能直接打开页面测试。把这个链接发给客户、同事或试点工厂即可。

健康检查链接是：

```text
https://你的项目.vercel.app/api/health
```

如果这里返回 `{"ok":true,...}`，说明 Serverless API 也正常。

## 8. 页面测试流程

1. 打开首页。
2. 在“工厂资料”里确认公司、产品线、卖点、认证、MOQ、交期。
3. 在“客户搜索 Agent”里填：
   - 产品关键词：`LED display screen`
   - 目标国家：`Germany, United States`
   - 客户类型：`distributor`
   - 数量：`50`
4. 点“生成候选客户”。
5. 点击高分客户，查看“AI 客户分析”。
6. 点“加入 CRM”。
7. 在“开发内容”里选语气，点“生成开发信”。
8. 点“复制”或“模拟发送”。
9. 看“轻 CRM”和“工作流日志”是否更新。

这就完成了 PRD 里“工厂资料 -> 客户搜索 -> AI 分析 -> 内容生成 -> 跟进记录”的线上体验闭环。

## 9. 以后每次更新怎么上线

本地改完代码后执行：

```bash
git add .
git commit -m "chore: update demo"
git push
```

只要 Vercel 已关联 GitHub，`git push` 后它会自动重新部署。部署完成后，原来的公开链接会自动更新到新版。

## 10. 常见问题

### 页面能打开，但生成客户失败

打开：

```text
https://你的项目.vercel.app/api/health
```

如果 health 正常，再回 Vercel 后台看 `Logs`。体验版不依赖数据库，通常是构建或环境变量问题。

### 需要真实 OpenAI 生成怎么办

在 Vercel 环境变量里改成：

```text
AI_PROVIDER=openai
OPENAI_API_KEY=你的真实 key
OPENAI_MODEL=gpt-4o-mini
```

保存后点 `Redeploy`。如果 OpenAI 调用失败，接口会回退到 mock 内容，页面不会白屏。

### 需要真实发邮件怎么办

当前版本只模拟发送，避免误发和域名配置问题。真实发信建议下一步接 SendGrid 或 Mailgun，并先配置 SPF、DKIM、DMARC，再把发送动作放在人工确认按钮后面。

### 需要数据库怎么办

体验版先不用数据库。真实 MVP 建议接 Vercel Postgres、Neon 或 Supabase，然后把浏览器 localStorage 里的 CRM 数据迁到数据库表。

### Vercel 链接要备案吗

只是用 Vercel 的 `*.vercel.app` 公网链接做海外线上体验测试，通常不走国内备案流程。中国大陆访问速度和稳定性可能受网络环境影响；如果正式面向国内客户长期访问，再考虑国内云和备案。
