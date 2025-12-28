export type OpenRouterMessage = { role: "system" | "user" | "assistant" | "tool"; content: string };
export type OpenRouterCallInput = {
  apiKey: string;
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  headers?: Record<string,string>;
};

export async function callOpenRouterChat(input: OpenRouterCallInput) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      ...(input.headers ?? {})
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.max_tokens
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(()=>"");
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }
  return res.json();
}

// Client class wrapper for compatibility with batch executor
export class OpenRouterClient {
  async call(input: OpenRouterCallInput) {
    return callOpenRouterChat(input);
  }
}
