# Product Requirements Document

**Project ID**: 20260201-AI-WORKSTATION-9c73
**Document**: 1-20260201-AI-WORKSTATION-9c73-01-PRD.md
**Status**: Step 1 - Planning Complete

---

## Goal

Build a full-screen AI workstation for non-technical users ("normies") where natural language and speech are the primary interface for computer interaction. The system provides a tiled workspace with an AI chat operator that can execute tasks, manage files, browse the web, and integrate both local and cloud AI models safely.

---

## Context

Non-technical users face barriers when interacting with computers — command lines, terminal operations, file system navigation, and system settings all require technical knowledge that most users don't possess. The AI Workstation acts as an intelligent operator, bridging this gap by:

- Providing a conversational interface for all computer interactions
- Executing common tasks through natural language commands
- Maintaining safe constraints to prevent accidental damage
- Offering hands-free operation via speech-to-text
- Presenting information in a flexible, tiled window layout

The system is designed for users who don't want to learn commands — they just want their computer to "do what they say."

---

## User Stories

### Workspace & Layout

| ID | User Story |
|----|------------|
| US-001 | As a user, I want a full-screen tiled workspace that automatically arranges windows so I can see multiple applications at once without manual resizing |
| US-002 | As a user, I want to open new screens with selected content from the AI chat so I can explore information side-by-side with the conversation |
| US-003 | As a user, I want to reorganize the workspace layout through natural language so I don't need to manually drag windows |

### AI Chat & Operator

| ID | User Story |
|----|------------|
| US-010 | As a user, I want to interact with the computer through natural language chat so I don't need to know commands or technical terms |
| US-011 | As a user, I want the AI to execute simple commands like opening applications, creating folders, or saving files |
| US-012 | As a user, I want the AI to help me change system settings like wallpaper without requiring me to navigate complex menus |
| US-013 | As a user, I want to ask for help with computer problems and receive clear, non-technical explanations |

### File System & Management

| ID | User Story |
|----|------------|
| US-020 | As a user, I want the AI to help me find, open, and organize my files through conversation |
| US-021 | As a user, I want to save files to specific folders by simply telling the AI where they should go |
| US-022 | As a user, I want the AI to safely clean up or move files without causing permanent damage |
| US-023 | As a user, I want a WYSIWYG text editor for editing files so I can make changes visually |

### File System Viewer

| ID | User Story |
|----|------------|
| US-024 | As a user, I want a visual file browser (written in Rust) to explore my files in a familiar tree/list format |
| US-025 | As a user, I want to double-click or select files from the viewer to open them in content screens |
| US-026 | As a user, I want the AI chat to be able to point me to specific files and have them highlighted in the file viewer |
| US-027 | As a user, I want to perform basic file operations (rename, move, delete) from the file viewer with AI confirmation for safety |
| US-028 | As a user, I want the file viewer to respect the safe directory constraints and show warnings when accessing restricted areas |

### Web Browsing

| ID | User Story |
|----|------------|
| US-030 | As a user, I want to open web pages directly from the AI chat within the workstation window |
| US-031 | As a user, I want the AI to search the web and present results or open pages based on my request |
| US-032 | As a user, I want to interact with web pages (click links, fill forms) through the AI if needed |

### Archive.org Integration

| ID | User Story |
|----|------------|
| US-035 | As a user, I want to ask the AI to download a book from Archive.org so I can read it offline |
| US-036 | As a user, I want to configure my Archive.org credentials so I can access my account and download books |
| US-037 | As a user, I want to specify download options (resolution, format) when downloading a book from Archive.org |
| US-038 | As a user, I want to view the download progress for books from Archive.org so I know when they are ready |
| US-039 | As a user, I want to manage downloaded books in the file system viewer so I can find and open them easily |

### YouTube Downloader (yt-dlp)

| ID | User Story |
|----|------------|
| US-040 | As a user, I want to download a YouTube video by providing a URL |
| US-041 | As a user, I want to download a YouTube playlist by providing a URL |
| US-042 | As a user, I want to specify the quality or format of the video I want to download |
| US-043 | As a user, I want to manage my downloads (pause, resume, cancel) through the AI chat |
| US-044 | As a user, I want to view the download progress for videos so I know when they are ready |

### Memos Integration (usememos.com)

| ID | User Story |
|----|------------|
| US-045 | As a user, I want to create a note by simply telling the AI what I want to write |
| US-046 | As a user, I want to organize my notes into folders or tags so I can find them easily |
| US-047 | As a user, I want to search for notes by keyword so I can find them quickly |
| US-048 | As a user, I want to sync my notes with a local file so I can access them offline |
| US-049 | As a user, I want to manage my notes (edit, delete) through the AI chat |

### Terminal & System Operations

| ID | User Story |
|----|------------|
| US-050 | As a user, I want the AI to use the terminal on my behalf for tasks that require it |
| US-051 | As a user, I want to safely kill unresponsive applications by asking the AI to do it |
| US-052 | As a user, I want the AI to assist with updating programs, asking for confirmation when needed |

### Speech & Hands-Free

| ID | User Story |
|----|------------|
| US-060 | As a user, I want to use speech to text to interact with the workstation hands-free |
| US-061 | As a user, I want the AI to execute simple commands (open window, save files, reorganize workspace) through voice commands |

### Hybrid AI Model

| ID | User Story |
|----|------------|
| US-070 | As a user, I want a local AI that works immediately without configuration for simple tasks |
| US-071 | As a user, I want to configure my own API key for a cloud AI (BYOK) when I need advanced comprehension and thinking |
| US-072 | As a user, I want the system to automatically route simple tasks to local AI and complex tasks to cloud AI |

### Safety & Constraints

| ID | User Story |
|----|------------|
| US-080 | As a user, I want the system to be protected from accidental damage by limiting write access to safe directories |
| US-081 | As a user, I want the AI to ask for confirmation before making significant changes |

---

## Success Criteria

| Criterion | Definition | How to Measure |
|-----------|------------|----------------|
| SC-001 | Full-screen tiled workspace with AI chat as the primary operator | User can interact with all features through chat without opening external tools |
| SC-002 | Non-technical users can complete common tasks | User testing with non-technical participants can complete 90% of core tasks without help |
| SC-003 | Safe file system constraints | No write operations outside designated user directories; system files protected |
| SC-004 | Local AI executes simple tool calls | Local model can open windows, save files, reorganize workspace successfully |
| SC-005 | BYOK cloud AI integration | User can input API key for GLM 4.7 and use it for comprehension tasks |
| SC-006 | Speech-to-text works for hands-free operation | User can complete workflows using voice commands without keyboard |
| SC-007 | WYSIWYG editor for file editing | User can edit text files visually with immediate preview |
| SC-008 | Web browsing in embedded window | User can open and navigate web pages within the workstation UI |
| SC-009 | Multi-platform support | Application packages available for Linux, Windows, and macOS |
| SC-010 | Performance is responsive | Simple commands execute within 2 seconds; page loads and complex tasks complete within acceptable UX thresholds |

---

## Out of Scope

- Operating system-level changes beyond wallpaper and process management
- Direct access to system configuration files or system directories
- Hardware device management beyond basic system operations
- Multi-user account management (initially single-user focused)
- Cloud storage integrations (future enhancement)
- Advanced coding/development features (this is a consumer workstation, not a developer IDE)
