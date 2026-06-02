import type { AIProvider, ChatMessage } from "./types";

export class MockAIProvider implements AIProvider {
  async chat({
    context,
    userMessage,
    history = [],
  }: {
    systemPrompt: string;
    context: string;
    userMessage: string;
    history?: ChatMessage[];
  }): Promise<string> {
    const contextPreview = context.slice(0, 600).trim();
    const turn = Math.floor(history.length / 2) + 1;

    return [
      turn > 1 ? `**第 ${turn} 轮追问分析**\n` : "",
      "**基于 Skill 参考资料的初步判断：**",
      "",
      contextPreview
        ? `我在资料中找到这些相关信息：\n\n> ${contextPreview.replace(/\n/g, "\n> ")}\n`
        : "暂时没有找到直接相关的 Skill 素材，我会先按通用方法给你一个低风险试用回答。",
      `**针对你的问题「${userMessage.slice(0, 50)}${userMessage.length > 50 ? "..." : ""}」：**`,
      "",
      turn === 1
        ? [
            "我建议先从 4 个角度拆：",
            "",
            "1. **目标确认**：你真正想得到的是判断、方案、修改建议，还是可交付成品？",
            "2. **现状材料**：请补充上下文、已有内容、限制条件和你最担心的点。",
            "3. **风险边界**：AI 只能做初步判断，关键决策需要真人确认。",
            "4. **下一步动作**：如果你愿意，可以继续贴材料，我会按这个 Skill 的方法给你逐段分析。",
          ].join("\n")
        : [
            "结合前面的对话，我会把重点收窄到可执行建议：",
            "",
            "1. 先确认你最想优化的一个指标。",
            "2. 再把材料拆成“已有信息 / 缺失信息 / 风险点”。",
            "3. 最后给出 1-3 个可以马上尝试的改法。",
          ].join("\n"),
      "",
      "---",
      "*当前使用模拟 AI 模式。配置真实模型后，这里会返回模型生成结果。AI 结果仅供试用参考，复杂需求建议升级真人服务。*",
    ].join("\n");
  }
}
