// ─────────────────────────────────────────────
// Swan Compliance Tracker — useAIChat Hook
// ─────────────────────────────────────────────

import { useState } from "react";
import { sendMessage, buildResearchSystemPrompt } from "../lib/api.js";

export function useAIChat(clients, deadlines) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function send(userText) {
    if (!userText.trim()) return;

    const userMsg = { role: "user", content: userText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setLoading(true);
    setError(null);

    try {
      const systemPrompt = buildResearchSystemPrompt(clients, deadlines);
      const reply = await sendMessage(updatedHistory, systemPrompt);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠ Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setMessages([]);
    setError(null);
  }

  return { messages, loading, error, send, clear };
}
