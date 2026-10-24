import { loadSessions } from "../storage.js";
import { buildSessionReport } from "./comparisonService.js";

// Montag 00:00 der Woche, in der das Datum liegt (lokale Zeit).
export function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Alle abgeschlossenen Trainings mit Auswertung, neueste zuerst.
export function getHistory() {
  const all = loadSessions();
  return all
    .filter((s) => s.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .map((session) => buildSessionReport(session, all));
}

// Gruppiert nach Kalenderwoche (Montag bis Sonntag), neueste Woche zuerst.
export function groupByWeek(history) {
  const groups = new Map();
  for (const report of history) {
    const key = startOfWeek(report.session.completedAt).getTime();
    if (!groups.has(key)) groups.set(key, { weekStart: new Date(key), reports: [] });
    groups.get(key).reports.push(report);
  }
  return Array.from(groups.values()).sort((a, b) => b.weekStart - a.weekStart);
}

export function weekLabel(weekStart, now = new Date()) {
  const thisWeek = startOfWeek(now).getTime();
  const ms = weekStart.getTime();
  if (ms === thisWeek) return "Diese Woche";
  if (ms === addDays(new Date(thisWeek), -7).getTime()) return "Letzte Woche";
  const fmt = (d) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  return `${fmt(weekStart)} – ${fmt(addDays(weekStart, 6))}`;
}

// Kennzahlen der letzten `weeks` Wochen (älteste zuerst, letzte = aktuelle Woche) - auch Wochen
// ohne Training, damit der Verlauf lückenlos dargestellt werden kann.
export function weeklyStats(history, weeks = 8, now = new Date()) {
  const currentStart = startOfWeek(now);
  const result = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = addDays(currentStart, -7 * i);
    result.push({ weekStart, trainings: 0, sets: 0, volume: 0 });
  }
  const byStart = new Map(result.map((w) => [w.weekStart.getTime(), w]));
  for (const report of history) {
    const week = byStart.get(startOfWeek(report.session.completedAt).getTime());
    if (!week) continue;
    week.trainings += 1;
    week.sets += report.totalSets;
    week.volume += report.totalVolume;
  }
  return result;
}

export function formatKg(value) {
  return `${Math.round(value).toLocaleString("de-DE")}\u00a0kg`;
}
