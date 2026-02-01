// Reference sample: Shared type definitions used by policy modules

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Errors returned by tool authorization checks.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ToolError {
    /// The request was malformed or missing required fields.
    Invalid(String),
    /// The tool call was denied by policy.
    Denied(String),
    /// The tool call requires user confirmation before proceeding.
    NeedsConfirmation,
}

impl std::fmt::Display for ToolError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ToolError::Invalid(msg) => write!(f, "invalid: {msg}"),
            ToolError::Denied(msg) => write!(f, "denied: {msg}"),
            ToolError::NeedsConfirmation => write!(f, "needs confirmation"),
        }
    }
}

impl std::error::Error for ToolError {}

/// A tool invocation request from an AI operator or user action.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    /// Unique identifier for this call (used for confirmation tracking).
    pub id: String,
    /// The tool being invoked (e.g. "read_file", "run_command", "launch_app").
    pub tool_name: String,
    /// JSON parameters passed to the tool.
    pub parameters: Value,
}

/// Supported host platforms.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Platform {
    Linux,
    MacOS,
    Windows,
}

/// User privilege level.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum UserRole {
    Standard,
    Admin,
}
