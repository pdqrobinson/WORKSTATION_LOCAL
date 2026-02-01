/**
 * Runtime detection + lazy loading for the platform abstraction.
 *
 * Checks `window.__TAURI_INTERNALS__` to decide which backend to use.
 * Uses dynamic `import()` so the Tauri chunk is only loaded when needed.
 */

import type { Platform } from "./types.ts";

export type { Platform, DirEntry, PtyHandle, PtySpawnOptions } from "./types.ts";

let _platform: Platform | null = null;

const isTauri = (): boolean =>
  typeof window !== "undefined" &&
  !!(window as any).__TAURI_INTERNALS__;

/**
 * Initialise and return the platform singleton (async — call once at startup).
 * Subsequent calls return the cached instance immediately.
 */
export async function getPlatform(): Promise<Platform> {
  if (_platform) return _platform;

  if (isTauri()) {
    const { tauriPlatform } = await import("./tauri.ts");
    _platform = tauriPlatform;
  } else {
    const { webPlatform } = await import("./web.ts");
    _platform = webPlatform;
  }

  return _platform;
}

/**
 * Synchronous accessor — only valid **after** `getPlatform()` has resolved.
 * Throws if called before initialisation.
 */
export function platform(): Platform {
  if (!_platform) {
    throw new Error(
      "Platform not initialised. Call `await getPlatform()` before using `platform()`."
    );
  }
  return _platform;
}
