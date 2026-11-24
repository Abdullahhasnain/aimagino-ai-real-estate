const json = (response, status, body) => response.status(status).json(body);

function validLead(payload) {
  const lead = payload?.lead;
  return Boolean(
    lead &&
    typeof lead.id === "string" && lead.id.length < 120 &&
    typeof lead.name === "string" && lead.name.trim().length >= 2 && lead.name.length < 160 &&
    typeof lead.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) &&
    typeof lead.phone === "string" && lead.phone.length < 80
  );
}

async function saveToSupabase(payload) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const workspace = process.env.WORKSPACE_SLUG;
  if (!url || !key || !workspace) return { provider: "supabase", status: "not_configured" };
  const response = await fetch(`${url}/rest/v1/lead_submissions`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ workspace_slug: workspace, lead_id: payload.lead.id, payload }),
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  return { provider: "supabase", status: "delivered" };
}

async function syncHubSpot(lead) {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) return { provider: "hubspot", status: "not_configured" };
  const names = lead.name.trim().split(/\s+/);
  const properties = {
    email: lead.email,
    firstname: names[0] || lead.name,
    lastname: names.slice(1).join(" "),
    phone: lead.phone,
    lifecyclestage: "lead",
    message: lead.summary || "Website property enquiry",
  };
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  let response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(lead.email)}?idProperty=email`, {
    method: "PATCH", headers, body: JSON.stringify({ properties }),
  });
  if (response.status === 404) {
    response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", { method: "POST", headers, body: JSON.stringify({ properties }) });
  }
  if (!response.ok) throw new Error(`HubSpot ${response.status}`);
  return { provider: "hubspot", status: "delivered" };
}

async function sendNotification(lead) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!apiKey || !to || !from) return { provider: "email", status: "not_configured" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New property enquiry: ${lead.name}`,
      text: [
        `Name: ${lead.name}`,
        `Email: ${lead.email}`,
        `Phone: ${lead.phone}`,
        `Score: ${lead.score?.total ?? "Pending"}/100`,
        `Location: ${lead.interest?.location ?? "Not provided"}`,
        `Budget: AED ${lead.interest?.budget?.toLocaleString?.() ?? "Not provided"}`,
        "",
        lead.summary || "Website property enquiry",
      ].join("\n"),
    }),
  });
  if (!response.ok) throw new Error(`Email ${response.status}`);
  return { provider: "email", status: "delivered" };
}

export default async function handler(request, response) {
  if (request.method !== "POST") return json(response, 405, { ok: false, error: "Method not allowed" });
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin && request.headers.origin && request.headers.origin !== allowedOrigin) {
    return json(response, 403, { ok: false, error: "Origin not allowed" });
  }
  const rawLength = Number(request.headers["content-length"] || 0);
  if (rawLength > 100_000) return json(response, 413, { ok: false, error: "Payload too large" });
  const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  if (!validLead(payload)) return json(response, 400, { ok: false, error: "Invalid lead submission" });

  const operations = await Promise.allSettled([
    saveToSupabase(payload),
    syncHubSpot(payload.lead),
    sendNotification(payload.lead),
  ]);
  const integrations = operations.map((result, index) => result.status === "fulfilled"
    ? result.value
    : { provider: ["supabase", "hubspot", "email"][index], status: "failed" });
  const delivered = integrations.some((item) => item.status === "delivered");
  return json(response, delivered ? 200 : 503, { ok: delivered, integrations });
}
