import http from "http";
import { runAgent, type Message } from "./agent";
import { loadConversation, saveConversation } from "./memory";

export function startHTTP(port = 3001) {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/chat") {
      let body = "";
      for await (const chunk of req) body += chunk;

      try {
        const { message, conversationId = "default" } = JSON.parse(body);
        if (!message) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "message is required" }));
          return;
        }

        const history: Message[] = loadConversation(conversationId);
        const { reply, updatedHistory } = await runAgent(message, history);
        saveConversation(conversationId, updatedHistory);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            reply,
            conversationId,
            messageCount: updatedHistory.length,
          })
        );
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  server.listen(port, () => {
    console.log(`🚀 Agent HTTP server running on http://localhost:${port}`);
    console.log(
      `📡 POST /chat { "message": "...", "conversationId": "optional" }`
    );
  });
}
