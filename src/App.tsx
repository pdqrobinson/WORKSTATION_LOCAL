import React, { useEffect, useMemo, useState } from "react";
import { applyCommands } from "./ai/commands";
import { runOperator } from "./ai/operator";
import { CommandEnvelope } from "./ai/schema";
import { GoldenLayoutSurface } from "./layout/GoldenLayoutSurface";
import { createInitialWindows, toSnapshots } from "./state/windowRegistry";
import { WindowType } from "./ai/schema";
import { VaultDoc, VaultIndexEntry } from "./vault/vault";
import { platform } from "./platform/index.ts";

const MAX_HISTORY = 5;
const WEBVIEW_LABEL_PREFIX = "web-";

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "https://example.com";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const isTauriRuntime = (): boolean =>
  typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;

const App: React.FC = () => {
  const [windows, setWindows] = useState(() => createInitialWindows());
  const [focusedWindowId, setFocusedWindowId] = useState<string | undefined>();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<CommandEnvelope | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [webAddress, setWebAddress] = useState<string>("");
  const [recentCommands, setRecentCommands] = useState<
    Array<{ action: string; windowId?: string }>
  >([]);
  const [vaultIndex, setVaultIndex] = useState<VaultIndexEntry[]>([]);
  const [vaultDocs, setVaultDocs] = useState<VaultDoc[]>([]);
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null);

  useEffect(() => {
    const loadDefault = async () => {
      const stored = localStorage.getItem("workspaceRoot");
      if (stored) {
        setWorkspaceRoot(stored);
        return;
      }
      const p = platform();
      const root = await p.getAppDataDir();
      const defaultRoot = await p.joinPath(root, "ai-workstation", "workspace");
      setWorkspaceRoot(defaultRoot);
    };
    loadDefault().catch(() => setWorkspaceRoot(null));
  }, []);

  const context = useMemo(
    () => ({
      windows: toSnapshots(windows),
      layoutName: "default",
      recentCommands,
      vaultIndex: vaultIndex.slice(0, 50),
      vaultDocs: vaultDocs.slice(0, 20).map((doc) => ({
        path: doc.path,
        title: doc.title,
        tags: doc.tags,
        links: doc.links,
        content: doc.content.slice(0, 2000)
      })),
      workspaceRoot
    }),
    [windows, recentCommands, vaultIndex, vaultDocs, workspaceRoot]
  );

  const handleRun = async () => {
    if (!prompt.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotes([]);

    try {
      const envelope = await runOperator(prompt, context);
      setOutput(envelope);
      const result = applyCommands(windows, envelope.commands);
      setWindows(result.windows);
      setFocusedWindowId(result.focusedWindowId);
      setNotes(result.notes);
      setRecentCommands((current) =>
        [...current, ...envelope.commands.map((cmd) => ({ action: cmd.action, windowId: cmd.windowId }))].slice(
          -MAX_HISTORY
        )
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddWindow = (type: WindowType) => {
    const title =
      type === "ai"
        ? "Operator"
        : type === "vault"
        ? "Vault"
        : type === "yazi"
        ? "Yazi"
        : `${type} window`;
    setWindows((current) => [
      ...current,
      { id: (typeof crypto.randomUUID === "function") ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join(""), type, title }
    ]);
  };

  const handleWorkspaceChange = () => {
    const next = window.prompt("Set workspace root path", workspaceRoot ?? "");
    if (next && next.trim()) {
      localStorage.setItem("workspaceRoot", next.trim());
      setWorkspaceRoot(next.trim());
    }
  };

  const handleOpenWeb = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = normalizeUrl(webAddress);
    setWebAddress(next);
    if (!isTauriRuntime()) {
      window.open(next, "_blank", "noopener,noreferrer");
      return;
    }
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const label = `${WEBVIEW_LABEL_PREFIX}${Date.now()}`;
    new WebviewWindow(label, { url: next });
  };

  const aiProps = useMemo(
    () => ({
      prompt,
      onPromptChange: setPrompt,
      onRun: handleRun,
      busy,
      error,
      notes,
      output
    }),
    [prompt, busy, error, notes, output]
  );

  const vaultProps = useMemo(
    () => ({
      onIndexChange: setVaultIndex,
      onDocsChange: setVaultDocs
    }),
    []
  );

  return (
    <div className="app-root">
      <div className="top-bar">
        <div className="brand">AI Workstation</div>
        <div className="actions">
          <form className="webbar" onSubmit={handleOpenWeb}>
            <input
              className="webbar-input"
              value={webAddress}
              onChange={(event) => setWebAddress(event.target.value)}
              placeholder="Open website..."
            />
            <button className="webbar-go" type="submit">
              Open
            </button>
          </form>
          <button onClick={handleWorkspaceChange}>Workspace</button>
          <button onClick={() => handleAddWindow("vault")}>+ Vault</button>
          <button onClick={() => handleAddWindow("ai")}>+ AI</button>
          <button onClick={() => handleAddWindow("yazi")}>+ Yazi</button>
          <button onClick={() => handleAddWindow("terminal")}>+ Terminal</button>
          <button onClick={() => handleAddWindow("doc")}>+ Doc</button>
          <button onClick={() => handleAddWindow("editor")}>+ Editor</button>
        </div>
      </div>
      <GoldenLayoutSurface
        windows={windows}
        focusedWindowId={focusedWindowId}
        ai={aiProps}
        vault={vaultProps}
        workspaceRoot={workspaceRoot}
      />
    </div>
  );
};

export default App;
