import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** AED 1,500,000 → "AED 1.5M"; 900,000 → "AED 900K" */
export function formatAEDShort(value: number) {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `AED ${Number.isInteger(m) ? m : m.toFixed(m >= 10 ? 1 : 2).replace(/0$/, "")}M`;
  }
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}K`;
  return `AED ${value}`;
}

export function formatAED(value: number) {
  return `AED ${value.toLocaleString("en-US")}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------- Relative dates (demo data is anchored to "now") ---------- */
export function atDayOffset(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Next occurrence of weekday (0=Sun..6=Sat), at least today. */
export function nextWeekday(weekday: number, hour: number, minute = 0) {
  const d = new Date();
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 7);
  return d.toISOString();
}

export function minutesAgo(min: number) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatRelativeDay(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, now)) return `Today, ${formatTime(iso)}`;
  if (isSameDay(d, tomorrow)) return `Tomorrow, ${formatTime(iso)}`;
  if (isSameDay(d, yesterday)) return `Yesterday, ${formatTime(iso)}`;
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (diffDays > 1 && diffDays < 7)
    return `${d.toLocaleDateString("en-US", { weekday: "long" })}, ${formatTime(iso)}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + `, ${formatTime(iso)}`;
}

export function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

export function dueLabel(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: "Overdue", tone: "danger" as const };
  const days = Math.floor(diff / 86_400_000);
  if (isSameDay(new Date(iso), new Date())) return { label: `Today, ${formatTime(iso)}`, tone: "warm" as const };
  if (days < 1) return { label: `Tomorrow, ${formatTime(iso)}`, tone: "default" as const };
  if (days < 2 && isSameDay(new Date(iso), new Date(Date.now() + 86_400_000)))
    return { label: `Tomorrow, ${formatTime(iso)}`, tone: "default" as const };
  return { label: `In ${Math.max(2, Math.round(diff / 86_400_000))} days`, tone: "default" as const };
}
