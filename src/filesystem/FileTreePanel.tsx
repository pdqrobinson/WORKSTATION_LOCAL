import React, { useCallback, useEffect, useRef, useState } from "react";
import { platform } from "../platform/index.ts";
import type { DirEntry } from "../platform/types.ts";

interface FileTreePanelProps {
  onOpenFile: (path: string) => void;
}

/** Sort entries: directories first, then files, alphabetical within each group. */
const sortEntries = (entries: DirEntry[]): DirEntry[] =>
  [...entries].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

const parentDir = (path: string): string => {
  const parts = path.replace(/\/+$/, "").split("/");
  parts.pop();
  return parts.join("/") || "/";
};

interface TreeNodeProps {
  entry: DirEntry;
  depth: number;
  expanded: Set<string>;
  childrenCache: Map<string, DirEntry[]>;
  loading: Set<string>;
  onToggle: (path: string) => void;
  onOpenFile: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  entry,
  depth,
  expanded,
  childrenCache,
  loading,
  onToggle,
  onOpenFile,
}) => {
  const isOpen = expanded.has(entry.path);
  const isLoading = loading.has(entry.path);
  const children = childrenCache.get(entry.path);

  const handleClick = () => {
    if (entry.isDirectory) {
      onToggle(entry.path);
    } else {
      onOpenFile(entry.path);
    }
  };

  return (
    <>
      <div
        className={`tree-node ${entry.isDirectory ? "directory" : "file"}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={handleClick}
      >
        <span className="icon">
          {entry.isDirectory
            ? isOpen
              ? "\u25BE"
              : "\u25B8"
            : "\u00A0"}
        </span>
        <span className="icon">
          {entry.isDirectory ? "\uD83D\uDCC1" : "\uD83D\uDCC4"}
        </span>
        <span className="tree-name">{entry.name}</span>
        {isLoading && <span className="tree-loading">...</span>}
      </div>
      {entry.isDirectory && isOpen && children && (
        sortEntries(children).map((child) => (
          <TreeNode
            key={child.path}
            entry={child}
            depth={depth + 1}
            expanded={expanded}
            childrenCache={childrenCache}
            loading={loading}
            onToggle={onToggle}
            onOpenFile={onOpenFile}
          />
        ))
      )}
    </>
  );
};

export const FileTreePanel: React.FC<FileTreePanelProps> = ({ onOpenFile }) => {
  const [rootPath, setRootPath] = useState<string>("");
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [childrenCache, setChildrenCache] = useState<Map<string, DirEntry[]>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const homeDirRef = useRef<string>("");

  const loadDir = useCallback(async (dirPath: string) => {
    const p = platform();
    return await p.readDir(dirPath);
  }, []);

  const loadRoot = useCallback(
    async (path: string) => {
      setRootPath(path);
      setExpanded(new Set());
      setChildrenCache(new Map());
      setLoading(new Set());
      setError(null);
      try {
        const result = await loadDir(path);
        setEntries(sortEntries(result));
      } catch (err) {
        setEntries([]);
        setError(`Failed to read directory: ${(err as Error).message}`);
      }
    },
    [loadDir],
  );

  useEffect(() => {
    const init = async () => {
      try {
        const p = platform();
        const home = await p.getHomeDir();
        homeDirRef.current = home;
        await loadRoot(home);
      } catch (err) {
        setError(`Failed to get home directory: ${(err as Error).message}`);
      }
    };
    init();
  }, [loadRoot]);

  const handleToggle = useCallback(
    async (path: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });

      if (!childrenCache.has(path)) {
        setLoading((prev) => new Set(prev).add(path));
        try {
          const result = await loadDir(path);
          setChildrenCache((prev) => new Map(prev).set(path, result));
        } catch {
          setChildrenCache((prev) => new Map(prev).set(path, []));
        } finally {
          setLoading((prev) => {
            const next = new Set(prev);
            next.delete(path);
            return next;
          });
        }
      }
    },
    [childrenCache, loadDir],
  );

  const handleNavigateUp = () => {
    if (rootPath === "/") return;
    const parent = parentDir(rootPath);
    loadRoot(parent);
  };

  return (
    <div className="filetree-panel">
      <div className="filetree-header">
        <button
          className="filetree-up"
          onClick={handleNavigateUp}
          disabled={rootPath === "/"}
        >
          ..
        </button>
        <span className="filetree-path" title={rootPath}>
          {rootPath}
        </span>
      </div>
      {error && (
        <div className="filetree-error">{error}</div>
      )}
      <div className="filetree-list">
        {entries.length === 0 && !error && rootPath && (
          <div className="filetree-empty">No entries</div>
        )}
        {entries.map((entry) => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            expanded={expanded}
            childrenCache={childrenCache}
            loading={loading}
            onToggle={handleToggle}
            onOpenFile={onOpenFile}
          />
        ))}
      </div>
    </div>
  );
};
