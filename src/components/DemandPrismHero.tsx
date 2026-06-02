export default function DemandPrismHero() {
  return (
    <section className="demand-prism-hero mb-10">
      <div className="demand-prism-copy">
        <p className="text-sm font-semibold text-primary mb-3">
          AI 增强型自由职业平台
        </p>
        <h1 className="text-4xl md:text-6xl font-black tracking-[-0.06em] leading-[0.98] mb-5">
          自由职业者的
          <br />
          AI Skill 试单市场
        </h1>
        <p className="text-muted max-w-xl leading-relaxed">
          平台连接需求侧与响应侧：需求侧先用 Skill AI 快速试单，判断能力与风格；
          响应侧发布个人 Skill AI，承接轻咨询，并把高价值需求转成人工服务线索。
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <a
            href="#skill-market"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            需求侧：输入需求找 Skill
          </a>
          <a
            href="/create"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold hover:border-primary/50 hover:text-primary transition-colors"
          >
            响应侧：发布我的 Skill AI
          </a>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">使用风险提示</p>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            平台仅提供 Skill AI 展示、试用、撮合与交易辅助服务。AI
            输出不构成法律、医疗、金融等专业最终意见；具体服务内容、交付质量与责任边界，
            由需求侧和响应侧在真人服务前自行确认。
          </p>
        </div>
      </div>

      <div className="demand-prism-stage" aria-hidden="true">
        <div className="demand-input-card">
          <span>需求侧输入</span>
          <strong>“我想做一个副业项目，但不知道先找谁帮我拆方案。”</strong>
        </div>

        <div className="prism-ray prism-ray-in" />
        <div className="prism-core" />
        <div className="prism-ray prism-ray-one" />
        <div className="prism-ray prism-ray-two" />
        <div className="prism-ray prism-ray-three" />

        <div className="skill-path-card path-one">
          <small>路径 01</small>
          <strong>BP 初筛 Skill</strong>
          <span>先判断商业闭环与目标用户</span>
        </div>
        <div className="skill-path-card path-two">
          <small>路径 02</small>
          <strong>小红书内容 Skill</strong>
          <span>再验证获客内容方向</span>
        </div>
        <div className="skill-path-card path-three">
          <small>路径 03</small>
          <strong>前端开发 Skill</strong>
          <span>最后评估 MVP 技术成本</span>
        </div>

        <div className="prism-floating-chip chip-one">AI 试用</div>
        <div className="prism-floating-chip chip-two">真人服务</div>
        <div className="prism-floating-chip chip-three">风险边界</div>
      </div>
    </section>
  );
}
