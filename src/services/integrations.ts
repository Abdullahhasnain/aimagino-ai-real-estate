/**
 * Integration adapters.
 *
 * In the demo every call resolves locally after a short, realistic delay.
 * To go live, replace each function body with a call to your backend
 * (WhatsApp Business API, CRM, calendar, email). The store only depends
 * on these signatures, so no UI code needs to change.
 */
import { sleep } from "@/lib/utils";
import type { Lead } from "@/types";
import { cloudConfigured, saveCloudLead } from "@/services/cloud";

export interface SendResult {
  ok: boolean;
  providerId: string;
}

export async function submitLead(payload: { lead: Lead; message: string }): Promise<{ ok: boolean; provider: "local" | "webhook" | "supabase" | "api" }> {
  if (cloudConfigured) {
    await saveCloudLead(payload);
    return { ok: true, provider: "supabase" };
  }
  const webhookUrl = import.meta.env.VITE_LEAD_WEBHOOK_URL?.trim();
  const apiUrl = import.meta.env.VITE_LEAD_API_URL?.trim() || (import.meta.env.PROD ? "/api/lead" : "");
  const endpoint = webhookUrl || apiUrl;
  if (!endpoint) return { ok: true, provider: "local" };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Lead webhook failed with status ${response.status}`);
  return { ok: true, provider: webhookUrl ? "webhook" : "api" };
}

/** WhatsApp Business / Instagram / email outbound message. */
export async function sendMessage(_channel: string, _to: string, _text: string): Promise<SendResult> {
  await sleep(900);
  return { ok: true, providerId: `demo_${Date.now()}` };
}

/** Create or update the lead in the agency CRM (Salesforce, HubSpot, Zoho, custom). */
export async function upsertCrmRecord(_leadId: string, _fields: Record<string, unknown>): Promise<{ ok: boolean }> {
  await sleep(400);
  return { ok: true };
}

/** Notify the assigned agent (WhatsApp, push, Slack or email). */
export async function notifyAgent(_agentId: string, _text: string): Promise<{ ok: boolean }> {
  await sleep(500);
  return { ok: true };
}

/** Write the appointment to the agent's calendar. */
export async function bookCalendarSlot(_agentId: string, _startIso: string, _durationMin: number): Promise<{ ok: boolean }> {
  await sleep(600);
  return { ok: true };
}
