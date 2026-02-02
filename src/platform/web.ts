/**
 * Browser/localStorage implementation of the Platform interface.
 * Used when running as a pure web app (no Tauri runtime).
 */

import type { DirEntry, Platform, PtySpawnOptions } from "./types.ts";

const FS_PREFIX = "wkst:fs:";
const DIR_MARKER = "wkst:dir:";

/** Simple POSIX-style path join. */
const joinPosix = (...parts: string[]): string =>
  parts
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "") || "/";

/** List keys that belong to a given directory prefix. */
const keysUnder = (dir: string): string[] => {
  const prefix = dir.endsWith("/") ? FS_PREFIX + dir : FS_PREFIX + dir + "/";
  const results: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      results.push(key.slice(FS_PREFIX.length));
    }
  }
  return results;
};

const buildTree = (basePath: string, paths: string[], recursive: boolean): DirEntry[] => {
  const base = basePath.endsWith("/") ? basePath : basePath + "/";
  const seen = new Map<string, DirEntry>();

  for (const fullPath of paths) {
    const relative = fullPath.slice(base.length);
    const segments = relative.split("/").filter(Boolean);
    if (segments.length === 0) continue;

    if (!recursive && segments.length > 1) {
      // Only show immediate child directory
      const dirName = segments[0];
      const dirPath = joinPosix(basePath, dirName);
      if (!seen.has(dirPath)) {
        seen.set(dirPath, { path: dirPath, name: dirName, isDirectory: true });
      }
      continue;
    }

    if (segments.length === 1) {
      const name = segments[0];
      const isDir = localStorage.getItem(DIR_MARKER + fullPath) !== null;
      seen.set(fullPath, { path: fullPath, name, isDirectory: isDir });
    } else {
      // Recursive: represent intermediate dirs
      let current = basePath;
      for (let i = 0; i < segments.length - 1; i++) {
        current = joinPosix(current, segments[i]);
        if (!seen.has(current)) {
          seen.set(current, {
            path: current,
            name: segments[i],
            isDirectory: true,
            children: []
          });
        }
      }
      const fileName = segments[segments.length - 1];
      const filePath = fullPath;
      seen.set(filePath, { path: filePath, name: fileName, isDirectory: false });
    }
  }

  return Array.from(seen.values());
};

export const webPlatform: Platform = {
  async readTextFile(path: string): Promise<string> {
    const data = localStorage.getItem(FS_PREFIX + path);
    if (data === null) {
      throw new Error(`File not found: ${path}`);
    }
    return data;
  },

  async writeTextFile(path: string, contents: string): Promise<void> {
    localStorage.setItem(FS_PREFIX + path, contents);
  },

  async readDir(path: string, options?: { recursive?: boolean }): Promise<DirEntry[]> {
    const paths = keysUnder(path);
    return buildTree(path, paths, options?.recursive ?? false);
  },

  async mkdir(path: string): Promise<void> {
    localStorage.setItem(DIR_MARKER + path, "1");
  },

  async exists(path: string): Promise<boolean> {
    return (
      localStorage.getItem(FS_PREFIX + path) !== null ||
      localStorage.getItem(DIR_MARKER + path) !== null
    );
  },

  async getAppDataDir(): Promise<string> {
    return "/appdata";
  },

  async getHomeDir(): Promise<string> {
    return "/home";
  },

  async joinPath(...parts: string[]): Promise<string> {
    return joinPosix(...parts);
  },

  spawnPty(
    _file: string,
    _args: string[],
    _options: PtySpawnOptions
  ) {
    // No PTY support in the browser.
    return null;
  }
};
