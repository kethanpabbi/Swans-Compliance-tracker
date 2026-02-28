# 🦢 Legal PI Case Manager

> **Brute force innovation into the legal industry.**

An AI-powered case management platform built for plaintiff personal injury law firms. Combines case intake, deadline tracking, document analysis with real text extraction, and a context-aware Claude AI assistant — all in a single unified interface.

Built to support Swan's mission: helping law firms serve more clients so the 92% of low-income households that can't afford legal help finally can.

---

## ✦ Features

| Feature | Description |
|---|---|
| **Dashboard** | At-a-glance overview — active cases, pipeline value, urgent deadlines, recent AI analysis |
| **Cases** | PI case management with intake, stage tracking, estimated settlement values, and attorney assignment |
| **Deadlines** | Court and internal deadlines grouped by urgency — critical, high, upcoming, later |
| **Document Analysis** | Upload PDF/DOCX — AI extracts the actual text and analyzes real document contents |
| **AI Assistant** | Context-aware Claude chat with full case awareness + document querying mode |

---

## 🗂 Project Structure

```
swan-compliance-tracker/
├── index.html                  # Vite HTML entry point (must be at root)
├── public/                     # Static assets
├── src/
│   └── App.jsx                 # Full application — single component file
├── .env                        # Your API key (never commit this)
├── .env.example                # API key template
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=18.0.0`
- npm
- Anthropic API key — [get one at console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
# 1. Unzip and enter the project folder
cd swan-compliance-tracker

# 2. Install dependencies
npm install

# 3. Create your .env file
echo "VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env

# 4. Start the dev server
npm run dev
```

App runs at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

---

## 🔑 Environment Variables

```env
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> ⚠️ **Security Note:** Never commit your `.env` file. It is included in `.gitignore` by default. The API key is sent directly from the browser using `anthropic-dangerous-direct-browser-access: true` — suitable for internal demos only. For production, proxy API calls through a backend server.

---

## 🤖 AI Integration

All AI features use **claude-haiku-4-5-20251001** via the Anthropic Messages API — the fastest and most cost-effective model, ideal for real-time legal analysis.

### Document Analysis

1. User uploads a `.pdf`, `.docx`, or `.txt` file
2. The browser extracts the full text using **pdf.js** (PDF) or **mammoth.js** (DOCX)
3. Extracted text is sent to Claude alongside case context
4. Claude returns a structured analysis: key facts, liability indicators, legal significance, and recommended next steps
5. A **"✓ Text extracted"** badge confirms actual content was read (not just filename)

### Document Querying

After analysis, click **"✦ Ask AI →"** on any document to enter **doc mode**:
- Full document text is loaded into the AI assistant's context
- AI can answer questions about specific clauses, fields to fill in, legal implications, and red flags
- A gold banner shows which document is active
- Click **"✕ Exit doc mode"** to return to general case chat

### AI Legal Assistant

The assistant is context-aware at all times:
- All active PI cases with type, stage, and estimated value
- Upcoming deadlines within 14 days
- When in doc mode: full document text (up to 4,000 characters)

Suggested queries change dynamically based on whether a document is loaded.

---

## 📋 Data Model

### Case (Client)

```ts
{
  id: number
  name: string
  type: "Auto Accident" | "Slip & Fall" | "Medical Malpractice" | "Workplace Injury" | "Truck Accident" | "Product Liability"
  status: "active" | "settlement" | "closed"
  stage: "Intake" | "Discovery" | "Filing" | "Negotiation" | "Litigation" | "Settlement" | "Closed"
  intake: string          // ISO date
  value: string           // estimated settlement, e.g. "$85,000"
  attorney: string
}
```

### Deadline

```ts
{
  id: number
  clientId: number
  title: string
  date: string            // ISO date
  daysLeft: number        // computed from today
  status: "pending" | "in-progress"
  type: "court" | "internal"
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
  uploaded: string        // ISO date
  status: "pending" | "analyzed"
  userUploaded: boolean   // only user-uploaded docs show AI Analyze button
  extractedText: string | null   // actual text content from PDF/DOCX
  summary: string | null  // returned by Claude
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
| **Purple Accent** | `#8b5cf6` |
| **Font** | Arial, sans-serif |

Stage colors: Intake (indigo), Discovery (amber), Filing (red), Negotiation (purple), Litigation (red), Settlement (green), Closed (grey)

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite |
| Styling | Inline styles + CSS-in-JS |
| AI Model | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| PDF Parsing | pdf.js (Cloudflare CDN) |
| DOCX Parsing | mammoth.js (Cloudflare CDN) |
| State | React `useState` hooks |

---

## 🔐 Security Notes

- API key stored in `.env` only — never hardcoded in source
- `anthropic-dangerous-direct-browser-access: true` header is required for direct browser API calls
- No document content is stored or logged externally — analysis happens in-session only
- For production deployments, route all API calls through a backend to keep the API key server-side

---

## 🗺 Roadmap

- [x] PI case management with stages and estimated values
- [x] Court vs internal deadline classification
- [x] PDF and DOCX text extraction in browser
- [x] AI document analysis using actual file contents
- [x] Document querying mode in AI assistant
- [ ] Backend persistence (PostgreSQL / Supabase)
- [ ] Calendar sync for court deadlines (Google Calendar / Outlook)
- [ ] Multi-user auth with attorney role separation
- [ ] Email/SMS alerts for critical court deadlines
- [ ] Intake form with client-facing portal
- [ ] Settlement calculator with comparable case data

---

## 📄 License

MIT © Kethan Pabbi

---

*Built with [Claude AI](https://anthropic.com) · Brute forcing innovation into law*