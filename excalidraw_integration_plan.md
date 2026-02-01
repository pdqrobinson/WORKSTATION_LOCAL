# Excalidraw Integration Plan

## Goal
Incorporate Excalidraw into the workstation in a way that is easy to use and understand for non‑technical users, while fitting the current app architecture.

## Plan
1) Review current app structure (frontend stack, routing, windowing) and identify the best integration point for an Excalidraw surface (new view/tool, modal, or embedded panel).

   - Self‑host Excalidraw (preferred for offline/local-first use).
   Define any Tauri security/permission constraints needed for the chosen approach.

3) Prototype the UI entry point (menu/toolbar/command palette) and layout, then wire basic state (open/close, routing) to the Excalidraw surface.

4) Add persistence strategy (local file save/load, exports) and optional integration with existing projects/workspace storage.

5) Finalize polish: shortcuts, theming alignment, accessibility, and a basic tests or manual verification checklist.

## Notes
- Favor simplicity and discoverability in the UI.
- If targeting offline/local-first usage, prefer self-hosting Excalidraw assets.
