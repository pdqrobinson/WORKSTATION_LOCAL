/** Shared platform abstraction types — no Tauri imports here. */

export interface DirEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  children?: DirEntry[];
}

export interface PtySpawnOptions {
  cols: number;
  rows: number;
  cwd?: string;
  env?: Record<string, string>;
}

export interface PtyHandle {
  onData(cb: (data: Uint8Array) => void): void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
  onExit(cb: (info: { exitCode: number }) => void): void;
}

export interface Platform {
  /** Read a UTF-8 text file. */
  readTextFile(path: string): Promise<string>;
  /** Write a UTF-8 text file (creates parent dirs as needed). */
  writeTextFile(path: string, contents: string): Promise<void>;
  /** List directory entries. */
  readDir(path: string, options?: { recursive?: boolean }): Promise<DirEntry[]>;
  /** Create a directory (recursive). */
  mkdir(path: string): Promise<void>;
  /** Check whether a path exists. */
  exists(path: string): Promise<boolean>;

  /** Platform-specific app data directory. */
  getAppDataDir(): Promise<string>;
  /** User's home directory. */
  getHomeDir(): Promise<string>;
  /** Join path segments. */
  joinPath(...parts: string[]): Promise<string>;

  /**
   * Spawn a PTY process. Returns `null` when the platform doesn't support
   * native processes (e.g. web browser).
   */
  spawnPty(
    file: string,
    args: string[],
    options: PtySpawnOptions
  ): PtyHandle | null;
}
