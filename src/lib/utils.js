// ─────────────────────────────────────────────
// Swan Compliance Tracker — Utility Functions
// ─────────────────────────────────────────────

import { RISK_COLORS, PRIORITY_THRESHOLDS } from "./constants.js";

/**
 * Calculate days remaining from today to a given ISO date string.
 */
export function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

/**
 * Classify a deadline's urgency based on days remaining.
 */
export function classifyUrgency(daysLeft) {
  if (daysLeft <= PRIORITY_THRESHOLDS.critical) return "critical";
  if (daysLeft <= PRIORITY_THRESHOLDS.high) return "high";
  if (daysLeft <= PRIORITY_THRESHOLDS.medium) return "medium";
  return "low";
}

/**
 * Get the hex color for a given risk or urgency level.
 */
export function getRiskColor(level) {
  return RISK_COLORS[level] ?? "#94a3b8";
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format an ISO date string to a short readable format.
 * e.g. "2026-03-15" → "Mar 15, 2026"
 */
export function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
