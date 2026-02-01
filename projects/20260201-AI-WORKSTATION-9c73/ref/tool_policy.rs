// Reference sample: Tool policy map by provider scope

#[derive(Debug, Clone, Copy)]
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
                "create_directory".into(),
                "open_tile".into(),
                "close_tile".into(),
                "reorganize_layout".into(),
                "download_archive_org".into(),
                "download_youtube".into(),
                "list_downloads".into(),
                "pause_download".into(),
                "resume_download".into(),
                "cancel_download".into(),
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
