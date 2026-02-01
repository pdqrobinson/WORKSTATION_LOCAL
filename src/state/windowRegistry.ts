import { WindowRecord } from "../ai/commands";

export const createInitialWindows = (): WindowRecord[] => [
  { id: "vault", type: "vault", title: "Vault" },
  { id: "ai-operator", type: "ai", title: "Operator" }
];

export const toSnapshots = (windows: WindowRecord[]) =>
  windows.map((window) => ({
    id: window.id,
    type: window.type,
    title: window.title
  }));
