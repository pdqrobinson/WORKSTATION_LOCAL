# GLM 4.7 Quick Start Guide

## Overview

The Operator now uses **GLM 4.7** (from z.ai) as its default AI model, replacing the local Ollama setup. GLM 4.7 is a powerful cloud-based model that offers:

- ✅ **Higher quality responses** than local models
- ✅ **Faster performance** with cloud infrastructure
- ✅ **No local installation required** - no Ollama setup needed
- ✅ **Consistent performance** regardless of your hardware

## Prerequisites

1. **z.ai Account**: Sign up at https://z.ai
2. **API Key**: Generate an API key from your z.ai account
3. **Internet Connection**: Required for API access

---

## Getting Your API Key

### Step 1: Sign Up/Login

1. Go to https://z.ai
2. Sign up for a free account or log in

### Step 2: Generate API Key

1. Navigate to your account settings or API keys section
2. Click "Generate New API Key"
3. Copy the API key (starts with a prefix like `zpk_` or similar)
4. **Keep it secure** - don't share it publicly!

### Step 3: Note Your Key

You'll need to enter this key in the workstation UI.

---

## Configuration

### Method 1: Using the UI (Recommended)

1. **Launch the Workstation**:
   ```bash
   cd Workstation
   npm run tauri dev
   ```

2. **Find the Operator Window** - usually in the top-left or created by default

3. **Set Your API Key**:
   - Click the **"🔑 Set API Key"** button
   - Enter your z.ai API key in the password field
   - Click the **"✓"** button to save

4. **Test Connection**:
   - Click the **"🔍 Check Connection"** button
   - Verify you see:
     - ✅ **GLM API Connected:** Yes
     - ✅ **Model Available:** Yes (GLM 4.7)

### Method 2: Setting via Code (Advanced)

Edit `Workstation/src/ai/ollama.ts`:

```typescript
const defaultGLMConfig: GLMConfig = {
  baseUrl: "https://api.z.ai/api/coding/paas/v4",
  apiKey: "your-zai-api-key-here",  // Add your key here
  model: "glm-4",
  timeoutMs: 60000,
};
```

---

## Using the Operator with GLM 4.7

### Basic Usage

Once configured, the operator works exactly the same way, just with better responses:

**"Open a terminal window"**

The AI will return:
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

### Example Commands

- **"Create a new note called 'Project Ideas'"**
- **"Focus the vault window"**
- **"Close all terminal windows"**
- **"Open a terminal and run 'ls -la'"**
- **"Reorganize the layout"**

---

## Advantages of GLM 4.7

| Feature | GLM 4.7 | Ollama (smollm2:135m) |
|----------|-----------|---------------------------|
| **Response Quality** | High | Medium |
| **Setup Required** | API Key only | Local installation + model download |
| **Performance** | Fast (cloud) | Varies (hardware) |
| **Privacy** | Cloud (data sent to z.ai) | Local (100% private) |
| **Cost** | Free tier available | Free |
| **Offline Use** | ❌ No | ✅ Yes |
| **Model Size** | N/A (cloud) | ~135MB |

---

## Troubleshooting

### Issue: "GLM API is not accessible"

**Error message:**
```
GLM API is not accessible. Please check your API key and connection
```

**Solutions:**
1. **Verify API Key** - Make sure you copied the full key correctly
2. **Check Internet** - Ensure you have a stable internet connection
3. **Test API Key** - Try making a simple API request:
   ```bash
   curl -X POST https://api.z.ai/api/coding/paas/v4/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{"model":"glm-4","messages":[{"role":"user","content":"test"}]}'
   ```
4. **Check API Key Status** - Visit z.ai to ensure your key is active

### Issue: "GLM API key is not set"

**Error message:**
```
GLM API key is not set. Please set your z.ai API key in configuration.
```

**Solutions:**
1. Click **"🔑 Set API Key"** in the Operator window
2. Enter your API key
3. Click **"✓"** to save
4. Try the command again

### Issue: Request timed out

**Error message:**
```
GLM request timed out after 60000ms
```

**Solutions:**
1. **Check Internet Connection** - Ensure stable connectivity
2. **Try Simpler Commands** - Reduce prompt complexity
3. **Wait and Retry** - The service might be temporarily busy
4. **Increase Timeout** - Edit `src/ai/ollama.ts` and increase `timeoutMs`:
   ```typescript
   timeoutMs: 120000  // 120 seconds instead of 60
   ```

### Issue: "GLM response missing message content"

**Solutions:**
1. **Check API Key** - Ensure it's valid and active
2. **Check z.ai Status** - The service might be down
3. **Retry Request** - Sometimes transient errors occur

---

## Configuration Options

### Change Model

Edit `Workstation/src/ai/ollama.ts`:

```typescript
const defaultGLMConfig: GLMConfig = {
  baseUrl: "https://api.z.ai/api/coding/paas/v4",
  apiKey: "",
  model: "glm-4-flash",  // Try other GLM variants
  timeoutMs: 60000,
};
```

Available GLM models (check z.ai documentation):
- `glm-4` - Standard GLM 4.7
- `glm-4-flash` - Faster variant
- `glm-4-long` - Longer context

### Adjust Temperature

Edit the request in `src/ai/ollama.ts`:

```typescript
body: JSON.stringify({
  model: config.model,
  messages,
  temperature: 0.3,  // Lower = more deterministic, Higher = more creative
  max_tokens: 2048,
  stream: false,
}),
```

- **0.1-0.3** - Very focused, deterministic (good for commands)
- **0.7** - Balanced (default)
- **0.8-1.0** - Creative, varied responses

### Adjust Max Tokens

```typescript
max_tokens: 4096  // Allow longer responses
```

---

## API Key Management

### Where is the API Key Stored?

The API key is stored in your browser's **localStorage** under the key `glm-api-key`.

### Security Best Practices

1. **Never share** your API key publicly
2. **Rotate keys** regularly if using production systems
3. **Monitor usage** in your z.ai dashboard
4. **Revoke compromised keys** immediately
5. **Use separate keys** for development and production

### Clearing the API Key

To remove your API key from the workstation:

```javascript
// Open browser console (F12)
localStorage.removeItem('glm-api-key');
// Refresh the page
```

Or click the **"🔑 Set API Key"** button and clear the input field.

---

## Switching Back to Ollama

If you want to use Ollama instead of GLM 4.7:

1. **Install Ollama** (if not already):
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Edit `Workstation/src/ai/operator.ts`**:
   ```typescript
   import {
     callOllamaChat,
     checkOllamaConnection,
     OllamaDiagnostics,
   } from "./ollama";
   ```

3. **Edit `Workstation/src/ai/ollama.ts`**:
   - Revert the changes to use Ollama configuration
   - Remove GLM-related code

4. **Restart the application**:
   ```bash
   npm run tauri dev
   ```

---

## Advanced Usage

### Custom System Prompt

Edit `Workstation/src/ai/operator.ts`:

```typescript
const systemPrompt = `You are an AI Operator for a desktop workstation.
Output ONLY valid JSON following this schema:
{
  "commands": [...]
}
Rules:
- Be concise and direct
- Prefer simple commands
- Focus on what the user explicitly requests
- No markdown, no extra text
`;
```

### Adding Multiple AI Backends

You can extend the system to support both Ollama and GLM:

```typescript
// In operator.ts
const useGLM = true; // Set based on user preference

const content = useGLM 
  ? await callGLMChat([...])
  : await callOllamaChat([...]);
```

---

## Performance Tips

1. **Keep API Key Valid** - Monitor your z.ai account for key status
2. **Use Concise Prompts** - Shorter requests are faster
3. **Cache Responses** - Reuse similar command patterns
4. **Monitor API Usage** - Check z.ai dashboard for usage stats
5. **Handle Timeouts** - Set appropriate timeouts for your network

---

## Getting Help

### Check Logs

Open browser console (F12) and look for:
- `[Ollama]` - Configuration and connection logs
- `[Ollama ERROR]` - Error messages (renamed from Ollama but still works for GLM)

### Useful Commands

```bash
# Test API connectivity
curl -X POST https://api.z.ai/api/coding/paas/v4/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model":"glm-4","messages":[{"role":"user","content":"Hello"}]}'

# Check DNS resolution
ping api.z.ai

# Check SSL certificate
openssl s_client -connect api.z.ai:443
```

---

## FAQ

**Q: Is GLM 4.7 free to use?**

A: z.ai typically offers a free tier with rate limits. Check their pricing page for details.

**Q: Can I use my own GLM deployment?**

A: Yes! Change the `baseUrl` in `src/ai/ai/ollama.ts` to your endpoint.

**Q: How do I know which model is being used?**

A: The operator displays "Model: GLM 4.7" in the UI header.

**Q: What happens if my API key expires?**

A: You'll get connection errors. Generate a new key from z.ai and update it in the workstation.

**Q: Can I switch between GLM and Ollama?**

A: Currently, you need to modify the code to switch. Advanced users can add a toggle feature.

**Q: Is my data private with GLM?**

A: Your requests are sent to z.ai's servers. Review their privacy policy for details. For 100% privacy, use Ollama locally.

---

## Conclusion

GLM 4.7 provides a powerful, cloud-based AI for your operator with better performance and quality than local models. With a simple API key setup, you can start using it immediately.

**Key Steps:**
1. Get API key from z.ai
2. Enter it in the workstation UI
3. Test connection with diagnostics
4. Start using natural language commands

Happy operating with GLM 4.7! 🚀

For more detailed information, see [OPERATOR_GUIDE.md](./OPERATOR_GUIDE.md).