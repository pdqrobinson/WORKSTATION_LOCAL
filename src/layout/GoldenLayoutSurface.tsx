import React, { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom/client";
import { GoldenLayout, LayoutConfig, ComponentContainer } from "golden-layout";
import { WindowRecord } from "../ai/commands";
import { WindowType } from "../ai/schema";
import { AiPanel } from "../ai/AiPanel";
import { VaultPanel } from "../vault/VaultPanel";
import { VaultDoc, VaultIndexEntry } from "../vault/vault";
import { YaziPanel } from "../terminal/YaziPanel";
import { TerminalPanel } from "../terminal/TerminalPanel";

interface GoldenLayoutSurfaceProps {
  windows: WindowRecord[];
  focusedWindowId?: string;
  ai: {
    prompt: string;
    onPromptChange: (value: string) => void;
    onRun: () => void;
    busy: boolean;
    error: string | null;
    notes: string[];
    output: any;
  };
  vault: {
    onIndexChange: (index: VaultIndexEntry[]) => void;
    onDocsChange: (docs: VaultDoc[]) => void;
  };
  workspaceRoot: string | null;
}

type WindowComponentState = {
  id: string;
  title: string;
  type: WindowType;
  content?: string;
  focused?: boolean;
};

type WindowComponentProps = WindowComponentState & {
  ai: GoldenLayoutSurfaceProps["ai"];
  vault: GoldenLayoutSurfaceProps["vault"];
  workspaceRoot: string | null;
};

const WindowRenderer: React.FC<WindowComponentProps> = ({
  id,
  type,
  title,
  content,
  ai,
  vault,
  workspaceRoot
}) => {
  if (type === "ai") {
    return (
      <div className="gl-pane ai-pane">
        <AiPanel
          prompt={ai.prompt}
          onPromptChange={ai.onPromptChange}
          onRun={ai.onRun}
          busy={ai.busy}
          error={ai.error}
          notes={ai.notes}
          output={ai.output}
        />
      </div>
    );
  }

  if (type === "vault") {
    return (
      <div className="gl-pane">
        <VaultPanel
          onIndexChange={vault.onIndexChange}
          onDocsChange={vault.onDocsChange}
          workspaceRoot={workspaceRoot}
        />
      </div>
    );
  }

  if (type === "yazi") {
    return (
      <div className="gl-pane">
        <YaziPanel workspaceRoot={workspaceRoot} />
      </div>
    );
  }

  if (type === "terminal") {
    return (
      <div className="gl-pane">
        <TerminalPanel workspaceRoot={workspaceRoot} />
      </div>
    );
  }

  if (type === "downloads") {
    return (
      <div className="gl-pane">
        <div className="panel">
          <h2>Downloads</h2>
          <p style={{ opacity: 0.7 }}>Download manager — coming soon</p>
        </div>
      </div>
    );
  }


  if (type === "memos") {
    return (
      <div className="gl-pane">
        <div className="panel">
          <h2>Memos</h2>
          <p style={{ opacity: 0.7 }}>usememos.com integration — coming soon</p>
        </div>
      </div>
    );
  }

  if (type === "filesystem") {
    return (
      <div className="gl-pane">
        <div className="panel">
          <h2>File System</h2>
          <p style={{ opacity: 0.7 }}>Tree/list file browser — coming soon</p>
        </div>
      </div>
    );
  }

  if (type === "appembed") {
    return (
      <div className="gl-pane">
        <div className="panel">
          <h2>App Embed</h2>
          <p style={{ opacity: 0.7 }}>Embedded application — coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gl-pane">
      <div className="panel">
        <h2>{title}</h2>
        <p style={{ opacity: 0.7 }}>{type}</p>
        {content && <pre className="ai-output">{content}</pre>}
      </div>
    </div>
  );
};

const componentRegistry = new Map<string, WindowComponent>();

class WindowComponent {
  private container: ComponentContainer;
  private root: ReactDOM.Root;
  private props: WindowComponentProps;

  constructor(container: ComponentContainer, state: WindowComponentProps) {
    this.container = container;
    this.root = ReactDOM.createRoot(this.container.element);
    this.props = state;
    this.render();
    componentRegistry.set(state.id, this);
    (this.container as any).on?.("destroy", () => {
      componentRegistry.delete(state.id);
      setTimeout(() => this.root.unmount(), 0);
    });
  }

  update(state: WindowComponentProps) {
    this.props = state;
    this.render();
  }

  render() {
    this.root.render(<WindowRenderer {...this.props} />);
  }
}

const buildLayout = (
  windows: WindowRecord[],
  focusedWindowId?: string,
  ai?: GoldenLayoutSurfaceProps["ai"],
  vault?: GoldenLayoutSurfaceProps["vault"],
  workspaceRoot?: string | null
): LayoutConfig => {
  if (windows.length === 0) {
    return { root: undefined };
  }

  const components = windows.map((window) => ({
    type: "stack" as const,
    content: [
      {
        type: "component" as const,
        componentType: window.type,
        title: window.title,
        componentState: {
          id: window.id,
          title: window.title,
          type: window.type,
          content: window.content,
          focused: window.id === focusedWindowId,
          ai,
          vault,
          workspaceRoot
        }
      }
    ]
  }));

  if (components.length === 1) {
    return { root: components[0] };
  }

  return {
    root: {
      type: "row",
      content: components
    }
  };
};

export const GoldenLayoutSurface: React.FC<GoldenLayoutSurfaceProps> = ({
  windows,
  focusedWindowId,
  ai,
  vault,
  workspaceRoot
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<GoldenLayout | null>(null);
  const layoutSignature = useMemo(
    () => windows.map((window) => `${window.id}:${window.type}:${window.title}`).join("|"),
    [windows]
  );

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }
    const layout = new GoldenLayout(hostRef.current);
    const register = (type: WindowType) => {
      layout.registerComponentConstructor(type, WindowComponent as any, false);
    };
    register("ai");
    register("vault");
    register("doc");
    register("editor");
    register("terminal");
    register("chart");
    register("data");
    register("yazi");
    register("downloads");
    register("memos");
    register("filesystem");
    register("appembed");
    layoutRef.current = layout;
    layout.loadLayout(buildLayout(windows, focusedWindowId, ai, vault, workspaceRoot));

    const resizeObserver = new ResizeObserver(() => {
      const rect = hostRef.current?.getBoundingClientRect();
      if (rect && layoutRef.current) {
        layoutRef.current.updateSize(rect.width, rect.height);
      }
    });
    resizeObserver.observe(hostRef.current);

    return () => {
      resizeObserver.disconnect();
      layout.destroy();
      layoutRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!layoutRef.current) {
      return;
    }
    const handle = requestAnimationFrame(() => {
      const layout = layoutRef.current;
      if (!layout) {
        return;
      }
      layout.clear();
      if (windows.length === 0) {
        return;
      }
      layout.loadLayout(buildLayout(windows, focusedWindowId, ai, vault, workspaceRoot));
    });
    return () => cancelAnimationFrame(handle);
  }, [layoutSignature]);

  useEffect(() => {
    windows.forEach((window) => {
      const instance = componentRegistry.get(window.id);
      if (instance) {
        instance.update({
          id: window.id,
          title: window.title,
          type: window.type,
          content: window.content,
          focused: window.id === focusedWindowId,
          ai,
          vault,
          workspaceRoot
        });
      }
    });
  }, [windows, focusedWindowId, ai, vault, workspaceRoot]);

  return <div className="layout-host" ref={hostRef} />;
};
