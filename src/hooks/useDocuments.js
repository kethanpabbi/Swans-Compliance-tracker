// ─────────────────────────────────────────────
// Swan Compliance Tracker — useDocuments Hook
// ─────────────────────────────────────────────

import { useState } from "react";
import { INITIAL_DOCUMENTS } from "../lib/constants.js";
import { sendMessage, buildDocumentAnalysisPrompt } from "../lib/api.js";
import { formatBytes } from "../lib/utils.js";

export function useDocuments(clients) {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [analyzing, setAnalyzing] = useState(null); // id of doc being analyzed

  function upload(file, clientId) {
    const newDoc = {
      id: Date.now(),
      clientId: Number(clientId),
      name: file.name,
      type: "Uploaded Document",
      size: formatBytes(file.size),
      uploaded: new Date().toISOString().split("T")[0],
      status: "pending",
      summary: null,
    };
    setDocuments((prev) => [...prev, newDoc]);
  }

  async function analyze(docId) {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    const client = clients.find((c) => c.id === doc.clientId);
    setAnalyzing(docId);

    try {
      const prompt = buildDocumentAnalysisPrompt(doc, client?.matter ?? "Unknown");
      const summary = await sendMessage([{ role: "user", content: prompt }]);
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "analyzed", summary } : d))
      );
    } catch {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: "analyzed", summary: "Analysis failed. Please retry." }
            : d
        )
      );
    } finally {
      setAnalyzing(null);
    }
  }

  const pendingCount = documents.filter((d) => d.status === "pending").length;

  return { documents, upload, analyze, analyzing, pendingCount };
}
