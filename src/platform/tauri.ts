/**
 * Tauri API wrapper implementation of the Platform interface.
 * Only loaded when running inside the Tauri runtime.
 */

import { appDataDir, join } from "@tauri-apps/api/path";
import {
  mkdir,
  readDir as tauriReadDir,
  readTextFile,
  writeTextFile,
  exists
} from "@tauri-apps/plugin-fs";
import { spawn } from "tauri-pty";

import type { DirEntry, Platform, PtyHandle, PtySpawnOptions } from "./types.ts";

/**
 * Read a directory and return our DirEntry shape.
 * Tauri v2 readDir returns { name, isDirectory, isFile, isSymlink } — no
 * `path` or `children`, so we construct full paths and optionally recurse.
 */
const readDirImpl = async (
  dirPath: string,
  recursive: boolean
): Promise<DirEntry[]> => {
  const raw = await tauriReadDir(dirPath);
  const results: DirEntry[] = [];

  for (const entry of raw) {
    const fullPath = await join(dirPath, entry.name);
    if (entry.isDirectory && recursive) {
      const children = await readDirImpl(fullPath, true);
      results.push({
        path: fullPath,
        name: entry.name,
        isDirectory: true,
        children
      });
    } else {
      results.push({
        path: fullPath,
        name: entry.name,
        isDirectory: entry.isDirectory
      });
    }
  }

  return results;
};

export const tauriPlatform: Platform = {
  readTextFile(path: string) {
    return readTextFile(path);
  },

  writeTextFile(path: string, contents: string) {
    return writeTextFile(path, contents);
  },

  readDir(path: string, options?: { recursive?: boolean }): Promise<DirEntry[]> {
    return readDirImpl(path, options?.recursive ?? false);
  },

  async mkdir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  },

  exists(path: string) {
    return exists(path);
  },

  getAppDataDir() {
    return appDataDir();
  },

  joinPath(...parts: string[]) {
    if (parts.length === 0) return Promise.resolve("");
    // join() from @tauri-apps/api/path returns Promise<string>,
    // so we chain calls sequentially.
    return parts.slice(1).reduce<Promise<string>>(
      (acc, part) => acc.then((prev) => join(prev, part)),
      Promise.resolve(parts[0])
    );
  },

  spawnPty(
    file: string,
    args: string[],
    options: PtySpawnOptions
  ): PtyHandle {
    const pty = spawn(file, args, {
      cols: options.cols,
      rows: options.rows,
      cwd: options.cwd,
      env: options.env
    });
    return {
      onData(cb) {
        pty.onData((data) => cb(data));
      },
      write(data) {
        pty.write(data);
      },
      resize(cols, rows) {
        pty.resize(cols, rows);
      },
      kill() {
        pty.kill();
      },
      onExit(cb) {
        pty.onExit(cb);
      }
    };
  }
};
