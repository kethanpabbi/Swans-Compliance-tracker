import { useState, useEffect, useRef } from "react";

const FONT = "Arial, sans-serif";

const CLIENTS = [
  { id: 1, name: "Marcus T. Williams", type: "Auto Accident", status: "active", stage: "Discovery", intake: "2026-01-12", value: "$85,000", attorney: "J. Rodriguez" },
  { id: 2, name: "Priya Nair", type: "Slip & Fall", status: "active", stage: "Negotiation", intake: "2025-11-03", value: "$42,000", attorney: "S. Chen" },
  { id: 3, name: "DeShawn Carter", type: "Medical Malpractice", status: "active", stage: "Filing", intake: "2026-02-01", value: "$220,000", attorney: "J. Rodriguez" },
  { id: 4, name: "Elena Vasquez", type: "Workplace Injury", status: "settlement", stage: "Settlement", intake: "2025-09-18", value: "$67,500", attorney: "S. Chen" },
  { id: 5, name: "Robert Kim", type: "Truck Accident", status: "active", stage: "Litigation", intake: "2025-12-22", value: "$310,000", attorney: "M. Patel" },
  { id: 6, name: "Latasha Brown", type: "Auto Accident", status: "closed", stage: "Closed", intake: "2025-07-04", value: "$28,000", attorney: "S. Chen" },
];

const DEADLINES = [
  { id: 1, clientId: 3, title: "Complaint Filing Deadline", date: "2026-03-02", daysLeft: 3, status: "pending", type: "court" },
  { id: 2, clientId: 1, title: "Discovery Response Due", date: "2026-03-10", daysLeft: 11, status: "pending", type: "court" },
  { id: 3, clientId: 5, title: "Expert Witness Disclosure", date: "2026-03-18", daysLeft: 19, status: "in-progress", type: "court" },
  { id: 4, clientId: 2, title: "Insurance Demand Letter", date: "2026-03-25", daysLeft: 26, status: "pending", type: "internal" },
  { id: 5, clientId: 4, title: "Settlement Agreement Review", date: "2026-03-28", daysLeft: 29, status: "in-progress", type: "internal" },
  { id: 6, clientId: 1, title: "Deposition Scheduling", date: "2026-04-05", daysLeft: 37, status: "pending", type: "court" },
];

const DOCUMENTS = [
  { id: 1, clientId: 1, name: "Police_Report_Williams.pdf", type: "Evidence", size: "1.2 MB", uploaded: "2026-02-10", status: "analyzed", userUploaded: false, extractedText: null, summary: "Report confirms at-fault driver ran red light at intersection of 5th & Main. Witness statements corroborate client's account. Blood alcohol level of 0.09% noted for defendant — strengthens negligence claim under state tort law." },
  { id: 2, clientId: 3, name: "Medical_Records_Carter.pdf", type: "Medical", size: "4.8 MB", uploaded: "2026-02-18", status: "analyzed", userUploaded: false, extractedText: null, summary: "Records indicate misdiagnosis of appendicitis resulting in delayed treatment. Standard of care breach identifiable under JCAHO guidelines. Recommend retaining board-certified surgical expert witness for testimony." },
  { id: 3, clientId: 5, name: "Accident_Reconstruction_Kim.pdf", type: "Expert Report", size: "2.1 MB", uploaded: "2026-02-24", status: "pending", userUploaded: false, extractedText: null, summary: null },
  { id: 4, clientId: 2, name: "Incident_Report_Nair.pdf", type: "Evidence", size: "890 KB", uploaded: "2026-02-20", status: "analyzed", userUploaded: false, extractedText: null, summary: "Store's internal incident report confirms wet floor without warning signage. Report was filed 3 days post-incident, suggesting possible concealment. Preserves spoliation argument under Fed. R. Civ. P. 37." },
];

const STAGE_COLORS = {
  "Intake": "#6366f1", "Discovery": "#f59e0b", "Filing": "#ef4444",
  "Negotiation": "#8b5cf6", "Litigation": "#ef4444", "Settlement": "#22c55e", "Closed": "#4a5568",
};

export default function SwanPITracker() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);
  const [aiChat, setAiChat] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState(DOCUMENTS);
  const [analyzing, setAnalyzing] = useState(null);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [deadlines, setDeadlines] = useState(DEADLINES);
  const [clients, setClients] = useState(CLIENTS);
  const [newDeadline, setNewDeadline] = useState({ title: "", date: "", clientId: 1, type: "court" });
  const [newClient, setNewClient] = useState({ name: "", type: "Auto Accident", attorney: "" });
  const [uploadClientId, setUploadClientId] = useState(1);
  const [activeDocContext, setActiveDocContext] = useState(null);
  const [extractingId, setExtractingId] = useState(null);
  const fileInputRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiChat]);

  const urgentCount = deadlines.filter(d => d.daysLeft <= 7).length;
  const activeCount = clients.filter(c => c.status === "active").length;
  const pendingDocs = uploadedDocs.filter(d => d.status === "pending").length;
  const totalValue = clients.filter(c => c.status !== "closed" && c.value !== "TBD").reduce((sum, c) => sum + parseInt(c.value.replace(/[$,]/g, "")), 0);

  const filteredDeadlines = selectedClient ? deadlines.filter(d => d.clientId === selectedClient) : deadlines;
  const filteredDocs = selectedClient ? uploadedDocs.filter(d => d.clientId === selectedClient) : uploadedDocs;

  // ── Text Extraction ─────────────────────────────────────────
  async function extractTextFromFile(file) {
    try {
      if (file.type === "text/plain") {
        return await file.text();
      }
      // DOCX
      if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }
      // PDF
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(" ");
          fullText += `\n[Page ${i}]\n${pageText}`;
        }
        return fullText.trim();
      }
      return null;
    } catch (err) {
      console.error("Text extraction failed:", err);
      return null;
    }
  }

  // ── File Upload ──────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const tempId = Date.now();
    setExtractingId(tempId);
    const extractedText = await extractTextFromFile(file);
    setUploadedDocs(prev => [...prev, {
      id: tempId,
      clientId: uploadClientId,
      name: file.name,
      type: "Uploaded Document",
      size: `${(file.size / 1024).toFixed(0)} KB`,
      uploaded: new Date().toISOString().split("T")[0],
      status: "pending",
      userUploaded: true,
      extractedText: extractedText || null,
      summary: null
    }]);
    setExtractingId(null);
    e.target.value = "";
  }

  // ── AI Document Analysis ─────────────────────────────────────
  async function analyzeDocument(docId) {
    setAnalyzing(docId);
    const doc = uploadedDocs.find(d => d.id === docId);
    const client = clients.find(c => c.id === doc.clientId);

    const textSection = doc.extractedText
      ? `\n\nDOCUMENT CONTENTS (extracted text):\n${doc.extractedText.slice(0, 4000)}`
      : "";

    const prompt = doc.extractedText
      ? `You are a PI legal AI. Analyze this document for a plaintiff personal injury case. Based on the actual document contents below, provide a 3-5 sentence analysis covering: key facts found, legal significance, liability indicators, and recommended next steps. Case: ${client?.name} - ${client?.type}. Document: "${doc.name}"${textSection}`
      : `You are a PI legal AI. Analyze this document for a plaintiff personal injury case. Provide 3-4 sentences covering: key facts, legal significance, liability indicators, and recommended next steps. Document: "${doc.name}", Type: "${doc.type}", Case: ${client?.name} - ${client?.type}.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      setUploadedDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "analyzed", summary: data.content?.[0]?.text || "Analysis complete." } : d));
    } catch {
      setUploadedDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "analyzed", summary: "Analysis failed. Please retry." } : d));
    }
    setAnalyzing(null);
  }

  // ── Open Document in AI Chat ─────────────────────────────────
  function openDocInChat(doc) {
    const client = clients.find(c => c.id === doc.clientId);
    setActiveDocContext(doc);
    const hasText = !!doc.extractedText;
    setAiChat([{
      role: "assistant",
      content: `I've ${hasText ? "read" : "reviewed"} **${doc.name}** for ${client?.name}.\n\n${doc.summary}\n\n${hasText ? "I have the full document text loaded and can answer specific questions about its contents, clauses, what fields to fill in, legal implications, or anything else you need." : "Ask me anything about this document and I'll help."}`
    }]);
    setActiveTab("ai-assistant");
  }

  // ── AI Chat ──────────────────────────────────────────────────
  async function sendAiMessage() {
    if (!aiInput.trim()) return;
    const userMsg = aiInput.trim();
    setAiInput("");
    setAiChat(prev => [...prev, { role: "user", content: userMsg }]);
    setAiLoading(true);

    const docContext = activeDocContext
      ? `\n\nThe user is querying a specific document: "${activeDocContext.name}" for client ${clients.find(c => c.id === activeDocContext.clientId)?.name}.${
          activeDocContext.extractedText
            ? `\n\nFULL DOCUMENT CONTENTS:\n${activeDocContext.extractedText.slice(0, 4000)}\n\nAnswer questions about this document specifically — explain clauses, what fields mean, what to fill in, legal implications, red flags, and how it affects the case. Reference specific sections from the document text.`
            : `\nAI summary of this document: ${activeDocContext.summary}`
        }`
      : "";

    const context = `You are an AI legal assistant for a plaintiff personal injury law firm powered by Swan. Swan's mission is to make legal help accessible to the 92% of low-income households who can't afford it.

Active PI cases: ${clients.filter(c => c.status === "active").map(c => `${c.name} (${c.type}, ${c.stage} stage, est. value ${c.value})`).join("; ")}.
Urgent deadlines: ${deadlines.filter(d => d.daysLeft <= 14).map(d => `${d.title} in ${d.daysLeft} days for ${clients.find(c => c.id === d.clientId)?.name}`).join("; ")}.
Specialties: auto accidents, slip & fall, medical malpractice, workplace injuries, truck accidents. Be direct, actionable, and reference specific tort laws, statutes, and case strategy.${docContext}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: context,
          messages: [...aiChat.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMsg }]
        })
      });
      const data = await res.json();
      setAiChat(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "Unable to get response." }]);
    } catch {
      setAiChat(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setAiLoading(false);
  }

  // ── Deadline / Client Add ────────────────────────────────────
  function addDeadline() {
    if (!newDeadline.title || !newDeadline.date) return;
    const daysLeft = Math.ceil((new Date(newDeadline.date) - new Date()) / (1000 * 60 * 60 * 24));
    setDeadlines(prev => [...prev, { ...newDeadline, id: Date.now(), status: "pending", daysLeft }]);
    setNewDeadline({ title: "", date: "", clientId: 1, type: "court" });
    setShowAddDeadline(false);
  }

  function addClient() {
    if (!newClient.name) return;
    setClients(prev => [...prev, {
      ...newClient, id: Date.now(), status: "active", stage: "Intake",
      intake: new Date().toISOString().split("T")[0], value: "TBD"
    }]);
    setNewClient({ name: "", type: "Auto Accident", attorney: "" });
    setShowAddClient(false);
  }

  // ── Markdown Renderer ────────────────────────────────────────
  function renderMarkdown(text) {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: "#c8a96e", marginTop: 14, marginBottom: 4 }}>{line.replace('### ', '')}</div>;
      if (line.startsWith('## ')) return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", marginTop: 18, marginBottom: 6, borderBottom: "1px solid #1e2330", paddingBottom: 4 }}>{line.replace('## ', '')}</div>;
      if (line.startsWith('# ')) return <div key={i} style={{ fontWeight: 800, fontSize: 16, color: "#e2e8f0", marginTop: 20, marginBottom: 8 }}>{line.replace('# ', '')}</div>;
      if (line.startsWith('- ')) {
        const content = line.replace(/^- \*\*(.*?)\*\*/, '$1').replace(/^- /, '');
        return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: "#c8a96e", flexShrink: 0 }}>·</span><span>{content.replace(/\*\*(.*?)\*\*/g, '$1')}</span></div>;
      }
      if (line.startsWith('---')) return <div key={i} style={{ borderBottom: "1px solid #1e2330", margin: "12px 0" }} />;
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <div key={i} style={{ marginBottom: 4 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: "#e2e8f0" }}>{p}</strong> : p)}</div>;
      }
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <div key={i} style={{ marginBottom: 4, color: "#cbd5e0", lineHeight: 1.6 }}>{line}</div>;
    });
  }

  const tabs = ["dashboard", "cases", "deadlines", "documents", "ai-assistant"];
  const tabLabels = { dashboard: "Dashboard", cases: "Cases", deadlines: "Deadlines", documents: "Documents", "ai-assistant": "AI Assistant" };
  const tabIcons = { dashboard: "◈", cases: "◉", deadlines: "◷", documents: "◻", "ai-assistant": "✦" };

  return (
    <div style={{ fontFamily: FONT, background: "#0a0c10", minHeight: "100vh", color: "#e2e8f0" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0c10; } ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 2px; }
        .tab-btn { background: none; border: none; border-bottom: 1px solid transparent; cursor: pointer; color: #4a5568; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.08em; padding: 12px 18px; transition: all 0.2s; text-transform: uppercase; font-weight: 600; }
        .tab-btn.active { color: #c8a96e; border-bottom: 1px solid #c8a96e; }
        .tab-btn:hover { color: #94a3b8; }
        .card { background: #111318; border: 1px solid #1e2330; border-radius: 8px; padding: 20px; }
        .tag { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; font-family: Arial, sans-serif; }
        .btn { background: #c8a96e; color: #0a0c10; border: none; border-radius: 4px; padding: 9px 18px; font-family: Arial, sans-serif; font-size: 12px; cursor: pointer; font-weight: 700; transition: all 0.2s; white-space: nowrap; }
        .btn:hover { background: #d4b97e; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline { background: transparent; color: #c8a96e; border: 1px solid #c8a96e; border-radius: 4px; padding: 7px 16px; font-family: Arial, sans-serif; font-size: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-outline:hover { background: rgba(200,169,110,0.08); }
        .btn-ghost { background: transparent; color: #64748b; border: 1px solid #1e2330; border-radius: 4px; padding: 7px 14px; font-family: Arial, sans-serif; font-size: 11px; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: #2a3040; color: #94a3b8; }
        input, select, textarea { background: #0d0f15; border: 1px solid #1e2330; border-radius: 4px; color: #e2e8f0; font-family: Arial, sans-serif; font-size: 12px; padding: 9px 12px; width: 100%; outline: none; transition: border 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: rgba(200,169,110,0.35); }
        select option { background: #111318; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px; }
        .row { display: flex; align-items: center; gap: 12px; }
        .case-row { padding: 16px; border: 1px solid #1e2330; border-radius: 6px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px; background: #0d0f15; }
        .case-row:hover, .case-row.selected { border-color: rgba(200,169,110,0.3); background: #111318; }
        .deadline-row { padding: 14px 16px; border-left: 3px solid; border-radius: 0 6px 6px 0; background: #0d0f15; margin-bottom: 8px; transition: background 0.2s; }
        .deadline-row:hover { background: #111318; }
        .doc-row { padding: 14px 16px; border: 1px solid #1e2330; border-radius: 6px; margin-bottom: 10px; background: #0d0f15; }
        .chat-bubble-user { background: #1a2035; border-radius: 8px 8px 2px 8px; padding: 10px 14px; max-width: 75%; margin-left: auto; font-size: 12px; line-height: 1.6; font-family: Arial, sans-serif; }
        .chat-bubble-ai { background: #111318; border: 1px solid #1e2330; border-radius: 8px 8px 8px 2px; padding: 12px 16px; max-width: 88%; font-size: 12px; line-height: 1.6; color: #cbd5e0; font-family: Arial, sans-serif; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .shimmer { background: linear-gradient(90deg, #1e2330 25%, #252b3b 50%, #1e2330 75%); background-size: 200%; animation: shimmer 1.5s infinite; border-radius: 4px; height: 12px; }
        @keyframes shimmer { 0% { background-position: 200%; } 100% { background-position: -200%; } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal { background: #111318; border: 1px solid #2a3040; border-radius: 10px; padding: 28px; width: 440px; }
        .doc-context-banner { background: rgba(200,169,110,0.07); border: 1px solid rgba(200,169,110,0.2); border-radius: 6px; padding: 10px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2330", padding: "0 60px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
        <div className="row" style={{ gap: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "0.06em", color: "#c8a96e" }}>SWANS</div>
          <div style={{ width: 1, height: 18, background: "#2a3040" }} />
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em" }}>PI CASE MANAGER</div>
          <div style={{ width: 1, height: 18, background: "#2a3040" }} />
          <div style={{ fontSize: 10, color: "#2a3040", letterSpacing: "0.1em" }}>BRUTE FORCE INNOVATION INTO LAW</div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {urgentCount > 0 && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, padding: "5px 12px", fontSize: 11, color: "#ef4444", fontWeight: 700, letterSpacing: "0.06em" }}>
              ⚠ {urgentCount} URGENT DEADLINE{urgentCount > 1 ? "S" : ""}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#374151" }}>FEB 28, 2026</div>
        </div>
      </div>

      {/* Mission bar */}
      <div style={{ background: "#0d0f15", borderBottom: "1px solid #161a24", padding: "7px 60px" }}>
        <div style={{ fontSize: 10, color: "#2d3748", letterSpacing: "0.08em" }}>
          MISSION: 92% of low-income households can't afford legal help — Swan equips PI firms with AI to change that
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e2330", padding: "0 60px", display: "flex" }}>
        {tabs.map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {tabIcons[t]} {tabLabels[t]}
            {t === "ai-assistant" && activeDocContext && (
              <span style={{ marginLeft: 6, background: "rgba(200,169,110,0.2)", color: "#c8a96e", borderRadius: 3, padding: "1px 5px", fontSize: 9 }}>DOC</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "36px 60px", maxWidth: 1400, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Case Overview</div>
              <div style={{ fontSize: 12, color: "#4a5568" }}>Plaintiff personal injury — all active matters</div>
            </div>
            <div className="grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: "Active Cases", val: activeCount, sub: `${clients.length} total clients`, color: "#c8a96e" },
                { label: "Urgent Deadlines", val: urgentCount, sub: "Due within 7 days", color: "#ef4444" },
                { label: "Pipeline Value", val: `$${(totalValue / 1000).toFixed(0)}K`, sub: "Estimated settlements", color: "#22c55e" },
                { label: "Docs to Review", val: pendingDocs, sub: "Awaiting AI analysis", color: "#8b5cf6" },
              ].map(s => (
                <div key={s.label} className="card" style={{ borderColor: s.color + "22" }}>
                  <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1, margin: "8px 0 4px" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#4a5568" }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="card">
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Urgent Deadlines</div>
                {[...deadlines].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5).map(d => {
                  const client = clients.find(c => c.id === d.clientId);
                  const color = d.daysLeft <= 7 ? "#ef4444" : d.daysLeft <= 21 ? "#f59e0b" : "#22c55e";
                  return (
                    <div key={d.id} className="deadline-row" style={{ borderLeftColor: color }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{d.title}</div>
                          <div style={{ fontSize: 11, color: "#4a5568" }}>{client?.name} · {d.type}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{d.daysLeft}d</div>
                          <div style={{ fontSize: 9, color: "#4a5568" }}>{d.date}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="btn-outline" style={{ width: "100%", marginTop: 10 }} onClick={() => setActiveTab("deadlines")}>View All →</button>
              </div>
              <div className="card">
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Case Pipeline</div>
                {clients.filter(c => c.status !== "closed").map(c => (
                  <div key={c.id} className="row" style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e2330" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#4a5568" }}>{c.type} · {c.attorney}</div>
                    </div>
                    <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                      <span className="tag" style={{ background: (STAGE_COLORS[c.stage] || "#4a5568") + "22", color: STAGE_COLORS[c.stage] || "#94a3b8" }}>{c.stage}</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Recent Document Analysis</div>
              <div className="grid-2">
                {uploadedDocs.filter(d => d.status === "analyzed").slice(0, 2).map(doc => {
                  const client = clients.find(c => c.id === doc.clientId);
                  return (
                    <div key={doc.id} style={{ padding: 14, background: "#0d0f15", border: "1px solid #1e2330", borderRadius: 6 }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontSize: 12, color: "#c8a96e", fontWeight: 600 }}>◻ {doc.name}</div>
                        <span className="tag" style={{ background: "#22c55e22", color: "#22c55e", flexShrink: 0 }}>analyzed</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#4a5568", marginBottom: 8 }}>{client?.name} · {doc.type}</div>
                      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{doc.summary?.slice(0, 130)}...</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CASES */}
        {activeTab === "cases" && (
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Cases</div>
                <div style={{ fontSize: 12, color: "#4a5568" }}>{clients.length} total · {activeCount} active</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                {selectedClient && <button className="btn-ghost" onClick={() => setSelectedClient(null)}>✕ Clear</button>}
                <button className="btn" onClick={() => setShowAddClient(true)}>+ New Case</button>
              </div>
            </div>
            {clients.map(c => (
              <div key={c.id} className={`case-row ${selectedClient === c.id ? "selected" : ""}`} onClick={() => setSelectedClient(selectedClient === c.id ? null : c.id)}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="row" style={{ marginBottom: 6, gap: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{c.name}</div>
                      <span className="tag" style={{ background: (STAGE_COLORS[c.stage] || "#4a5568") + "22", color: STAGE_COLORS[c.stage] || "#94a3b8" }}>{c.stage}</span>
                      <span className="tag" style={{ background: "#1e2330", color: "#64748b" }}>{c.type}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#4a5568" }}>Attorney: {c.attorney} · Intake: {c.intake} · Est. Value: <span style={{ color: "#22c55e", fontWeight: 600 }}>{c.value}</span></div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: "#4a5568" }}>{deadlines.filter(d => d.clientId === c.id).length} deadline(s)</div>
                    <div style={{ fontSize: 11, color: "#4a5568" }}>{uploadedDocs.filter(d => d.clientId === c.id).length} doc(s)</div>
                  </div>
                </div>
              </div>
            ))}
            {selectedClient && (
              <div className="grid-2" style={{ marginTop: 16 }}>
                <div className="card">
                  <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Case Deadlines</div>
                  {filteredDeadlines.length === 0
                    ? <div style={{ fontSize: 12, color: "#4a5568" }}>No deadlines.</div>
                    : filteredDeadlines.map(d => {
                      const color = d.daysLeft <= 7 ? "#ef4444" : d.daysLeft <= 21 ? "#f59e0b" : "#22c55e";
                      return (
                        <div key={d.id} className="deadline-row" style={{ borderLeftColor: color }}>
                          <div className="row" style={{ justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{d.title}</div>
                              <div style={{ fontSize: 10, color: "#4a5568", marginTop: 2 }}>{d.date} · {d.type}</div>
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color, flexShrink: 0, marginLeft: 12 }}>{d.daysLeft}d</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="card">
                  <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Case Documents</div>
                  {filteredDocs.length === 0
                    ? <div style={{ fontSize: 12, color: "#4a5568" }}>No documents.</div>
                    : filteredDocs.map(doc => (
                      <div key={doc.id} style={{ padding: "10px 0", borderBottom: "1px solid #1e2330" }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <div style={{ fontSize: 12, color: "#c8a96e" }}>◻ {doc.name}</div>
                          <span className="tag" style={{ background: doc.status === "analyzed" ? "#22c55e22" : "#f59e0b22", color: doc.status === "analyzed" ? "#22c55e" : "#f59e0b", flexShrink: 0 }}>{doc.status}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#4a5568", marginTop: 3 }}>{doc.type} · {doc.size}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEADLINES */}
        {activeTab === "deadlines" && (
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Deadlines</div>
                <div style={{ fontSize: 12, color: "#4a5568" }}>{deadlines.length} tracked obligations</div>
              </div>
              <button className="btn" onClick={() => setShowAddDeadline(true)}>+ Add Deadline</button>
            </div>
            {[
              { label: "🔴 CRITICAL — Due within 7 days", filter: d => d.daysLeft <= 7, color: "#ef4444" },
              { label: "🟡 HIGH — Due within 3 weeks", filter: d => d.daysLeft > 7 && d.daysLeft <= 21, color: "#f59e0b" },
              { label: "🟢 UPCOMING — Due within 5 weeks", filter: d => d.daysLeft > 21 && d.daysLeft <= 35, color: "#22c55e" },
              { label: "⚪ LATER — Due beyond 5 weeks", filter: d => d.daysLeft > 35, color: "#4a5568" },
            ].map((group, gi) => {
              const items = deadlines.filter(group.filter);
              if (!items.length) return null;
              return (
                <div key={gi} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 10, color: group.color, letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase", fontWeight: 600 }}>{group.label}</div>
                  {items.map(d => {
                    const client = clients.find(c => c.id === d.clientId);
                    return (
                      <div key={d.id} className="deadline-row" style={{ borderLeftColor: group.color }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{d.title}</div>
                            <div className="row" style={{ gap: 8 }}>
                              <span style={{ fontSize: 11, color: "#4a5568" }}>{client?.name}</span>
                              <span className="tag" style={{ background: "#1e2330", color: "#64748b" }}>{d.status}</span>
                              <span className="tag" style={{ background: d.type === "court" ? "#ef444422" : "#6366f122", color: d.type === "court" ? "#ef4444" : "#818cf8" }}>{d.type}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: group.color, lineHeight: 1 }}>{d.daysLeft}</div>
                            <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase" }}>days left</div>
                            <div style={{ fontSize: 10, color: "#374151" }}>{d.date}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Document Analysis</div>
                <div style={{ fontSize: 12, color: "#4a5568" }}>Upload PDFs or DOCX — AI reads and analyzes the actual content · {uploadedDocs.length} documents</div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <select value={uploadClientId} onChange={e => setUploadClientId(+e.target.value)} style={{ width: 200 }}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.txt" style={{ display: "none" }} />
                <button className="btn" onClick={() => fileInputRef.current.click()} disabled={extractingId !== null}>
                  {extractingId !== null ? "Reading..." : "↑ Upload Document"}
                </button>
              </div>
            </div>

            {pendingDocs > 0 && (
              <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 11, color: "#f59e0b" }}>
                ⚠ {pendingDocs} document{pendingDocs > 1 ? "s" : ""} awaiting AI analysis
              </div>
            )}

            {uploadedDocs.map(doc => {
              const client = clients.find(c => c.id === doc.clientId);
              const isAnalyzing = analyzing === doc.id;
              const hasText = !!doc.extractedText;
              return (
                <div key={doc.id} className="doc-row">
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: doc.summary ? 12 : 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 10, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, color: "#c8a96e", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>◻ {doc.name}</div>
                        <span className="tag" style={{ background: doc.status === "analyzed" ? "#22c55e22" : "#f59e0b22", color: doc.status === "analyzed" ? "#22c55e" : "#f59e0b", flexShrink: 0 }}>
                          {doc.status === "analyzed" ? "✓ Analyzed" : "Pending"}
                        </span>
                        {hasText && (
                          <span className="tag" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", flexShrink: 0 }}>
                            ✓ Text extracted
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#4a5568" }}>{doc.type} · {doc.size} · {client?.name} · {doc.uploaded}</div>
                    </div>
                    <div className="row" style={{ gap: 8, flexShrink: 0, marginLeft: 12 }}>
                      {doc.status === "pending" && doc.userUploaded && (
                        <button className="btn" disabled={isAnalyzing} onClick={() => analyzeDocument(doc.id)}>
                          {isAnalyzing ? "Analyzing..." : "✦ AI Analyze"}
                        </button>
                      )}
                      {doc.status === "analyzed" && (
                        <button className="btn-outline" style={{ fontSize: 11, padding: "6px 12px" }} onClick={() => openDocInChat(doc)}>
                          ✦ Ask AI →
                        </button>
                      )}
                    </div>
                  </div>
                  {isAnalyzing && (
                    <div style={{ marginTop: 10 }}>
                      <div className="shimmer" style={{ marginBottom: 6 }} />
                      <div className="shimmer" style={{ width: "80%", marginBottom: 6 }} />
                      <div className="shimmer" style={{ width: "60%" }} />
                    </div>
                  )}
                  {doc.summary && !isAnalyzing && (
                    <div style={{ background: "#0d0f15", border: "1px solid #1e2330", borderRadius: 4, padding: "12px 16px", fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                      <div style={{ color: "#c8a96e", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>✦ AI CASE ANALYSIS {hasText ? "· based on actual document contents" : ""}</div>
                      {renderMarkdown(doc.summary)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI ASSISTANT */}
        {activeTab === "ai-assistant" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>AI Legal Assistant</div>
              <div style={{ fontSize: 12, color: "#4a5568" }}>Case-aware PI law intelligence · powered by Claude</div>
            </div>

            {/* Active document context banner */}
            {activeDocContext && (
              <div className="doc-context-banner">
                <div style={{ fontSize: 11, color: "#c8a96e" }}>
                  ✦ Querying document: <strong>{activeDocContext.name}</strong>
                  <span style={{ color: "#4a5568", marginLeft: 8 }}>· {clients.find(c => c.id === activeDocContext.clientId)?.name}</span>
                  {activeDocContext.extractedText && <span style={{ color: "#818cf8", marginLeft: 8 }}>· full text loaded</span>}
                </div>
                <button className="btn-ghost" style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => { setActiveDocContext(null); setAiChat([]); }}>
                  ✕ Exit doc mode
                </button>
              </div>
            )}

            {/* Suggested prompts — change based on doc context */}
            {aiChat.length === 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
                  {activeDocContext ? "Suggested Document Questions" : "Suggested Queries"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(activeDocContext ? [
                    "What does this document mean for our case?",
                    "Are there any red flags or clauses I should worry about?",
                    "What fields do I need to fill in?",
                    "Summarize this in plain English",
                    "What are my client's obligations under this?",
                    "Is this favorable or unfavorable to our client?",
                  ] : [
                    "What's the statute of limitations for auto accidents?",
                    "How do I maximize a soft tissue injury settlement?",
                    "Expert witnesses needed for medical malpractice?",
                    "Best strategies for truck accident cases",
                    "How to calculate pain and suffering damages",
                    "Strongest arguments for Marcus Williams' case",
                  ]).map(q => (
                    <button key={q} onClick={() => setAiInput(q)}
                      style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 4, padding: "8px 14px", fontSize: 11, color: "#64748b", cursor: "pointer", fontFamily: FONT, transition: "all 0.2s", fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(200,169,110,0.3)"; e.currentTarget.style.color = "#c8a96e"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2330"; e.currentTarget.style.color = "#64748b"; }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="card" style={{ minHeight: 400, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, overflowY: "auto", maxHeight: 460, paddingBottom: 16 }}>
                {aiChat.length === 0 && (
                  <div style={{ textAlign: "center", padding: "56px 20px" }}>
                    <div style={{ fontSize: 24, marginBottom: 16, color: "#c8a96e" }}>✦</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>Your PI Law AI Assistant</div>
                    <div style={{ fontSize: 12, color: "#4a5568", lineHeight: 1.8 }}>
                      {activeDocContext
                        ? `Ready to answer questions about ${activeDocContext.name}. Ask anything about its contents, clauses, or legal implications.`
                        : "Ask about case strategy, settlements, statutes of limitations, expert witnesses, or any of your active cases."}
                    </div>
                  </div>
                )}
                {aiChat.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    {msg.role === "user"
                      ? <div className="chat-bubble-user">{msg.content}</div>
                      : (
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 26, height: 26, background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#c8a96e", flexShrink: 0, fontWeight: 700 }}>✦</div>
                          <div className="chat-bubble-ai">{renderMarkdown(msg.content)}</div>
                        </div>
                      )}
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div className="pulse" style={{ width: 26, height: 26, background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#c8a96e", flexShrink: 0 }}>✦</div>
                    <div className="chat-bubble-ai" style={{ minWidth: 200 }}>
                      <div className="shimmer" style={{ width: 240, marginBottom: 6 }} />
                      <div className="shimmer" style={{ width: 180, marginBottom: 6 }} />
                      <div className="shimmer" style={{ width: 120 }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ borderTop: "1px solid #1e2330", paddingTop: 16, display: "flex", gap: 10 }}>
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder={activeDocContext ? `Ask about ${activeDocContext.name}...` : "Ask about case strategy, settlements, statutes, damages..."}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
                  style={{ flex: 1 }}
                />
                <button className="btn" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>Send</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Deadline Modal */}
      {showAddDeadline && (
        <div className="modal-overlay" onClick={() => setShowAddDeadline(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, color: "#e2e8f0" }}>Add Case Deadline</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Title</div>
                <input value={newDeadline.title} onChange={e => setNewDeadline(p => ({ ...p, title: e.target.value }))} placeholder="e.g. File Complaint with Court" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Client</div>
                <select value={newDeadline.clientId} onChange={e => setNewDeadline(p => ({ ...p, clientId: +e.target.value }))}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div>
                  <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Due Date</div>
                  <input type="date" value={newDeadline.date} onChange={e => setNewDeadline(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Type</div>
                  <select value={newDeadline.type} onChange={e => setNewDeadline(p => ({ ...p, type: e.target.value }))}>
                    <option value="court">Court</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <button className="btn-ghost" onClick={() => setShowAddDeadline(false)}>Cancel</button>
              <button className="btn" onClick={addDeadline}>Add Deadline</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="modal-overlay" onClick={() => setShowAddClient(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, color: "#e2e8f0" }}>New Case Intake</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Client Name</div>
                <input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="e.g. John Smith" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Case Type</div>
                <select value={newClient.type} onChange={e => setNewClient(p => ({ ...p, type: e.target.value }))}>
                  {["Auto Accident", "Slip & Fall", "Medical Malpractice", "Workplace Injury", "Truck Accident", "Product Liability"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Assigned Attorney</div>
                <input value={newClient.attorney} onChange={e => setNewClient(p => ({ ...p, attorney: e.target.value }))} placeholder="e.g. J. Rodriguez" />
              </div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <button className="btn-ghost" onClick={() => setShowAddClient(false)}>Cancel</button>
              <button className="btn" onClick={addClient}>Add Case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}