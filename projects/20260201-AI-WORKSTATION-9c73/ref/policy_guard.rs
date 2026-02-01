// Reference sample: PolicyGuard authorization entrypoint

use crate::policy::{app_allowlist, command_allowlist, safe_path, tool_policy, ToolScope};
use crate::state::AppState;
use crate::types::{ToolCall, ToolError};

pub fn authorize(call: &ToolCall, state: &AppState) -> Result<(), ToolError> {
    let scope: ToolScope = state.current_tool_scope();
    let policy = tool_policy::policy_for(scope);

    if !policy.allowed_tools.contains(&call.tool_name) {
        return Err(ToolError::Denied("Tool not allowed".into()));
    }

    if policy.requires_confirmation.contains(&call.tool_name) {
        if !state.confirmation_registry.is_confirmed(&call.id) {
            return Err(ToolError::NeedsConfirmation);
        }
    }

    // File operations must validate safe paths
    if call.tool_name == "read_file"
        || call.tool_name == "write_file"
        || call.tool_name == "delete_file"
        || call.tool_name == "move_file"
        || call.tool_name == "rename_file"
        || call.tool_name == "copy_file"
        || call.tool_name == "create_directory"
        || call.tool_name == "list_directory"
    {
        safe_path::validate_safe_path_from_params(&call.parameters, &state.config.safe_directories)?;
    }

    // Command execution must pass allowlist validation
    if call.tool_name == "run_command" {
        command_allowlist::validate_command_from_params(&call.parameters)?;
    }

    // App embedding must be allowlisted
    if call.tool_name == "launch_app" {
        let app_id = call
            .parameters
            .get("app_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ToolError::Invalid("Missing app_id".into()))?;

        let role = state.current_user_role();
        if !app_allowlist::is_allowed(app_id, role, state.platform) {
            return Err(ToolError::Denied("App not allowlisted".into()));
        }
    }

    Ok(())
}
