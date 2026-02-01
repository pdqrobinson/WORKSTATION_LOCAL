# Step 4 Project Plan (Implementation Iteration)

**Project ID**: 20260201-AI-WORKSTATION-9c73  
**Mode**: Initial Implementation Planning  
**Date**: 2026-02-01

---

# Proposed Reference Samples

1. `ref/policy_guard.rs` — PolicyGate authorization entrypoint (confirmation + allowlist + safe-path)
2. `ref/tool_policy.rs` — Provider-specific tool policy map (local vs cloud)
3. `ref/safe_path.rs` — TOCTOU-resistant safe path resolution helpers
4. `ref/command_allowlist.rs` — Allowlist validation (git/curl/tar + package managers)
5. `ref/ipc_events.ts` — Confirmation + denial event types for frontend
6. `ref/app_embed_protocol.md` — AppEmbed session protocol (launch/close/stream)

---

# Phase 1 (Foundation/Types)

Goal: Define the policy surface and types that all tools must pass through.

- Implement PolicyGuard skeleton with explicit error outputs.
- Define ToolScope + ToolPolicy for local vs cloud AI.
- Add safe-path resolver helpers with system-path blocking.
- Add command allowlist validator function signatures.

Deliverables:
- `ref/policy_guard.rs`
- `ref/tool_policy.rs`
- `ref/safe_path.rs`
- `ref/command_allowlist.rs`

---

# Phase 2 (Logic Validation)

Goal: Validate end-to-end safety flow between tool calls and UI confirmation.

- Reference IPC event types for `confirmation_required`, `tool_denied`, `tool_executed`.
- AppEmbed session protocol reference (launch → session → close).
- Map PolicyGuard checks to tool execution flow.

Deliverables:
- `ref/ipc_events.ts`
- `ref/app_embed_protocol.md`

---

# Verification Steps

1. Simulate a destructive tool call without confirmation → expect denial.
2. Simulate `git clone` to unsafe path → expect denial.
3. Simulate cloud AI tool call for `run_command` → expect denial.
4. Simulate `launch_app` without confirmation → expect denial.
5. Confirm tool call and re-run → expect approval.

---

# Iteration Scope (User-Requested)

Focus: tighten TOCTOU safety and clarify AppEmbed backend expectations before synthesis.

## Proposed Reference Samples (Iteration)

1. `ref/safe_path_openat.md` — OS-level strategy for TOCTOU resistance (openat/dirfd, symlink handling).
2. `ref/app_embed_backend.md` — Linux-first app embedding transport options (X11/Wayland) and localhost constraints.
3. `ref/allowlist_map.rs` — Full-path allowlist mapping per OS with explicit resolution rules.

## Iteration Phases

**Phase 1 (Safety Hardening)**
- TOCTOU-resistant path strategy (dirfd/openat; no symlink traversal).
- Full-path resolution rules for allowlisted commands.

**Phase 2 (AppEmbed Clarification)**
- Backend transport selection notes and security constraints.
- Session lifecycle + cleanup expectations.

## Iteration Verification

1. Validate that safe-path checks bind the validated path to the executed handle.
2. Validate allowlist resolution uses full paths (no PATH search).
3. Validate AppEmbed sessions are localhost-only and single-app per session.
