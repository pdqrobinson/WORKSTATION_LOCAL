// Reference sample: Full-path allowlist mapping (per OS)

#[derive(Debug, Clone, Copy)]
pub enum Platform {
    Linux,
    MacOS,
    Windows,
}

pub struct AllowlistedCommand {
    pub name: &'static str,
    pub full_paths: &'static [&'static str],
    pub arg_patterns: &'static [&'static str],
}

pub fn allowlist_for(platform: Platform) -> Vec<AllowlistedCommand> {
    match platform {
        Platform::Linux => vec![
            AllowlistedCommand {
                name: "xdg-open",
                full_paths: &["/usr/bin/xdg-open"],
                arg_patterns: &["<path-or-url>"],
            },
            AllowlistedCommand {
                name: "uname",
                full_paths: &["/usr/bin/uname"],
                arg_patterns: &["-a"],
            },
            AllowlistedCommand {
                name: "df",
                full_paths: &["/bin/df"],
                arg_patterns: &["-h"],
            },
            AllowlistedCommand {
                name: "free",
                full_paths: &["/usr/bin/free"],
                arg_patterns: &["-h"],
            },
            AllowlistedCommand {
                name: "ps",
                full_paths: &["/bin/ps"],
                arg_patterns: &["aux"],
            },
            AllowlistedCommand {
                name: "kill",
                full_paths: &["/bin/kill"],
                arg_patterns: &["-TERM <pid>"],
            },
            AllowlistedCommand {
                name: "git",
                full_paths: &["/usr/bin/git"],
                arg_patterns: &["clone <repo-url> <dest-path>"],
            },
            AllowlistedCommand {
                name: "curl",
                full_paths: &["/usr/bin/curl"],
                arg_patterns: &["-L <url> -o <dest-path>"],
            },
            AllowlistedCommand {
                name: "tar",
                full_paths: &["/bin/tar"],
                arg_patterns: &["-xzf <tarball> -C <dest-path>"],
            },
            AllowlistedCommand {
                name: "apt",
                full_paths: &["/usr/bin/apt"],
                arg_patterns: &["remove <package>"],
            },
            AllowlistedCommand {
                name: "dnf",
                full_paths: &["/usr/bin/dnf"],
                arg_patterns: &["remove <package>"],
            },
            AllowlistedCommand {
                name: "pacman",
                full_paths: &["/usr/bin/pacman"],
                arg_patterns: &["-R <package>"],
            },
            AllowlistedCommand {
                name: "flatpak",
                full_paths: &["/usr/bin/flatpak"],
                arg_patterns: &["uninstall <app-id>"],
            },
            AllowlistedCommand {
                name: "snap",
                full_paths: &["/usr/bin/snap"],
                arg_patterns: &["remove <package>"],
            },
        ],
        Platform::MacOS => vec![
            AllowlistedCommand {
                name: "open",
                full_paths: &["/usr/bin/open"],
                arg_patterns: &["<path-or-url>"],
            },
            AllowlistedCommand {
                name: "brew",
                full_paths: &["/opt/homebrew/bin/brew", "/usr/local/bin/brew"],
                arg_patterns: &["uninstall <formula-or-cask>"],
            },
        ],
        Platform::Windows => vec![
            AllowlistedCommand {
                name: "start",
                full_paths: &["C:\\Windows\\System32\\cmd.exe"],
                arg_patterns: &["/C start <path-or-url>"],
            },
            AllowlistedCommand {
                name: "winget",
                full_paths: &["C:\\Windows\\System32\\winget.exe"],
                arg_patterns: &["uninstall --id <id>"],
            },
        ],
    }
}
