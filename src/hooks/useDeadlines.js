// ─────────────────────────────────────────────
// Swan Compliance Tracker — useDeadlines Hook
// ─────────────────────────────────────────────

import { useState } from "react";
import { INITIAL_DEADLINES } from "../lib/constants.js";
import { daysUntil } from "../lib/utils.js";

export function useDeadlines() {
  const [deadlines, setDeadlines] = useState(INITIAL_DEADLINES);

  function add({ title, date, priority, clientId }) {
    if (!title || !date) return;
    const newDeadline = {
      id: Date.now(),
      clientId: Number(clientId),
      title,
      date,
      priority,
      status: "pending",
      daysLeft: daysUntil(date),
    };
    setDeadlines((prev) => [...prev, newDeadline]);
  }

  function updateStatus(id, status) {
    setDeadlines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d))
    );
  }

  function remove(id) {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  }

  const criticalCount = deadlines.filter((d) => d.daysLeft <= 7).length;

  return { deadlines, add, updateStatus, remove, criticalCount };
}
