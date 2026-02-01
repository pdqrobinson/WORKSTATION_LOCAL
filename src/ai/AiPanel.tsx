import React from "react";
import { CommandEnvelope } from "./schema";

interface AiPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onRun: () => void;
  busy: boolean;
  error: string | null;
  notes: string[];
  output: CommandEnvelope | null;
}

export const AiPanel: React.FC<AiPanelProps> = ({
  prompt,
  onPromptChange,
  onRun,
  busy,
  error,
  notes,
  output
}) => {
  return (
    <div className="ai-window">
      <div className="ai-header">
        <div>
          <h2>Operator</h2>
          <p>Model: smollm2:135m</p>
        </div>
      </div>
      <textarea
        placeholder="Tell the operator what to do..."
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
      />
      <button onClick={onRun} disabled={busy}>
        {busy ? "Running..." : "Run Command"}
      </button>
      {error && <div className="ai-output">Error: {error}</div>}
      {notes.length > 0 && <div className="ai-output">Notes: {notes.join(" | ")}</div>}
      {output && <div className="ai-output">{JSON.stringify(output, null, 2)}</div>}
    </div>
  );
};
