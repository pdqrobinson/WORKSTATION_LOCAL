# System State Document

**Project ID**: 20260201-AI-WORKSTATION-9c73
**Document**: 1-20260201-AI-WORKSTATION-9c73-01-SYSTEM_STATE.md
**Status**: Planning Phase Complete
**Last Updated**: 2026-02-01

---

## Project Status

**Current Phase**: Step 5 — Synthesis Complete

Production-ready planning artifacts finalized.

## Hardening Summary (Logic Mitigated vs. Risk Accepted)

**Logic Mitigated**
- Add a centralized policy/authorization gate for all tool calls (allowlist + confirmation enforcement).
- Enforce safe-path validation for every file operation and close symlink/TOCTOU escapes.
- Separate trust paths for cloud AI tool calls (restricted tool set, stricter policy).

**Risk Accepted (For Now)**
- Performance impact of strict path validation on very large directory operations.
- Single-process Tauri service (no dedicated sandbox process for untrusted tool calls).

---

## Step 4 Implementation Log

- Phase 1: PolicyGuard, tool policy, safe path, command allowlist reference samples created.
- Phase 2: IPC event types and AppEmbed session protocol reference samples created.
- Verification steps provided for safety checks and AppEmbed flow.
- Iteration plan added for TOCTOU openat strategy and AppEmbed backend constraints.
- Iteration samples delivered: safe_path_openat, app_embed_backend, allowlist_map.

---

## Final Architecture Summary

- Tauri + Golden Layout UI with ChatTile as hub.
- Rust backend single service with PolicyGuard enforcement.
- Safe-path validation and command allowlists for system safety.
- AppEmbed supports allowlisted app streaming into tiles (localhost-only).

---

## Final Planning Folder Structure

```
1-20260201-AI-WORKSTATION-9c73-01-PAYLOAD.json
1-20260201-AI-WORKSTATION-9c73-01-PRD.md
1-20260201-AI-WORKSTATION-9c73-01-SYSTEM_STATE.md
2-20260201-AI-WORKSTATION-9c73-02-DESIGN_SPEC.md
2-20260201-AI-WORKSTATION-9c73-02-PAYLOAD.json
3-20260201-AI-WORKSTATION-9c73-03-AUDIT_REPORT.md
3-20260201-AI-WORKSTATION-9c73-03-GATING_PAYLOAD.json
4-20260201-AI-WORKSTATION-9c73-04-PAYLOAD.json
4-20260201-AI-WORKSTATION-9c73-04-PROJECT_PLAN.md
4-20260201-AI-WORKSTATION-9c73-04-REFERENCE_SAMPLES.md
5-20260201-AI-WORKSTATION-9c73-05-PROD_READY_SPEC.md
ref/
  allowlist_map.rs
  app_embed_protocol.md
  app_embed_backend.md
  command_allowlist.rs
  ipc_events.ts
  policy_guard.rs
  safe_path.rs
  safe_path_openat.md
  tool_policy.rs
```

## Planning Folder Structure (Current)

```
1-20260201-AI-WORKSTATION-9c73-01-PAYLOAD.json
1-20260201-AI-WORKSTATION-9c73-01-PRD.md
1-20260201-AI-WORKSTATION-9c73-01-SYSTEM_STATE.md
2-20260201-AI-WORKSTATION-9c73-02-DESIGN_SPEC.md
2-20260201-AI-WORKSTATION-9c73-02-PAYLOAD.json
3-20260201-AI-WORKSTATION-9c73-03-AUDIT_REPORT.md
3-20260201-AI-WORKSTATION-9c73-03-GATING_PAYLOAD.json
4-20260201-AI-WORKSTATION-9c73-04-PAYLOAD.json
4-20260201-AI-WORKSTATION-9c73-04-PROJECT_PLAN.md
4-20260201-AI-WORKSTATION-9c73-04-REFERENCE_SAMPLES.md
ref/
  allowlist_map.rs
  app_embed_protocol.md
  app_embed_backend.md
  command_allowlist.rs
  ipc_events.ts
  policy_guard.rs
  safe_path.rs
  safe_path_openat.md
  tool_policy.rs
```

---

## Technical Summary

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Workstation (Tauri)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Frontend (Web + Golden Layout)                │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐ │ │
│  │  │ AI Chat    │  │ Content      │  │ Web Browser       │ │ │
│  │  │ (Main Hub) │  │ Screens      │  │ (Embedded)        │ │ │
│  │  └────────────┘  └──────────────┘  └────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Rust Backend (Tauri)                        │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐ │ │
│  │  │ File System│  │ System Ops   │  │ AI Router         │ │ │
│  │  │ (Sandboxed)│  │ (Wallpaper,  │  │ (Local + BYOK)    │ │ │
│  │  │            │  │  Processes)  │  │                    │ │ │
│  │  └────────────┘  └──────────────┘  └────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack Confirmed

| Layer | Technology |
|-------|------------|
| Application Framework | Tauri (Rust + Web Renderer) |
| UI Layout | Golden Layout (JavaScript) |
| Web Browsing | Embedded web view (to be determined - Tauri's webview or custom) |
| Backend Language | Rust |
| Local AI Runtime | Ollama (small model optimized for tool calls) |
| Cloud AI Provider | BYOK - GLM 4.7 (user-provided API key) |
| Speech-to-Text | Integrated STT capability (implementation TBD) |
| Text Editor | WYSIWYG web-based editor |
| Packaging | Linux (primary), then Windows, macOS |
| File System Viewer | Rust-native component with Tauri integration |
| Archive.org Downloader | Python3 script integration for downloading books in PDF format |
| YouTube Downloader (yt-dlp) | Python tool for downloading YouTube videos/playlists, format/quality options |
| Memos (usememos.com) | Self-hosted note-taking service, Docker deployment, API integration |

### File System Access Model

| Access Type | Scope | Restrictions |
|-------------|-------|--------------|
| Read | User directories (`~/Documents`, `~/Desktop`, `~/Downloads`, etc.) | System files read-only |
| Write | Limited to designated user workspace directories | No write access to system directories |
| System Operations | Wallpaper changes, process management | Protected API surface, requires confirmation for critical operations |

### File System Viewer Component

The AI Workstation includes a Rust-based file system viewer that integrates directly with the UI. This component provides a native, fast, and secure way to browse and manage files within the user's designated workspace directories. It leverages Tauri's capabilities to access the file system while maintaining a clean and intuitive interface for the end user.

### Archive.org Downloader Component

The Archive.org Downloader is a Python3 script integrated into the AI Workstation. It allows users to download books from Archive.org in PDF format for offline reading. The script is called from the AI chat, and user credentials (email/password) are stored securely. Downloads are saved to the user's designated workspace directory. The script offers options for resolution control (10 to 0), JPG or PDF output, metadata export, and threaded downloads.

### YouTube Downloader Component (yt-dlp)

The YouTube Downloader is a Python tool integrated into the AI Workstation. It allows users to download YouTube videos and playlists in various formats and quality options. The tool is called from the AI chat, and user credentials (if required) are stored securely. Downloads are saved to the user's designated workspace directory. The tool offers options for format selection, quality control, and threaded downloads.

### Memos Integration Component

The Memos Integration Component allows the AI Workstation to interact with a self-hosted Memos note-taking service. It provides a way for users to create, read, update, and delete notes within the AI Workstation. The integration is done via the Memos API, which is exposed via a Docker container. The AI Workstation can call the API to perform actions such as creating a new note, updating an existing note, or deleting a note. The integration is designed to be secure and to respect user privacy.

### AI Routing Logic (High-Level)

```
User Input
    ↓
Intent Classification (Local or Cloud?)
    ↓
┌─────────────────┬─────────────────┐
│ Simple Tasks    │ Complex Tasks   │
│ (Open window,   │ (Comprehension, │
│  Save file,     │  Deep reasoning,│
│  Reorganize)    │  Research)      │
│                 │                 │
│ ↓               │ ↓               │
│ Local AI        │ Cloud AI (BYOK) │
│ (Ollama)        │ (GLM 4.7)       │
└─────────────────┴─────────────────┘
```

### Platform Targets

1. **Linux** — Primary target, first release
2. **Windows** — Secondary target
3. **macOS** — Tertiary target

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Local AI Implementation | Ollama with a small model optimized for tool calls |
| Permission/Sandboxing Granularity | Write access limited to user directories; system operations exposed via controlled APIs |
| UI Implementation Approach | Tauri + Golden Layout JavaScript + embedded web view for browsing |

---

## Step 2 Encoding Summary

### Finalized Logic Map

The AI Workstation follows a single-service architecture with a Rust backend managing all system operations and a React-based frontend using Golden Layout for tiled UI. All components exist as tiles within the full-screen Golden Layout container.

**Data Flow**:
1. User Input (Speech/Text) → STT → ChatTile → Tauri IPC → Rust Backend
2. Intent Classifier routes to Local AI (Ollama) or Cloud AI (GLM 4.7 BYOK)
3. AI executes tools via ToolExecutor (File, System, Download, Memos, UI)
4. Results flow back through Rust → Tauri IPC → Frontend updates

**Component Hierarchy**:
- Full-Screen Golden Layout Container
  - ChatTile (AI Chat - Main Hub)
  - ContentTile (Dynamic content screens)
  - BrowserTile (Embedded web view)
  - FileSystemTile (Rust file viewer)
  - EditorTile (WYSIWYG editor)
  - DownloadsTile (Progress management)
  - MemosTile (Notes interface)
  - TerminalTile (Optional terminal output)

**Service Architecture**:
- Single Tauri service with 6 backend modules:
  - FileSystemService (sandboxed file operations)
  - SystemService (wallpaper, processes, commands)
  - AIRouterService (local/cloud AI routing)
  - DownloadService (Archive.org, YouTube)
  - MemosService (notes CRUD)
  - STTService (speech-to-text)
  - ConfigService (persistence, secure credentials)

**Data Models**: Comprehensive Rust types and TypeScript interfaces defined for configuration, messages, file system, downloads, memos, and system operations.

**Dependencies**:
- External: Tauri, Golden Layout, React, Ollama, GLM 4.7, yt-dlp, Archive.org Downloader, Memos
- Rust crates: tauri, serde, tokio, chrono, dirs, walkdir, reqwest
- Node.js: golden-layout, react, @tauri-apps/api
- Python: yt-dlp, requests

**Security**:
- Safe directory constraints for write operations
- System path blocking for critical directories
- Process killing limited to user-owned processes
- Command execution allowlist
- Secure credential storage
- AI confirmation for destructive operations

**Performance Targets**:
- Simple commands: < 2 seconds
- Local AI response: < 3 seconds
- Cloud AI response: < 5 seconds
- File listing (1000 items): < 500ms
- Tile open/close: < 300ms

**Status**: READY FOR STEP 3 GATING

---

## Next Steps

Proceed to **Step 2 — Encoding (Design & Logic)** to produce:
- `2-20260201-AI-WORKSTATION-9c73-02-DESIGN_SPEC.md` — Detailed technical design and logic mapping
- Detailed component specifications
- Integration patterns for Tauri, Golden Layout, Ollama, and GLM 4.7
- API surface definitions for safe system operations
