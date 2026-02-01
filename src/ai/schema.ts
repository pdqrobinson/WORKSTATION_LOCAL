export type WindowType =
  | "ai"
  | "doc"
  | "editor"
  | "terminal"
  | "chart"
  | "data"
  | "vault"
  | "yazi"
  | "downloads"
  | "memos"
  | "filesystem"
  | "appembed";

export type CommandAction =
  | "create_window"
  | "update_window"
  | "focus_window"
  | "close_window"
  | "list_windows"
  | "write_to_window"
  | "reflow_layout";

export interface Command {
  action: CommandAction;
  windowId?: string;
  windowType?: WindowType;
  title?: string;
  payload?: Record<string, unknown>;
}

export interface CommandEnvelope {
  commands: Command[];
}

export const isCommandAction = (value: unknown): value is CommandAction =>
  typeof value === "string" &&
  [
    "create_window",
    "update_window",
    "focus_window",
    "close_window",
    "list_windows",
    "write_to_window",
    "reflow_layout"
  ].includes(value);

export const isWindowType = (value: unknown): value is WindowType =>
  typeof value === "string" &&
  [
    "ai",
    "doc",
    "editor",
    "terminal",
    "chart",
    "data",
    "vault",
    "yazi",
    "downloads",
    "memos",
    "filesystem",
    "appembed"
  ].includes(value);

export const validateCommandEnvelope = (input: unknown): CommandEnvelope => {
  if (!input || typeof input !== "object") {
    throw new Error("Command response is not an object");
  }

  const raw = input as { commands?: unknown };
  if (!Array.isArray(raw.commands)) {
    throw new Error("Command response missing commands array");
  }

  const commands: Command[] = raw.commands.map((command, index) => {
    if (!command || typeof command !== "object") {
      throw new Error(`Command at index ${index} is not an object`);
    }

    const typed = command as Command;
    if (!isCommandAction(typed.action)) {
      throw new Error(`Command at index ${index} has invalid action`);
    }

    return typed;
  });

  return { commands };
};
