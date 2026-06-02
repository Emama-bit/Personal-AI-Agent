import Link from "next/link";

interface ProxyCardProps {
  id: string;
  name: string;
  domain: string;
  description: string;
  chunkCount: number;
  avgRating?: number;
  ratingCount?: number;
}

export default function ProxyCard({
  id,
  name,
  domain,
  description,
  chunkCount,
  avgRating = 0,
  ratingCount = 0,
}: ProxyCardProps) {
  const auditionLine = getAuditionLine(domain);

  return (
    <Link href={`/proxy/${id}`} className="skill-theater-card block">
      <div className="skill-stage">
        <div className="stage-spotlight" />
        <div className="stage-curtain left" />
        <div className="stage-curtain right" />
        <div className="performer-avatar">✦</div>
        <div className="stage-content">
          <span className="stage-label">Skill AI 现场试镜</span>
          <h3>{name}</h3>
          <p>“{auditionLine}”</p>
        </div>
      </div>

      <div className="skill-card-body">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {domain}
          </span>
          {ratingCount > 0 ? (
            <span className="flex items-center gap-1 text-xs text-muted">
              <span className="text-yellow-400">★</span>
              {avgRating}
              <span className="text-gray-300">({ratingCount})</span>
            </span>
          ) : (
            <span className="text-xs text-gray-300">暂无评价</span>
          )}
        </div>

        <p className="text-sm text-muted line-clamp-2 mb-4">
          {description || "暂无描述"}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-muted">试镜方式</p>
            <p className="font-medium text-foreground mt-0.5">AI 即时回答</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-muted">真人服务</p>
            <p className="font-medium text-foreground mt-0.5">可转线索</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <span>{chunkCount} 条技能素材</span>
          <span>风险边界待确认</span>
        </div>

        <div className="mt-4 rounded-xl bg-foreground text-white text-center text-sm font-semibold py-2.5">
          进入试镜 →
        </div>
      </div>
    </Link>
  );
}

function getAuditionLine(domain: string) {
  if (domain.includes("内容") || domain.includes("文案")) {
    return "我先给你 5 个选题方向，再判断哪个更容易转化。";
  }
  if (domain.includes("技术") || domain.includes("代码")) {
    return "我先定位错误层级，再给你排查路径。";
  }
  if (domain.includes("商业") || domain.includes("创业")) {
    return "我先拆目标用户、痛点和商业闭环。";
  }
  if (domain.includes("求职") || domain.includes("简历")) {
    return "我先指出经历表达的问题，再给修改方向。";
  }
  return "我先展示我的判断方法，再决定是否升级真人服务。";
}
