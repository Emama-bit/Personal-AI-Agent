import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "自由职业 AI Skill 市场",
  description: "需求侧先试用 Skill AI，再选择自由职业者真人服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <nav className="bg-white border-b border-border sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-primary">
              AI Skill 市场
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/#skill-market"
                className="text-muted hover:text-foreground transition-colors"
              >
                需求侧找技能
              </Link>
              <Link
                href="/create"
                className="bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
              >
                响应侧发布 Skill
              </Link>
              <Link
                href="/leads"
                className="text-muted hover:text-foreground transition-colors"
              >
                查看线索
              </Link>
              <Link
                href="/dashboard"
                className="text-muted hover:text-foreground transition-colors"
              >
                个人中心
              </Link>
              <Link
                href="/login"
                className="text-muted hover:text-foreground transition-colors"
              >
                登录
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
