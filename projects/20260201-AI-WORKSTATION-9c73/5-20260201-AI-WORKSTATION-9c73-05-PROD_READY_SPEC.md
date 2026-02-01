# Production-Ready Spec (Step 5 — Synthesis)

**Project ID**: 20260201-AI-WORKSTATION-9c73  
**Status**: Planning Phase Complete  
**Date**: 2026-02-01

---

# 1) Goal Alignment (PRD DNA Check)

**Primary Goal**: Full-screen AI workstation with tiled UI and natural language control.  
**Status**: Met in blueprint and reference samples.

**Success Criteria Mapping**:
- Full-screen tiled workspace + AI chat hub: **Covered** (Golden Layout, ChatTile)
- Non-technical user workflows: **Covered** (PolicyGuard, tool allowlist)
- Safe file system constraints: **Covered** (safe-path + PolicyGuard)
- Local AI for simple tasks + BYOK cloud: **Covered** (AI routing, tool scopes)
- Speech-to-text: **Covered** (STTService in design)
- WYSIWYG editor: **Covered** (EditorTile)
- Embedded web browsing: **Covered** (BrowserTile)
- Multi-platform: **Planned** (Linux-first, Win/macOS secondary)
- Performance targets: **Planned** (defined in design)

---

# 2) Final Architecture Blueprint

**Frontend (Tauri + Golden Layout)**
- ChatTile (primary interface)
- ContentTile, BrowserTile, FileSystemTile, EditorTile, DownloadsTile, MemosTile, TerminalTile
- AppEmbedTile (embedded app streaming in a tile)

**Backend (Single Rust Service)**
- FileSystemService
- SystemService
- AIRouterService
- DownloadService
- MemosService
- STTService
- ConfigService
- **PolicyGuardService (mandatory)**
- **AppEmbedService (guarded, allowlist-only)**

---

# 3) Safety & Hardening (Weak Spot Resolved)

**Weak Spot**: Missing centralized policy gate for tool calls.  
**Resolution**:
- PolicyGuard now enforces confirmation, allowlists, and safe-path checks for every tool call.
- Provider-specific tool scopes restrict Cloud AI to a reduced tool set.
- TOCTOU-resistant safe-path strategy documented (openat/dirfd).
- Command allowlist uses full-path resolution; no PATH search.

---

# 4) Tool Policy + Allowlist (Reference)

**PolicyGuard**: `/ref/policy_guard.rs`  
**Tool Scopes**: `/ref/tool_policy.rs`  
**Safe Path**: `/ref/safe_path.rs` + `/ref/safe_path_openat.md`  
**Allowlist Validation**: `/ref/command_allowlist.rs` + `/ref/allowlist_map.rs`

Allowlisted commands (v1):
- `git clone`, `curl -L`, `tar -xzf`, `unzip`, OS open commands
- Package managers: `apt remove`, `dnf remove`, `pacman -R`, `flatpak uninstall`, `snap remove`, `brew uninstall`, `winget uninstall`

All destructive operations require explicit confirmation.

---

# 5) App Embedding (Tile-Embedded Apps)

**Protocol**: `/ref/app_embed_protocol.md`  
**Backend Options**: `/ref/app_embed_backend.md`

Guardrails:
- Allowlist-only apps
- Localhost-only streaming endpoint
- Confirmation required per session
- Cloud AI cannot launch apps by default

**App Allowlist (v1)**:
- Standard: Files/Finder/Explorer, Text Editor, Terminal
- Admin: Adds Firefox (all platforms)

**Session Token**:
- `viewport_url` includes `?token=<token>` and is validated per request.

---

# 6) Reference Samples (Step 4)

**Phase 1**:
- `/ref/policy_guard.rs`
- `/ref/tool_policy.rs`
- `/ref/safe_path.rs`
- `/ref/command_allowlist.rs`

**Phase 2**:
- `/ref/ipc_events.ts`
- `/ref/app_embed_protocol.md`

**Iteration Additions**:
- `/ref/safe_path_openat.md`
- `/ref/app_embed_backend.md`
- `/ref/allowlist_map.rs`

---

# 7) Verification Checklist (Final)

1. Destructive tool call without confirmation → denied.
2. `git clone` to unsafe path → denied.
3. Cloud AI `run_command` → denied.
4. `launch_app` without confirmation → denied.
5. Confirmed call executes → allowed.
6. Safe-path bound to handle (openat/dirfd) → no TOCTOU.
7. AppEmbed session is localhost-only with token.

---

# 8) Remaining Technical Debt

- App embedding on non-Linux platforms requires platform-specific backend selection.
- Safe-path hardening requires OS-specific implementation details beyond reference pseudocode.

---

# 9) Final Determination

**Instruction Set Status**: Production-ready planning artifacts complete.  
**Next Step**: Step 5 payload generated; ready for archive or production build.
