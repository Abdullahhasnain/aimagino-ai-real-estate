import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "@/types";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const workspaceSlug = import.meta.env.VITE_WORKSPACE_SLUG?.trim() || "default-agency";
export const cloudConfigured = Boolean(url && anonKey);

const client: SupabaseClient | null = cloudConfigured ? createClient(url!, anonKey!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

export function getCloudClient(): SupabaseClient | null {
  return client;
}

export async function getSession(): Promise<Session | null> {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email: string, password: string) {
  if (!client) throw new Error("Cloud authentication is not configured.");
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function saveCloudLead(payload: { lead: Lead; message: string }): Promise<void> {
  if (!client) return;
  const { error } = await client.from("lead_submissions").insert({
    workspace_slug: workspaceSlug,
    lead_id: payload.lead.id,
    payload,
  });
  if (error) throw error;
}

export async function loadCloudLeads(): Promise<Array<{ lead: Lead; message: string }>> {
  if (!client) return [];
  const { data, error } = await client
    .from("lead_submissions")
    .select("payload")
    .eq("workspace_slug", workspaceSlug)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const payload = row.payload as { lead?: Lead; message?: string } | null;
    return payload?.lead ? [{ lead: payload.lead, message: payload.message ?? "Website enquiry" }] : [];
  });
}
