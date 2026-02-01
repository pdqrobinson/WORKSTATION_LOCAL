export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
  };
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

const defaultConfig: OllamaConfig = {
  baseUrl: "http://localhost:11434",
  model: "smollm2:135m",
  timeoutMs: 8000
};

export const callOllamaChat = async (
  messages: OllamaChatMessage[],
  overrides: Partial<OllamaConfig> = {}
): Promise<string> => {
  const config = { ...defaultConfig, ...overrides };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}`);
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data.message?.content;
    if (!content) {
      throw new Error("Ollama response missing message content");
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
};

export const getDefaultOllamaConfig = (): OllamaConfig => ({ ...defaultConfig });
