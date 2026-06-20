import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI外贸获客数字员工系统",
  description: "用对话指挥 AI 外贸获客员工完成产品分析、客户搜索、评分、开发信和轻 CRM。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
