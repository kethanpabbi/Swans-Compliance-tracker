# 🦢 Swan Compliance Tracker

> **Legal Intelligence Platform** — AI-powered compliance management for legal teams.

A full-featured compliance tracking application built for law firms and legal operations teams. Combines client matter management, deadline tracking, document analysis, and Claude AI-powered legal research into a single unified interface.

---

## ✦ Features

| Feature | Description |
|---|---|
| **Dashboard** | At-a-glance compliance overview — risk matrix, critical deadlines, recent AI analysis |
| **Clients & Matters** | Manage clients, jurisdiction, risk level, and matter status |
| **Deadline Tracker** | Color-coded urgency system — critical, high, medium, low |
| **Document Analysis** | Upload documents and trigger live AI-powered compliance review |
| **AI Legal Research** | Context-aware Claude AI chat with full client/matter awareness |

---

## 🗂 Project Structure

```
swan-compliance-tracker/
├── public/
│   └── index.html                  # HTML entry point
│
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx           # Overview stats, risk matrix, deadline summary
│   │   ├── ClientsPanel.jsx        # Client/matter management and filtering
│   │   ├── DeadlineTracker.jsx     # Deadline list, urgency grouping, add modal
│   │   ├── DocumentAnalysis.jsx    # File upload + AI document review
│   │   ├── AIResearch.jsx          # Claude AI chat interface
│   │   ├── Header.jsx              # App header with alert banners
│   │   └── Sidebar.jsx             # Tab navigation
│   │
│   ├── hooks/
│   │   ├── useDeadlines.js         # Deadline state management
│   │   ├── useDocuments.js         # Document upload + analysis logic
│   │   └── useAIChat.js            # Claude API chat state
│   │
│   ├── lib/
│   │   ├── api.js                  # Anthropic API client wrapper
│   │   ├── constants.js            # App-wide constants, mock data
│   │   └── utils.js                # Date helpers, risk color logic, formatters
│   │
│   ├── styles/
│   │   └── globals.css             # Global styles, CSS variables, animations
│   │
│   └── App.jsx                     # Root component and routing
│
├── docs/
│   ├── ARCHITECTURE.md             # Technical architecture overview
│   └── API.md                      # API integration reference
│
├── .env.example                    # Environment variable template
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=18.0.0`
- npm or yarn
- Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/swans/compliance-tracker.git
cd compliance-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Open `.env` and add your credentials:

```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

> ⚠️ **Security Note:** Never commit your `.env` file. It's included in `.gitignore` by default.

### Development

```bash
npm run dev
```

App runs at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

---

## 🤖 AI Integration

This app uses the **Claude claude-sonnet-4-20250514** model via the Anthropic Messages API.

### Document Analysis

When a document is uploaded and "AI Analyze" is triggered, the app sends document metadata + matter context to Claude and returns a structured compliance summary with regulatory flags.

### AI Legal Research Chat

The AI Research tab includes full system-prompt context:
- All active clients and their matters
- Upcoming critical deadlines (within 14 days)
- Jurisdiction awareness

Claude responds with regulation-specific guidance, citations, and actionable flags.

---

## 📋 Data Model

### Client

```ts
{
  id: number
  name: string
  matter: string
  status: "active" | "review" | "closed"
  risk: "high" | "medium" | "low"
  jurisdiction: "Federal" | "State" | "EU" | string
}
```

### Deadline

```ts
{
  id: number
  clientId: number
  title: string
  date: string           // ISO 8601
  priority: "critical" | "high" | "medium" | "low"
  status: "pending" | "in-progress" | "complete"
  daysLeft: number       // computed from today
}
```

### Document

```ts
{
  id: number
  clientId: number
  name: string
  type: string
  size: string
  uploaded: string       // ISO 8601
  status: "pending" | "analyzed"
  summary: string | null // returned by Claude API
}
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| **Primary Gold** | `#c8a96e` |
| **Background** | `#0a0c10` |
| **Surface** | `#111318` |
| **Border** | `#1e2330` |
| **Critical Red** | `#ef4444` |
| **Warning Amber** | `#f59e0b` |
| **Safe Green** | `#22c55e` |
| **Display Font** | Syne (800 weight) |
| **Mono Font** | DM Mono |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite |
| Styling | Inline styles + CSS-in-JS |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| State | React `useState` / `useReducer` |
| Fonts | Google Fonts (Syne, DM Mono) |

---

## 🔐 Security & Compliance

- API keys stored in environment variables only — never in source code
- No sensitive client data is persisted to external storage
- All document analysis is performed client-side through the Anthropic API
- The app does not store or log document contents

---

## 🗺 Roadmap

- [ ] Backend persistence (PostgreSQL / Supabase)
- [ ] Real document parsing (PDF, DOCX text extraction)
- [ ] Calendar sync for deadlines (Google Calendar / Outlook)
- [ ] Multi-user authentication and role-based access
- [ ] Email/Slack alerts for critical deadlines
- [ ] Audit log for compliance actions

---

## 📄 License

MIT © Swan Legal Technologies

---

*Built with [Claude AI](https://anthropic.com) · Part of the Swan Legal Platform*
