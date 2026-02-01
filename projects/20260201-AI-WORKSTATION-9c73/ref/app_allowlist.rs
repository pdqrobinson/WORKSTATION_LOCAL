// Reference sample: App allowlist by platform + role

#[derive(Debug, Clone, Copy)]
pub enum Platform {
    Linux,
    MacOS,
    Windows,
}

#[derive(Debug, Clone, Copy)]
pub enum UserRole {
    Standard,
    Admin,
}

pub struct AllowlistedApp {
    pub app_id: &'static str,
    pub display_name: &'static str,
    pub platform: Platform,
}

pub fn allowlisted_apps(platform: Platform, role: UserRole) -> Vec<AllowlistedApp> {
    let mut apps = Vec::new();

    // Baseline apps for Standard users
    match platform {
        Platform::Linux => {
            apps.push(AllowlistedApp {
                app_id: "org.gnome.Nautilus",
                display_name: "Files",
                platform,
            });
            apps.push(AllowlistedApp {
                app_id: "org.gnome.TextEditor",
                display_name: "Text Editor",
                platform,
            });
            apps.push(AllowlistedApp {
                app_id: "org.gnome.Terminal",
                display_name: "Terminal",
                platform,
            });
        }
        Platform::MacOS => {
            apps.push(AllowlistedApp {
                app_id: "com.apple.Finder",
                display_name: "Finder",
                platform,
            });
            apps.push(AllowlistedApp {
                app_id: "com.apple.TextEdit",
                display_name: "TextEdit",
                platform,
            });
            apps.push(AllowlistedApp {
                app_id: "com.apple.Terminal",
                display_name: "Terminal",
                platform,
            });
        }
        Platform::Windows => {
            apps.push(AllowlistedApp {
                app_id: "Microsoft.Windows.Explorer",
                display_name: "File Explorer",
                platform,
            });
            apps.push(AllowlistedApp {
                app_id: "Microsoft.Notepad",
                display_name: "Notepad",
                platform,
            });
            apps.push(AllowlistedApp {
                app_id: "Microsoft.WindowsTerminal",
                display_name: "Windows Terminal",
                platform,
            });
        }
    }

    // Admin users can launch additional tools
    if let UserRole::Admin = role {
        match platform {
            Platform::Linux => {
                apps.push(AllowlistedApp {
                    app_id: "org.mozilla.firefox",
                    display_name: "Firefox",
                    platform,
                });
            }
            Platform::MacOS => {
                apps.push(AllowlistedApp {
                    app_id: "org.mozilla.firefox",
                    display_name: "Firefox",
                    platform,
                });
            }
            Platform::Windows => {
                apps.push(AllowlistedApp {
                    app_id: "Mozilla.Firefox",
                    display_name: "Firefox",
                    platform,
                });
            }
        }
    }

    apps
}

pub fn is_allowed(app_id: &str, role: UserRole, platform: Platform) -> bool {
    allowlisted_apps(platform, role)
        .iter()
        .any(|app| app.app_id == app_id)
}
