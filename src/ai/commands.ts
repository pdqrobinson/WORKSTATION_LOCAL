import { Command, WindowType } from "./schema";

export interface WindowRecord {
  id: string;
  type: WindowType;
  title: string;
  content?: string;
  data?: Record<string, unknown>;
}

export interface CommandApplyResult {
  windows: WindowRecord[];
  focusedWindowId?: string;
  notes: string[];
}

const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP proxies, etc.)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const applyCommands = (
  current: WindowRecord[],
  commands: Command[]
): CommandApplyResult => {
  let windows = [...current];
  let focusedWindowId: string | undefined;
  const notes: string[] = [];

  for (const command of commands) {
    switch (command.action) {
      case "create_window": {
        const type = (command.windowType ?? "doc") as WindowType;
        const title = command.title ?? `${type} window`;
        const id = generateId();
        const url =
          typeof command.payload?.url === "string" ? (command.payload.url as string) : undefined;
        windows = [...windows, { id, type, title, content: url }];
        focusedWindowId = id;
        notes.push(`Created ${type} (${id})`);
        break;
      }
      case "update_window": {
        if (!command.windowId) {
          notes.push("update_window missing windowId");
          break;
        }
        const nextUrl =
          typeof command.payload?.url === "string" ? (command.payload.url as string) : undefined;
        windows = windows.map((window) =>
          window.id === command.windowId
            ? {
                ...window,
                title: command.title ?? window.title,
                content:
                  typeof command.payload?.content === "string"
                    ? (command.payload.content as string)
                    : nextUrl ?? window.content
              }
            : window
        );
        break;
      }
      case "write_to_window": {
        if (!command.windowId) {
          notes.push("write_to_window missing windowId");
          break;
        }
        windows = windows.map((window) =>
          window.id === command.windowId
            ? {
                ...window,
                content:
                  typeof command.payload?.content === "string"
                    ? (command.payload.content as string)
                    : window.content
              }
            : window
        );
        break;
      }
      case "focus_window": {
        if (!command.windowId) {
          notes.push("focus_window missing windowId");
          break;
        }
        focusedWindowId = command.windowId;
        break;
      }
      case "close_window": {
        if (!command.windowId) {
          notes.push("close_window missing windowId");
          break;
        }
        windows = windows.filter((window) => window.id !== command.windowId);
        break;
      }
      case "list_windows": {
        notes.push("list_windows requested");
        break;
      }
      case "reflow_layout": {
        notes.push("reflow_layout requested");
        break;
      }
      default:
        notes.push(`Unknown action ${command.action}`);
    }
  }

  return { windows, focusedWindowId, notes };
};
