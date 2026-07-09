import * as readline from "readline";
import { runAgent, type Message } from "./agent";
import { loadConversation, saveConversation } from "./memory";

export async function startCLI() {
  const args = process.argv.slice(2);
  const convIdx = args.indexOf("--conversation-id");
  const conversationId =
    convIdx !== -1 && args[convIdx + 1] ? args[convIdx + 1] : "default";

  let history: Message[] = loadConversation(conversationId);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🏪 Marketplace Agent (输入 'exit' 退出, 'clear' 清空对话)");
  console.log(`📝 对话 ID: ${conversationId}\n`);

  const ask = () => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();
      if (trimmed === "exit" || trimmed === "quit") {
        saveConversation(conversationId, history);
        console.log("对话已保存。再见！");
        rl.close();
        return;
      }
      if (trimmed === "clear") {
        history = [];
        saveConversation(conversationId, history);
        console.log("对话已清空。\n");
        ask();
        return;
      }
      if (!trimmed) {
        ask();
        return;
      }

      try {
        const { reply, updatedHistory } = await runAgent(trimmed, history);
        history = updatedHistory;
        saveConversation(conversationId, history);
        console.log(`\nAgent: ${reply}\n`);
      } catch (err: any) {
        console.error(`\nError: ${err.message}\n`);
      }
      ask();
    });
  };

  ask();
}
