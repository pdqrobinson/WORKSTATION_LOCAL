# Audit Report

**Project ID**: 20260201-AI-WORKSTATION-9c73  
**Step**: 3 (Gating)  
**Date**: 2026-02-01

---

# Identified Risks

1. **Tool Execution Policy Is Not Enforced (Critical)**
   - `execute_tool_call` dispatches sensitive operations (delete, move, run_command, kill_process) without checking confirmation status or allowlists. The design relies on the AI to ask for confirmation, which is non-binding and bypassable.
   - **Failure point:** `execute_tool_call` directly calls `system_ops::run_command`, `delete_file`, `move_file` with no policy gate.

2. **Safe Directory Checks Are Incomplete and TOCTOU-Prone (Critical)**
   - `is_safe_path` uses `canonicalize()` but the actual file operation likely re-uses the original path. A symlink swap after check can escape safe directories (classic TOCTOU). Read operations are not uniformly constrained by safe directories.
   - **Failure point:** `is_safe_path` is not guaranteed to guard all file operations, and there is no open-at or directory file descriptor approach to bind the checked path.

3. **Cloud AI Tool Calls Have Same Privilege as Local AI (High)**
   - The routing logic sends complex requests to cloud AI but there is no tool-call trust segregation. Cloud AI output is executed with the same tool surface as local AI, enabling remote prompt injection into high-privilege tools.
   - **Failure point:** `route_to_ai` + `execute_tool_call` without a per-provider tool policy.

4. **Run Command Allowlist Undefined (High)**
   - System operations mention an allowlist, but the executable path is not validated and no enforcement is shown. This undermines the safety model for non-technical users.
   - **Failure point:** `system_ops::run_command` signature lacks allowlist validation inputs.

5. **Download Task State Races (Medium)**
   - `DownloadTask` updates are protected by a single `Mutex<Vec<DownloadTask>>` but task lifecycle actions (pause/resume/cancel) are not associated with specific process handles. This can desync UI state from actual subprocess state.
   - **Failure point:** Long-running subprocesses invoked without a persistent handle map.

6. **Path Handling Edge Cases (Medium)**
   - Relative paths, `..` segments, and Unicode normalization are not addressed. Canonicalization failures return false, but UX flows do not define user feedback for unsafe paths.
   - **Failure point:** `is_safe_path` rejects on error without clear error propagation.

---

# Edge Case Matrix

| Edge Case | Failure Mode | Proposed Mitigation | Priority |
|---|---|---|---|
| Empty `safe_directories` | All writes blocked, unclear UX | Require minimum safe dir at setup | High |
| Symlink inside safe dir → `/etc` | Escape to system path | Use open-at with dir fd + deny symlink traversal | Critical |
| Relative path `../` | Bypass safe directory intent | Normalize + resolve against safe root | High |
| Cloud AI prompt injection | Destructive tool call executed | Enforce per-provider tool policy | High |
| Unrecognized tool name | Silent fail or unknown execution | Strict tool registry + error surfaced in UI | Medium |
| Large dir listing (100k files) | UI freeze / memory spike | Paginated listing + streaming events | Medium |
| Download cancel | UI shows cancelled but subprocess continues | Track process handle + kill on cancel | Medium |

---

# The Weak Spot

**Primary Weak Spot: Missing Centralized Policy Gate for Tool Calls (Macro-Complexity in Safety Controls)**

The design distributes safety across AI prompts, per-service logic, and a partial `is_safe_path` check. There is no single, authoritative policy gate that enforces confirmation requirements, tool allowlists, and safe-path constraints. This violates KISS and creates a brittle safety model where any new tool or code path can bypass protections. The most likely failure is a destructive command executed without confirmation or a safe-path bypass through a new tool that forgets to call `is_safe_path`.

---

# Mandatory Mitigations for the Blueprint

1. **Centralized Policy Guard (Mandatory)**
   - Add a `PolicyGuard` layer in Rust that validates every tool call before execution:
     - Confirmation enforcement (delete/move/rename/kill/run_command).
     - Tool allowlist enforcement (run_command must be explicitly permitted).
     - Safe-path validation for all file operations.

2. **Safe-Path Enforcement with TOCTOU Resistance**
   - Use directory file descriptors and `openat`-style resolution (or a canonicalized safe root + resolved relative path) to guarantee the executed path is the validated path. Deny symlink traversal by default.

3. **Provider-Specific Tool Policies**
   - Restrict cloud AI to a reduced tool set unless user explicitly approves elevated actions. Local AI can have broader capabilities, but still behind PolicyGuard.

4. **Command Allowlist Enforcement**
   - Define and enforce a concrete allowlist with full path resolution and argument validation for `run_command`.

5. **Download Task Control Plane**
   - Maintain a `DownloadHandle` map keyed by task ID to ensure pause/resume/cancel map to real subprocess state.

---

**Audit Outcome:** Blueprint requires the mandatory mitigations above before it is safe for Step 4 implementation.
