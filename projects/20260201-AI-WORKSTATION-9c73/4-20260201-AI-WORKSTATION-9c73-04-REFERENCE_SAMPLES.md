# Step 4 Reference Samples

**Project ID**: 20260201-AI-WORKSTATION-9c73  
**Date**: 2026-02-01

---

# 1) PolicyGuard Skeleton

```rust
pub mod policy_guard {
    use crate::models::{ToolCall, ToolResult};
    use crate::policy::{ToolPolicy, ToolScope, policy_for};
    use crate::state::AppState;

    pub async fn authorize(call: &ToolCall, state: &AppState) -> Result<(), String> {
        let scope = state.current_tool_scope();
        let policy = policy_for(scope);

        if !policy.allowed_tools.contains(&call.tool_name) {
            return Err(format!("Tool not allowed: {}", call.tool_name));
        }

        if policy.requires_confirmation.contains(&call.tool_name) {
            if !state.confirmation_registry.is_confirmed(&call.id) {
                return Err("Confirmation required".into());
            }
        }

        // File ops validation (example)
        if call.tool_name == "write_file" || call.tool_name == "delete_file" {
            crate::policy::validate_safe_path(&call.parameters, &state.config.safe_directories)?;
        }

        Ok(())
    }
}
```

---

# 2) Safe Path Resolver

```rust
pub fn resolve_safe_path(path: &Path, safe_dirs: &[PathBuf]) -> Result<PathBuf, String> {
    let candidate = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|_| "Cannot resolve current dir")?
            .join(path)
    };

    let canonical = candidate
        .canonicalize()
        .map_err(|_| "Path cannot be resolved")?;

    let path_str = canonical.to_string_lossy().to_lowercase();
    if path_str.contains("/etc/") ||
       path_str.contains("/usr/bin/") ||
       path_str.contains("/bin/") ||
       path_str.contains("/sbin/") ||
       path_str.contains("/boot/") ||
       path_str.contains("/dev/") ||
       path_str.contains("/proc/") ||
       path_str.contains("/sys/") {
        return Err("System paths are not allowed".into());
    }

    for safe_dir in safe_dirs {
        if let Ok(safe) = safe_dir.canonicalize() {
            if canonical.starts_with(&safe) {
                return Ok(canonical);
            }
        }
    }

    Err("Path not within safe directories".into())
}
```

---

# 3) Tool Policy Map

```rust
pub enum ToolScope {
    LocalAI,
    CloudAI,
    UserDirect,
}

pub struct ToolPolicy {
    pub allowed_tools: Vec<String>,
    pub requires_confirmation: Vec<String>,
}

pub fn policy_for(scope: ToolScope) -> ToolPolicy {
    match scope {
        ToolScope::LocalAI => ToolPolicy {
            allowed_tools: vec![
                "read_file".into(),
                "write_file".into(),
                "list_directory".into(),
                "open_tile".into(),
                "close_tile".into(),
                "reorganize_layout".into(),
                "download_archive_org".into(),
                "download_youtube".into(),
                "list_downloads".into(),
                "launch_app".into(),
            ],
            requires_confirmation: vec![
                "delete_file".into(),
                "move_file".into(),
                "rename_file".into(),
                "kill_process".into(),
                "run_command".into(),
                "launch_app".into(),
            ],
        },
        ToolScope::CloudAI => ToolPolicy {
            allowed_tools: vec![
                "read_file".into(),
                "list_directory".into(),
                "open_tile".into(),
                "close_tile".into(),
                "reorganize_layout".into(),
            ],
            requires_confirmation: vec![],
        },
        ToolScope::UserDirect => ToolPolicy {
            allowed_tools: vec![],
            requires_confirmation: vec![],
        },
    }
}
```

---

# 4) Download Handle Map

```rust
pub struct DownloadHandle {
    pub child_id: u32,
}

pub type DownloadHandleMap = std::collections::HashMap<String, DownloadHandle>;

pub fn register_handle(map: &mut DownloadHandleMap, task_id: &str, child_id: u32) {
    map.insert(task_id.to_string(), DownloadHandle { child_id });
}

pub fn cancel_handle(map: &mut DownloadHandleMap, task_id: &str) -> Result<(), String> {
    let handle = map.get(task_id).ok_or("Missing download handle")?;
    // send kill to child_id
    Ok(())
}
```
