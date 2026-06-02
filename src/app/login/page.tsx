"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState("");

  function enterProviderDashboard() {
    try {
      window.localStorage?.setItem("skill-market-auth", "true");
      window.localStorage?.setItem("dashboard-role", "provider");
      window.localStorage?.setItem(
        "dashboard-identity",
        identity.trim() || "自由职业响应者"
      );
    } catch {}
    router.push("/dashboard");
  }

  return (
    <div className="login-page provider-mode">
      <section className="login-shell">
        <div className="login-copy">
          <Link href="/" className="login-brand">
            <span>Skill</span>
            <strong>AI 市场</strong>
          </Link>
          <p className="login-kicker">响应侧登录入口</p>
          <h1>需求侧不用登录，响应侧进入星门。</h1>
          <p className="login-description">
            需求侧可以直接浏览 Skill 市场；真正试用 Skill AI 时再做轻量登记。
            响应侧需要进入工作台，发布 Skill、管理线索、生成报价单和处理托管交易。
          </p>
          <div className="login-flow">
            <span>公开浏览市场</span>
            <i />
            <span>试用时登记</span>
            <i />
            <span>响应侧登录管理</span>
          </div>
        </div>

        <div className="login-stage">
          <div className="login-role-gate">
            <Link href="/#skill-market" className="login-role-card">
              <small>需求侧</small>
              <strong>不用登录，直接逛 Skill 市场</strong>
              <span>先看 Skill、看介绍、看风险提示；真正试用时再弹轻量登记。</span>
            </Link>
            <div className="login-role-card active provider-card">
              <small>响应侧</small>
              <strong>我要发布自己的 Skill AI</strong>
              <span>进入响应侧星门，管理 Skill、线索、报价和托管交易。</span>
            </div>
          </div>

          <div className="login-card">
            <div className="provider-starfield" aria-hidden="true">
              <span className="star-node node-a">内容 Skill</span>
              <span className="star-node node-b">商业 Skill</span>
              <span className="star-node node-c">技术 Skill</span>
              <span className="star-orbit orbit-a" />
              <span className="star-orbit orbit-b" />
            </div>

            <div className="login-card-head">
              <span>Skill 星门已打开</span>
              <h2>响应侧登录</h2>
              <p>
                这里暂时是 MVP 模拟登录。后续会接真实账号、权限隔离、发布者资料和结算身份。
              </p>
            </div>

            <div className="login-form">
              <input
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                placeholder="你的自由职业者名称 / 邮箱"
              />
              <input placeholder="验证码 / 密码（MVP 暂不校验）" />
              <button type="button" onClick={enterProviderDashboard}>
                进入响应侧星门 →
              </button>
            </div>

            <div className="login-risk-note">
              登录即确认：平台仅提供 Skill AI 展示、试用、撮合、线索和托管交易辅助；
              AI 输出不构成专业最终意见。
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
