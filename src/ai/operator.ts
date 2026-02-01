import { callOllamaChat } from "./ollama";
import { validateCommandEnvelope, CommandEnvelope } from "./schema";

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

const systemPrompt = `You are the Local Operator AI for a desktop AI workstation.
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
    `Workspace root: ${context.workspaceRoot ?? "unset"}`
  ].join("\n");
};

export const runOperator = async (
  message: string,
  context: OperatorContext
): Promise<CommandEnvelope> => {
  const content = await callOllamaChat([
    { role: "system", content: systemPrompt },
    { role: "user", content: buildUserPrompt(message, context) }
  ]);

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Operator output is not valid JSON: ${(error as Error).message}`);
  }

  return validateCommandEnvelope(parsed);
};
