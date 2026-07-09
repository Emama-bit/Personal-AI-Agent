import type OpenAI from "openai";
import {
  handleListSkills,
  handleGetSkill,
  handleCreateSkill,
  handleDeleteSkill,
  handleChatWithSkill,
  handleRateSkill,
  handleListLeads,
  handleGetLead,
  handleCreateLead,
  handleUpdateLead,
  handleListQuotes,
  handleCreateQuote,
  handleAcceptQuote,
  handleListOrders,
  handleCreateOrder,
  handleUpdateOrder,
  handleListReviews,
  handleCreateReview,
} from "./tools/index";
import {
  loadProfile,
  saveProfile,
  addHabit,
  removeHabit,
  updatePreference,
  updateBio,
  updateName,
  getProfileSummary,
} from "./profile";
import {
  addEvent,
  searchEvents,
  getRecentEvents,
  getEventsByPerson,
  touchPerson,
  updatePersonInfo,
  getPersonSummary,
  addDecision,
  getRecentDecisions,
  getMemorySummary,
} from "./events";
import { importWeChatChat, importWeChatFile } from "./wechat";

export const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_skills",
      description: "列出市场上所有可用的 Skill（AI 人格）。返回 Skill 的 id、名称、领域、描述和知识库块数。",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_skill",
      description: "获取单个 Skill 的详细信息，包括系统提示词和知识库配置。",
      parameters: {
        type: "object",
        properties: { id: { type: "string", description: "Skill ID" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_skill",
      description: "创建一个新的 Skill（AI 人格）。需要名称、领域、描述，可选上传参考文本用于 RAG 知识库。",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Skill 名称" },
          domain: { type: "string", description: "专业领域" },
          description: { type: "string", description: "Skill 描述" },
          texts: {
            type: "array",
            description: "参考文本数组，用于构建 RAG 知识库",
            items: {
              type: "object",
              properties: {
                content: { type: "string", description: "文本内容" },
                source: { type: "string", description: "来源名称" },
              },
            },
          },
        },
        required: ["name", "domain", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_skill",
      description: "删除一个 Skill 及其关联的知识库数据。",
      parameters: {
        type: "object",
        properties: { id: { type: "string", description: "Skill ID" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "chat_with_skill",
      description: "与某个 Skill 进行 AI 试聊。返回该 Skill 的 RAG 上下文和系统提示，用于回答用户关于该 Skill 的问题。",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Skill ID" },
          message: { type: "string", description: "用户消息" },
          history: {
            type: "array",
            description: "对话历史",
            items: {
              type: "object",
              properties: {
                role: { type: "string" },
                content: { type: "string" },
              },
            },
          },
        },
        required: ["id", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rate_skill",
      description: "对某个 Skill 进行评分（1-5 星），可选附带评论。",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Skill ID" },
          stars: { type: "number", description: "评分 1-5" },
          comment: { type: "string", description: "评论内容" },
        },
        required: ["id", "stars"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_leads",
      description: "列出所有服务线索（按时间倒序）。线索代表潜在客户的服务意向。",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lead",
      description: "获取单条线索的详细信息。",
      parameters: {
        type: "object",
        properties: { id: { type: "string", description: "线索 ID" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "为某个 Skill 创建一条服务线索（客户意向）。需要客户信息和需求描述。",
      parameters: {
        type: "object",
        properties: {
          proxyId: { type: "string", description: "Skill ID" },
          skillName: { type: "string", description: "Skill 名称" },
          customerName: { type: "string", description: "客户名称" },
          contact: { type: "string", description: "联系方式" },
          need: { type: "string", description: "需求描述" },
        },
        required: ["proxyId", "skillName", "customerName", "contact", "need"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_lead",
      description: "更新线索状态（new/contacted/proposal/won/closed）或解锁客户联系方式。",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "线索 ID" },
          status: { type: "string", description: "新状态" },
          unlock: { type: "boolean", description: "是否解锁联系方式" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_quotes",
      description: "列出所有报价单（按时间倒序）。",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_quote",
      description: "为一条线索自动生成报价单。报价金额基于需求复杂度自动计算。",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "string", description: "线索 ID" },
          skillName: { type: "string", description: "Skill 名称" },
          need: { type: "string", description: "需求内容" },
        },
        required: ["leadId", "skillName", "need"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "accept_quote",
      description: "接受一条报价单。接受后可创建托管订单。",
      parameters: {
        type: "object",
        properties: { id: { type: "string", description: "报价单 ID" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_orders",
      description: "列出所有托管订单（按时间倒序）。",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "从已接受的报价单创建托管订单。报价单必须已接受。",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "string", description: "线索 ID" },
          quoteId: { type: "string", description: "报价单 ID" },
        },
        required: ["leadId", "quoteId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order",
      description: "更新托管订单状态（escrowed/delivered/settled/disputed）。",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "订单 ID" },
          status: { type: "string", description: "新状态" },
        },
        required: ["id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_reviews",
      description: "列出服务评价。可按 Skill ID 或订单 ID 过滤。",
      parameters: {
        type: "object",
        properties: {
          proxyId: { type: "string", description: "按 Skill ID 过滤" },
          orderId: { type: "string", description: "按订单 ID 过滤" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_review",
      description: "为已结算的托管订单提交服务评价。订单必须处于 settled 状态。",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "订单 ID" },
          stars: { type: "number", description: "评分 1-5" },
          comment: { type: "string", description: "评价内容" },
        },
        required: ["orderId", "stars"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "feed_habit",
      description: "喂养个人习惯。当用户描述自己的习惯、作息、偏好时调用此工具记录。",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "习惯分类，如：作息、饮食、工作、运动、学习、社交" },
          content: { type: "string", description: "习惯内容的具体描述" },
          confidence: { type: "number", description: "置信度 1-10，10 表示用户明确说过" },
        },
        required: ["category", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "feed_preference",
      description: "喂养个人偏好设置。如喜欢的沟通方式、工作工具、饮食偏好等。",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "偏好名称，如：沟通方式、编程语言、咖啡口味" },
          value: { type: "string", description: "偏好值" },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "feed_document",
      description: "喂养一段个人文档（简历、日记、工作笔记等），从中提取个人习惯和偏好。",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "文档内容" },
          source: { type: "string", description: "文档来源，如：简历、日记、自我介绍" },
        },
        required: ["content", "source"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_profile",
      description: "查看当前个人画像，包括所有已记录的习惯和偏好。",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_habit",
      description: "删除一条已记录的习惯。",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "习惯 ID" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_bio",
      description: "更新个人简介。",
      parameters: {
        type: "object",
        properties: {
          bio: { type: "string", description: "个人简介内容" },
        },
        required: ["bio"],
      },
    },
  },
  // ── Event Memory Tools ──────────────────────────────────
  {
    type: "function",
    function: {
      name: "add_event",
      description: "记录一条事件。当用户提到发生了某件事、见了某人、做了某事时，自动调用此工具。",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "事件分类：会议、社交、工作、学习、生活、项目、其他" },
          summary: { type: "string", description: "一句话概括事件" },
          details: { type: "string", description: "详细描述" },
          people: { type: "array", items: { type: "string" }, description: "涉及的人物姓名" },
          tags: { type: "array", items: { type: "string" }, description: "标签关键词" },
        },
        required: ["category", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_decision",
      description: "记录一个决策。当用户做出选择、决定方向时调用。",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "决策主题" },
          options: { type: "array", items: { type: "string" }, description: "考虑过的选项" },
          chosen: { type: "string", description: "最终选择" },
          reason: { type: "string", description: "选择原因" },
        },
        required: ["topic", "chosen", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_events",
      description: "搜索历史事件记忆。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_events",
      description: "查看最近的事件记录。",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "查看最近几天，默认7天" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_person_info",
      description: "查看某个人的信息和互动历史。",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "人名" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_people_list",
      description: "查看所有人脉记录。",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_memory_summary",
      description: "查看完整的记忆概览：最近事件、人脉、决策。",
      parameters: { type: "object", properties: {} },
    },
  },
  // ── WeChat Import Tools ────────────────────────────────
  {
    type: "function",
    function: {
      name: "import_wechat",
      description: "导入微信聊天记录文本。支持多种格式：微信PC导出、时间戳格式等。自动提取事件、人物、习惯。",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "聊天记录文本内容" },
          ownerName: { type: "string", description: "聊天记录主人的昵称（区分自己和他人）" },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "import_wechat_file",
      description: "从文件导入微信聊天记录。支持 .txt 和 .csv 格式。",
      parameters: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "文件路径" },
          ownerName: { type: "string", description: "聊天记录主人的昵称" },
        },
        required: ["filePath"],
      },
    },
  },
];

export async function dispatch(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const handlers: Record<string, (input: any) => Promise<string>> = {
    list_skills: handleListSkills,
    get_skill: handleGetSkill,
    create_skill: handleCreateSkill,
    delete_skill: handleDeleteSkill,
    chat_with_skill: handleChatWithSkill,
    rate_skill: handleRateSkill,
    list_leads: handleListLeads,
    get_lead: handleGetLead,
    create_lead: handleCreateLead,
    update_lead: handleUpdateLead,
    list_quotes: handleListQuotes,
    create_quote: handleCreateQuote,
    accept_quote: handleAcceptQuote,
    list_orders: handleListOrders,
    create_order: handleCreateOrder,
    update_order: handleUpdateOrder,
    list_reviews: handleListReviews,
    create_review: handleCreateReview,
    feed_habit: async (input) => {
      const h = addHabit(input.category, input.content, "conversation", input.confidence || 8);
      return JSON.stringify({ success: true, habit: h });
    },
    feed_preference: async (input) => {
      updatePreference(input.key, input.value);
      return JSON.stringify({ success: true, key: input.key, value: input.value });
    },
    feed_document: async (input) => {
      return JSON.stringify({ success: true, message: "文档已接收，请从内容中提取习惯并调用 feed_habit 记录。" });
    },
    get_profile: async () => {
      return getProfileSummary();
    },
    remove_habit: async (input) => {
      const ok = removeHabit(input.id);
      return JSON.stringify({ success: ok });
    },
    update_bio: async (input) => {
      updateBio(input.bio);
      return JSON.stringify({ success: true });
    },
    // ── Event Memory Handlers ──────────────────────────────
    add_event: async (input) => {
      const e = addEvent(input.category, input.summary, input.details || "", input.people || [], input.tags || []);
      return JSON.stringify({ success: true, event: e });
    },
    add_decision: async (input) => {
      const d = addDecision(input.topic, input.options || [], input.chosen, input.reason);
      return JSON.stringify({ success: true, decision: d });
    },
    search_events: async (input) => {
      const results = searchEvents(input.query);
      return JSON.stringify({ count: results.length, events: results });
    },
    get_recent_events: async (input) => {
      const results = getRecentEvents(input.days || 7);
      return JSON.stringify({ count: results.length, events: results });
    },
    get_person_info: async (input) => {
      const events = getEventsByPerson(input.name);
      return JSON.stringify({ events });
    },
    get_people_list: async () => {
      return getPersonSummary();
    },
    get_memory_summary: async () => {
      return getMemorySummary();
    },
    // ── WeChat Import Handlers ─────────────────────────────
    import_wechat: async (input) => {
      const result = importWeChatChat(input.content, input.ownerName || "");
      return JSON.stringify(result);
    },
    import_wechat_file: async (input) => {
      const result = importWeChatFile(input.filePath, input.ownerName || "");
      return JSON.stringify(result);
    },
  };

  const handler = handlers[name];
  if (!handler) return JSON.stringify({ error: `Unknown tool: ${name}` });

  try {
    return await handler(input);
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
}
