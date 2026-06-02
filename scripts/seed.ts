import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function chunkText(text: string, proxyId: string, source: string) {
  const paragraphs = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const chunks: { proxyId: string; text: string; source: string; index: number }[] = [];
  let buffer = "";
  let idx = 0;
  for (const para of paragraphs) {
    if (buffer.length + para.length > 500 && buffer.length > 0) {
      chunks.push({ proxyId, text: buffer.trim(), source, index: idx++ });
      buffer = buffer.slice(-50) + "\n\n" + para;
    } else {
      buffer += (buffer ? "\n\n" : "") + para;
    }
  }
  if (buffer.trim()) {
    chunks.push({ proxyId, text: buffer.trim(), source, index: idx });
  }
  return chunks;
}

// 示例替身 1：合同审查专家
const proxy1Id = genId();
const proxy1 = {
  id: proxy1Id,
  name: "王律师 - 合同审查专家",
  domain: "法律/合同审查",
  description: "执业15年的合同法律师，擅长劳动合同、商业合同、租赁合同的风险审查。处理过800+合同纠纷案件。",
  systemPrompt: "你是「王律师 - 合同审查专家」，一位法律/合同审查领域的资深专家。\n关于你自己：执业15年的合同法律师，擅长劳动合同、商业合同、租赁合同的风险审查。\n请基于以下参考资料回答用户问题。\n如果参考资料中没有相关内容，请基于你的专业知识诚实回答，并说明依据。\n每个回答末尾标注置信度：[高] / [中] / [低] / [不确定]",
  createdAt: new Date().toISOString(),
  fileNames: ["合同审查要点.txt", "常见风险条款.txt"],
  chunkCount: 0,
};

const proxy1Texts = [
  {
    content: `劳动合同审查要点

一、必备条款检查
1. 用人单位名称、住所和法定代表人
2. 劳动者姓名、住址和身份证号码
3. 劳动合同期限（固定/无固定/以完成一定工作任务为期限）
4. 工作内容和工作地点
5. 工作时间和休息休假
6. 劳动报酬（基本工资、绩效、奖金、补贴）
7. 社会保险
8. 劳动保护、劳动条件和职业危害防护

二、高风险条款重点审查
1. 竞业限制条款：
   - 限制期限不得超过2年
   - 必须约定经济补偿（一般不低于离职前12个月平均工资的30%）
   - 限制范围应合理（行业、地域、时间）
   - 没有约定补偿金的竞业限制，实践中多数法院认为未生效

2. 试用期条款：
   - 合同期限1年以下：试用期不超过1个月
   - 合同期限1-3年：试用期不超过2个月
   - 合同期限3年以上或无固定期限：试用期不超过6个月
   - 同一用人单位与同一劳动者只能约定一次试用期

3. 违约金条款：
   - 只有培训服务期和竞业限制两种情况可以约定违约金
   - 其他情况下约定违约金的条款无效`,
    source: "合同审查要点.txt",
  },
  {
    content: `常见合同风险条款

一、模糊条款
"公司有权根据经营需要调整员工工作岗位和薪酬"
→ 风险：过于宽泛，可能导致用人单位单方面变更劳动合同
→ 建议：明确调整的条件、程序和幅度限制

二、兜底条款
"员工应遵守公司所有规章制度"
→ 风险：规章制度可能未经民主程序制定，内容可能不合理
→ 建议：要求附上主要规章制度清单，确认规章制度经过民主程序

三、放弃权利条款
"员工自愿放弃带薪年假"
→ 风险：违反劳动法强制性规定，无效但可能影响维权心态
→ 建议：删除此类条款

四、社保相关
"公司将社保费用折算为现金发放给员工"
→ 风险：违反社保法强制性规定
→ 建议：明确要求依法缴纳社保

五、保密与知识产权
"员工在职期间及离职后创作的所有作品归公司所有"
→ 风险：范围过宽，可能侵犯员工非职务作品的著作权
→ 建议：明确限定为"利用公司资源完成的职务作品"`,
    source: "常见风险条款.txt",
  },
];

// 示例替身 2：文案写作专家
const proxy2Id = genId();
const proxy2 = {
  id: proxy2Id,
  name: "李老师 - 营销文案专家",
  domain: "营销/文案写作",
  description: "10年品牌营销经验，服务过50+品牌。擅长产品文案、品牌故事、社交媒体内容创作。",
  systemPrompt: "你是「李老师 - 营销文案专家」，一位营销/文案写作领域的资深专家。\n关于你自己：10年品牌营销经验，服务过50+品牌。擅长产品文案、品牌故事、社交媒体内容创作。\n请基于以下参考资料回答用户问题。\n如果参考资料中没有相关内容，请基于你的专业知识诚实回答，并说明依据。\n每个回答末尾标注置信度：[高] / [中] / [低] / [不确定]",
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  fileNames: ["文案写作技巧.txt"],
  chunkCount: 0,
};

const proxy2Texts = [
  {
    content: `文案写作核心技巧

一、标题公式
1. 数字型："3个方法让你的转化率提升200%"
2. 疑问型："为什么你的文案没人看？"
3. 对比型："月薪3千和月薪3万的文案，差距在这里"
4. 紧迫型："最后3天，错过再等一年"
5. 利益型："学会这招，让你的产品卖断货"

二、开头技巧
1. 痛点切入：直击用户最深的焦虑
2. 故事切入：用一个真实案例引入
3. 数据切入："80%的人都不知道..."
4. 场景切入：描述用户日常使用场景

三、卖点提炼
FAB法则：
- Feature（特征）：产品有什么
- Advantage（优势）：比别人好在哪
- Benefit（利益）：能给用户带来什么

四、行动号召（CTA）
- 降低决策门槛："先试用，不满意全额退款"
- 制造紧迫感："限量100份"
- 社交证明："已有10万人选择"
- 损失厌恶："不行动的代价是..."

五、常见错误
1. 自嗨型文案：只说自己多厉害，不说用户能得到什么
2. 信息过载：一个文案想传达10个卖点
3. 脱离场景：不考虑用户在哪里看到这条文案
4. 缺乏差异化：和竞品说的一模一样`,
    source: "文案写作技巧.txt",
  },
];

// 生成所有 chunks
const allChunks = [
  ...proxy1Texts.flatMap((t) => chunkText(t.content, proxy1Id, t.source)),
  ...proxy2Texts.flatMap((t) => chunkText(t.content, proxy2Id, t.source)),
];

proxy1.chunkCount = allChunks.filter((c) => c.proxyId === proxy1Id).length;
proxy2.chunkCount = allChunks.filter((c) => c.proxyId === proxy2Id).length;

// 写入文件
fs.writeFileSync(
  path.join(DATA_DIR, "proxies.json"),
  JSON.stringify([proxy1, proxy2], null, 2),
  "utf-8"
);

fs.writeFileSync(
  path.join(DATA_DIR, "chunks.json"),
  JSON.stringify(allChunks, null, 2),
  "utf-8"
);

fs.writeFileSync(
  path.join(DATA_DIR, "ratings.json"),
  JSON.stringify([], null, 2),
  "utf-8"
);

console.log("示例数据创建成功！");
console.log(`替身1: ${proxy1.name} (${proxy1.chunkCount} chunks)`);
console.log(`替身2: ${proxy2.name} (${proxy2.chunkCount} chunks)`);
