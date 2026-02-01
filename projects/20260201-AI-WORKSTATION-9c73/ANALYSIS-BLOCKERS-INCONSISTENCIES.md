# Project Analysis: Blockers & Inconsistencies

**Project ID**: 20260201-AI-WORKSTATION-9c73
**Date**: 2026-02-01
**Environment**: Zo Computer (containerized Debian 12, gVisor, 9p filesystem)

---

## Executive Summary

This document identifies inconsistencies, missing implementations, and environment-specific blockers in the AI Workstation project plan and reference samples. The analysis reveals several critical issues that will block development in the Zo Computer environment, particularly around platform capabilities, missing implementations, and architectural assumptions that don't align with the containerized runtime.

**Critical Blockers**: 8
**High Priority Issues**: 7
**Medium Priority Issues**: 5
**Low Priority Issues**: 3

---

## Critical Blockers (Must Fix Before Development)

### 1. **Containerized Environment Limitations — Tauri Cannot Build Here**

**Issue**: The design spec relies on **Tauri** as the primary application framework. However, the Zo Computer environment is a **containerized gVisor runtime** with a 9p filesystem. Tauri requires:
- Native window system (X11/Wayland on Linux)
- System-level access for desktop integration
- Native packaging and distribution mechanisms

**Impact**: Tauri **cannot build or run** in the current Zo Computer environment. The application framework assumption is fundamentally incompatible with the runtime.

**Reference**:
- Design Spec: `file '2-20260201-AI-WORKSTATION-9c73-02-DESIGN_SPEC.md'` — lists Tauri as the application framework
- Environment Info: `gVisor container, 9p filesystem` (from system prompt)

**Suggested Resolution**:
1. **Option A**: Re-architect for web-based delivery (web app that can be deployed as a Zo Site)
2. **Option B**: Build Tauri app externally and package for distribution outside Zo
3. **Option C**: Use Electron-like approach but deliver as a web service

---

### 2. **Missing `AppState` and Confirmation Registry Implementation**

**Issue**: `ref/policy_guard.rs` references:
- `state.config.safe_directories`
- `state.confirmation_registry.is_confirmed()`
- `state.current_tool_scope()`
- `state.current_user_role()`
- `state.platform`

None of these types or methods exist in any reference sample. The code samples assume `AppState` is implemented but provide no definition.

**Reference**: `file 'ref/policy_guard.rs'`
```rust
pub fn authorize(call: &ToolCall, state: &AppState) -> Result<(), ToolError> {
    let scope: ToolScope = state.current_tool_scope();  // Undefined method
    let policy = tool_policy::policy_for(scope);

    if policy.requires_confirmation.contains(&call.tool_name) {
        if !state.confirmation_registry.is_confirmed(&call.id) {  // Undefined type/method
            return Err(ToolError::NeedsConfirmation);
        }
    }
    // ...
}
```

**Impact**: The PolicyGuard cannot be compiled or tested without the `AppState` type definition.

**Suggested Resolution**: Create `ref/state.rs` with:
```rust
pub struct AppState {
    pub config: AppConfig,
    pub confirmation_registry: ConfirmationRegistry,
    pub current_scope: ToolScope,
    pub current_role: UserRole,
    pub platform: Platform,
}

impl AppState {
    pub fn current_tool_scope(&self) -> ToolScope { self.current_scope }
    pub fn current_user_role(&self) -> UserRole { self.current_role }
}
```

---

### 3. **Missing `ToolError` Type Definition**

**Issue**: `ref/policy_guard.rs` and `ref/safe_path.rs` reference `ToolError` but the type is never defined. The samples use:
- `ToolError::Denied(msg)`
- `ToolError::Invalid(msg)`
- `ToolError::NeedsConfirmation`

**Reference**: Multiple files in `ref/` use undefined `ToolError`

**Impact**: Code samples cannot compile.

**Suggested Resolution**: Add `ref/types.rs`:
```rust
#[derive(Debug, thiserror::Error)]
pub enum ToolError {
    #[error("Denied: {0}")]
    Denied(String),
    #[error("Invalid: {0}")]
    Invalid(String),
    #[error("Needs confirmation")]
    NeedsConfirmation,
    #[error("Io: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serde: {0}")]
    Serde(#[from] serde_json::Error),
}
```

---

### 4. **Missing `app_allowlist` Module in PolicyGuard**

**Issue**: `ref/policy_guard.rs` imports and uses:
```rust
use crate::policy::app_allowlist;
// ...
app_allowlist::is_allowed(app_id, role, state.platform)
```

But `ref/app_allowlist.rs` or similar module does not exist. There is only `ref/command_allowlist.rs` for commands, not apps.

**Reference**: `file 'ref/policy_guard.rs'` line 3

**Impact**: The `launch_app` tool check cannot be implemented.

**Suggested Resolution**: Create `ref/app_allowlist.rs`:
```rust
pub fn is_allowed(app_id: &str, _role: UserRole, platform: Platform) -> bool {
    let allowlist = match platform {
        Platform::Linux => vec![
            "firefox", "chromium", "libreoffice", "gimp",
            "vlc", "code", "thunderbird",
        ],
        Platform::Windows => vec![
            "notepad", "mspaint", "explorer",
        ],
        Platform::MacOs => vec![
            "safari", "textedit", "preview",
        ],
    };
    allowlist.contains(&app_id)
}
```

---

### 5. **`command_allowlist.rs` Has Missing Comma After `kill` Case**

**Issue**: Syntax error in `ref/command_allowlist.rs`:
```rust
"kill" => {
    if args.len() == 2 && args[0] == "-TERM" {
        Ok(())
    } else {
        Err(ToolError::Denied("Invalid args for kill".into()))
    }
}  // <-- Missing comma here!
"git" => { ... }
```

**Reference**: `file 'ref/command_allowlist.rs'` lines 35-42

**Impact**: Code does not compile.

**Suggested Resolution**: Add comma after the closing brace of the `kill` case.

---

### 6. **Missing `openat()` Implementation Details**

**Issue**: `ref/safe_path_openat.md` provides pseudocode for TOCTOU-resistant path handling but does not provide actual Rust code. The design mentions:
- `open()` or `openat()` on canonical safe directory with `O_DIRECTORY | O_RDONLY`
- `openat()` with `O_NOFOLLOW` for each path segment

But there is no working Rust implementation of this pattern in the ref/ folder.

**Reference**: `file 'ref/safe_path_openat.md'` pseudocode section

**Impact**: The TOCTOU mitigation cannot be implemented from the reference samples alone.

**Suggested Resolution**: Add `ref/safe_path_openat.rs` with full implementation using `nix` crate:
```rust
use nix::fcntl::{open, OFlag};
use nix::unistd::close;

pub fn open_safe_path(root: &Path, rel: &Path) -> Result<RawFd, ToolError> {
    let root_fd = open(
        root,
        OFlag::O_DIRECTORY | OFlag::O_RDONLY,
        Mode::empty()
    ).map_err(|e| ToolError::Denied(format!("Cannot open root: {}", e)))?;

    let mut fd = root_fd;
    for segment in rel.components() {
        if let Component::Normal(s) = segment {
            fd = openat(
                Some(fd),
                s,
                OFlag::O_NOFOLLOW | OFlag::O_RDONLY,
                Mode::empty()
            ).map_err(|e| {
                close(root_fd);
                ToolError::Denied(format!("Cannot open segment: {}", e))
            })?;
        }
    }
    Ok(fd)
}
```

---

### 7. **No Implementation of `DownloadHandleMap` Integration**

**Issue**: `4-20260201-AI-WORKSTATION-9c73-04-REFERENCE_SAMPLES.md` shows a `DownloadHandleMap` skeleton, but:
1. There is no actual file `ref/download_handle.rs` in the ref/ folder
2. The download service integration with subprocess handles is not shown
3. No example of how to spawn, track, and kill subprocesses

**Reference**: `file '4-20260201-AI-WORKSTATION-9c73-04-REFERENCE_SAMPLES.md'` Download Handle Map section

**Impact**: Download management cannot be implemented from the reference.

**Suggested Resolution**: Add `ref/download_handle.rs` with subprocess management:
```rust
use tokio::process::Command;

pub struct DownloadHandle {
    pub child: tokio::process::Child,
}

pub struct DownloadService {
    handles: HashMap<String, DownloadHandle>,
}

impl DownloadService {
    pub fn start_download(&mut self, task_id: String, cmd: Command) -> Result<(), String> {
        let child = cmd.spawn().map_err(|e| e.to_string())?;
        self.handles.insert(task_id, DownloadHandle { child });
        Ok(())
    }

    pub fn cancel_download(&mut self, task_id: &str) -> Result<(), String> {
        let handle = self.handles.remove(task_id)
            .ok_or("Download not found")?;
        handle.child.kill().map_err(|e| e.to_string())?;
        Ok(())
    }
}
```

---

### 8. **Missing IPC Event Handling Code for Frontend**

**Issue**: `ref/ipc_events.ts` defines TypeScript types for events, but:
1. No example of how to register event listeners in Tauri
2. No example of how to handle `confirmation_required` event and show a modal
3. No example of how to send `confirm_tool_call` back to backend

**Reference**: `file 'ref/ipc_events.ts'`

**Impact**: Frontend cannot implement the confirmation flow from type definitions alone.

**Suggested Resolution**: Add `ref/ipc_handler.ts`:
```typescript
import { listen } from '@tauri-apps/api/event';

export function setupConfirmationHandlers() {
  listen<ConfirmationRequiredEvent>('confirmation_required', (event) => {
    showConfirmationModal({
      action: event.payload.action,
      target: event.payload.target,
      risk: event.payload.risk_level,
      onConfirm: () => invoke('confirm_tool_call', { toolCallId: event.payload.tool_call_id }),
      onCancel: () => console.log('Tool call cancelled'),
    });
  });

  listen<ToolDeniedEvent>('tool_denied', (event) => {
    showError(`Tool denied: ${event.payload.reason}`);
  });
}
```

---

## High Priority Issues

### 9. **Platform Enumeration Not Defined**

**Issue**: `ref/policy_guard.rs` uses `state.platform` but no `Platform` enum is defined. The design spec mentions Linux, Windows, macOS but there's no actual type.

**Impact**: Platform-specific logic cannot compile.

**Suggested Resolution**: Add to `ref/types.rs`:
```rust
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Platform {
    Linux,
    Windows,
    MacOs,
}
```

---

### 10. **Missing `UserRole` Type**

**Issue**: `ref/policy_guard.rs` uses `state.current_user_role()` but `UserRole` type is undefined.

**Impact**: App allowlist checking cannot compile.

**Suggested Resolution**: Add to `ref/types.rs`:
```rust
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum UserRole {
    Standard,
    Administrator,
}
```

---

### 11. **Safe Path Validation Inconsistency**

**Issue**: `ref/safe_path.rs` blocks system paths using string contains checks (`path_str.contains("/etc/")`), but:
1. This approach is fragile (e.g., `/home/user/some_etc_folder` would be blocked incorrectly)
2. Path comparison should use canonical prefix matching instead
3. The design spec mentions "System Path Blocking" but this implementation is inadequate

**Reference**: `file 'ref/safe_path.rs'` lines 25-37

**Impact**: False positives in path blocking.

**Suggested Resolution**: Replace string contains with proper path prefix matching:
```rust
const SYSTEM_PATHS: &[&str] = &[
    "/etc", "/usr/bin", "/bin", "/sbin",
    "/boot", "/dev", "/proc", "/sys",
];

for sys_path in SYSTEM_PATHS {
    let sys = PathBuf::from(sys_path).canonicalize().ok()?;
    if canonical == sys || canonical.starts_with(&sys) {
        return Err(ToolError::Denied("System paths are not allowed".into()));
    }
}
```

---

### 12. **`tool_policy.rs` Inconsistency — `copy_file` Not Listed**

**Issue**: `ref/tool_policy.rs` lists allowed tools for LocalAI but does not include `copy_file`. However:
1. `ref/policy_guard.rs` validates safe paths for `copy_file`
2. The design spec mentions copy operations
3. The policy is inconsistent with the actual tool set

**Reference**: `ref/tool_policy.rs` vs `ref/policy_guard.rs`

**Impact**: PolicyGuard would validate `copy_file` but the tool policy would reject it.

**Suggested Resolution**: Add `"copy_file".into()` to `ToolPolicy::LocalAI.allowed_tools`.

---

### 13. **Missing `validate_safe_path_from_params` Implementation**

**Issue**: `ref/policy_guard.rs` calls `safe_path::validate_safe_path_from_params()` but this function does not exist in `ref/safe_path.rs`. The file only has `resolve_safe_path()`.

**Reference**: `ref/policy_guard.rs` line 25, `ref/safe_path.rs`

**Impact**: PolicyGuard does not compile.

**Suggested Resolution**: The function is already defined in `ref/safe_path.rs` (lines 56-70), but this is an inconsistency note — verify the function signature matches what PolicyGuard expects.

---

### 14. **Missing `command_allowlist::validate_command_from_params` Implementation**

**Issue**: `ref/policy_guard.rs` calls `command_allowlist::validate_command_from_params()` but the function in `ref/command_allowlist.rs` has a different name pattern. The actual function is `validate_command_from_params` but it's not clear if the full path resolution logic is implemented.

**Impact**: Command validation might be incomplete.

**Suggested Resolution**: Verify the function signature and add path validation:
```rust
pub fn validate_command_from_params(params: &Value) -> Result<(), ToolError> {
    let command = params.get("command").and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::Invalid("Missing command".into()))?;

    // Add full-path resolution for allowlisted commands
    let resolved = which::which(command)
        .map_err(|_| ToolError::Denied("Command not found in PATH".into()))?;

    let args = extract_args(params)?;
    validate_command(&resolved.to_string_lossy(), &args)
}
```

---

### 15. **AppEmbed Protocol Assumes Localhost Binding — Not Clear in Container**

**Issue**: The AppEmbed protocol (`ref/app_embed_protocol.md`) assumes `viewport_url = http://127.0.0.1:<port>/?token=<token>`. In the Zo Computer container environment:
1. Network binding to localhost may not work as expected
2. Port allocation and forwarding may be different
3. The xpra backend might not run properly in a containerized gVisor environment

**Reference**: `ref/app_embed_protocol.md` and `ref/app_embed_backend.md`

**Impact**: AppEmbed streaming might not work in Zo environment.

**Suggested Resolution**: Clarify the port binding strategy for containerized environments, possibly using Zo's service registration (`register_user_service`) instead.

---

## Medium Priority Issues

### 16. **Missing `which` Dependency for Command Resolution**

**Issue**: The command allowlist validation should resolve full paths, but the `which` crate is not mentioned in dependencies.

**Reference**: Design spec mentions "full-path resolution" but no dependency listed.

**Impact**: Command allowlist cannot validate full paths.

---

### 17. **Missing `thiserror` Dependency**

**Issue**: `ToolError` should use `thiserror` for cleaner error handling, but it's not in the design spec's Rust crate dependencies.

**Reference**: Design spec crate dependencies list

---

### 18. **Missing `nix` Dependency for `openat()`**

**Issue**: `openat()` system calls require the `nix` crate for safe Rust bindings, but it's not in dependencies.

**Reference**: Design spec crate dependencies list

---

### 19. **No AI Router Implementation Sample**

**Issue**: The design spec describes `AIRouterService` for routing between local Ollama and cloud GLM 4.7, but no reference sample shows how to:
1. Make HTTP calls to Ollama
2. Make HTTP calls to GLM 4.7 API
3. Implement intent classification

**Impact**: AI routing cannot be implemented from the plan.

---

### 20. **No Ollama Integration Sample**

**Issue**: No code sample shows how to integrate with Ollama's HTTP API, which is required for local AI.

**Impact**: Local AI cannot be implemented.

---

## Low Priority Issues

### 21. **Frontend-Backend IPC Not Fully Specified**

**Issue**: While `ipc_events.ts` defines event types, there's no complete example of:
1. Tauri command definitions for frontend → backend communication
2. Event emission from Rust backend to frontend
3. TypeScript type generation for commands

---

### 22. **No Configuration Loading/Saving Sample**

**Issue**: The design defines `AppConfig` but no sample shows how to:
1. Load config from disk at startup
2. Save config on changes
3. Handle missing/corrupt config files

---

### 23. **No STT (Speech-to-Text) Implementation Details**

**Issue**: The PRD requires speech-to-text functionality, but there's no:
1. Selected STT engine (Vosk, Whisper, Web Speech API)
2. Integration pattern with Rust backend
3. Audio capture approach

---

## Zo Computer Environment Specific Blockers

### 24. **gVisor System Call Limitations**

**Issue**: The gVisor sandbox used by Zo Computer may restrict certain system calls required by:
1. `openat()` with specific flags
2. Process management (spawn, kill)
3. File system operations on 9p filesystem

**Impact**: Some low-level operations may fail or behave unexpectedly.

---

### 25. **9p Filesystem Performance**

**Issue**: The 9p filesystem is optimized for container I/O but may have:
1. Higher latency for file operations
2. Different behavior for symlinks and inodes
3. Incompatibility with some `canonicalize()` assumptions

**Impact**: File system operations may be slower than expected.

---

### 26. **No Native Desktop Environment**

**Issue**: Zo Computer is a web-based environment accessed through a browser. There is no:
1. Native window system for Tauri apps
2. Direct desktop integration (wallpaper, notifications)
3. System tray or menu bar access

**Impact**: Desktop-related features (wallpaper, launch_app) cannot work as designed.

---

## Summary of Missing Reference Files

| Missing File | Purpose | Criticality |
|--------------|---------|------------|
| `ref/types.rs` | ToolError, Platform, UserRole, AppState | Critical |
| `ref/state.rs` | AppState struct and methods | Critical |
| `ref/app_allowlist.rs` | App allowlist validation | Critical |
| `ref/safe_path_openat.rs` | TOCTOU-resistant path implementation | Critical |
| `ref/download_handle.rs` | Subprocess tracking for downloads | Critical |
| `ref/ipc_handler.ts` | Frontend event handler code | Critical |
| `ref/ai_router.rs` | AI routing implementation | High |
| `ref/ollama_client.rs` | Ollama HTTP client | High |
| `ref/config_service.rs` | Configuration loading/saving | Medium |

---

## Recommended Next Steps

1. **Address Tauri incompatibility**: Decide on alternative architecture (web app vs. external build)
2. **Create missing type definitions**: Add `ref/types.rs` with `ToolError`, `Platform`, `UserRole`
3. **Create `AppState` implementation**: Add `ref/state.rs` with confirmation registry
4. **Create app allowlist**: Add `ref/app_allowlist.rs` with platform-specific allowlists
5. **Fix syntax errors**: Add missing comma in `ref/command_allowlist.rs`
6. **Implement openat pattern**: Add `ref/safe_path_openat.rs` with full Rust implementation
7. **Implement download service**: Add `ref/download_handle.rs` with subprocess management
8. **Add IPC handler**: Add `ref/ipc_handler.ts` with event listener examples
9. **Clarify platform strategy**: Document how to handle Zo Computer's containerized environment
10. **Test in Zo environment**: Validate that safe path and system calls work in gVisor/9p

---

## Conclusion

The project plan is well-structured from a requirements and design perspective, but the reference samples are **incomplete and contain critical gaps**. The most significant blocker is the **fundamental incompatibility of Tauri with the Zo Computer containerized environment**.

Before any development can proceed, the team must decide on an application architecture that works within the Zo environment, or acknowledge that this project must be built externally and packaged for distribution outside of Zo.
