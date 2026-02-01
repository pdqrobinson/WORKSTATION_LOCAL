// Reference sample: Safe path resolution helpers

use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::types::ToolError;

pub fn resolve_safe_path(path: &Path, safe_dirs: &[PathBuf]) -> Result<PathBuf, ToolError> {
    let candidate = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|_| ToolError::Invalid("Cannot resolve current dir".into()))?
            .join(path)
    };

    let canonical = candidate
        .canonicalize()
        .map_err(|_| ToolError::Denied("Path cannot be resolved".into()))?;

    let path_str = canonical.to_string_lossy().to_lowercase();
    if path_str.contains("/etc/")
        || path_str.contains("/usr/bin/")
        || path_str.contains("/bin/")
        || path_str.contains("/sbin/")
        || path_str.contains("/boot/")
        || path_str.contains("/dev/")
        || path_str.contains("/proc/")
        || path_str.contains("/sys/")
    {
        return Err(ToolError::Denied("System paths are not allowed".into()));
    }

    for safe_dir in safe_dirs {
        if let Ok(safe) = safe_dir.canonicalize() {
            if canonical.starts_with(&safe) {
                return Ok(canonical);
            }
        }
    }

    Err(ToolError::Denied(
        "Path not within safe directories".into(),
    ))
}

pub fn validate_safe_path_from_params(
    params: &Value,
    safe_dirs: &[PathBuf],
) -> Result<(), ToolError> {
    // Common parameter names used by tool calls
    let candidate = params
        .get("path")
        .or_else(|| params.get("source"))
        .or_else(|| params.get("destination"))
        .or_else(|| params.get("dest"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::Invalid("Missing path parameter".into()))?;

    let _resolved = resolve_safe_path(Path::new(candidate), safe_dirs)?;
    Ok(())
}
