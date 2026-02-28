# Architecture Overview

## Swan Compliance Tracker

### Stack

| Layer | Technology | Notes |
|---|---|---|
| UI Framework | React 18 | Functional components + hooks |
| Build | Vite 4 | Fast dev server, ESM output |
| AI | Anthropic Claude API | `claude-sonnet-4-20250514` |
| Styling | Inline CSS + CSS-in-JS | No external CSS framework |
| State | React useState/useReducer | No external state library |
| Fonts | Google Fonts | Syne (display) + DM Mono (UI) |

---

### Data Flow

```
User Interaction
      │
      ▼
React Component
      │
      ▼
Custom Hook (useDeadlines / useDocuments / useAIChat)
      │
      ├─── Local state update (setDeadlines, setDocuments, setMessages)
      │
      └─── API call (src/lib/api.js)
                │
                ▼
          Anthropic /v1/messages
                │
                ▼
          Response parsed → state updated → UI re-renders
```

---

### Component Hierarchy

```
App.jsx
├── Header.jsx              (alert banner, branding)
├── Sidebar / Tab Nav       (inline in App)
└── [Active Panel]
    ├── Dashboard.jsx
    ├── ClientsPanel.jsx
    ├── DeadlineTracker.jsx
    ├── DocumentAnalysis.jsx
    └── AIResearch.jsx
```

---

### AI Integration Points

#### 1. Document Analysis (`useDocuments.js`)
- Triggered manually by user per document
- Sends: document name, type, client matter
- Returns: 2-3 sentence compliance summary with regulatory flags

#### 2. AI Research Chat (`useAIChat.js`)
- Full conversational interface
- System prompt injected with live client + deadline context
- Maintains full message history per session (no persistence between sessions)

---

### State Management

All state is local to the React component tree. No global store is used.

| Hook | Owns |
|---|---|
| `useDeadlines` | Deadline list, add/update/remove |
| `useDocuments` | Document list, upload, AI analysis |
| `useAIChat` | Chat message history, loading state |

Client data (`INITIAL_CLIENTS`) is currently static seed data from `src/lib/constants.js`.

---

### Security Notes

- The Anthropic API key is read from `import.meta.env.VITE_ANTHROPIC_API_KEY`
- The key is bundled into the client-side JS build — **suitable for internal tools only**
- For public-facing deployments, proxy API calls through a backend server
- No document content is sent to the API — only metadata (name, type, matter label)
