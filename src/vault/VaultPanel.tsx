import React, { useEffect, useMemo, useState } from "react";
import {
  buildVaultIndex,
  createMarkdownFile,
  listMarkdownFiles,
  parseVaultDoc,
  readMarkdownFile,
  VaultDoc,
  VaultIndexEntry,
  writeMarkdownFile
} from "./vault";

interface VaultPanelProps {
  onIndexChange?: (index: VaultIndexEntry[]) => void;
  onDocsChange?: (docs: VaultDoc[]) => void;
  workspaceRoot: string | null;
}

const DEFAULT_NOTE = `# Welcome

This is your local vault. Try:
- Creating new notes
- Linking like [[Welcome]]
- Tagging with #ideas
`;

const sanitizeFilename = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();

export const VaultPanel: React.FC<VaultPanelProps> = ({
  onIndexChange,
  onDocsChange,
  workspaceRoot
}) => {
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const activeDoc = useMemo(
    () => docs.find((doc) => doc.path === activePath) ?? null,
    [docs, activePath]
  );

  const index = useMemo(() => buildVaultIndex(docs), [docs]);

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  useEffect(() => {
    onDocsChange?.(docs);
  }, [docs, onDocsChange]);

  useEffect(() => {
    const load = async () => {
      const { files } = await listMarkdownFiles(workspaceRoot);
      if (files.length === 0) {
        const welcomePath = await createMarkdownFile(
          "Welcome.md",
          DEFAULT_NOTE,
          workspaceRoot
        );
        const content = await readMarkdownFile(welcomePath);
        const doc = parseVaultDoc(welcomePath, content);
        setDocs([doc]);
        setActivePath(welcomePath);
        setDraft(content);
        return;
      }

      const loaded: VaultDoc[] = [];
      for (const path of files) {
        const content = await readMarkdownFile(path);
        loaded.push(parseVaultDoc(path, content));
      }
      setDocs(loaded);
      setActivePath(loaded[0]?.path ?? null);
      setDraft(loaded[0]?.content ?? "");
    };

    load().catch((err) => setStatus(`Vault error: ${(err as Error).message}`));
  }, [workspaceRoot]);

  useEffect(() => {
    if (activeDoc) {
      setDraft(activeDoc.content);
    }
  }, [activeDoc]);

  const handleSave = async () => {
    if (!activeDoc) {
      return;
    }
    await writeMarkdownFile(activeDoc.path, draft);
    setDocs((current) =>
      current.map((doc) =>
        doc.path === activeDoc.path ? parseVaultDoc(doc.path, draft) : doc
      )
    );
    setStatus("Saved");
    setTimeout(() => setStatus(null), 1200);
  };

  const handleCreate = async () => {
    const name = prompt("New note name");
    if (!name) {
      return;
    }
    const filename = sanitizeFilename(name);
    if (!filename) {
      setStatus("Invalid filename");
      return;
    }
    const path = await createMarkdownFile(`${filename}.md`, `# ${name}\n\n`, workspaceRoot);
    const content = await readMarkdownFile(path);
    const doc = parseVaultDoc(path, content);
    setDocs((current) => [doc, ...current]);
    setActivePath(path);
    setDraft(content);
  };

  return (
    <div className="panel vault-panel">
      <div className="vault-header">
        <div>
          <h2>Vault</h2>
          <p>Local markdown notes in your workspace root.</p>
        </div>
        <div className="vault-actions">
          <button onClick={handleCreate}>New Note</button>
          <button onClick={handleSave} disabled={!activeDoc}>
            Save
          </button>
        </div>
      </div>
      <div className="vault-body">
        <div className="vault-list">
          {docs.map((doc) => (
            <button
              key={doc.path}
              className={doc.path === activePath ? "active" : undefined}
              onClick={() => setActivePath(doc.path)}
            >
              <span>{doc.title}</span>
              <small>{doc.tags.join(" ")}</small>
            </button>
          ))}
        </div>
        <div className="vault-editor">
          {activeDoc ? (
            <>
              <div className="vault-meta">
                <span>{activeDoc.title}</span>
                <div className="vault-tags">
                  {activeDoc.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className="vault-backlinks">
                <strong>Backlinks</strong>
                <ul>
                  {index
                    .find((entry) => entry.path === activeDoc.path)
                    ?.backlinks.map((path) => {
                      const doc = docs.find((item) => item.path === path);
                      return <li key={path}>{doc?.title ?? path}</li>;
                    })}
                  {index.find((entry) => entry.path === activeDoc.path)?.backlinks
                    .length === 0 && <li>None yet</li>}
                </ul>
              </div>
            </>
          ) : (
            <div className="vault-empty">No note selected.</div>
          )}
        </div>
      </div>
      {status && <div className="vault-status">{status}</div>}
    </div>
  );
};
