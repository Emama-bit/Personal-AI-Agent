"use client";

import { useEffect, useState, useMemo } from "react";
import DemandPrismHero from "@/components/DemandPrismHero";
import ProxyCard from "@/components/ProxyCard";
import type { ProxyItem } from "@/types/domain";

interface RatingInfo {
  avgRating: number;
  ratingCount: number;
}

type SortBy = "default" | "rating" | "data" | "newest";

interface DemandMatch {
  proxy: ProxyItem;
  score: number;
  reasons: string[];
}

const demandExamples = [
  "我想做一个副业项目，但不知道先找谁帮我拆方案。",
  "小红书账号没方向，想先试几个选题和标题。",
  "简历经历很散，想包装成更像项目成果的表达。",
  "前端项目一直报错，需要先判断问题在哪一层。",
];

const domainKeywords: Record<string, string[]> = {
  "求职/简历优化": ["简历", "求职", "面试", "转岗", "经历", "项目成果", "候选人"],
  "内容/营销文案": ["小红书", "内容", "文案", "标题", "种草", "账号", "选题", "营销"],
  "技术/代码调试": ["代码", "报错", "前端", "接口", "构建", "bug", "react", "next"],
  "商业/创业咨询": ["创业", "副业", "商业", "bp", "融资", "用户", "痛点", "模式", "项目"],
};

export default function Home() {
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [demandText, setDemandText] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("default");

  useEffect(() => {
  // 加载服务列表
    fetch("/api/proxy")
      .then((r) => r.json())
      .then(async (data) => {
        const list = data.proxies || [];
        setProxies(list);

        // 批量加载评分
        const ratingMap: Record<string, RatingInfo> = {};
        await Promise.all(
          list.map(async (p: ProxyItem) => {
            try {
              const res = await fetch(`/api/proxy/${p.id}/rate`);
              const r = await res.json();
              ratingMap[p.id] = {
                avgRating: r.avgRating || 0,
                ratingCount: r.ratingCount || 0,
              };
            } catch {}
          })
        );
        setRatings(ratingMap);
      })
      .finally(() => setLoading(false));
  }, []);

  // 提取所有领域标签
  const domains = useMemo(() => {
    const set = new Set(proxies.map((p) => p.domain));
    return Array.from(set);
  }, [proxies]);

  const demandMatches = useMemo(
    () => getDemandMatches(proxies, ratings, demandText),
    [proxies, ratings, demandText]
  );

  // 过滤 + 排序
  const filtered = useMemo(() => {
    let result = proxies;

    // 筛选
    if (selectedDomain) {
      result = result.filter((p) => p.domain === selectedDomain);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q)
      );
    }

    // 排序
    if (sortBy === "rating") {
      result = [...result].sort((a, b) => {
        const ra = ratings[a.id]?.avgRating || 0;
        const rb = ratings[b.id]?.avgRating || 0;
        return rb - ra;
      });
    } else if (sortBy === "data") {
      result = [...result].sort((a, b) => b.chunkCount - a.chunkCount);
    } else if (sortBy === "newest") {
      // 默认 API 返回顺序就是最新的在前（取决于后端）
    }

    return result;
  }, [proxies, search, selectedDomain, sortBy, ratings]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <DemandPrismHero />

      {!loading && proxies.length > 0 && (
        <section className="demand-match-lab">
          <div className="demand-match-copy">
            <span>需求雷达</span>
            <h2>不用先懂类目，先把需求扔进来</h2>
            <p>
              平台会把模糊需求拆成可试用的 Skill 路径：先看匹配理由，再进入 Skill AI
              试镜，合适再提交真人服务意向。
            </p>
            <div className="demand-example-list">
              {demandExamples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setDemandText(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="demand-match-console">
            <label htmlFor="demand-radar-input">描述你的真实需求</label>
            <textarea
              id="demand-radar-input"
              value={demandText}
              onChange={(event) => setDemandText(event.target.value)}
              placeholder="例如：我有一个副业想法，但不知道商业模式、内容获客和技术 MVP 应该先找谁拆..."
            />
            <div className="match-console-actions">
              <button
                type="button"
                onClick={() => {
                  setSearch(demandText);
                  setSelectedDomain("");
                  window.location.hash = "skill-market";
                }}
                disabled={!demandText.trim()}
              >
                用这段需求搜索市场
              </button>
              {demandText && (
                <button type="button" onClick={() => setDemandText("")}>
                  清空
                </button>
              )}
            </div>
          </div>

          <div className="demand-match-results">
            {demandMatches.map((match, index) => (
              <article key={match.proxy.id} className="match-card">
                <div className="match-card-top">
                  <span>推荐 {index + 1}</span>
                  <strong>{match.score}%</strong>
                </div>
                <h3>{match.proxy.name}</h3>
                <p>{match.proxy.description}</p>
                <div className="match-meter">
                  <i style={{ width: `${match.score}%` }} />
                </div>
                <div className="match-reasons">
                  {match.reasons.map((reason) => (
                    <span key={reason}>{reason}</span>
                  ))}
                </div>
                <div className="match-actions">
                  <a href={`/proxy/${match.proxy.id}`}>进入试镜</a>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDomain(match.proxy.domain);
                      setSearch("");
                      window.location.hash = "skill-market";
                    }}
                  >
                    看同类 Skill
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 搜索和筛选 */}
      {!loading && proxies.length > 0 && (
        <div id="skill-market" className="mb-6 space-y-3 scroll-mt-20">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索服务者、擅长方向、简历场景..."
              className="w-full border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              🔍
            </span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* 领域筛选 + 排序 */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {domains.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDomain("")}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    !selectedDomain
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-muted hover:bg-gray-200"
                  }`}
                >
                  全部
                </button>
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setSelectedDomain(selectedDomain === d ? "" : d)
                    }
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                      selectedDomain === d
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-muted hover:bg-gray-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {/* 排序 */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted">排序：</span>
              {(
                [
                  ["default", "默认"],
                  ["rating", "评分最高"],
                  ["data", "素材最多"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-2 py-1 rounded transition-colors ${
                    sortBy === key
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 结果统计 */}
          <p className="text-xs text-muted">
            {filtered.length === proxies.length
              ? `共 ${proxies.length} 个 Skill AI`
              : `找到 ${filtered.length} / ${proxies.length} 个 Skill AI`}
          </p>
        </div>
      )}

      {/* Skill 列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted">加载中...</div>
      ) : proxies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🧩</p>
          <h2 className="text-xl font-semibold mb-2">还没有 Skill AI</h2>
          <p className="text-muted mb-6">成为第一个发布自由职业 Skill 的人</p>
          <a
            href="/create"
            className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
          >
            发布 Skill
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-muted">没有找到匹配的 Skill AI</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedDomain("");
            }}
            className="text-primary text-sm mt-2 hover:underline"
          >
            清除筛选条件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProxyCard
              key={p.id}
              id={p.id}
              name={p.name}
              domain={p.domain}
              description={p.description}
              chunkCount={p.chunkCount}
              avgRating={ratings[p.id]?.avgRating}
              ratingCount={ratings[p.id]?.ratingCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getDemandMatches(
  proxies: ProxyItem[],
  ratings: Record<string, RatingInfo>,
  demandText: string
): DemandMatch[] {
  const query = demandText.trim().toLowerCase();

  return proxies
    .map((proxy) => {
      const keywords = domainKeywords[proxy.domain] || [];
      const searchable = [
        proxy.name,
        proxy.domain,
        proxy.description,
        ...keywords,
      ]
        .join(" ")
        .toLowerCase();
      const matchedKeywords = keywords.filter((keyword) =>
        query.includes(keyword.toLowerCase())
      );
      const directHit = query
        ? [proxy.name, proxy.domain, proxy.description].some((text) =>
            query
              .split(/\s+|，|。|、|；|,|\./)
              .filter(Boolean)
              .some((word) => text.toLowerCase().includes(word))
          )
        : false;
      const fuzzyHit = query
        ? query
            .split("")
            .filter((char) => char.trim() && searchable.includes(char)).length
        : 0;
      const ratingBoost = Math.round((ratings[proxy.id]?.avgRating || 0) * 4);
      const materialBoost = Math.min(14, proxy.chunkCount * 6);
      const intentScore = query
        ? matchedKeywords.length * 18 + (directHit ? 16 : 0) + fuzzyHit
        : 0;
      const score = Math.min(
        96,
        Math.max(46, 48 + intentScore + ratingBoost + materialBoost)
      );
      const reasons = buildMatchReasons(proxy, matchedKeywords, Boolean(query));

      return { proxy, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildMatchReasons(
  proxy: ProxyItem,
  matchedKeywords: string[],
  hasDemand: boolean
) {
  const reasons = new Set<string>();

  if (matchedKeywords.length > 0) {
    reasons.add(`命中 ${matchedKeywords.slice(0, 3).join(" / ")}`);
  }
  if (proxy.chunkCount > 0) {
    reasons.add(`${proxy.chunkCount} 条方法素材可试用`);
  }
  if (hasDemand) {
    reasons.add("适合先用 AI 低成本试单");
  } else {
    reasons.add("输入需求后会重新排序");
  }
  reasons.add("可升级真人服务线索");

  return Array.from(reasons).slice(0, 3);
}
