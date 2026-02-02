# Operator Usage and Troubleshooting Guide

## Table of Contents
1. [What is the Operator?](#what-is-the-operator)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Using the Operator](#using-the-operator)
5. [Troubleshooting](#troubleshooting)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Best Practices](#best-practices)
8. [Advanced Configuration](#advanced-configuration)

---

## What is the Operator?

The Operator is an AI-powered command processor that acts as the brain of your AI workstation. It:

- **Listens** to your natural language requests
- **Thinks** about what commands to execute based on context
- **Responds** with structured JSON commands that control your workstation

### Key Features

- ✅ **Local LLM**: Uses Ollama for privacy and speed (no cloud required)
- ✅ **Context-aware**: Knows about open windows, recent commands, and your notes
- ✅ **Window Management**: Can create, update, focus, and close windows
- ✅ **Multi-Type Support**: Works with AI, doc, editor, terminal, chart, data, vault, yazi, downloads, memos, filesystem, and appembed windows
- ✅ **Safe Design**: Returns empty commands if unsure, avoiding unexpected actions

---

## Prerequisites

### 1. Install Ollama

**Linux/Mac:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from https://ollama.com/download

### 2. Start Ollama

Ollama must be running for the Operator to work:

```bash
ollama serve
```

**Important:** Keep this terminal window open while using the workstation!

### 3. Pull the Model

The Operator uses the `smollm2:135m` model by default:

```bash
ollama pull smollm2:135m
```

This model is optimized for tool calls and is lightweight (only 135MB).

---

## Getting Started

### Step 1: Verify Ollama is Running

Check if Ollama is accessible:

```bash
curl http://localhost:11434/api/version
```

You should see a JSON response with a version number.

### Step 2: Verify Model is Available

Check if the model is installed:

```bash
curl http://localhost:11434/api/tags
```

Look for `smollm2:135m` in the response.

### Step 3: Launch the Workstation

Start your Tauri application:

```bash
cd Workstation
npm run tauri dev
```

### Step 4: Check Operator Connection

In the Operator window, click the **"🔍 Check Connection"** button.

You should see:
- ✅ **Ollama Running:** Yes (with version number)
- ✅ **Model Available:** Yes (smollm2:135m)

---

## Using the Operator

### Basic Commands

#### Create Windows

**"Open a terminal"**
```json
{
  "commands": [
    {
      "action": "create_window",
      "windowType": "terminal",
      "title": "Terminal"
    }
  ]
}
```

**"Create a new note"**
```json
{
  "commands": [
    {
      "action": "create_window",
      "windowType": "editor",
      "title": "New Note"
    }
  ]
}
```

#### Focus Windows

**"Switch to the vault"**
```json
{
  "commands": [
    {
      "action": "focus_window",
      "windowId": "vault"
    }
  ]
}
```

#### Close Windows

**"Close the terminal"**
```json
{
  "commands": [
    {
      "action": "close_window",
      "windowId": "terminal-1"
    }
  ]
}
```

#### Complex Commands

**"Open a terminal, list files in current directory, and close the vault"**
```json
{
  "commands": [
    {
      "action": "create_window",
      "windowType": "terminal",
      "title": "Terminal"
    },
    {
      "action": "focus_window",
      "windowId": "terminal-1"
    },
    {
      "action": "write_to_window",
      "windowId": "terminal-1",
      "payload": { "command": "ls -la" }
    },
    {
      "action": "close_window",
      "windowId": "vault"
    }
  ]
}
```

### Available Actions

| Action | Purpose | Required Parameters |
|--------|---------|-------------------|
| `create_window` | Open a new window | `windowType` |
| `update_window` | Update window content | `windowId` |
| `focus_window` | Switch to window | `windowId` |
| `close_window` | Close a window | `windowId` |
| `list_windows` | List all windows | None |
| `write_to_window` | Write to a window | `windowId`, `payload` |
| `reflow_layout` | Reorganize layout | None |

### Available Window Types

- `ai` - AI Operator window
- `doc` - Document viewer
- `editor` - Text editor
- `terminal` - Terminal emulator
- `chart` - Data visualization
- `data` - Data table viewer
- `vault` - Notes/vault manager
- `yazi` - File manager
- `downloads` - Download manager
- `memos` - Notes application
- `filesystem` - File browser
- `appembed` - Embedded application

---

## Troubleshooting

### Using the Diagnostics Panel

The Operator now includes a diagnostics feature:

1. **Click "🔍 Check Connection"** in the Operator header
2. **Review the status:**
   - ✅ **Ollama Running:** Yes/No
   - ✅ **Model Available:** Yes/No
   - 📝 **Version:** Ollama version number
   - 📝 **Model:** Currently selected model

### Interpreting Errors

#### Error: "Ollama is not running"

**What it means:** The Operator cannot connect to Ollama at `http://localhost:11434`

**How to fix:**
1. Open a terminal and run: `ollama serve`
2. Keep the terminal running while using the workstation
3. Verify Ollama is accessible: `curl http://localhost:11434/api/version`

#### Error: "Model 'smollm2:135m' is not available"

**What it means:** The model is not installed on your system

**How to fix:**
1. Open a terminal and run: `ollama pull smollm2:135m`
2. Wait for the download to complete (~135MB)
3. Verify installation: `ollama list`
4. Try running the command again

#### Error: "Ollama request timed out after 30000ms"

**What it means:** The request took longer than 30 seconds

**How to fix:**
1. **Try a simpler command** - Complex commands may take longer
2. **Check Ollama performance:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
3. **Consider using a faster model:**
   - `smollm2:135m` is already fast
   - Alternative: `phi3:mini` (if you want better quality)
4. **Check system resources** - Ensure you have enough RAM/CPU

#### Error: "Operator output is not valid JSON"

**What it means:** The AI model returned malformed JSON

**How to fix:**
1. **Check browser console** for the raw output
2. **Try a simpler command** - Complex prompts may confuse the model
3. **Verify the model is working:**
   ```bash
   ollama run smollm2:135m "Output only valid JSON: {\"test\": true}"
   ```
4. **Report the issue** - This might indicate a problem with the model

#### Error: "Command at index X has invalid action"

**What it means:** The AI generated an invalid command action

**How to fix:**
1. **Check the output** - See what command was generated
2. **Verify actions** - Ensure only valid actions are used (see Available Actions table)
3. **Simplify your request** - Use more specific language
4. **Try again** - Sometimes the model makes mistakes

### Debugging Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for `[Ollama]` and `[Operator]` logs
   - Check for error messages in red

2. **Verify Network Requests**
   - Open Developer Tools → Network tab
   - Filter by "11434" or "ollama"
   - Check for failed requests (red)
   - Examine response bodies

3. **Test Ollama Directly**
   ```bash
   # Test connection
   curl http://localhost:11434/api/version
   
   # Test model
   curl http://localhost:11434/api/generate -d '{
     "model": "smollm2:135m",
     "prompt": "Hello",
     "stream": false
   }'
   ```

4. **Check System Resources**
   - Monitor CPU usage
   - Check available RAM (model requires ~1-2GB)
   - Ensure disk space is available

---

## Common Issues and Solutions

### Issue: Operator doesn't respond

**Possible causes:**
1. Ollama is not running
2. Model is not installed
3. Network connection issues
4. Timeout errors

**Solutions:**
1. Click "🔍 Check Connection" to diagnose
2. Start Ollama with `ollama serve`
3. Pull the model with `ollama pull smollm2:135m`
4. Check browser console for errors

### Issue: Commands are not executed

**Possible causes:**
1. Invalid JSON structure
2. Invalid window IDs
3. Invalid action types
4. Missing required parameters

**Solutions:**
1. Review the output in the Operator window
2. Verify window IDs match existing windows
3. Check action names against the valid actions list
4. Ensure required parameters are provided

### Issue: Model makes mistakes

**Possible causes:**
1. Model is too small
2. Context is too complex
3. Ambiguous instructions

**Solutions:**
1. **Use more specific language** - Instead of "open something", say "open a terminal"
2. **Break down complex tasks** - Do one thing at a time
3. **Try alternative models** - `phi3:mini` or `llama3.2:1b`
4. **Provide context** - Refer to specific windows by name

### Issue: Slow responses

**Possible causes:**
1. Model is large
2. System is under load
3. Prompt is complex
4. Network latency (if using remote Ollama)

**Solutions:**
1. **Use smaller models** - `smollm2:135m` is fastest
2. **Reduce context** - Fewer windows, shorter prompts
3. **Simplify commands** - Break into smaller steps
4. **Close unused applications** - Free up system resources

### Issue: Out of memory errors

**Possible causes:**
1. Model is too large
2. Multiple models loaded
3. System has limited RAM

**Solutions:**
1. **Unload unused models:**
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "smollm2:135m",
     "keep_alive": 0
   }'
   ```
2. **Use smaller models** - `smollm2:135m` uses only 135MB
3. **Close other applications** - Free up RAM
4. **Increase swap space** - Allow system to use disk as RAM

---

## Best Practices

### 1. Be Specific

❌ **Bad:** "Open a window"

✅ **Good:** "Open a terminal window titled 'Development'"

### 2. Use Simple Language

❌ **Bad:** "I would appreciate it if you could facilitate the creation of a new textual editing interface"

✅ **Good:** "Create an editor window"

### 3. Break Down Complex Tasks

❌ **Bad:** "Create a terminal, run npm install, then open an editor and show me the package.json"

✅ **Good:** 
1. "Create a terminal"
2. "Run npm install in the terminal"
3. "Open an editor showing package.json"

### 4. Reference Windows by Name

❌ **Bad:** "Focus window with ID abc123"

✅ **Good:** "Focus the terminal window"

### 5. Check Output First

Always review the generated JSON before accepting commands:
1. Look at the output panel
2. Verify commands match your intent
3. Check for errors in the notes section

### 6. Use Diagnostics Regularly

Click "🔍 Check Connection" when:
- Starting a new session
- After system updates
- When experiencing issues
- Before complex operations

---

## Advanced Configuration

### Change the Model

Edit `Workstation/src/ai/ollama.ts`:

```typescript
const defaultConfig: OllamaConfig = {
  baseUrl: "http://localhost:11434",
  model: "phi3:mini",  // Change to your preferred model
  timeoutMs: 30000,
};
```

### Adjust Timeout

Increase timeout for slower systems or complex tasks:

```typescript
const defaultConfig: OllamaConfig = {
  baseUrl: "http://localhost:11434",
  model: "smollm2:135m",
  timeoutMs: 60000,  // 60 seconds instead of 30
};
```

### Use Remote Ollama

If Ollama is running on a different machine:

```typescript
const defaultConfig: OllamaConfig = {
  baseUrl: "http://192.168.1.100:11434",  // Remote IP
  model: "smollm2:135m",
  timeoutMs: 30000,
};
```

### Modify System Prompt

Edit `Workstation/src/ai/operator.ts` to customize behavior:

```typescript
const systemPrompt = `You are the Local Operator AI for a desktop AI workstation.
Output ONLY valid JSON following this schema:
{
  "commands": [
    {
      "action": "create_window|update_window|focus_window|close_window|list_windows|write_to_window|reflow_layout",
      "windowId": "string?",
      "windowType": "ai|doc|editor|terminal|chart|data|vault|yazi?",
      "title": "string?",
      "payload": { "any": "object" }
    }
  ]
}
Rules:
- No markdown. No extra text.
- If unsure, respond with {"commands": []}.
- Never invent window IDs. Use only provided IDs.
- You can reference vault entries (notes) from the provided vault index.
- Be concise and direct.
- Prefer simple commands over complex ones.
`;
```

### Add Custom Window Types

Edit `Workstation/src/ai/schema.ts`:

```typescript
export type WindowType =
  | "ai"
  | "doc"
  | "editor"
  | "terminal"
  | "chart"
  | "data"
  | "vault"
  | "yazi"
  | "downloads"
  | "memos"
  | "filesystem"
  | "appembed"
  | "my-custom-type";  // Add your custom type
```

Then implement the window component in the appropriate location.

---

## Performance Tips

1. **Keep Ollama Running** - Avoid startup overhead
2. **Use Smaller Models** - `smollm2:135m` is optimized for speed
3. **Limit Context** - Fewer windows = faster processing
4. **Cache Results** - Reuse previously created windows
5. **Monitor Resources** - Keep an eye on CPU and RAM usage

---

## Getting Help

### Check Logs

Always check the browser console for detailed logs:
- `[Ollama]` - Ollama-related logs
- `[Operator]` - Operator-related logs
- `[Ollama ERROR]` - Error messages from Ollama
- `[Operator ERROR]` - Error messages from Operator

### Report Issues

If you encounter a bug:

1. **Check diagnostics** - Click "🔍 Check Connection"
2. **Copy error messages** - Include the full error text
3. **Include system info:**
   - OS and version
   - Ollama version (`ollama --version`)
   - Model being used
   - Browser and version
4. **Describe the issue** - What you tried, what happened, what you expected

### Useful Commands

```bash
# Check Ollama version
ollama --version

# List installed models
ollama list

# Show model details
ollama show smollm2:135m

# Test model directly
ollama run smollm2:135m

# Check running Ollama processes
ps aux | grep ollama

# Check port usage (default 11434)
netstat -tlnp | grep 11434  # Linux/Mac
netstat -ano | findstr 11434 # Windows
```

---

## FAQ

**Q: Can I use a different model?**

A: Yes! Edit the `model` field in `src/ai/ollama.ts`. Just make sure it's installed with `ollama pull <model-name>`.

**Q: Why does the Operator sometimes return empty commands?**

A: This is a safety feature. The model returns empty commands when it's unsure about what to do, preventing unexpected actions.

**Q: Can I use a remote Ollama server?**

A: Yes! Change the `baseUrl` in `src/ai/ollama.ts` to your remote server's address.

**Q: How do I improve response quality?**

A: 
- Use larger models (e.g., `phi3:mini`, `llama3.2:1b`)
- Be more specific in your requests
- Provide more context about what you want

**Q: What happens if Ollama crashes?**

A: The Operator will display an error and won't process commands until Ollama is restarted.

**Q: Can I use the Operator offline?**

A: Yes! Everything runs locally. Just make sure Ollama and the model are installed.

---

## Conclusion

The Operator is a powerful tool for controlling your AI workstation through natural language. With proper configuration and understanding of its capabilities, you can efficiently manage windows, execute commands, and automate tasks.

**Key takeaways:**
- Always verify Ollama is running before using the Operator
- Use the diagnostics panel to troubleshoot issues
- Be specific and use simple language
- Break down complex tasks into smaller steps
- Check the output before accepting commands

Happy operating! 🚀