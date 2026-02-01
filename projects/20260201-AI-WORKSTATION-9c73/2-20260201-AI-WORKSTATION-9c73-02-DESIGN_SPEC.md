# Design Specification

**Project ID**: 20260201-AI-WORKSTATION-9c73
**Document**: 2-20260201-AI-WORKSTATION-9c73-02-DESIGN_SPEC.md
**Status**: Step 2 - Encoding Complete
**Generated**: 2026-02-01

---

## Architecture Overview

The AI Workstation is built using **Tauri** with a full-screen **Golden Layout** tiled interface. All UI components exist as tiles within the layout container. The architecture follows a single-service model with a Rust backend managing all system operations, and a web-based frontend providing the user interface.

```
┌─────────────────────────────────────────────────────────────────┐
│              Full-Screen Golden Layout Container                 │
│  (All components are tiles that can be opened/closed/moved)    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ ChatTile    │  │ ContentTile  │  │ BrowserTile  │  │  │
│  │  │ (AI Chat)   │  │ (Dynamic)    │  │ (Web View)   │  │  │
│  │  │ - always    │  │ - multiple   │  │              │  │  │
│  │  │   present   │  │   instances  │  │              │  │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ FileSystem   │  │ EditorTile   │  │ DownloadsTile│  │  │
│  │  │ Tile         │  │ (WYSIWYG)    │  │ (Progress)   │  │  │
│  │  │              │  │              │  │              │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐                     │  │
│  │  │ MemosTile    │  │ TerminalTile  │                     │  │
│  │  │ (Notes)      │  │ (Optional)    │                     │  │
│  │  │              │  │               │                     │  │
│  │  └──────────────┘  └──────────────┘                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓ Tauri IPC                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Rust Backend (Single Service)               │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐ │ │
│  │  │ File System│  │ System Ops   │  │ AI Router         │ │ │
│  │  │ (Sandboxed)│  │ (Wallpaper,  │  │ (Local + BYOK)    │ │ │
│  │  │            │  │  Processes)  │  │                    │ │ │
│  │  └────────────┘  └──────────────┘  └────────────────────┘ │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐ │ │
│  │  │ Download   │  │ Memos        │  │ STT Service       │ │ │
│  │  │ Manager    │  │ Integration  │  │ (Speech-to-Text)  │ │ │
│  │  │            │  │              │  │                    │ │ │
│  │  └────────────┘  └──────────────┘  └────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### State Management Pattern

**Pattern**: Service-based with Tauri IPC

- **Frontend**: React-based state management (React hooks + context)
- **Backend**: Centralized Rust service with event-driven updates
- **State Source of Truth**: Rust backend
- **Frontend State**: Derived from backend via Tauri events and commands

### Single Service Architecture

**Decision**: All backend functionality is consolidated into a single Tauri service. No additional services are required because:

1. All file operations are handled by the Rust std library and Tauri's file system APIs
2. AI routing and execution can be managed within the main Tauri process
3. External integrations (Ollama, GLM 4.7, Memos) are called via HTTP/IPC, not requiring separate daemons
4. Download management uses async tasks within the main service

### Policy Gate (Mandatory)

All tool calls must pass through a centralized PolicyGuard before any service executes them. This is the single enforcement point for:
- Confirmation requirements (destructive actions)
- Allowlisted system commands
- Safe-path validation (including TOCTOU resistance)
- Provider-specific tool permissions (local vs cloud AI)

---

## Data Models

### Rust Backend Data Structures

#### Configuration Schema

```rust
/// Application configuration persisted to disk
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppConfig {
    pub user_id: String,
    pub safe_directories: Vec<PathBuf>,
    pub ai_config: AIConfig,
    pub archive_org: ArchiveConfig,
    pub memos: MemosConfig,
    pub ui: UIConfig,
}

/// AI configuration for local and cloud models
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AIConfig {
    pub local_ai_enabled: bool,
    pub cloud_ai_enabled: bool,
    pub cloud_api_endpoint: String,
    pub cloud_api_key: Option<String>, // Stored separately in secure storage
    pub local_model_name: String,
    pub cloud_model_name: String,
}

/// Archive.org downloader configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ArchiveConfig {
    pub email: String,
    pub password: Option<String>, // Stored separately in secure storage
    pub default_resolution: u8, // 0-10, 0 = highest
    pub default_format: String, // "jpg" or "pdf"
    pub default_output_dir: PathBuf,
}

/// Memos integration configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MemosConfig {
    pub enabled: bool,
    pub endpoint: String,
    pub api_key: Option<String>, // Stored separately in secure storage
    pub local_sync_dir: Option<PathBuf>,
}

/// UI configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UIConfig {
    pub theme: String, // "light", "dark", "auto"
    pub default_layout: String, // Golden Layout config JSON
    pub speech_enabled: bool,
}
```

#### AI Messages

```rust
/// Chat message structure
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatMessage {
    pub id: String,
    pub role: ChatRole,
    pub content: String,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ChatRole {
    System,
    User,
    Assistant,
}

/// Tool call request from AI
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ToolCall {
    pub tool_name: String,
    pub parameters: serde_json::Value,
}

/// Tool execution result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ToolResult {
    pub success: bool,
    pub data: serde_json::Value,
    pub error: Option<String>,
}
```

#### File System Structures

```rust
/// File system entry (file or directory)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileEntry {
    pub path: PathBuf,
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: i64,
    pub is_safe: bool, // Within safe directory constraints
}

/// File operation request
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileOperationRequest {
    pub operation: FileOperation,
    pub source: PathBuf,
    pub destination: Option<PathBuf>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum FileOperation {
    Read,
    Write { content: String },
    Delete,
    Move,
    Rename { new_name: String },
    Copy,
    CreateDir,
}
```

#### Download Management

```rust
/// Download task information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DownloadTask {
    pub id: String,
    pub download_type: DownloadType,
    pub url: String,
    pub status: DownloadStatus,
    pub progress: u8, // 0-100
    pub bytes_downloaded: u64,
    pub total_bytes: Option<u64>,
    pub output_path: PathBuf,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum DownloadType {
    ArchiveOrg {
        resolution: u8,
        format: String,
    },
    YouTube {
        quality: String,
        format: String,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DownloadStatus {
    Pending,
    Running,
    Paused,
    Completed,
    Failed,
    Cancelled,
}
```

#### Memos Integration

```rust
/// Memo/note structure
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Memo {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub visibility: String, // "public", "private"
}

/// Memo search/filter criteria
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MemoSearch {
    pub query: Option<String>,
    pub tags: Option<Vec<String>>,
    pub limit: Option<u32>,
}
```

#### System Operations

```rust
/// System operation request
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemOperationRequest {
    pub operation: SystemOperation,
    pub requires_confirmation: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum SystemOperation {
    SetWallpaper { path: PathBuf },
    KillProcess { pid: u32, name: String },
    ListProcesses,
    RunCommand { command: String, args: Vec<String> },
    LaunchApp { app_id: String },
}
```

/// Embedded app session
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppSession {
    pub session_id: String,
    pub app_id: String,
    pub status: String, // "running", "stopped"
    pub viewport_url: String, // localhost streaming endpoint
}

### Frontend TypeScript Interfaces

```typescript
// Configuration
interface AppConfig {
  user_id: string;
  safe_directories: string[];
  ai_config: AIConfig;
  archive_org: ArchiveConfig;
  memos: MemosConfig;
  ui: UIConfig;
}

interface AIConfig {
  local_ai_enabled: boolean;
  cloud_ai_enabled: boolean;
  cloud_api_endpoint: string;
  local_model_name: string;
  cloud_model_name: string;
}

interface ArchiveConfig {
  email: string;
  default_resolution: number;
  default_format: "jpg" | "pdf";
  default_output_dir: string;
}

interface MemosConfig {
  enabled: boolean;
  endpoint: string;
  local_sync_dir?: string;
}

// Chat
interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ToolCall {
  tool_name: string;
  parameters: any;
}

// File System
interface FileEntry {
  path: string;
  name: string;
  is_dir: boolean;
  size: number;
  modified: number;
  is_safe: boolean;
}

// Downloads
interface DownloadTask {
  id: string;
  download_type: DownloadType;
  url: string;
  status: DownloadStatus;
  progress: number;
  bytes_downloaded: number;
  total_bytes?: number;
  output_path: string;
  started_at: number;
  completed_at?: number;
  error?: string;
}

type DownloadType =
  | { archive_org: { resolution: number; format: string } }
  | { youtube: { quality: string; format: string } };

type DownloadStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

// Memos
interface Memo {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: number;
  updated_at: number;
  visibility: "public" | "private";
}

// System Operations
interface SystemOperationRequest {
  operation: SystemOperation;
  requires_confirmation: boolean;
}

type SystemOperation =
  | { set_wallpaper: { path: string } }
  | { kill_process: { pid: number; name: string } }
  | { list_processes: {} }
  | { run_command: { command: string; args: string[] } }
  | { launch_app: { app_id: string } };

interface AppSession {
  session_id: string;
  app_id: string;
  status: "running" | "stopped";
  viewport_url: string;
}
```

---

## Logic Flow

### Primary Request Flow

```
1. User Input (Speech/Text)
   ↓
2. Speech-to-Text (if applicable)
   ↓
3. Frontend: ChatTile captures input
   ↓
4. Tauri IPC: invoke("process_chat_message", { message })
   ↓
5. Rust Backend: IntentClassifier determines local vs cloud AI
   ↓
6. AI Execution:
   ├─ Local (Ollama) for simple tool calls
   └─ Cloud (GLM 4.7) for complex tasks
   ↓
7. Tool Execution (if AI returns tool calls)
   ├─ File Operations → FileSystemService
   ├─ System Operations → SystemService
   ├─ Downloads → DownloadService
   ├─ Memos → MemosService
   └─ Browsing → BrowserTile (frontend)
   ↓
8. Result Aggregation → AI formulates response
   ↓
9. Rust Backend returns response to Frontend
   ↓
10. Frontend updates ChatTile and relevant tiles
   ↓
11. Golden Layout updates if tiles need to be opened/closed
```

### AI Routing Logic

```rust
pub fn route_to_ai(message: &str, config: &AIConfig) -> AIProvider {
    // Intent classification heuristics
    let lower = message.to_lowercase();

    // Check for keywords requiring comprehension
    let requires_comprehension = lower.contains("explain") ||
        lower.contains("what is") ||
        lower.contains("why") ||
        lower.contains("how does") ||
        lower.contains("research") ||
        lower.contains("summarize");

    // Check for simple tool calls
    let is_simple_task = lower.contains("open") ||
        lower.contains("save") ||
        lower.contains("create") ||
        lower.contains("delete") ||
        lower.contains("move") ||
        lower.contains("rename") ||
        lower.contains("download");

    if requires_comprehension && config.cloud_ai_enabled {
        AIProvider::Cloud
    } else if is_simple_task && config.local_ai_enabled {
        AIProvider::Local
    } else if config.cloud_ai_enabled {
        AIProvider::Cloud
    } else if config.local_ai_enabled {
        AIProvider::Local
    } else {
        AIProvider::None // Fallback
    }
}

#[derive(Debug, Clone, Copy)]
pub enum AIProvider {
    Local,
    Cloud,
    None,
}
```

### Provider-Specific Tool Policies

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
            ],
            requires_confirmation: vec![
                "delete_file".into(),
                "move_file".into(),
                "rename_file".into(),
                "kill_process".into(),
                "run_command".into(),
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

### Command Allowlist (v1 Proposal)

The allowlist is enforced in `PolicyGuard` and requires full-path resolution. No shell parsing is permitted; commands are executed with explicit args only.

| Command | Full Path (Examples) | Allowed Args (v1) | Notes |
|---|---|---|---|
| `xdg-open` | `/usr/bin/xdg-open` | `<path-or-url>` | Open files or URLs in default app |
| `open` (macOS) | `/usr/bin/open` | `<path-or-url>` | macOS equivalent |
| `start` (Windows) | `C:\\Windows\\System32\\cmd.exe /C start` | `<path-or-url>` | Windows equivalent (wrapped) |
| `uname` | `/usr/bin/uname` | `-a` | System info |
| `df` | `/bin/df` | `-h` | Disk usage |
| `free` | `/usr/bin/free` | `-h` | Memory usage |
| `ps` | `/bin/ps` | `aux` | Process listing |
| `kill` | `/bin/kill` | `-TERM <pid>` | Only user-owned processes |
| `git` | `/usr/bin/git` | `clone <repo-url> <dest-path>` | Dest must be inside safe directories |
| `unzip` | `/usr/bin/unzip` | `<zip-path> -d <dest-path>` | Paths must be inside safe directories |
| `curl` | `/usr/bin/curl` | `-L <url> -o <dest-path>` | Dest must be inside safe directories |
| `tar` | `/bin/tar` | `-xzf <tarball> -C <dest-path>` | Paths must be inside safe directories |
| `apt` | `/usr/bin/apt` | `remove <package>` | Requires confirmation |
| `dnf` | `/usr/bin/dnf` | `remove <package>` | Requires confirmation |
| `pacman` | `/usr/bin/pacman` | `-R <package>` | Requires confirmation |
| `flatpak` | `/usr/bin/flatpak` | `uninstall <app-id>` | Requires confirmation |
| `snap` | `/usr/bin/snap` | `remove <package>` | Requires confirmation |
| `brew` | `/opt/homebrew/bin/brew` or `/usr/local/bin/brew` | `uninstall <formula-or-cask>` | Requires confirmation |
| `winget` | `C:\\Windows\\System32\\winget.exe` | `uninstall --id <id>` | Requires confirmation |
| `launch_app` | (internal) | `app_id` from allowlist | Requires confirmation |

Any command not on the list is rejected. Args outside the specified subset are rejected.

### Confirmation UX Flow (v1)

1. Tool call proposed → `PolicyGuard` detects `requires_confirmation`.
2. Backend emits `confirmation_required` event with:
   - `action`, `target`, `risk_level`, `summary`, `tool_call_id`.
3. UI shows a modal:
   - **Title**: “Confirm action”
   - **Body**: plain-language summary + exact target
   - **Buttons**: `Confirm` / `Cancel`
4. If confirmed:
   - UI sends `confirm_tool_call(tool_call_id)` IPC
   - `PolicyGuard` rechecks and executes.
5. If cancelled:
   - Tool call is dropped and logged as denied.

### Tool Execution Flow (With Policy Guard)

```rust
pub async fn execute_tool_call(call: &ToolCall, state: &AppState) -> ToolResult {
    // Centralized policy gate (confirmation + allowlist + path safety)
    if let Err(e) = policy_guard::authorize(call, state).await {
        return ToolResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(e),
        };
    }

    match call.tool_name.as_str() {
        // File System Tools
        "read_file" => file_ops::read_file(&call.parameters).await,
        "write_file" => file_ops::write_file(&call.parameters).await,
        "delete_file" => file_ops::delete_file(&call.parameters, &state.config.safe_directories).await,
        "move_file" => file_ops::move_file(&call.parameters, &state.config.safe_directories).await,
        "list_directory" => file_ops::list_directory(&call.parameters).await,
        "create_directory" => file_ops::create_directory(&call.parameters, &state.config.safe_directories).await,

        // System Tools
        "set_wallpaper" => system_ops::set_wallpaper(&call.parameters).await,
        "kill_process" => system_ops::kill_process(&call.parameters).await,
        "list_processes" => system_ops::list_processes().await,
        "run_command" => system_ops::run_command(&call.parameters).await,
        "launch_app" => system_ops::launch_app(&call.parameters).await,

        // Download Tools
        "download_archive_org" => download_ops::download_archive_org(&call.parameters).await,
        "download_youtube" => download_ops::download_youtube(&call.parameters).await,
        "list_downloads" => download_ops::list_downloads().await,
        "pause_download" => download_ops::pause_download(&call.parameters).await,
        "resume_download" => download_ops::resume_download(&call.parameters).await,
        "cancel_download" => download_ops::cancel_download(&call.parameters).await,

        // Memos Tools
        "create_memo" => memos_ops::create_memo(&call.parameters).await,
        "list_memos" => memos_ops::list_memos(&call.parameters).await,
        "search_memos" => memos_ops::search_memos(&call.parameters).await,
        "update_memo" => memos_ops::update_memo(&call.parameters).await,
        "delete_memo" => memos_ops::delete_memo(&call.parameters).await,

        // UI Tools
        "open_tile" => ui_ops::open_tile(&call.parameters).await,
        "close_tile" => ui_ops::close_tile(&call.parameters).await,
        "reorganize_layout" => ui_ops::reorganize_layout(&call.parameters).await,

        _ => ToolResult {
            success: false,
            data: serde_json::Value::Null,
            error: Some(format!("Unknown tool: {}", call.tool_name)),
        },
    }
}
```

### File System Safety Enforcement (TOCTOU-Resistant)

```rust
pub fn resolve_safe_path(path: &Path, safe_dirs: &[PathBuf]) -> Result<PathBuf, String> {
    // Normalize relative inputs before canonicalization
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

    // Reject system paths regardless of safe_dirs
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

    // Check against canonicalized safe roots
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

### Download Management Flow

```rust
pub async fn start_archive_org_download(
    url: String,
    options: ArchiveDownloadOptions,
    config: &ArchiveConfig,
    downloads: &Arc<Mutex<Vec<DownloadTask>>>,
) -> Result<String, String> {
    let task_id = generate_id();
    let output_path = config.default_output_dir.join(format!("{}.pdf", task_id));

    // Create task entry
    let task = DownloadTask {
        id: task_id.clone(),
        download_type: DownloadType::ArchiveOrg {
            resolution: options.resolution,
            format: options.format.clone(),
        },
        url,
        status: DownloadStatus::Pending,
        progress: 0,
        bytes_downloaded: 0,
        total_bytes: None,
        output_path,
        started_at: chrono::Utc::now().timestamp(),
        completed_at: None,
        error: None,
    };

    {
        let mut downloads_guard = downloads.lock().unwrap();
        downloads_guard.push(task.clone());
    }

    // Emit event to frontend
    emit_download_update(&task);

    // Spawn async download task
    let downloads_clone = Arc::clone(downloads);
    let task_id_clone = task_id.clone();

    tokio::spawn(async move {
        // Execute Python script via subprocess
        let result = execute_archive_org_script(
            &task.url,
            &task.output_path,
            options.resolution,
            &options.format,
        ).await;

        // Update task status
        let mut downloads_guard = downloads_clone.lock().unwrap();
        if let Some(task) = downloads_guard.iter_mut().find(|t| t.id == task_id_clone) {
            match result {
                Ok(bytes) => {
                    task.status = DownloadStatus::Completed;
                    task.progress = 100;
                    task.bytes_downloaded = bytes;
                    task.total_bytes = Some(bytes);
                    task.completed_at = Some(chrono::Utc::now().timestamp());
                }
                Err(e) => {
                    task.status = DownloadStatus::Failed;
                    task.error = Some(e);
                }
            }
        }

        // Emit update
        emit_download_update(&task);
    });

    Ok(task_id)
}
```

### Download Handle Map (Pause/Resume/Cancel Correctness)

```rust
/// Track active subprocess handles for download control
pub struct DownloadHandle {
    pub child_id: u32,
}

/// Map task ID -> process handle
pub type DownloadHandleMap = std::collections::HashMap<String, DownloadHandle>;
```

---

## Component/Service Definitions

### Frontend Tiles (Golden Layout Components)

All tiles are web-based components integrated into the Golden Layout container.

#### ChatTile (Primary Hub)

- **Purpose**: Main AI chat interface
- **Behavior**: Always present, full-height left panel (configurable)
- **Features**:
  - Message input (text + speech button)
  - Conversation history
  - Tool call visualization
  - Quick action buttons for common tasks

#### ContentTile (Dynamic)

- **Purpose**: Display various content types
- **Behavior**: Multiple instances possible
- **Content Types**:
  - File viewer (tree/list)
  - PDF viewer
  - Image viewer
  - Video player
  - Text preview

#### BrowserTile (Embedded Web View)

- **Purpose**: In-app web browsing
- **Behavior**: Single or multiple instances
- **Features**:
  - URL bar
  - Navigation controls
  - AI assistance for page interaction

#### FileSystemTile (Rust Component)

- **Purpose**: Native file browser
- **Behavior**: Opens on-demand from chat or content tiles
- **Features**:
  - Tree/list view toggle
  - Double-click to open files
  - AI highlight integration
  - File operations with confirmation

#### EditorTile (WYSIWYG)

- **Purpose**: Visual text editing
- **Behavior**: Opens when editing files, multiple instances
- **Features**:
  - Markdown support
  - Live preview
  - Toolbar for formatting

#### DownloadsTile (Progress)

- **Purpose**: Download management
- **Behavior**: Shows active downloads, can be minimized
- **Features**:
  - Progress bars
  - Pause/resume/cancel controls
  - Auto-open on completion

#### MemosTile (Notes)

- **Purpose**: Memos note-taking interface
- **Behavior**: Opens on-demand
- **Features**:
  - Note list
  - Create/edit notes
  - Search by keyword
  - Tag management

#### TerminalTile (Optional)

- **Purpose**: Terminal output display
- **Behavior**: Opens when needed
- **Features**:
- Read-only terminal output
- Copy to clipboard

#### AppEmbedTile (Embedded App Session)

- **Purpose**: Display a live view of a local application inside a tile
- **Behavior**: Opens on-demand, single instance per app session
- **Approach**:
  - Uses a local streaming session (e.g., VNC/RDP over localhost) to render the app inside a webview
  - The Tauri backend launches an allowlisted app and binds it to a local session
- **Constraints**:
  - Only allowlisted apps can be launched
  - Always requires explicit confirmation
  - Linux-first; Windows/macOS may require different backends

### Backend Services (Rust)

#### FileSystemService

**Responsibilities**:
- File and directory operations (read, write, delete, move, rename, copy)
- Directory traversal and listing
- File metadata extraction
- Safe path enforcement (via PolicyGuard + TOCTOU-resistant resolution)

**Tauri Commands**:
- `read_file(path: String) -> Result<String, String>`
- `write_file(path: String, content: String) -> Result<(), String>`
- `delete_file(path: String) -> Result<(), String>`
- `move_file(source: String, dest: String) -> Result<(), String>`
- `rename_file(path: String, new_name: String) -> Result<(), String>`
- `list_directory(path: String) -> Result<Vec<FileEntry>, String>`
- `create_directory(path: String) -> Result<(), String>`

#### SystemService

**Responsibilities**:
- Wallpaper management
- Process management (list, kill)
- Command execution
- System information

**Tauri Commands**:
- `set_wallpaper(path: String) -> Result<(), String>`
- `kill_process(pid: u32) -> Result<(), String>`
- `list_processes() -> Result<Vec<ProcessInfo>, String>`
- `run_command(command: String, args: Vec<String>) -> Result<String, String>`
- `launch_app(app_id: String) -> Result<AppSession, String>`

**Command Allowlist (Required)**:
- Allowlist enforced in PolicyGuard with full path resolution.
- Arguments validated per command definition (no free-form shell).

#### AIRouterService

**Responsibilities**:
- Intent classification (local vs cloud AI)
- Local AI communication (Ollama HTTP API)
- Cloud AI communication (GLM 4.7 API)
- Tool call orchestration

#### PolicyGuardService (Mandatory)

**Responsibilities**:
- Enforce tool allowlists per provider (local vs cloud AI)
- Require explicit confirmation for destructive operations
- Validate safe paths for all file operations
- Validate command allowlist and arguments

**Tauri Commands**:
- `process_chat_message(message: String) -> Result<ChatResponse, String>`
- `configure_ai(config: AIConfig) -> Result<(), String>`
- `stream_chat_response(message: String) -> Result<(), String>`

#### DownloadService

**Responsibilities**:
- Download task management (create, pause, resume, cancel)
- Archive.org integration (Python script execution)
- YouTube integration (yt-dlp execution)
- Progress tracking
- Event emission to frontend

**Tauri Commands**:
- `start_archive_download(url: String, options: ArchiveOptions) -> Result<String, String>`
- `start_youtube_download(url: String, options: YouTubeOptions) -> Result<String, String>`
- `list_downloads() -> Result<Vec<DownloadTask>, String>`
- `pause_download(id: String) -> Result<(), String>`
- `resume_download(id: String) -> Result<(), String>`
- `cancel_download(id: String) -> Result<(), String>`

#### MemosService

**Responsibilities**:
- Memos API communication
- CRUD operations for notes
- Search and filtering
- Local file sync

**Tauri Commands**:
- `create_memo(title: String, content: String, tags: Vec<String>) -> Result<Memo, String>`
- `list_memos(limit: u32) -> Result<Vec<Memo>, String>`
- `search_memos(query: String) -> Result<Vec<Memo>, String>`
- `update_memo(id: String, content: String) -> Result<Memo, String>`
- `delete_memo(id: String) -> Result<(), String>`

#### STTService

**Responsibilities**:
- Speech-to-text processing
- Audio capture
- Stream results to frontend

**Tauri Commands**:
- `start_listening() -> Result<(), String>`
- `stop_listening() -> Result<(), String>`

#### ConfigService

**Responsibilities**:
- Configuration persistence
- Secure credential storage
- Application state management

**Tauri Commands**:
- `get_config() -> Result<AppConfig, String>`
- `update_config(config: AppConfig) -> Result<(), String>`
- `set_api_key(service: String, key: String) -> Result<(), String>`
- `get_api_key(service: String) -> Result<String, String>`

#### AppEmbedService (Optional, Guarded)

**Responsibilities**:
- Launch allowlisted local applications
- Start/stop embedded app sessions
- Stream app view into AppEmbedTile (localhost-only)

**Tauri Commands**:
- `launch_app(app_id: String) -> Result<AppSession, String>`
- `close_app_session(session_id: String) -> Result<(), String>`

### AppEmbed Session Protocol (v1)

**Flow**
1. User requests app → AI proposes `launch_app(app_id)`
2. PolicyGuard checks allowlist + confirmation
3. AppEmbedService starts app + local streaming session
4. Backend emits `app_session_started` with `session_id` + `viewport_url`
5. Frontend opens AppEmbedTile and loads `viewport_url`
6. User closes tile → `close_app_session(session_id)` → backend stops session

**Constraints**
- Localhost-only streaming endpoint
- One app per session
- Cloud AI cannot invoke `launch_app` by default

### App Allowlist (v1)

Apps are allowlisted per OS and per user role. The allowlist is enforced by PolicyGuard.

**Baseline apps (Standard role):**
- Linux: Files, Text Editor, Terminal
- macOS: Finder, TextEdit, Terminal
- Windows: File Explorer, Notepad, Windows Terminal

**Admin extensions:**
- Browser (e.g., Firefox) on all platforms

### AppEmbed Token (v1)

Each session generates a unique token and embeds it in the localhost URL:

`http://127.0.0.1:<port>/?token=<token>`

Token is validated per request and expires on session close.

---

## Dependencies

### External Dependencies

| Dependency | Purpose | License/Notes |
|-------------|---------|---------------|
| **Tauri** | Application framework (Rust + Web) | MIT/Apache-2.0 |
| **Golden Layout** | Tiled UI layout (JavaScript) | MIT |
| **React** | Frontend UI framework | MIT |
| **Ollama** | Local AI runtime (external) | Not bundled, user-installed |
| **GLM 4.7** | Cloud AI (BYOK) | User-provided API key |
| **yt-dlp** | YouTube downloader (Python) | Unlicense |
| **Archive.org Downloader** | Archive.org downloader (Python) | MIT |
| **Memos** | Self-hosted note-taking (Docker) | MIT |

### Rust Crate Dependencies

```toml
[dependencies]
tauri = { version = "2.0", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
chrono = "0.4"
dirs = "5.0"
walkdir = "2.4"
reqwest = { version = "0.11", features = ["json"] }
```

### Node.js Dependencies

```json
{
  "dependencies": {
    "golden-layout": "^2.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tauri-apps/api": "^2.0.0"
  }
}
```

### Python Dependencies

```txt
yt-dlp>=2023.0.0
requests>=2.28.0
```

### System Requirements

- **Linux**: Primary target
- **Windows**: Secondary target
- **macOS**: Tertiary target
- **Python 3.8+**: For yt-dlp and Archive.org downloader
- **Docker**: For Memos (optional, can be installed separately)

---

## API Surface Definition (Safe System Operations)

### Allowed File System Operations

| Operation | Constraints | Confirmation Required |
|-----------|-------------|----------------------|
| Read | User directories only | No |
| Write | Safe directories only (configurable) | No |
| Delete | Safe directories only, non-system files | Yes |
| Move/Rename | Within safe directories only | Yes |
| Copy | Within safe directories only | Yes |
| Create Directory | Within safe directories only | No |

### System Operations

| Operation | Constraints | Confirmation Required |
|-----------|-------------|----------------------|
| Set Wallpaper | Any valid image file | No |
| Kill Process | User-owned processes only | Yes |
| Run Command | Allowlisted commands only | Yes |
| Launch App | Allowlisted apps only | Yes |
| List Processes | No restrictions | No |

### Download Operations

| Operation | Constraints | Confirmation Required |
|-----------|-------------|----------------------|
| Download from Archive.org | Safe output directory | No |
| Download from YouTube | Safe output directory | No |
| Pause/Resume Download | User's downloads only | No |
| Cancel Download | User's downloads only | Yes |

---

## Security Considerations

1. **Safe Directories**: Write operations are restricted to user-configured safe directories (e.g., `~/Documents`, `~/Downloads`, custom workspace)

2. **System Path Blocking**: Paths to critical system directories (`/etc`, `/usr/bin`, `/boot`, `/dev`, `/proc`, `/sys`) are blocked regardless of safe directory configuration

3. **Centralized Policy Guard**: All tool calls are validated through a single PolicyGuard enforcing confirmations, allowlists, and safe-path checks

4. **Process Killing**: Only user-owned processes can be killed; system processes are protected

5. **Command Execution**: A command allowlist will be enforced with full-path resolution and argument validation

6. **Credential Storage**: API keys and passwords are stored using the platform's secure storage mechanism (e.g., keyring, secret service)

7. **AI Confirmation**: Destructive operations (delete, move, rename, kill process) require explicit user confirmation enforced by PolicyGuard

8. **Provider-Specific Tool Policies**: Cloud AI tool access is restricted to a reduced tool set unless user explicitly approves elevated actions

9. **App Embedding Safety**: App embedding is allowlist-only, localhost-only streaming, and requires user confirmation per session

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Simple command execution | < 2 seconds |
| AI response (local) | < 3 seconds |
| AI response (cloud) | < 5 seconds |
| File listing (1000 items) | < 500ms |
| Tile open/close | < 300ms |
| Page load (embedded browser) | < 2 seconds |

---

## Testing Strategy

1. **Unit Tests**: Rust backend services (file operations, AI routing, download management)
2. **Integration Tests**: Tauri command invocation, AI tool execution
3. **E2E Tests**: User workflows (download file, create note, change wallpaper)
4. **Safety Tests**: Verify safe directory constraints, system path blocking
5. **Performance Tests**: Measure response times against targets

---

## Out of Scope

- Operating system-level changes beyond wallpaper and process management
- Direct access to system configuration files
- Hardware device management beyond basic operations
- Multi-user account management
- Advanced coding/development features
