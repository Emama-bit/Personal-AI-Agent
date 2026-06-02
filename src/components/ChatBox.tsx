"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export interface AuditionMessage {
  role: "user" | "assistant";
  content: string;
}

interface DisplayMessage extends AuditionMessage {
  sources?: string[];
}

export default function ChatBox({
  proxyId,
  onFinishAudition,
  onAuditionActiveChange,
  onAuditionMessagesChange,
}: {
  proxyId: string;
  onFinishAudition?: (messages: AuditionMessage[]) => void;
  onAuditionActiveChange?: (active: boolean) => void;
  onAuditionMessagesChange?: (messages: AuditionMessage[]) => void;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [history, setHistory] = useState<AuditionMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [loginName, setLoginName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setIsLoggedIn(window.localStorage?.getItem("skill-market-auth") === "true");
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  useEffect(() => {
    onAuditionActiveChange?.(messages.length > 0);
    onAuditionMessagesChange?.(messages);
  }, [messages, messages.length, onAuditionActiveChange, onAuditionMessagesChange]);

  async function send(skipAuth = false) {
    const text = input.trim();
    if (!text || loading) return;
    if (!skipAuth && !isLoggedIn) {
      setShowLoginGate(true);
      return;
    }

    setInput("");
    // 立即显示用户消息
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/proxy/${proxyId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history, // 发送完整历史
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `错误：${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, sources: data.sources },
        ]);
        // 同步服务端返回的完整历史
        if (data.history) {
          setHistory(data.history);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络错误，请重试" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([]);
    setHistory([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function loginAndContinue() {
    try {
      window.localStorage?.setItem("skill-market-auth", "true");
      window.localStorage?.setItem("dashboard-role", "buyer");
      window.localStorage?.setItem(
        "dashboard-identity",
        loginName.trim() || "需求侧体验用户"
      );
    } catch {}
    setIsLoggedIn(true);
    setShowLoginGate(false);
    setTimeout(() => {
      send(true);
    }, 0);
  }

  return (
    <div className="flex flex-col h-[390px] min-h-[390px] lg:h-[420px] lg:min-h-[420px]">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-t-xl">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-muted py-6">
            <div>
            <p className="text-4xl mb-3">💬</p>
            <p>先试用这个 Skill AI</p>
            <p className="text-xs mt-1">
              描述你的需求、贴一段材料或询问服务者的判断方法
            </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-white border border-border rounded-bl-md"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-muted">
                  参考资料：{msg.sources.join("、")}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入区域 */}
      <div className="border border-t-0 border-border rounded-b-xl p-3 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你想试用的问题，例如：帮我看看这段文案/代码/BP/简历有什么问题..."
            rows={2}
            className="flex-1 resize-none border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            disabled={loading}
          />
          <div className="flex flex-col gap-1.5 self-end">
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              试用
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-muted hover:text-red-400 transition-colors px-2"
              >
                清空对话
              </button>
            )}
          </div>
        </div>
        {history.length > 0 && (
          <p className="text-xs text-muted mt-1.5">
            已记录 {history.length} 条对话上下文
          </p>
        )}
        {messages.length > 0 && onFinishAudition && (
          <div className="audition-finish-bar">
            <div>
              <strong>这个 Skill 合适吗？</strong>
              <span>聊得可以，再进入信任校验舱并留下真人服务意向。</span>
            </div>
            <button type="button" onClick={() => onFinishAudition(messages)}>
              试镜结束，就它了
            </button>
          </div>
        )}
      </div>

      {showLoginGate && (
        <div className="skill-login-modal" role="dialog" aria-modal="true">
          <div className="skill-login-card">
            <button
              type="button"
              className="skill-login-close"
              onClick={() => setShowLoginGate(false)}
              aria-label="关闭登录弹窗"
            >
              ×
            </button>

            <div className="skill-login-visual" aria-hidden="true">
              <span className="skill-login-orbit orbit-one" />
              <span className="skill-login-orbit orbit-two" />
              <span className="skill-login-core">
                Skill
                <br />
                Gate
              </span>
            </div>

            <div>
              <p className="text-sm text-primary font-semibold mb-2">
                使用 Skill AI 前需要登录
              </p>
              <h2 className="text-2xl font-bold tracking-tight">
                市场可以随便逛，真正试用时再登记身份。
              </h2>
              <p className="text-sm text-muted leading-relaxed mt-3">
                登录后我们会把你的试用、意向、报价单和托管状态归到需求侧个人中心。
                当前仍是 MVP 模拟登录，不做真实账号校验。
              </p>
            </div>

            <div className="skill-login-form">
              <input
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="你的称呼 / 邮箱 / 手机号"
              />
              <button type="button" onClick={loginAndContinue}>
                登录并继续试用 →
              </button>
              <Link href="/login">去完整登录页选择角色</Link>
            </div>

            <p className="skill-login-risk">
              登录即确认：平台仅提供 Skill AI 展示、试用、撮合和托管辅助；
              AI 输出不构成专业最终意见。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
