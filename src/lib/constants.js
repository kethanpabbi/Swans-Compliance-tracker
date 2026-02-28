// ─────────────────────────────────────────────
// Swan Compliance Tracker — App Constants
// ─────────────────────────────────────────────

export const MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 1000;

export const RISK_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
  critical: "#dc2626",
};

export const PRIORITY_THRESHOLDS = {
  critical: 7,   // ≤7 days
  high: 21,      // ≤21 days
  medium: 35,    // ≤35 days
};

// ── Seed Data ──────────────────────────────────

export const INITIAL_CLIENTS = [
  { id: 1, name: "Meridian Capital Group", matter: "SEC Regulatory Compliance", status: "active", risk: "high", jurisdiction: "Federal" },
  { id: 2, name: "Harlow & Associates", matter: "GDPR Data Protection Audit", status: "active", risk: "medium", jurisdiction: "EU" },
  { id: 3, name: "Vantage HealthCorp", matter: "HIPAA Privacy Compliance", status: "review", risk: "high", jurisdiction: "Federal" },
  { id: 4, name: "Stonebridge Ventures", matter: "AML/KYC Framework Review", status: "active", risk: "low", jurisdiction: "State" },
  { id: 5, name: "Orion Logistics Ltd", matter: "DOT Safety Regulations", status: "closed", risk: "low", jurisdiction: "Federal" },
];

export const INITIAL_DEADLINES = [
  { id: 1, clientId: 1, title: "Form ADV Annual Update", date: "2026-03-15", priority: "critical", status: "pending", daysLeft: 16 },
  { id: 2, clientId: 3, title: "HIPAA Risk Assessment Due", date: "2026-03-02", priority: "critical", status: "pending", daysLeft: 3 },
  { id: 3, clientId: 2, title: "DPA Review Submission", date: "2026-03-20", priority: "high", status: "in-progress", daysLeft: 21 },
  { id: 4, clientId: 4, title: "SAR Filing Window", date: "2026-04-01", priority: "medium", status: "pending", daysLeft: 33 },
  { id: 5, clientId: 1, title: "Quarterly Compliance Report", date: "2026-04-10", priority: "medium", status: "pending", daysLeft: 42 },
  { id: 6, clientId: 2, title: "Staff Training Certification", date: "2026-03-28", priority: "low", status: "in-progress", daysLeft: 29 },
];

export const INITIAL_DOCUMENTS = [
  { id: 1, clientId: 1, name: "SEC_ADV_Draft_v3.pdf", type: "Regulatory Filing", size: "2.4 MB", uploaded: "2026-02-20", status: "analyzed", summary: "Annual advisory filing with updated AUM disclosures. 3 risk flags identified in Section 7B." },
  { id: 2, clientId: 3, name: "HIPAA_Policy_Manual.docx", type: "Policy Document", size: "1.1 MB", uploaded: "2026-02-15", status: "analyzed", summary: "PHI handling procedures compliant. Breach notification timeline requires update per 2024 OCR guidance." },
  { id: 3, clientId: 2, name: "DPA_Agreement_Final.pdf", type: "Contract", size: "890 KB", uploaded: "2026-02-25", status: "pending", summary: null },
  { id: 4, clientId: 4, name: "AML_Risk_Matrix.xlsx", type: "Risk Assessment", size: "340 KB", uploaded: "2026-02-18", status: "analyzed", summary: "Low-risk customer base identified. Enhanced due diligence required for 2 entity types in Schedule B." },
];

export const AI_QUICK_PROMPTS = [
  "What are the latest SEC amendments to Form ADV?",
  "Summarize HIPAA breach notification requirements",
  "AML red flags for our fintech clients",
  "GDPR Article 28 processor obligations",
  "Upcoming compliance deadlines this month",
];
