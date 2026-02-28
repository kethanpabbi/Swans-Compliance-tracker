# API Reference

## Anthropic Claude API Integration

### Endpoint

```
POST https://api.anthropic.com/v1/messages
```

### Authentication

Pass your API key via environment variable. The Vite build exposes it as:

```js
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
```

> ⚠️ For production, proxy through a backend to avoid exposing the key in the browser.

---

### Request Format

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "system": "<optional system prompt>",
  "messages": [
    { "role": "user", "content": "Your message here" },
    { "role": "assistant", "content": "Previous reply" }
  ]
}
```

### Response Format

```json
{
  "content": [
    { "type": "text", "text": "Claude's response text" }
  ]
}
```

---

## Internal API Module (`src/lib/api.js`)

### `sendMessage(messages, systemPrompt?)`

Sends a conversation to Claude and returns the response text.

```js
import { sendMessage } from "./lib/api.js";

const reply = await sendMessage(
  [{ role: "user", content: "Summarize HIPAA requirements" }],
  "You are a compliance assistant..."
);
```

**Parameters:**
- `messages` — `Array<{ role: "user" | "assistant", content: string }>`
- `systemPrompt` — `string` (optional)

**Returns:** `Promise<string>`

---

### `buildResearchSystemPrompt(clients, deadlines)`

Constructs the AI Research system prompt with live client/deadline context.

```js
const systemPrompt = buildResearchSystemPrompt(clients, deadlines);
```

**Returns:** `string`

---

### `buildDocumentAnalysisPrompt(doc, matter)`

Constructs the prompt for analyzing a compliance document.

```js
const prompt = buildDocumentAnalysisPrompt(doc, "HIPAA Privacy Compliance");
```

**Returns:** `string`
