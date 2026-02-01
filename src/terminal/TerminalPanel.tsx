import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { platform } from "../platform/index.ts";
import type { PtyHandle } from "../platform/types.ts";

interface TerminalPanelProps {
  workspaceRoot: string | null;
}

const getShellCommand = () => {
  if (navigator.userAgent.toLowerCase().includes("win")) {
    return { file: "powershell.exe", args: [] as string[] };
  }
  return { file: "bash", args: ["-l"] };
};

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ workspaceRoot }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ptyRef = useRef<PtyHandle | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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

    const decoder = new TextDecoder();

    try {
      const shell = getShellCommand();
      const pty = platform().spawnPty(shell.file, shell.args, {
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
          "\r\n  Terminal is not available in web mode.\r\n" +
          "  Run the Tauri desktop build to use the terminal.\r\n"
        );
        return () => {
          term.dispose();
        };
      }

      pty.onData((data) => term.write(decoder.decode(data)));
      term.onData((data) => pty.write(data));
      pty.onExit(({ exitCode }) => setStatus(`Shell exited (${exitCode})`));
      ptyRef.current = pty;
    } catch (err) {
      setStatus((err as Error).message);
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
      {status && <div className="yazi-error">Terminal: {status}</div>}
      <div className="yazi-terminal" ref={containerRef} />
    </div>
  );
};
