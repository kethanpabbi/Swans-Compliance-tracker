// ─────────────────────────────────────────────
// Swan Compliance Tracker — Anthropic API Client
// ─────────────────────────────────────────────

import { MODEL, MAX_TOKENS } from "./constants.js";

const API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Send a message to Claude and return the text response.
 * @param {Array} messages - Array of {role, content} message objects
 * @param {string} systemPrompt - Optional system prompt
 * @returns {Promise<string>} Claude's text response
 */
export async function sendMessage(messages, systemPrompt = "") {
  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages,
  };
  if (systemPrompt) body.system = systemPrompt;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

/**
 * Build the system prompt for the AI Research chat,
 * injecting live client/deadline context.
 */
export function buildResearchSystemPrompt(clients, deadlines) {
  const activeClients = clients
    .filter((c) => c.status !== "closed")
    .map((c) => `${c.name} (${c.matter}, ${c.jurisdiction})`)
    .join("; ");

  const urgentDeadlines = deadlines
    .filter((d) => d.daysLeft <= 14)
    .map((d) => `"${d.title}" in ${d.daysLeft} days`)
    .join("; ");

  return `You are a senior legal compliance AI assistant at Swan Legal. You help attorneys track regulatory compliance, analyze documents, and research legal requirements.

Active clients: ${activeClients || "None"}.
Urgent deadlines (≤14 days): ${urgentDeadlines || "None"}.

Be concise and precise. Cite specific regulations, rule numbers, and enforcement guidance when relevant. Flag action items clearly.`;
}

/**
 * Build the prompt used to analyze a compliance document.
 */
export function buildDocumentAnalysisPrompt(doc, matter) {
  return `As a compliance AI, analyze this legal document and provide a 2–3 sentence compliance summary with specific regulatory references and actionable flags.

Document name: ${doc.name}
Document type: ${doc.type}
Client matter: ${matter}

Return a professional compliance analysis. Be specific about regulation sections and any compliance gaps.`;
}
