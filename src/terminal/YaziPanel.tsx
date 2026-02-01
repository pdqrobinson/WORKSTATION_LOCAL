import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { platform } from "../platform/index.ts";
import type { PtyHandle } from "../platform/types.ts";

interface YaziPanelProps {
  workspaceRoot: string | null;
}

export const YaziPanel: React.FC<YaziPanelProps> = ({ workspaceRoot }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const ptyRef = useRef<PtyHandle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "JetBrains Mono, Liberation Mono, monospace",
      fontSize: 13,
      theme: {
        background: "#0d0f12",
        foreground: "#f6f2ea"
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    const decoder = new TextDecoder();

    try {
      const pty = platform().spawnPty("yazi", [], {
        cols: term.cols,
        rows: term.rows,
        cwd: workspaceRoot ?? undefined,
        env: {
          TERM: "xterm-256color",
          COLORTERM: "truecolor"
        }
      });

      if (!pty) {
        term.write(
          "\r\n  Yazi file manager is not available in web mode.\r\n" +
          "  Run the Tauri desktop build to use Yazi.\r\n"
        );
        return () => {
          term.dispose();
        };
      }

      pty.onData((data) => term.write(decoder.decode(data)));
      term.onData((data) => pty.write(data));
      ptyRef.current = pty;
      pty.onExit(({ exitCode }) => {
        setError(`Yazi exited (${exitCode}). Is it installed on PATH?`);
      });
    } catch (err) {
      setError((err as Error).message);
    }

    const onResize = () => {
      fitAddon.fit();
      const pty = ptyRef.current;
      if (pty) {
        pty.resize(term.cols, term.rows);
      }
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      ptyRef.current?.kill();
      term.dispose();
    };
  }, [workspaceRoot]);

  return (
    <div className="yazi-panel">
      {error && <div className="yazi-error">Yazi error: {error}</div>}
      <div className="yazi-terminal" ref={containerRef} />
    </div>
  );
};
