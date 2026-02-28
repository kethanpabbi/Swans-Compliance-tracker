import { useState, useEffect, useRef } from "react";

const CLIENTS = [
  { id: 1, name: "Meridian Capital Group", matter: "SEC Regulatory Compliance", status: "active", risk: "high", jurisdiction: "Federal" },
  { id: 2, name: "Harlow & Associates", matter: "GDPR Data Protection Audit", status: "active", risk: "medium", jurisdiction: "EU" },
  { id: 3, name: "Vantage HealthCorp", matter: "HIPAA Privacy Compliance", status: "review", risk: "high", jurisdiction: "Federal" },
  { id: 4, name: "Stonebridge Ventures", matter: "AML/KYC Framework Review", status: "active", risk: "low", jurisdiction: "State" },
  { id: 5, name: "Orion Logistics Ltd", matter: "DOT Safety Regulations", status: "closed", risk: "low", jurisdiction: "Federal" },
];

const DEADLINES = [
  { id: 1, clientId: 1, title: "Form ADV Annual Update", date: "2026-03-15", priority: "critical", status: "pending", daysLeft: 16 },
  { id: 2, clientId: 3, title: "HIPAA Risk Assessment Due", date: "2026-03-02", priority: "critical", status: "pending", daysLeft: 3 },
  { id: 3, clientId: 2, title: "DPA Review Submission", date: "2026-03-20", priority: "high", status: "in-progress", daysLeft: 21 },
  { id: 4, clientId: 4, title: "SAR Filing Window", date: "2026-04-01", priority: "medium", status: "pending", daysLeft: 33 },
  { id: 5, clientId: 1, title: "Quarterly Compliance Report", date: "2026-04-10", priority: "medium", status: "pending", daysLeft: 42 },
  { id: 6, clientId: 2, title: "Staff Training Certification", date: "2026-03-28", priority: "low", status: "in-progress", daysLeft: 29 },
];

const DOCUMENTS = [
  { id: 1, clientId: 1, name: "SEC_ADV_Draft_v3.pdf", type: "Regulatory Filing", size: "2.4 MB", uploaded: "2026-02-20", status: "analyzed", summary: "Annual advisory filing with updated AUM disclosures. 3 risk flags identified in Section 7B." },
  { id: 2, clientId: 3, name: "HIPAA_Policy_Manual.docx", type: "Policy Document", size: "1.1 MB", uploaded: "2026-02-15", status: "analyzed", summary: "PHI handling procedures compliant. Breach notification timeline requires update per 2024 OCR guidance." },
  { id: 3, clientId: 2, name: "DPA_Agreement_Final.pdf", type: "Contract", size: "890 KB", uploaded: "2026-02-25", status: "pending", summary: null },
  { id: 4, clientId: 4, name: "AML_Risk_Matrix.xlsx", type: "Risk Assessment", size: "340 KB", uploaded: "2026-02-18", status: "analyzed", summary: "Low-risk customer base identified. Enhanced due diligence required for 2 entity types in Schedule B." },
];

const RISK_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e", critical: "#dc2626" };

const SYNE = "Arial, sans-serif";
const MONO = "Arial, sans-serif";

export default function SwanComplianceTracker() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);
  const [aiChat, setAiChat] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState(DOCUMENTS);
  const [analyzing, setAnalyzing] = useState(null);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [deadlines, setDeadlines] = useState(DEADLINES);
  const [newDeadline, setNewDeadline] = useState({ title: "", date: "", priority: "medium", clientId: 1 });
  const fileInputRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChat]);

  const filteredDeadlines = selectedClient ? deadlines.filter(d => d.clientId === selectedClient) : deadlines;
  const filteredDocs = selectedClient ? uploadedDocs.filter(d => d.clientId === selectedClient) : uploadedDocs;
  const criticalCount = deadlines.filter(d => d.daysLeft <= 7).length;
  const highRiskCount = CLIENTS.filter(c => c.risk === "high").length;
  const pendingAnalysis = uploadedDocs.filter(d => d.status === "pending").length;

  async function sendAiMessage() {
    if (!aiInput.trim()) return;
    const userMsg = aiInput.trim();
    setAiInput("");
    setAiChat(prev => [...prev, { role: "user", content: userMsg }]);
    setAiLoading(true);
    const context = `You are a senior legal compliance AI assistant at Swan Legal. You help attorneys track regulatory compliance, analyze documents, and research legal requirements. Current active clients: ${CLIENTS.map(c => `${c.name} (${c.matter})`).join(", ")}. Upcoming critical deadlines: ${deadlines.filter(d => d.daysLeft <= 14).map(d => `${d.title} in ${d.daysLeft} days`).join(", ")}. Be concise, precise, and cite specific regulations when relevant.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
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

  async function analyzeDocument(docId) {
    setAnalyzing(docId);
    const doc = uploadedDocs.find(d => d.id === docId);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `As a compliance AI, provide a realistic mock analysis summary (2-3 sentences) for a legal document named "${doc.name}" of type "${doc.type}" for client matter "${CLIENTS.find(c => c.id === doc.clientId)?.matter}". Include specific regulatory references and actionable flags.` }]
        })
      });
      const data = await res.json();
      setUploadedDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "analyzed", summary: data.content?.[0]?.text || "Analysis complete." } : d));
    } catch {
      setUploadedDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "analyzed", summary: "Analysis failed. Please retry." } : d));
    }
    setAnalyzing(null);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedDocs(prev => [...prev, {
      id: Date.now(),
      clientId: selectedClient || 1,
      name: file.name,
      type: "Uploaded Document",
      size: `${(file.size / 1024).toFixed(0)} KB`,
      uploaded: new Date().toISOString().split("T")[0],
      status: "pending",
      summary: null
    }]);
  }

  function addDeadline() {
    if (!newDeadline.title || !newDeadline.date) return;
    const daysLeft = Math.ceil((new Date(newDeadline.date) - new Date("2026-02-27")) / (1000 * 60 * 60 * 24));
    setDeadlines(prev => [...prev, { ...newDeadline, id: Date.now(), status: "pending", daysLeft }]);
    setNewDeadline({ title: "", date: "", priority: "medium", clientId: 1 });
    setShowAddDeadline(false);
  }

  const tabs = ["dashboard", "clients", "deadlines", "documents", "ai-research"];
  const tabLabels = { dashboard: "Dashboard", clients: "Clients & Matters", deadlines: "Deadlines", documents: "Documents", "ai-research": "AI Research" };
  const tabIcons = { dashboard: "⬡", clients: "◈", deadlines: "◷", documents: "◻", "ai-research": "✦" };

  return (
    <div style={{ fontFamily: MONO, background: "#0a0c10", minHeight: "100vh", color: "#e2e8f0" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0c10; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 2px; }

        .tab-btn {
          background: none; border: none; cursor: pointer; color: #4a5568;
          font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.1em;
          padding: 10px 16px; transition: all 0.2s; text-transform: uppercase;
          border-bottom: 1px solid transparent;
        }
        .tab-btn.active { color: #c8a96e; border-bottom: 1px solid #c8a96e; }
        .tab-btn:hover { color: #94a3b8; }

        .card { background: #111318; border: 1px solid #1e2330; border-radius: 8px; padding: 20px; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; font-family: Arial, sans-serif; }

        .btn {
          background: #c8a96e; color: #0a0c10; border: none; border-radius: 4px;
          padding: 8px 16px; font-family: Arial, sans-serif; font-size: 11px;
          cursor: pointer; letter-spacing: 0.05em; font-weight: 500; transition: all 0.2s;
          white-space: nowrap;
        }
        .btn:hover { background: #d4b97e; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-outline {
          background: transparent; color: #c8a96e; border: 1px solid #c8a96e;
          border-radius: 4px; padding: 6px 14px; font-family: Arial, sans-serif;
          font-size: 11px; cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s;
        }
        .btn-outline:hover { background: rgba(200,169,110,0.1); }

        input, select, textarea {
          background: #0d0f15; border: 1px solid #1e2330; border-radius: 4px;
          color: #e2e8f0; font-family: Arial, sans-serif; font-size: 12px;
          padding: 8px 12px; width: 100%; outline: none; transition: border 0.2s;
        }
        input:focus, select:focus, textarea:focus { border-color: rgba(200,169,110,0.3); }
        select option { background: #111318; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .row { display: flex; align-items: center; gap: 12px; }

        .stat-num {
          font-family: Arial, sans-serif !important;
          font-size: 36px !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          letter-spacing: -0.02em !important;
          color: #c8a96e;
        }

        .section-title {
          font-family: Arial, sans-serif;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #4a5568;
          margin-bottom: 14px;
        }

        .page-title {
          font-family: Arial, sans-serif !important;
          font-size: 26px !important;
          font-weight: 800 !important;
          line-height: 1.1 !important;
          letter-spacing: -0.01em !important;
          color: #e2e8f0;
        }

        .client-row {
          padding: 14px 16px; border: 1px solid #1e2330; border-radius: 6px;
          cursor: pointer; transition: all 0.2s; margin-bottom: 8px; background: #0d0f15;
        }
        .client-row:hover, .client-row.selected { border-color: rgba(200,169,110,0.3); background: #111318; }

        .deadline-row {
          padding: 14px 16px; border-left: 3px solid; border-radius: 0 6px 6px 0;
          background: #0d0f15; margin-bottom: 8px; transition: background 0.2s;
        }
        .deadline-row:hover { background: #111318; }

        .doc-row { padding: 14px 16px; border: 1px solid #1e2330; border-radius: 6px; margin-bottom: 8px; background: #0d0f15; }

        .chat-bubble-user {
          background: #1a2035; border-radius: 8px 8px 2px 8px;
          padding: 10px 14px; max-width: 75%; margin-left: auto;
          font-size: 12px; line-height: 1.6; font-family: Arial, sans-serif;
        }
        .chat-bubble-ai {
          background: #111318; border: 1px solid #1e2330;
          border-radius: 8px 8px 8px 2px; padding: 10px 14px;
          max-width: 85%; font-size: 12px; line-height: 1.6; color: #cbd5e0;
          font-family: Arial, sans-serif;
        }

        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        .shimmer {
          background: linear-gradient(90deg, #1e2330 25%, #252b3b 50%, #1e2330 75%);
          background-size: 200%; animation: shimmer 1.5s infinite;
          border-radius: 4px; height: 12px;
        }
        @keyframes shimmer { 0% { background-position: 200%; } 100% { background-position: -200%; } }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal { background: #111318; border: 1px solid #2a3040; border-radius: 10px; padding: 28px; width: 420px; }

        .deadline-days {
          font-family: Arial, sans-serif !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          letter-spacing: -0.02em !important;
        }

        .logo-text {
          font-family: Arial, sans-serif !important;
          font-weight: 800 !important;
          font-size: 16px !important;
          letter-spacing: 0.05em !important;
          color: #c8a96e;
        }

        .client-name {
          font-family: Arial, sans-serif !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          color: #e2e8f0;
          letter-spacing: 0 !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2330", padding: "0 60px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div className="row" style={{ gap: 16 }}>
          <div className="logo-text">
            SWANS <span style={{ color: "#4a5568", fontWeight: 400, fontFamily: MONO }}>/</span> <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, fontFamily: SYNE }}>COMPLIANCE</span>
          </div>
          <div style={{ width: 1, height: 20, background: "#1e2330" }} />
          <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", fontFamily: MONO }}>LEGAL INTELLIGENCE PLATFORM</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {criticalCount > 0 && (
            <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, padding: "4px 10px", fontSize: 10, color: "#ef4444", letterSpacing: "0.08em", fontFamily: MONO }}>
              ⚠ {criticalCount} CRITICAL DEADLINE{criticalCount > 1 ? "S" : ""}
            </div>
          )}
          <div style={{ fontSize: 10, color: "#4a5568", fontFamily: MONO }}>FEB 27, 2026</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e2330", padding: "0 60px", display: "flex" }}>
        {tabs.map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {tabIcons[t]} {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "40px 60px", maxWidth: 1400, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div className="page-title" style={{ marginBottom: 4 }}>Compliance Overview</div>
              <div style={{ fontSize: 11, color: "#4a5568", letterSpacing: "0.08em", fontFamily: MONO }}>ALL ACTIVE MATTERS · Q1 2026</div>
            </div>

            <div className="grid-3" style={{ marginBottom: 24 }}>
              {[
                { label: "Active Clients", val: CLIENTS.filter(c => c.status === "active").length, sub: `${CLIENTS.length} total matters`, accent: "#c8a96e" },
                { label: "Critical Deadlines", val: criticalCount, sub: "Due within 7 days", accent: "#ef4444" },
                { label: "High Risk Matters", val: highRiskCount, sub: "Require immediate attention", accent: "#f59e0b" },
              ].map(s => (
                <div key={s.label} className="card" style={{ borderColor: s.accent + "33" }}>
                  <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontFamily: MONO }}>{s.label}</div>
                  <div className="stat-num" style={{ color: s.accent, marginBottom: 6 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#4a5568", fontFamily: MONO }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="section-title">Upcoming Deadlines</div>
                {[...deadlines].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4).map(d => {
                  const client = CLIENTS.find(c => c.id === d.clientId);
                  const color = d.daysLeft <= 7 ? "#ef4444" : d.daysLeft <= 21 ? "#f59e0b" : "#22c55e";
                  return (
                    <div key={d.id} className="deadline-row" style={{ borderLeftColor: color, marginBottom: 8 }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", marginBottom: 2, fontFamily: MONO }}>{d.title}</div>
                          <div style={{ fontSize: 10, color: "#4a5568", fontFamily: MONO }}>{client?.name}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                          <div className="deadline-days" style={{ fontSize: 20, color }}>{d.daysLeft}d</div>
                          <div style={{ fontSize: 9, color: "#4a5568", fontFamily: MONO }}>{d.date}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="btn-outline" style={{ width: "100%", marginTop: 8 }} onClick={() => setActiveTab("deadlines")}>View All Deadlines →</button>
              </div>

              <div className="card">
                <div className="section-title">Client Risk Matrix</div>
                {CLIENTS.map(c => (
                  <div key={c.id} className="row" style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e2330" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: MONO, marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: "#4a5568", fontFamily: MONO }}>{c.matter}</div>
                    </div>
                    <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                      <span className="tag" style={{ background: RISK_COLORS[c.risk] + "22", color: RISK_COLORS[c.risk] }}>{c.risk}</span>
                      <span className="tag" style={{ background: "#1e2330", color: "#94a3b8" }}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="section-title">Recently Analyzed Documents</div>
              <div className="grid-2">
                {uploadedDocs.filter(d => d.status === "analyzed").slice(0, 2).map(doc => (
                  <div key={doc.id} style={{ padding: 14, background: "#0d0f15", border: "1px solid #1e2330", borderRadius: 6 }}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: "#c8a96e", fontFamily: MONO }}>◻ {doc.name}</div>
                      <span className="tag" style={{ background: "#22c55e22", color: "#22c55e" }}>analyzed</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6, fontFamily: MONO }}>{doc.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLIENTS */}
        {activeTab === "clients" && (
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div className="page-title" style={{ marginBottom: 4 }}>Clients & Matters</div>
                <div style={{ fontSize: 11, color: "#4a5568", fontFamily: MONO }}>{CLIENTS.length} matters · click to filter</div>
              </div>
              {selectedClient && <button className="btn-outline" onClick={() => setSelectedClient(null)}>✕ Clear Filter</button>}
            </div>

            <div style={{ marginBottom: 20 }}>
              {CLIENTS.map(c => (
                <div key={c.id} className={`client-row ${selectedClient === c.id ? "selected" : ""}`} onClick={() => setSelectedClient(selectedClient === c.id ? null : c.id)}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <div className="row" style={{ marginBottom: 6, gap: 10 }}>
                        <div className="client-name">{c.name}</div>
                        <span className="tag" style={{ background: RISK_COLORS[c.risk] + "22", color: RISK_COLORS[c.risk] }}>{c.risk} risk</span>
                        <span className="tag" style={{ background: "#1e2330", color: "#94a3b8" }}>{c.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", fontFamily: MONO }}>{c.matter} · {c.jurisdiction}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "#4a5568", fontFamily: MONO }}>{deadlines.filter(d => d.clientId === c.id).length} deadline(s)</div>
                      <div style={{ fontSize: 11, color: "#4a5568", fontFamily: MONO }}>{uploadedDocs.filter(d => d.clientId === c.id).length} document(s)</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedClient && (
              <div className="grid-2">
                <div className="card">
                  <div className="section-title">Active Deadlines</div>
                  {filteredDeadlines.length === 0
                    ? <div style={{ fontSize: 12, color: "#4a5568", fontFamily: MONO }}>No deadlines for this client.</div>
                    : filteredDeadlines.map(d => {
                      const color = d.daysLeft <= 7 ? "#ef4444" : d.daysLeft <= 21 ? "#f59e0b" : "#22c55e";
                      return (
                        <div key={d.id} className="deadline-row" style={{ borderLeftColor: color }}>
                          <div className="row" style={{ justifyContent: "space-between" }}>
                            <div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: MONO }}>{d.title}</div>
                            <div className="deadline-days" style={{ fontSize: 18, color, flexShrink: 0, marginLeft: 12 }}>{d.daysLeft}d</div>
                          </div>
                          <div style={{ fontSize: 10, color: "#4a5568", marginTop: 4, fontFamily: MONO }}>{d.date} · {d.status}</div>
                        </div>
                      );
                    })}
                </div>
                <div className="card">
                  <div className="section-title">Documents</div>
                  {filteredDocs.length === 0
                    ? <div style={{ fontSize: 12, color: "#4a5568", fontFamily: MONO }}>No documents uploaded.</div>
                    : filteredDocs.map(doc => (
                      <div key={doc.id} style={{ padding: "10px 0", borderBottom: "1px solid #1e2330" }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <div style={{ fontSize: 12, color: "#c8a96e", fontFamily: MONO }}>◻ {doc.name}</div>
                          <span className="tag" style={{ background: doc.status === "analyzed" ? "#22c55e22" : "#f59e0b22", color: doc.status === "analyzed" ? "#22c55e" : "#f59e0b" }}>{doc.status}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#4a5568", marginTop: 4, fontFamily: MONO }}>{doc.type} · {doc.size}</div>
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
                <div className="page-title" style={{ marginBottom: 4 }}>Compliance Deadlines</div>
                <div style={{ fontSize: 11, color: "#4a5568", fontFamily: MONO }}>{deadlines.length} tracked obligations</div>
              </div>
              <button className="btn" onClick={() => setShowAddDeadline(true)}>+ Add Deadline</button>
            </div>

            {["critical", "high", "medium", "low"].map(prio => {
              const items = deadlines.filter(d => {
                if (prio === "critical") return d.daysLeft <= 7;
                if (prio === "high") return d.daysLeft > 7 && d.daysLeft <= 21;
                if (prio === "medium") return d.daysLeft > 21 && d.daysLeft <= 35;
                return d.daysLeft > 35;
              });
              if (items.length === 0) return null;
              const color = RISK_COLORS[prio];
              const labels = { critical: "🔴 CRITICAL — Due within 7 days", high: "🟡 HIGH — Due within 3 weeks", medium: "🟢 MEDIUM — Due within 5 weeks", low: "⚪ LOW — Due later" };
              return (
                <div key={prio} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 10, color, letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase", fontFamily: MONO }}>{labels[prio]}</div>
                  {items.map(d => {
                    const client = CLIENTS.find(c => c.id === d.clientId);
                    return (
                      <div key={d.id} className="deadline-row" style={{ borderLeftColor: color }}>
                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 4, fontFamily: MONO }}>{d.title}</div>
                            <div className="row" style={{ gap: 8 }}>
                              <span style={{ fontSize: 10, color: "#4a5568", fontFamily: MONO }}>{client?.name}</span>
                              <span className="tag" style={{ background: "#1e2330", color: "#94a3b8" }}>{d.status}</span>
                              <span style={{ fontSize: 10, color: "#4a5568", fontFamily: MONO }}>{client?.jurisdiction}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                            <div className="deadline-days" style={{ fontSize: 28, color }}>{d.daysLeft}</div>
                            <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", fontFamily: MONO }}>days left</div>
                            <div style={{ fontSize: 9, color: "#4a5568", fontFamily: MONO }}>{d.date}</div>
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
                <div className="page-title" style={{ marginBottom: 4 }}>Document Analysis</div>
                <div style={{ fontSize: 11, color: "#4a5568", fontFamily: MONO }}>AI-powered compliance review · {uploadedDocs.length} documents</div>
              </div>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
                <button className="btn" onClick={() => fileInputRef.current.click()}>↑ Upload Document</button>
              </div>
            </div>

            {pendingAnalysis > 0 && (
              <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 11, color: "#f59e0b", fontFamily: MONO }}>
                ⚠ {pendingAnalysis} document{pendingAnalysis > 1 ? "s" : ""} awaiting AI analysis
              </div>
            )}

            {uploadedDocs.map(doc => {
              const client = CLIENTS.find(c => c.id === doc.clientId);
              const isAnalyzing = analyzing === doc.id;
              return (
                <div key={doc.id} className="doc-row">
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: doc.summary ? 10 : 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 10, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, color: "#c8a96e", fontWeight: 500, fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>◻ {doc.name}</div>
                        <span className="tag" style={{ background: doc.status === "analyzed" ? "#22c55e22" : "#f59e0b22", color: doc.status === "analyzed" ? "#22c55e" : "#f59e0b", flexShrink: 0 }}>
                          {doc.status === "analyzed" ? "✓ AI Analyzed" : "Pending"}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "#4a5568", fontFamily: MONO }}>{doc.type} · {doc.size} · {client?.name} · Uploaded {doc.uploaded}</div>
                    </div>
                    {doc.status === "pending" && (
                      <button className="btn" disabled={isAnalyzing} onClick={() => analyzeDocument(doc.id)} style={{ marginLeft: 12, flexShrink: 0 }}>
                        {isAnalyzing ? "Analyzing..." : "✦ AI Analyze"}
                      </button>
                    )}
                  </div>
                  {isAnalyzing && (
                    <div style={{ marginTop: 10 }}>
                      <div className="shimmer" style={{ marginBottom: 6 }} />
                      <div className="shimmer" style={{ width: "75%" }} />
                    </div>
                  )}
                  {doc.summary && !isAnalyzing && (
                    <div style={{ background: "#0d0f15", border: "1px solid #1e2330", borderRadius: 4, padding: "10px 14px", fontSize: 11, color: "#94a3b8", lineHeight: 1.7, fontFamily: MONO }}>
                      <span style={{ color: "#c8a96e", marginRight: 6 }}>✦ AI ANALYSIS:</span>{doc.summary}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI RESEARCH */}
        {activeTab === "ai-research" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div className="page-title" style={{ marginBottom: 4 }}>AI Legal Research</div>
              <div style={{ fontSize: 11, color: "#4a5568", fontFamily: MONO }}>Context-aware compliance intelligence · powered by Claude</div>
            </div>

            {aiChat.length === 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="section-title">Suggested Queries</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    "What are the latest SEC amendments to Form ADV?",
                    "Summarize HIPAA breach notification requirements",
                    "AML red flags for our fintech clients",
                    "GDPR Article 28 processor obligations",
                    "Upcoming compliance deadlines this month",
                  ].map(q => (
                    <button key={q} onClick={() => setAiInput(q)}
                      style={{ background: "#111318", border: "1px solid #2a3040", borderRadius: 4, padding: "8px 14px", fontSize: 11, color: "#94a3b8", cursor: "pointer", fontFamily: MONO, transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(200,169,110,0.3)"; e.currentTarget.style.color = "#c8a96e"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a3040"; e.currentTarget.style.color = "#94a3b8"; }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="card" style={{ minHeight: 360, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, overflowY: "auto", maxHeight: 420, paddingBottom: 16 }}>
                {aiChat.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ fontSize: 28, marginBottom: 14, color: "#c8a96e" }}>✦</div>
                    <div style={{ fontSize: 13, color: "#4a5568", fontFamily: MONO, lineHeight: 1.8 }}>Ask anything about your clients' compliance obligations,<br />regulatory requirements, or deadlines.</div>
                  </div>
                )}
                {aiChat.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    {msg.role === "user"
                      ? <div className="chat-bubble-user">{msg.content}</div>
                      : (
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 24, height: 24, background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#c8a96e", flexShrink: 0 }}>✦</div>
                          <div className="chat-bubble-ai">{msg.content}</div>
                        </div>
                      )}
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div className="pulse" style={{ width: 24, height: 24, background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#c8a96e", flexShrink: 0 }}>✦</div>
                    <div className="chat-bubble-ai">
                      <div className="shimmer" style={{ width: 220, marginBottom: 6 }} />
                      <div className="shimmer" style={{ width: 160 }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ borderTop: "1px solid #1e2330", paddingTop: 16, display: "flex", gap: 10 }}>
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Ask about regulations, deadlines, compliance requirements..."
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
            <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 18, marginBottom: 20, color: "#e2e8f0" }}>Add Compliance Deadline</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontFamily: MONO }}>Title</div>
                <input value={newDeadline.title} onChange={e => setNewDeadline(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Form 10-K Annual Filing" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontFamily: MONO }}>Client</div>
                <select value={newDeadline.clientId} onChange={e => setNewDeadline(p => ({ ...p, clientId: +e.target.value }))}>
                  {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div>
                  <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontFamily: MONO }}>Due Date</div>
                  <input type="date" value={newDeadline.date} onChange={e => setNewDeadline(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase", fontFamily: MONO }}>Priority</div>
                  <select value={newDeadline.priority} onChange={e => setNewDeadline(p => ({ ...p, priority: e.target.value }))}>
                    {["critical", "high", "medium", "low"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <button className="btn-outline" onClick={() => setShowAddDeadline(false)}>Cancel</button>
              <button className="btn" onClick={addDeadline}>Add Deadline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}