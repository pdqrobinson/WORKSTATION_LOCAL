export interface GLMChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GLMChatResponse {
  choices?: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

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

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export interface OllamaVersionResponse {
  version: string;
}

export interface GLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export interface GLMDiagnostics {
  connected: boolean;
  modelAvailable: boolean;
  version: string | null;
  error: string | null;
}

export interface OllamaDiagnostics {
  connected: boolean;
  version: string | null;
  modelAvailable: boolean;
  models: string[];
  error: string | null;
}

const defaultGLMConfig: GLMConfig = {
  baseUrl: "https://api.z.ai/api/coding/paas/v4",
  apiKey: "",
  model: "glm-4.7",
  timeoutMs: 60000,
};

const defaultConfig: OllamaConfig = {
  baseUrl: "http://localhost:11434",
  model: "glm4:9b",
  timeoutMs: 60000,
};

const log = (message: string, ...args: unknown[]): void => {
  console.log(`[Ollama] ${message}`, ...args);
};

const logError = (message: string, ...args: unknown[]): void => {
  console.error(`[Ollama ERROR] ${message}`, ...args);
};

export const checkGLMConnection = async (
  config: Partial<GLMConfig> = {},
): Promise<GLMDiagnostics> => {
  const {
    baseUrl = defaultGLMConfig.baseUrl,
    apiKey = defaultGLMConfig.apiKey,
    model = defaultGLMConfig.model,
  } = {
    ...defaultGLMConfig,
    ...config,
  };

  log("Checking GLM connection...", { baseUrl, model });

  const diagnostics: GLMDiagnostics = {
    connected: false,
    modelAvailable: false,
    version: null,
    error: null,
  };

  if (!apiKey || apiKey.trim() === "") {
    diagnostics.error = "API key is not set. Please set your z.ai API key.";
    logError("API key not set");
    return diagnostics;
  }

  try {
    // Test connection with a simple request
    const testResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "test" }],
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text().catch(() => "");
      throw new Error(
        `GLM API error ${testResponse.status}${testResponse.statusText ? ` ${testResponse.statusText}` : ""}${errorText ? `: ${errorText}` : ""}`,
      );
    }

    diagnostics.connected = true;
    diagnostics.modelAvailable = true;
    diagnostics.version = "4.7";
    log("GLM is accessible", { model });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    diagnostics.error = errorMessage;
    logError("Connection check failed", errorMessage);
  }

  return diagnostics;
};

export const checkOllamaConnection = async (
  config: Partial<OllamaConfig> = {},
): Promise<OllamaDiagnostics> => {
  const { baseUrl = defaultConfig.baseUrl, model = defaultConfig.model } = {
    ...defaultConfig,
    ...config,
  };

  log("Checking Ollama connection...", { baseUrl, model });

  const diagnostics: OllamaDiagnostics = {
    connected: false,
    version: null,
    modelAvailable: false,
    models: [],
    error: null,
  };

  try {
    // Check if Ollama is running
    const versionResponse = await fetch(`${baseUrl}/api/version`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!versionResponse.ok) {
      throw new Error(
        `Ollama version check failed: ${versionResponse.status} ${versionResponse.statusText}`,
      );
    }

    const versionData = (await versionResponse.json()) as OllamaVersionResponse;
    diagnostics.connected = true;
    diagnostics.version = versionData.version;
    log("Ollama is running", { version: versionData.version });

    // Get list of available models
    const modelsResponse = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (modelsResponse.ok) {
      const modelsData = (await modelsResponse.json()) as {
        models: OllamaModel[];
      };
      diagnostics.models = modelsData.models.map((m) => m.name);
      diagnostics.modelAvailable = modelsData.models.some(
        (m) => m.name === model || m.name.startsWith(model),
      );

      log("Available models", {
        count: modelsData.models.length,
        modelAvailable: diagnostics.modelAvailable,
        requestedModel: model,
        models: diagnostics.models.slice(0, 10),
      });
    }

    if (!diagnostics.modelAvailable) {
      diagnostics.error = `Model '${model}' not found. Available models: ${diagnostics.models.join(", ")}`;
      logError("Model not available", {
        requestedModel: model,
        available: diagnostics.models,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    diagnostics.error = errorMessage;
    logError("Connection check failed", errorMessage);
  }

  return diagnostics;
};

export const callGLMChat = async (
  messages: GLMChatMessage[],
  overrides: Partial<GLMConfig> = {},
): Promise<string> => {
  const config = { ...defaultGLMConfig, ...overrides };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  if (!config.apiKey || config.apiKey.trim() === "") {
    throw new Error(
      "GLM API key is not set. Please set your z.ai API key in the configuration.",
    );
  }

  log("Calling GLM chat", {
    model: config.model,
    baseUrl: config.baseUrl,
    messageCount: messages.length,
    timeoutMs: config.timeoutMs,
  });

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = `GLM API error ${response.status}${response.statusText ? ` ${response.statusText}` : ""}${errorText ? `: ${errorText}` : ""}`;
      logError("API call failed", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as GLMChatResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      logError("Response missing content", data);
      throw new Error("GLM response missing message content");
    }

    log("Chat response received", { contentLength: content.length });
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logError("Request timed out", { timeoutMs: config.timeoutMs });
      throw new Error(`GLM request timed out after ${config.timeoutMs}ms`);
    }

    logError("Chat call failed", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const callOllamaChat = async (
  messages: OllamaChatMessage[],
  overrides: Partial<OllamaConfig> = {},
): Promise<string> => {
  const config = { ...defaultConfig, ...overrides };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  log("Calling Ollama chat", {
    model: config.model,
    baseUrl: config.baseUrl,
    messageCount: messages.length,
    timeoutMs: config.timeoutMs,
  });

  try {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = `Ollama error ${response.status}${response.statusText ? ` ${response.statusText}` : ""}${errorText ? `: ${errorText}` : ""}`;
      logError("API call failed", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data.message?.content;

    if (!content) {
      logError("Response missing content", data);
      throw new Error("Ollama response missing message content");
    }

    log("Chat response received", { contentLength: content.length });
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logError("Request timed out", { timeoutMs: config.timeoutMs });
      throw new Error(`Ollama request timed out after ${config.timeoutMs}ms`);
    }

    logError("Chat call failed", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const getDefaultGLMConfig = (): GLMConfig => ({
  ...defaultGLMConfig,
});

export const setGLMApiKey = (apiKey: string): void => {
  defaultGLMConfig.apiKey = apiKey;
  log("GLM API key updated", { hasKey: !!apiKey });
};

export const getDefaultOllamaConfig = (): OllamaConfig => ({
  ...defaultConfig,
});
