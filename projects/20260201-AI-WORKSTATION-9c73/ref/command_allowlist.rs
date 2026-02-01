// Reference sample: Command allowlist validation

use serde_json::Value;

use crate::types::ToolError;

pub fn validate_command_from_params(params: &Value) -> Result<(), ToolError> {
    let command = params
        .get("command")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::Invalid("Missing command".into()))?;
    let args = params
        .get("args")
        .and_then(|v| v.as_array())
        .ok_or_else(|| ToolError::Invalid("Missing args".into()))?
        .iter()
        .map(|v| v.as_str().unwrap_or_default().to_string())
        .collect::<Vec<String>>();

    validate_command(command, &args)
}

pub fn validate_command(command: &str, args: &[String]) -> Result<(), ToolError> {
    match command {
        "xdg-open" | "open" | "start" => {
            if args.len() == 1 {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for open".into()))
            }
        }
        "uname" => match args.as_slice() {
            ["-a"] => Ok(()),
            _ => Err(ToolError::Denied("Invalid args for uname".into())),
        },
        "df" => match args.as_slice() {
            ["-h"] => Ok(()),
            _ => Err(ToolError::Denied("Invalid args for df".into())),
        },
        "free" => match args.as_slice() {
            ["-h"] => Ok(()),
            _ => Err(ToolError::Denied("Invalid args for free".into())),
        },
        "ps" => match args.as_slice() {
            ["aux"] => Ok(()),
            _ => Err(ToolError::Denied("Invalid args for ps".into())),
        },
        "kill" => {
            if args.len() == 2 && args[0] == "-TERM" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for kill".into()))
            }
        },
        "git" => {
            if args.len() == 3 && args[0] == "clone" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for git clone".into()))
            }
        }
        "curl" => {
            if args.len() == 4 && args[0] == "-L" && args[2] == "-o" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for curl".into()))
            }
        }
        "tar" => {
            if args.len() == 4 && args[0] == "-xzf" && args[2] == "-C" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for tar".into()))
            }
        }
        "apt" => {
            if args.len() == 2 && args[0] == "remove" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for apt remove".into()))
            }
        }
        "dnf" => {
            if args.len() == 2 && args[0] == "remove" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for dnf remove".into()))
            }
        }
        "pacman" => {
            if args.len() == 2 && args[0] == "-R" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for pacman -R".into()))
            }
        }
        "flatpak" => {
            if args.len() == 2 && args[0] == "uninstall" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for flatpak uninstall".into()))
            }
        }
        "snap" => {
            if args.len() == 2 && args[0] == "remove" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for snap remove".into()))
            }
        }
        "brew" => {
            if args.len() == 2 && args[0] == "uninstall" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for brew uninstall".into()))
            }
        }
        "winget" => {
            if args.len() == 3 && args[0] == "uninstall" && args[1] == "--id" {
                Ok(())
            } else {
                Err(ToolError::Denied("Invalid args for winget uninstall".into()))
            }
        }
        _ => Err(ToolError::Denied("Command not allowlisted".into())),
    }
}
