import React, { useState, useEffect } from "react";
import { CommandEnvelope } from "./schema";
import { checkGLMConnection, setGLMApiKey } from "./ollama";

interface AiPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onRun: () => void;
  busy: boolean;
  error: string | null;
  notes: string[];
  output: CommandEnvelope | null;
}

interface DiagnosticsStatus {
  connected: boolean;
  modelAvailable: boolean;
  model?: string;
  version?: string;
  error: string | null;
}

interface GLMDiagnostics {
  connected: boolean;
  modelAvailable: boolean;
  version: string | null;
  error: string | null;
}

export const AiPanel: React.FC<AiPanelProps> = ({
  prompt,
  onPromptChange,
  onRun,
  busy,
  error,
  notes,
  output,
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsStatus | null>(
    null,
  );
  const [checkingDiagnostics, setCheckingDiagnostics] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const handleCheckDiagnostics = async () => {
    setCheckingDiagnostics(true);
    setShowDiagnostics(true);
    try {
      if (apiKey.trim()) {
        setGLMApiKey(apiKey.trim());
      }
      const result = await checkGLMConnection();
      setDiagnostics({
        connected: result.connected,
        modelAvailable: result.modelAvailable,
        model: "GLM 4.7",
        version: result.version ?? undefined,
        error: result.error,
      });
      console.log("Diagnostics result:", result);
    } catch (err) {
      setDiagnostics({
        connected: false,
        modelAvailable: false,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error("Diagnostics error:", err);
    } finally {
      setCheckingDiagnostics(false);
    }
  };

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("glm-api-key");
    if (savedKey) {
      setApiKey(savedKey);
      setGLMApiKey(savedKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem("glm-api-key", value);
  };

  return (
    <div className="ai-window">
      <div className="ai-header">
        <div>
          <h2>Operator</h2>
          <p>Model: GLM 4.7</p>
          {showApiKey ? (
            <div className="api-key-container">
              <input
                type="password"
                className="api-key-input"
                placeholder="Enter z.ai API key..."
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
              />
              <button
                className="api-key-toggle"
                onClick={() => setShowApiKey(false)}
                type="button"
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              className="api-key-toggle"
              onClick={() => setShowApiKey(true)}
              type="button"
            >
              🔑 Set API Key
            </button>
          )}
        </div>
        <button
          onClick={handleCheckDiagnostics}
          disabled={checkingDiagnostics}
          className="diagnostics-button"
        >
          {checkingDiagnostics ? "Checking..." : "🔍 Check Connection"}
        </button>
      </div>
      <textarea
        placeholder="Tell the operator what to do..."
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onRun();
          }
        }}
      />
      <div className="button-row">
        <button onClick={onRun} disabled={busy}>
          {busy ? "Running..." : "Run Command"}
        </button>
        {showDiagnostics && (
          <button onClick={() => setShowDiagnostics(false)}>
            Hide Diagnostics
          </button>
        )}
      </div>

      {error && (
        <div className="ai-output error">
          <strong>Error:</strong> {error}
          {error.includes("not accessible") && (
            <div className="error-help">
              <p>
                💡 <strong>To fix this:</strong>
              </p>
              <ol>
                <li>Make sure your API key is set correctly</li>
                <li>Check your internet connection</li>
                <li>Verify the API endpoint is accessible</li>
              </ol>
            </div>
          )}
          {error.includes("API key") && (
            <div className="error-help">
              <p>
                💡 <strong>To fix this:</strong>
              </p>
              <ol>
                <li>Click the "🔑 Set API Key" button</li>
                <li>Enter your z.ai API key</li>
                <li>Click "🔍 Check Connection" to verify</li>
              </ol>
            </div>
          )}
          {error.includes("timed out") && (
            <div className="error-help">
              <p>
                💡 <strong>To fix this:</strong>
              </p>
              <ol>
                <li>The request took too long. Try a simpler command.</li>
                <li>Check your internet connection</li>
                <li>Try again with a shorter prompt</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {showDiagnostics && diagnostics && (
        <div className="ai-output diagnostics">
          <h3>Connection Status</h3>
          <ul>
            <li>
              <strong>GLM API Connected:</strong>{" "}
              {diagnostics.connected ? (
                <span className="status-success">✅ Yes</span>
              ) : (
                <span className="status-error">❌ No</span>
              )}
              {diagnostics.version && (
                <span className="status-info"> (v{diagnostics.version})</span>
              )}
            </li>
            <li>
              <strong>Model Available:</strong>{" "}
              {diagnostics.modelAvailable ? (
                <span className="status-success">✅ Yes</span>
              ) : (
                <span className="status-error">❌ No</span>
              )}
              {diagnostics.model && (
                <span className="status-info"> ({diagnostics.model})</span>
              )}
            </li>
            {diagnostics.error && (
              <li>
                <strong>Error:</strong>{" "}
                <span className="status-error">{diagnostics.error}</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {notes.length > 0 && (
        <div className="ai-output notes">
          <strong>Notes:</strong> {notes.join(" | ")}
        </div>
      )}

      {output && (
        <div className="ai-output output">
          <strong>Output:</strong>
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
