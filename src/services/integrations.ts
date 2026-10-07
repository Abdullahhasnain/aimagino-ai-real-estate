/**
 * Integration adapters.
 *
 * In the demo every call resolves locally after a short, realistic delay.
 * To go live, replace each function body with a call to your backend
 * (WhatsApp Business API, CRM, calendar, email). The store only depends
 * on these signatures, so no UI code needs to change.
 */
import { sleep } from "@/lib/utils";

export interface SendResult {
  ok: boolean;
  providerId: string;
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
