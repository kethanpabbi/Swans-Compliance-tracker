import { useState, useEffect, useRef } from "react";

const FONT = "Arial, sans-serif";

// ── Light Theme Tokens ───────────────────────────────────────
const C = {
  bg:        "#f4f6f9",   // page background
  surface:   "#ffffff",   // cards, header, tabs
  surface2:  "#f0f2f5",   // row backgrounds, inputs
  border:    "#e2e6ed",   // borders
  border2:   "#d0d5de",   // stronger borders
  text:      "#1a2030",   // primary text
  text2:     "#475569",   // secondary text
  muted:     "#94a3b8",   // placeholder / labels
  gold:      "#b8860b",   // primary accent (darker gold for light bg)
  goldLight: "rgba(184,134,11,0.1)",
  goldBorder:"rgba(184,134,11,0.25)",
};

const STAGE_COLORS = {
  "Intake": "#6366f1", "Discovery": "#d97706", "Filing": "#ef4444",
  "Negotiation": "#8b5cf6", "Litigation": "#ef4444", "Settlement": "#16a34a", "Closed": "#94a3b8",
};

const CLIENTS = [
  { id: 1, name: "Marcus T. Williams", type: "Auto Accident",      status: "active",     stage: "Discovery",   intake: "2026-01-12", value: "$85,000",  attorney: "J. Rodriguez" },
  { id: 2, name: "Priya Nair",         type: "Slip & Fall",        status: "active",     stage: "Negotiation", intake: "2025-11-03", value: "$42,000",  attorney: "S. Chen" },
  { id: 3, name: "DeShawn Carter",     type: "Medical Malpractice",status: "active",     stage: "Filing",      intake: "2026-02-01", value: "$220,000", attorney: "J. Rodriguez" },
  { id: 4, name: "Elena Vasquez",      type: "Workplace Injury",   status: "settlement", stage: "Settlement",  intake: "2025-09-18", value: "$67,500",  attorney: "S. Chen" },
  { id: 5, name: "Robert Kim",         type: "Truck Accident",     status: "active",     stage: "Litigation",  intake: "2025-12-22", value: "$310,000", attorney: "M. Patel" },
  { id: 6, name: "Latasha Brown",      type: "Auto Accident",      status: "closed",     stage: "Closed",      intake: "2025-07-04", value: "$28,000",  attorney: "S. Chen" },
];

const DEADLINES = [
  { id: 1, clientId: 3, title: "Complaint Filing Deadline",  date: "2026-03-02", daysLeft: 3,  status: "pending",     type: "court" },
  { id: 2, clientId: 1, title: "Discovery Response Due",     date: "2026-03-10", daysLeft: 11, status: "pending",     type: "court" },
  { id: 3, clientId: 5, title: "Expert Witness Disclosure",  date: "2026-03-18", daysLeft: 19, status: "in-progress", type: "court" },
  { id: 4, clientId: 2, title: "Insurance Demand Letter",    date: "2026-03-25", daysLeft: 26, status: "pending",     type: "internal" },
  { id: 5, clientId: 4, title: "Settlement Agreement Review",date: "2026-03-28", daysLeft: 29, status: "in-progress", type: "internal" },
  { id: 6, clientId: 1, title: "Deposition Scheduling",      date: "2026-04-05", daysLeft: 37, status: "pending",     type: "court" },
];

const DOCUMENTS = [
  { id: 1, clientId: 1, name: "Police_Report_Williams.pdf",      type: "Evidence",      size: "1.2 MB", uploaded: "2026-02-10", status: "analyzed", userUploaded: false, extractedText: null, summary: "Report confirms at-fault driver ran red light at intersection of 5th & Main. Witness statements corroborate client's account. Blood alcohol level of 0.09% noted for defendant — strengthens negligence claim under state tort law." },
  { id: 2, clientId: 3, name: "Medical_Records_Carter.pdf",      type: "Medical",       size: "4.8 MB", uploaded: "2026-02-18", status: "analyzed", userUploaded: false, extractedText: null, summary: "Records indicate misdiagnosis of appendicitis resulting in delayed treatment. Standard of care breach identifiable under JCAHO guidelines. Recommend retaining board-certified surgical expert witness for testimony." },
  { id: 3, clientId: 5, name: "Accident_Reconstruction_Kim.pdf", type: "Expert Report", size: "2.1 MB", uploaded: "2026-02-24", status: "pending",  userUploaded: false, extractedText: null, summary: null },
  { id: 4, clientId: 2, name: "Incident_Report_Nair.pdf",        type: "Evidence",      size: "890 KB", uploaded: "2026-02-20", status: "analyzed", userUploaded: false, extractedText: null, summary: "Store's internal incident report confirms wet floor without warning signage. Report was filed 3 days post-incident, suggesting possible concealment. Preserves spoliation argument under Fed. R. Civ. P. 37." },
];

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
  const [newClient, setNewClient] = useState({ name: "", type: "Auto Accident", attorney: "", value: "" });
  const [uploadClientId, setUploadClientId] = useState(1);
  const [activeDocContext, setActiveDocContext] = useState(null);
  const [extractingId, setExtractingId] = useState(null);
  const fileInputRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiChat]);

  const urgentCount  = deadlines.filter(d => d.daysLeft <= 7).length;
  const activeCount  = clients.filter(c => c.status === "active").length;
  const pendingDocs  = uploadedDocs.filter(d => d.status === "pending").length;
  const totalValue   = clients.filter(c => c.status !== "closed" && c.value !== "TBD").reduce((s, c) => s + parseInt(c.value.replace(/[$,]/g, "")), 0);
  const filteredDeadlines = selectedClient ? deadlines.filter(d => d.clientId === selectedClient) : deadlines;
  const filteredDocs      = selectedClient ? uploadedDocs.filter(d => d.clientId === selectedClient) : uploadedDocs;

  // ── Text Extraction ─────────────────────────────────────────
  async function extractTextFromFile(file) {
    try {
      if (file.type === "text/plain") return await file.text();
      if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += `\n[Page ${i}]\n${content.items.map(item => item.str).join(" ")}`;
        }
        return fullText.trim();
      }
      return null;
    } catch (err) { console.error("Extraction failed:", err); return null; }
  }

  // ── File Upload ──────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const tempId = Date.now();
    setExtractingId(tempId);
    const extractedText = await extractTextFromFile(file);
    setUploadedDocs(prev => [...prev, {
      id: tempId, clientId: uploadClientId, name: file.name,
      type: "Uploaded Document", size: `${(file.size / 1024).toFixed(0)} KB`,
      uploaded: new Date().toISOString().split("T")[0],
      status: "pending", userUploaded: true, extractedText: extractedText || null, summary: null
    }]);
    setExtractingId(null);
    e.target.value = "";
  }

  // ── AI Document Analysis ─────────────────────────────────────
  async function analyzeDocument(docId) {
    setAnalyzing(docId);
    const doc = uploadedDocs.find(d => d.id === docId);
    const client = clients.find(c => c.id === doc.clientId);
    const textSection = doc.extractedText ? `\n\nDOCUMENT CONTENTS:\n${doc.extractedText.slice(0, 4000)}` : "";
    const prompt = doc.extractedText
      ? `You are a PI legal AI. Analyze this document for a plaintiff personal injury case. Based on the actual document contents below, provide a 3-5 sentence analysis: key facts, legal significance, liability indicators, recommended next steps. Case: ${client?.name} - ${client?.type}. Document: "${doc.name}"${textSection}`
      : `You are a PI legal AI. Analyze this document for a plaintiff personal injury case. Provide 3-4 sentences: key facts, legal significance, liability indicators, recommended next steps. Document: "${doc.name}", Type: "${doc.type}", Case: ${client?.name} - ${client?.type}.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      setUploadedDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "analyzed", summary: data.content?.[0]?.text || "Analysis complete." } : d));
    } catch {
      setUploadedDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "analyzed", summary: "Analysis failed. Please retry." } : d));
    }
    setAnalyzing(null);
  }

  // ── Open Doc in Chat ─────────────────────────────────────────
  function openDocInChat(doc) {
    const client = clients.find(c => c.id === doc.clientId);
    setActiveDocContext(doc);
    const hasText = !!doc.extractedText;
    setAiChat([{ role: "assistant", content: `I've ${hasText ? "read" : "reviewed"} **${doc.name}** for ${client?.name}.\n\n${doc.summary}\n\n${hasText ? "I have the full document text loaded — ask me anything about its contents, clauses, what to fill in, or legal implications." : "Ask me anything about this document and I'll help."}` }]);
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
      ? `\n\nThe user is querying document: "${activeDocContext.name}" for ${clients.find(c => c.id === activeDocContext.clientId)?.name}.${activeDocContext.extractedText ? `\n\nFULL DOCUMENT:\n${activeDocContext.extractedText.slice(0, 4000)}\n\nAnswer questions about this document — explain clauses, what fields mean, what to fill in, legal implications, red flags.` : `\nSummary: ${activeDocContext.summary}`}`
      : "";
    const context = `You are an AI legal assistant for a plaintiff personal injury law firm powered by Swan. Swan's mission: make legal help accessible to the 92% who can't afford it.
Active cases: ${clients.filter(c => c.status === "active").map(c => `${c.name} (${c.type}, ${c.stage}, est. ${c.value})`).join("; ")}.
Urgent deadlines: ${deadlines.filter(d => d.daysLeft <= 14).map(d => `${d.title} in ${d.daysLeft} days for ${clients.find(c => c.id === d.clientId)?.name}`).join("; ")}.
Specialties: auto accidents, slip & fall, medical malpractice, workplace injuries, truck accidents. Be direct and actionable.${docContext}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, system: context, messages: [...aiChat.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMsg }] })
      });
      const data = await res.json();
      setAiChat(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "Unable to get response." }]);
    } catch {
      setAiChat(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setAiLoading(false);
  }

  function addDeadline() {
    if (!newDeadline.title || !newDeadline.date) return;
    const daysLeft = Math.ceil((new Date(newDeadline.date) - new Date()) / 86400000);
    setDeadlines(prev => [...prev, { ...newDeadline, id: Date.now(), status: "pending", daysLeft }]);
    setNewDeadline({ title: "", date: "", clientId: 1, type: "court" });
    setShowAddDeadline(false);
  }

  function addClient() {
    if (!newClient.name) return;
    setClients(prev => [...prev, { ...newClient, id: Date.now(), status: "active", stage: "Intake", intake: new Date().toISOString().split("T")[0], value: newClient.value ? `$${newClient.value.replace(/[$,]/g, "")}` : "TBD" }]);
    setNewClient({ name: "", type: "Auto Accident", attorney: "", value: "" });
    setShowAddClient(false);
  }

  // ── Markdown Renderer ────────────────────────────────────────
  function renderMarkdown(text) {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: C.gold, marginTop: 14, marginBottom: 4 }}>{line.replace('### ', '')}</div>;
      if (line.startsWith('## '))  return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: C.text, marginTop: 18, marginBottom: 6, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>{line.replace('## ', '')}</div>;
      if (line.startsWith('# '))   return <div key={i} style={{ fontWeight: 800, fontSize: 16, color: C.text, marginTop: 20, marginBottom: 8 }}>{line.replace('# ', '')}</div>;
      if (line.startsWith('- ')) {
        const content = line.replace(/^- \*\*(.*?)\*\*/, '$1').replace(/^- /, '');
        return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: C.gold, flexShrink: 0 }}>·</span><span style={{ color: C.text2 }}>{content.replace(/\*\*(.*?)\*\*/g, '$1')}</span></div>;
      }
      if (line.startsWith('---')) return <div key={i} style={{ borderBottom: `1px solid ${C.border}`, margin: "12px 0" }} />;
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <div key={i} style={{ marginBottom: 4, color: C.text2 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.text }}>{p}</strong> : p)}</div>;
      }
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <div key={i} style={{ marginBottom: 4, color: C.text2, lineHeight: 1.6 }}>{line}</div>;
    });
  }

  const tabs = ["dashboard", "cases", "deadlines", "documents", "ai-assistant"];
  const tabLabels = { dashboard: "Dashboard", cases: "Cases", deadlines: "Deadlines", documents: "Documents", "ai-assistant": "AI Assistant" };
  const tabIcons  = { dashboard: "◈", cases: "◉", deadlines: "◷", documents: "◻", "ai-assistant": "✦" };

  // ── Label style helper ───────────────────────────────────────
  const labelStyle = { fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 };

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 2px; }

        .tab-btn { background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: ${C.muted}; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.08em; padding: 14px 18px; transition: all 0.2s; text-transform: uppercase; font-weight: 600; }
        .tab-btn.active { color: ${C.gold}; border-bottom-color: ${C.gold}; }
        .tab-btn:hover:not(.active) { color: ${C.text2}; }

        .card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

        .tag { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 700; font-family: Arial, sans-serif; }

        .btn { background: ${C.gold}; color: #fff; border: none; border-radius: 6px; padding: 9px 18px; font-family: Arial, sans-serif; font-size: 12px; cursor: pointer; font-weight: 700; transition: all 0.2s; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .btn:hover { background: #a07708; }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-outline { background: transparent; color: ${C.gold}; border: 1.5px solid ${C.gold}; border-radius: 6px; padding: 7px 16px; font-family: Arial, sans-serif; font-size: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-outline:hover { background: ${C.goldLight}; }

        .btn-ghost { background: transparent; color: ${C.text2}; border: 1px solid ${C.border}; border-radius: 6px; padding: 7px 14px; font-family: Arial, sans-serif; font-size: 11px; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: ${C.border2}; background: ${C.surface2}; }

        input, select, textarea { background: ${C.surface2}; border: 1px solid ${C.border}; border-radius: 6px; color: ${C.text}; font-family: Arial, sans-serif; font-size: 12px; padding: 9px 12px; width: 100%; outline: none; transition: border 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: ${C.gold}; background: ${C.surface}; box-shadow: 0 0 0 3px ${C.goldLight}; }
        select option { background: ${C.surface}; }
        ::placeholder { color: ${C.muted}; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px; }
        .row { display: flex; align-items: center; gap: 12px; }

        .case-row { padding: 16px; border: 1px solid ${C.border}; border-radius: 8px; cursor: pointer; transition: all 0.15s; margin-bottom: 8px; background: ${C.surface}; }
        .case-row:hover { border-color: ${C.gold}; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
        .case-row.selected { border-color: ${C.gold}; background: #fffbf2; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

        .deadline-row { padding: 14px 16px; border-left: 3px solid; border-radius: 0 8px 8px 0; background: ${C.surface}; margin-bottom: 8px; border-top: 1px solid ${C.border}; border-right: 1px solid ${C.border}; border-bottom: 1px solid ${C.border}; transition: box-shadow 0.15s; }
        .deadline-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

        .doc-row { padding: 16px; border: 1px solid ${C.border}; border-radius: 8px; margin-bottom: 10px; background: ${C.surface}; transition: box-shadow 0.15s; }
        .doc-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

        .chat-bubble-user { background: ${C.gold}; color: #fff; border-radius: 16px 16px 4px 16px; padding: 10px 16px; max-width: 72%; margin-left: auto; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .chat-bubble-ai { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px 16px 16px 4px; padding: 12px 16px; max-width: 88%; font-size: 13px; line-height: 1.6; color: ${C.text2}; font-family: Arial, sans-serif; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        .shimmer { background: linear-gradient(90deg, ${C.border} 25%, ${C.surface2} 50%, ${C.border} 75%); background-size: 200%; animation: shimmer 1.5s infinite; border-radius: 4px; height: 12px; }
        @keyframes shimmer { 0% { background-position: 200%; } 100% { background-position: -200%; } }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15,20,40,0.4); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 12px; padding: 28px; width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }

        .section-label { font-size: 10px; color: ${C.muted}; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; margin-bottom: 14px; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 60px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="row" style={{ gap: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: "0.08em", color: C.gold }}>SWANS</div>
          <div style={{ width: 1, height: 18, background: C.border }} />
          <div style={{ fontSize: 12, color: C.text2, fontWeight: 700, letterSpacing: "0.04em" }}>PI CASE MANAGER</div>
          <div style={{ width: 1, height: 18, background: C.border }} />
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>BRUTE FORCE INNOVATION INTO LAW</div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {urgentCount > 0 && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 12px", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>
              ⚠ {urgentCount} URGENT DEADLINE{urgentCount > 1 ? "S" : ""}
            </div>
          )}
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>MAR 1, 2026</div>
        </div>
      </div>

      {/* ── Mission bar ────────────────────────────────────────── */}
      <div style={{ background: "#fffbf0", borderBottom: `1px solid #f0e4c0`, padding: "6px 60px" }}>
        <div style={{ fontSize: 10, color: "#92700a", letterSpacing: "0.07em", fontWeight: 600 }}>
          MISSION: 92% of low-income households can't afford legal help — Swan equips PI firms with AI to change that
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 60px", display: "flex" }}>
        {tabs.map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {tabIcons[t]} {tabLabels[t]}
            {t === "ai-assistant" && activeDocContext && (
              <span style={{ marginLeft: 6, background: C.goldLight, color: C.gold, borderRadius: 3, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>DOC</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div style={{ padding: "36px 60px", maxWidth: 1400, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Case Overview</div>
              <div style={{ fontSize: 12, color: C.muted }}>Plaintiff personal injury — all active matters</div>
            </div>

            <div className="grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: "Active Cases",    val: activeCount,                          sub: `${clients.length} total clients`,  color: C.gold,    bg: "#fffbf0", border: "#f0e4c0" },
                { label: "Urgent Deadlines",val: urgentCount,                          sub: "Due within 7 days",                color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                { label: "Pipeline Value",  val: `$${(totalValue/1000).toFixed(0)}K`,  sub: "Estimated settlements",            color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                { label: "Docs to Review",  val: pendingDocs,                          sub: "Awaiting AI analysis",             color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
              ].map(s => (
                <div key={s.label} className="card" style={{ borderColor: s.border, background: s.bg }}>
                  <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: s.color, lineHeight: 1, margin: "10px 0 4px" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="card">
                <div className="section-label">Urgent Deadlines</div>
                {[...deadlines].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5).map(d => {
                  const client = clients.find(c => c.id === d.clientId);
                  const color = d.daysLeft <= 7 ? "#dc2626" : d.daysLeft <= 21 ? "#d97706" : "#16a34a";
                  return (
                    <div key={d.id} className="deadline-row" style={{ borderLeftColor: color }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>{d.title}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{client?.name} · {d.type}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{d.daysLeft}d</div>
                          <div style={{ fontSize: 9, color: C.muted }}>{d.date}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="btn-outline" style={{ width: "100%", marginTop: 12 }} onClick={() => setActiveTab("deadlines")}>View All →</button>
              </div>

              <div className="card">
                <div className="section-label">Case Pipeline</div>
                {clients.filter(c => c.status !== "closed").map(c => (
                  <div key={c.id} className="row" style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{c.type} · {c.attorney}</div>
                    </div>
                    <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                      <span className="tag" style={{ background: (STAGE_COLORS[c.stage] || "#94a3b8") + "18", color: STAGE_COLORS[c.stage] || "#64748b" }}>{c.stage}</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-label">Recent Document Analysis</div>
              <div className="grid-2">
                {uploadedDocs.filter(d => d.status === "analyzed").slice(0, 2).map(doc => {
                  const client = clients.find(c => c.id === doc.clientId);
                  return (
                    <div key={doc.id} style={{ padding: 14, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>◻ {doc.name}</div>
                        <span className="tag" style={{ background: "#f0fdf4", color: "#16a34a", flexShrink: 0 }}>✓ analyzed</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{client?.name} · {doc.type}</div>
                      <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>{doc.summary?.slice(0, 130)}...</div>
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
                <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Cases</div>
                <div style={{ fontSize: 12, color: C.muted }}>{clients.length} total · {activeCount} active</div>
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{c.name}</div>
                      <span className="tag" style={{ background: (STAGE_COLORS[c.stage] || "#94a3b8") + "18", color: STAGE_COLORS[c.stage] || "#64748b" }}>{c.stage}</span>
                      <span className="tag" style={{ background: C.surface2, color: C.text2 }}>{c.type}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>Attorney: {c.attorney} · Intake: {c.intake} · Est. Value: <span style={{ color: "#16a34a", fontWeight: 700 }}>{c.value}</span></div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: C.muted }}>{deadlines.filter(d => d.clientId === c.id).length} deadline(s)</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{uploadedDocs.filter(d => d.clientId === c.id).length} doc(s)</div>
                  </div>
                </div>
              </div>
            ))}

            {selectedClient && (
              <div className="grid-2" style={{ marginTop: 16 }}>
                <div className="card">
                  <div className="section-label">Case Deadlines</div>
                  {filteredDeadlines.length === 0
                    ? <div style={{ fontSize: 12, color: C.muted }}>No deadlines.</div>
                    : filteredDeadlines.map(d => {
                      const color = d.daysLeft <= 7 ? "#dc2626" : d.daysLeft <= 21 ? "#d97706" : "#16a34a";
                      return (
                        <div key={d.id} className="deadline-row" style={{ borderLeftColor: color }}>
                          <div className="row" style={{ justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.title}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{d.date} · {d.type}</div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color, flexShrink: 0, marginLeft: 12 }}>{d.daysLeft}d</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="card">
                  <div className="section-label">Case Documents</div>
                  {filteredDocs.length === 0
                    ? <div style={{ fontSize: 12, color: C.muted }}>No documents.</div>
                    : filteredDocs.map(doc => (
                      <div key={doc.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <div style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>◻ {doc.name}</div>
                          <span className="tag" style={{ background: doc.status === "analyzed" ? "#f0fdf4" : "#fffbeb", color: doc.status === "analyzed" ? "#16a34a" : "#d97706", flexShrink: 0 }}>{doc.status}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{doc.type} · {doc.size}</div>
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
                <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Deadlines</div>
                <div style={{ fontSize: 12, color: C.muted }}>{deadlines.length} tracked obligations</div>
              </div>
              <button className="btn" onClick={() => setShowAddDeadline(true)}>+ Add Deadline</button>
            </div>

            {[
              { label: "🔴 Critical — Due within 7 days",    filter: d => d.daysLeft <= 7,                 color: "#dc2626", bg: "#fef2f2" },
              { label: "🟡 High — Due within 3 weeks",       filter: d => d.daysLeft > 7 && d.daysLeft <= 21, color: "#d97706", bg: "#fffbeb" },
              { label: "🟢 Upcoming — Due within 5 weeks",   filter: d => d.daysLeft > 21 && d.daysLeft <= 35, color: "#16a34a", bg: "#f0fdf4" },
              { label: "⚪ Later — Due beyond 5 weeks",      filter: d => d.daysLeft > 35,                 color: "#94a3b8", bg: C.surface2 },
            ].map((group, gi) => {
              const items = deadlines.filter(group.filter);
              if (!items.length) return null;
              return (
                <div key={gi} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, color: group.color, letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase", fontWeight: 700 }}>{group.label}</div>
                  {items.map(d => {
                    const client = clients.find(c => c.id === d.clientId);
                    return (
                      <div key={d.id} className="deadline-row" style={{ borderLeftColor: group.color }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>{d.title}</div>
                            <div className="row" style={{ gap: 8 }}>
                              <span style={{ fontSize: 11, color: C.muted }}>{client?.name}</span>
                              <span className="tag" style={{ background: C.surface2, color: C.text2 }}>{d.status}</span>
                              <span className="tag" style={{ background: d.type === "court" ? "#fef2f2" : "#eff6ff", color: d.type === "court" ? "#dc2626" : "#2563eb" }}>{d.type}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                            <div style={{ fontSize: 32, fontWeight: 900, color: group.color, lineHeight: 1 }}>{d.daysLeft}</div>
                            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase" }}>days left</div>
                            <div style={{ fontSize: 10, color: C.muted }}>{d.date}</div>
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
                <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Document Analysis</div>
                <div style={{ fontSize: 12, color: C.muted }}>Upload PDFs or DOCX — AI reads actual content · {uploadedDocs.length} documents</div>
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
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 11, color: "#92400e", fontWeight: 500 }}>
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
                        <div style={{ fontSize: 13, color: C.gold, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>◻ {doc.name}</div>
                        <span className="tag" style={{ background: doc.status === "analyzed" ? "#f0fdf4" : "#fffbeb", color: doc.status === "analyzed" ? "#16a34a" : "#d97706", flexShrink: 0 }}>
                          {doc.status === "analyzed" ? "✓ Analyzed" : "Pending"}
                        </span>
                        {hasText && <span className="tag" style={{ background: "#f5f3ff", color: "#7c3aed", flexShrink: 0 }}>✓ Text extracted</span>}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>{doc.type} · {doc.size} · {client?.name} · {doc.uploaded}</div>
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
                    <div style={{ background: "#fffbf0", border: `1px solid #f0e4c0`, borderRadius: 6, padding: "12px 16px", fontSize: 12, lineHeight: 1.7 }}>
                      <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>✦ AI CASE ANALYSIS {hasText ? "· based on actual document contents" : ""}</div>
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
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>AI Legal Assistant</div>
              <div style={{ fontSize: 12, color: C.muted }}>Case-aware PI law intelligence · powered by Claude</div>
            </div>

            {activeDocContext && (
              <div style={{ background: "#fffbf0", border: `1px solid #f0e4c0`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>
                  ✦ Querying: <strong>{activeDocContext.name}</strong>
                  <span style={{ color: C.muted, marginLeft: 8, fontWeight: 400 }}>· {clients.find(c => c.id === activeDocContext.clientId)?.name}</span>
                  {activeDocContext.extractedText && <span style={{ color: "#7c3aed", marginLeft: 8 }}>· full text loaded</span>}
                </div>
                <button className="btn-ghost" style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => { setActiveDocContext(null); setAiChat([]); }}>
                  ✕ Exit doc mode
                </button>
              </div>
            )}

            {aiChat.length === 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>
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
                      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px", fontSize: 11, color: C.text2, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s", fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; e.currentTarget.style.background = "#fffbf0"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; e.currentTarget.style.background = C.surface; }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="card" style={{ minHeight: 420, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, overflowY: "auto", maxHeight: 480, paddingBottom: 16 }}>
                {aiChat.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: 28, marginBottom: 16, color: C.gold }}>✦</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>Your PI Law AI Assistant</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
                      {activeDocContext
                        ? `Ready to answer questions about ${activeDocContext.name}.`
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
                          <div style={{ width: 28, height: 28, background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.gold, flexShrink: 0, fontWeight: 900 }}>✦</div>
                          <div className="chat-bubble-ai">{renderMarkdown(msg.content)}</div>
                        </div>
                      )}
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div className="pulse" style={{ width: 28, height: 28, background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.gold, flexShrink: 0 }}>✦</div>
                    <div className="chat-bubble-ai" style={{ minWidth: 200 }}>
                      <div className="shimmer" style={{ width: 240, marginBottom: 6 }} />
                      <div className="shimmer" style={{ width: 180, marginBottom: 6 }} />
                      <div className="shimmer" style={{ width: 120 }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", gap: 10 }}>
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

      {/* ── Add Deadline Modal ──────────────────────────────────── */}
      {showAddDeadline && (
        <div className="modal-overlay" onClick={() => setShowAddDeadline(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 22, color: C.text }}>Add Case Deadline</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><div style={labelStyle}>Title</div><input value={newDeadline.title} onChange={e => setNewDeadline(p => ({ ...p, title: e.target.value }))} placeholder="e.g. File Complaint with Court" /></div>
              <div><div style={labelStyle}>Client</div>
                <select value={newDeadline.clientId} onChange={e => setNewDeadline(p => ({ ...p, clientId: +e.target.value }))}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div><div style={labelStyle}>Due Date</div><input type="date" value={newDeadline.date} onChange={e => setNewDeadline(p => ({ ...p, date: e.target.value }))} /></div>
                <div><div style={labelStyle}>Type</div>
                  <select value={newDeadline.type} onChange={e => setNewDeadline(p => ({ ...p, type: e.target.value }))}>
                    <option value="court">Court</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button className="btn-ghost" onClick={() => setShowAddDeadline(false)}>Cancel</button>
              <button className="btn" onClick={addDeadline}>Add Deadline</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Client Modal ────────────────────────────────────── */}
      {showAddClient && (
        <div className="modal-overlay" onClick={() => setShowAddClient(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 22, color: C.text }}>New Case Intake</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><div style={labelStyle}>Client Name</div><input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="e.g. John Smith" /></div>
              <div><div style={labelStyle}>Case Type</div>
                <select value={newClient.type} onChange={e => setNewClient(p => ({ ...p, type: e.target.value }))}>
                  {["Auto Accident", "Slip & Fall", "Medical Malpractice", "Workplace Injury", "Truck Accident", "Product Liability"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><div style={labelStyle}>Assigned Attorney</div><input value={newClient.attorney} onChange={e => setNewClient(p => ({ ...p, attorney: e.target.value }))} placeholder="e.g. J. Rodriguez" /></div>
              <div><div style={labelStyle}>Estimated Value (optional)</div><input value={newClient.value} onChange={e => setNewClient(p => ({ ...p, value: e.target.value }))} placeholder="e.g. 85000" type="number" min="0" /></div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button className="btn-ghost" onClick={() => setShowAddClient(false)}>Cancel</button>
              <button className="btn" onClick={addClient}>Add Case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}