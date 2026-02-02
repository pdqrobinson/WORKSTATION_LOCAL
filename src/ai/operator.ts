import {
  AiBackend,
  callGLMChat,
  callOllamaChat,
  checkGLMConnection,
  checkOllamaConnection,
} from "./ollama";
import { validateCommandEnvelope, CommandEnvelope } from "./schema";

export interface OperatorBackendConfig {
  backend: AiBackend;
  model: string;
}

const log = (message: string, ...args: unknown[]): void => {
  console.log(`[Operator] ${message}`, ...args);
};

const logError = (message: string, ...args: unknown[]): void => {
  console.error(`[Operator ERROR] ${message}`, ...args);
};

export interface OperatorContext {
  windows: Array<{ id: string; type: string; title: string }>;
  layoutName: string;
  recentCommands: Array<{ action: string; windowId?: string }>;
  vaultIndex: Array<{
    path: string;
    title: string;
    tags: string[];
    links: string[];
    backlinks: string[];
    excerpt: string;
  }>;
  vaultDocs: Array<{
    path: string;
    title: string;
    tags: string[];
    links: string[];
    content: string;
  }>;
  workspaceRoot: string | null;
}

const systemPrompt = `You are an AI Operator for a desktop workstation. You can control windows, manage files, and execute tasks using natural language.
Output ONLY valid JSON following this schema:
{
  "commands": [
    {
      "action": "create_window|update_window|focus_window|close_window|list_windows|write_to_window|reflow_layout",
      "windowId": "string?",
      "windowType": "ai|doc|editor|terminal|chart|data|vault|yazi?",
      "title": "string?",
      "payload": { "any": "object" }
    }
  ]
}
Rules:
- No markdown. No extra text.
- If unsure, respond with {"commands": []}.
- Never invent window IDs. Use only provided IDs.
- You can reference vault entries (notes) from the provided vault index.
`;

const buildUserPrompt = (message: string, context: OperatorContext): string => {
  return [
    `User request: ${message}`,
    `Open windows: ${JSON.stringify(context.windows)}`,
    `Layout: ${context.layoutName}`,
    `Recent commands: ${JSON.stringify(context.recentCommands)}`,
    `Vault index: ${JSON.stringify(context.vaultIndex)}`,
    `Vault docs: ${JSON.stringify(context.vaultDocs)}`,
    `Workspace root: ${context.workspaceRoot ?? "unset"}`,
  ].join("\n");
};

export const runOperator = async (
  message: string,
  context: OperatorContext,
  config: OperatorBackendConfig = { backend: "glm", model: "glm-4.7" },
): Promise<CommandEnvelope> => {
  log("Running operator", {
    backend: config.backend,
    model: config.model,
    messageLength: message.length,
    windowCount: context.windows.length,
  });

  // Check diagnostics first
  if (config.backend === "glm") {
    const diagnostics = await checkGLMConnection({ model: config.model });
    if (!diagnostics.connected) {
      throw new Error(
        `GLM API is not accessible. ${diagnostics.error || "Please check your API key and connection"}`,
      );
    }
    if (!diagnostics.modelAvailable) {
      throw new Error(
        `GLM model is not available. ${diagnostics.error || "Unknown error"}`,
      );
    }
  } else {
    const diagnostics = await checkOllamaConnection({ model: config.model });
    if (!diagnostics.connected) {
      throw new Error(
        `Ollama is not accessible. ${diagnostics.error || "Please check that Ollama is running"}`,
      );
    }
    if (!diagnostics.modelAvailable) {
      throw new Error(
        `Ollama model '${config.model}' is not available. ${diagnostics.error || "Unknown error"}`,
      );
    }
  }

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: buildUserPrompt(message, context) },
  ];

  try {
    const content =
      config.backend === "glm"
        ? await callGLMChat(messages, { model: config.model })
        : await callOllamaChat(messages, { model: config.model });

    log("Received response", { backend: config.backend, contentLength: content.length });

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      logError("Failed to parse JSON", {
        rawContent: content,
        error: (error as Error).message,
      });
      throw new Error(
        `Operator output is not valid JSON: ${(error as Error).message}. Raw output: ${content.substring(0, 200)}`,
      );
    }

    return validateCommandEnvelope(parsed);
  } catch (error) {
    if (error instanceof Error) {
      logError("Operator failed", error.message);
      throw error;
    }
    throw new Error(`Unknown error in operator: ${String(error)}`);
  }
};

