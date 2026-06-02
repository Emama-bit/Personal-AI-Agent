export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIProvider {
  chat(params: {
    systemPrompt: string;
    context: string;
    userMessage: string;
    history?: ChatMessage[];
  }): Promise<string>;
}
