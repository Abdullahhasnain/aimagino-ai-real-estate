/**
 * Mock AI engine.
 *
 * Every function here is deterministic and runs in the browser so the demo works
 * offline. Each one mirrors the contract a real LLM / scoring service would have,
 * so swapping in a backend later means replacing the body, not the call sites.
 *
 * IMPORTANT: scores produced here are a transparent, rule-based DEMO scoring
 * model. They are not statistically validated predictions.
 */
import type {
  Financing,
  Lead,
  LeadInterest,
  LeadScore,
  Property,
  PropertyMatch,
  ScoreAdjustment,
  Temperature,
  Timeline,
} from "@/types";
import { formatAEDShort } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

export const COMMUNITIES = [
  "Dubai Marina",
  "Downtown Dubai",
  "Business Bay",
  "Palm Jumeirah",
  "Jumeirah Village Circle",
  "Dubai Hills Estate",
  "Jumeirah Lake Towers",
  "Dubai Creek Harbour",
  "Arabian Ranches",
  "City Walk",
] as const;

const LOCATION_ALIASES: [RegExp, string][] = [
  [/\b(dubai\s*)?marina\b/i, "Dubai Marina"],
  [/\bdowntown\b|burj khalifa/i, "Downtown Dubai"],
  [/\bbusiness\s*bay\b/i, "Business Bay"],
  [/\bpalm(\s*jumeirah)?\b/i, "Palm Jumeirah"],
  [/\bjvc\b|jumeirah village circle/i, "Jumeirah Village Circle"],
  [/\bdubai\s*hills\b/i, "Dubai Hills Estate"],
  [/\bjlt\b|jumeirah lake/i, "Jumeirah Lake Towers"],
  [/\bcreek\s*harbou?r\b|\bcreek\b/i, "Dubai Creek Harbour"],
  [/\barabian\s*ranches\b/i, "Arabian Ranches"],
  [/\bcity\s*walk\b/i, "City Walk"],
];

/** Communities treated as "nearby" for partial location credit. */
const NEARBY: Record<string, string[]> = {
  "Dubai Marina": ["Jumeirah Lake Towers", "Palm Jumeirah"],
  "Jumeirah Lake Towers": ["Dubai Marina"],
  "Downtown Dubai": ["Business Bay", "City Walk"],
  "Business Bay": ["Downtown Dubai", "City Walk"],
  "City Walk": ["Downtown Dubai", "Business Bay"],
  "Palm Jumeirah": ["Dubai Marina"],
  "Dubai Hills Estate": ["Arabian Ranches"],
  "Arabian Ranches": ["Dubai Hills Estate"],
  "Dubai Creek Harbour": ["Downtown Dubai"],
  "Jumeirah Village Circle": ["Dubai Hills Estate"],
};

/** Preference → property feature credit (partial credit for near-misses). */
const PREFERENCE_FIT: Record<string, Record<string, number>> = {
  "Marina view": { "Marina view": 1, "Partial marina view": 0.5 },
  "High floor": { "High floor": 1, "Mid floor": 0.5 },
  "Close to metro": { "Close to metro": 1, "Metro within 10 min": 0.5, "Metro 15 min walk": 0.25 },
  "Sea view": { "Sea view": 1, "Partial sea view": 0.5 },
  "Burj Khalifa view": { "Burj Khalifa view": 1, "Partial Burj view": 0.5 },
  "Private pool": { "Private pool": 1 },
  "Garden": { "Garden": 1, "Terrace": 0.5 },
  "Near schools": { "Near schools": 1 },
  "Ready to move": { "Ready to move": 1, "Handover in 6 months": 0.5 },
  "Payment plan": { "Payment plan": 1 },
  "Rental demand": { "Rental demand": 1, "Close to metro": 0.5 },
};

/* ------------------------------------------------------------------ */
/* 1. Extraction: free-text customer message → structured fields       */
/* ------------------------------------------------------------------ */

const WORD_NUM: Record<string, number> = { studio: 0, one: 1, two: 2, three: 3, four: 4, five: 5 };

export type Extraction = Partial<LeadInterest>;

export function extractLeadData(text: string): Extraction {
  const t = text.toLowerCase();
  const out: Extraction = {};

  // Bedrooms
  const bed = t.match(/\b(studio|one|two|three|four|five|\d)\s*(?:-|\s)?(?:bed(?:room)?s?|br|bhk)\b/);
  if (bed) out.bedrooms = WORD_NUM[bed[1]!] ?? Number(bed[1]);
  else if (/\bstudio\b/.test(t)) out.bedrooms = 0;

  // Property type
  if (/\bvilla\b/.test(t)) out.propertyType = "Villa";
  else if (/\btown\s*house\b/.test(t)) out.propertyType = "Townhouse";
  else if (/\bpenthouse\b/.test(t)) out.propertyType = "Penthouse";
  else if (/\b(apartment|flat|unit)\b/.test(t)) out.propertyType = "Apartment";

  // Location
  const locText = text.replace(/marina views?/gi, "");
  for (const [re, name] of LOCATION_ALIASES) {
    if (re.test(locText)) {
      out.location = name;
      break;
    }
  }

  // Intent
  if (/\b(rent|rental|lease|leasing)\b/.test(t) && !/rental (income|yield|demand)/.test(t)) out.intent = "Rent";
  if (/^\s*buy\b|\b(buy|buying|purchase|purchasing|own)\b/.test(t)) out.intent = "Buy";

  // Budget: "1.5 million", "AED 1,500,000", "900k", "2.1m"
  const mil = t.match(/(\d+(?:\.\d+)?)\s*(?:m\b|mn\b|mil|million)/);
  const thou = t.match(/(\d+(?:\.\d+)?)\s*(?:k\b|thousand)/);
  const raw = t.match(/(?:aed|dhs|dirham)?\s*(\d{1,3}(?:,\d{3}){2,})/);
  if (mil) out.budget = Math.round(parseFloat(mil[1]!) * 1_000_000);
  else if (thou) out.budget = Math.round(parseFloat(thou[1]!) * 1_000);
  else if (raw) out.budget = Number(raw[1]!.replace(/,/g, ""));

  // Timeline
  let tl: Timeline | undefined;
  if (/\b(asap|immediately|right away|this week|urgent)\b/.test(t)) tl = "Immediately";
  else if (/\b(next|within|in)\s+(the\s+)?(next\s+)?(month|30 days|few weeks|4 weeks|couple of weeks)\b|\bthis month\b/.test(t)) tl = "Within 30 days";
  else if (/\b(2|3|two|three|couple of|1\s*-\s*3|1 to 3)\s*months?\b/.test(t)) tl = "1–3 months";
  else if (/\b(4|5|6|six|3\s*-\s*6)\s*months?\b|\bend of (the )?year\b/.test(t)) tl = "3–6 months";
  else if (/\bnext year\b|\bjust (looking|browsing|exploring)\b|\bno rush\b/.test(t)) tl = "6+ months";
  if (tl) out.timeline = tl;

  // Purpose
  if (/\b(invest|investment|rental income|roi|yield|rent it out)\b/.test(t)) out.purpose = "Investment";
  else if (/\b(live in|move in|for my family|for myself|end use|own use|relocat)/.test(t)) out.purpose = "End use";

  // Financing
  let fin: Financing | undefined;
  if (/\bcash\b/.test(t)) fin = "Cash buyer";
  else if (/pre-?approv/.test(t)) fin = "Mortgage pre-approved";
  else if (/(financing|finance|mortgage).{0,20}(approved|sorted|in place|confirmed|ready)|(approved|sorted|confirmed).{0,20}(financing|finance|mortgage)/.test(t))
    fin = "Financing confirmed";
  else if (/\b(need|will need|require)s?\b.{0,15}\bmortgage\b/.test(t)) fin = "Needs mortgage advice";
  if (fin) out.financing = fin;

  // Preferences
  const prefs: string[] = [];
  if (/marina view/.test(t)) prefs.push("Marina view");
  if (/sea view|beach/.test(t)) prefs.push("Sea view");
  if (/high floor|higher floor/.test(t)) prefs.push("High floor");
  if (/metro/.test(t)) prefs.push("Close to metro");
  if (/pool/.test(t)) prefs.push("Private pool");
  if (/school/.test(t)) prefs.push("Near schools");
  if (/payment plan|off.?plan/.test(t)) prefs.push("Payment plan");
  if (prefs.length) out.preferences = prefs;

  return out;
}

export function mergeInterest(base: LeadInterest, ex: Extraction): LeadInterest {
  return {
    ...base,
    ...Object.fromEntries(Object.entries(ex).filter(([k, v]) => v !== undefined && k !== "preferences")),
    preferences: Array.from(new Set([...(base.preferences ?? []), ...(ex.preferences ?? [])])),
  } as LeadInterest;
}

/** Human-readable chips for what was extracted from one message. */
export function describeExtraction(ex: Extraction): string[] {
  const chips: string[] = [];
  if (ex.bedrooms !== undefined && ex.bedrooms !== null) chips.push(ex.bedrooms === 0 ? "Studio" : `${ex.bedrooms} Bedroom`);
  if (ex.propertyType) chips.push(ex.propertyType);
  if (ex.location) chips.push(ex.location);
  if (ex.intent) chips.push(`Intent: ${ex.intent}`);
  if (ex.budget) chips.push(`Budget: ${formatAEDShort(ex.budget)}`);
  if (ex.timeline) chips.push(`Timeline: ${ex.timeline}`);
  if (ex.purpose) chips.push(`Purpose: ${ex.purpose}`);
  if (ex.financing) chips.push(ex.financing);
  ex.preferences?.forEach((p) => chips.push(p));
  return chips;
}

/* ------------------------------------------------------------------ */
/* 2. Lead scoring (transparent demo model)                            */
/* ------------------------------------------------------------------ */

export const SCORE_WEIGHTS = {
  budgetMatch: 0.25,
  purchaseIntent: 0.2,
  timeline: 0.2,
  propertyFit: 0.2,
  engagement: 0.15,
} as const;

export const HOT_THRESHOLD = 75;
export const WARM_THRESHOLD = 50;

const TIMELINE_SCORE: Record<Timeline, number> = {
  Immediately: 95,
  "Within 30 days": 90,
  "1–3 months": 72,
  "3–6 months": 50,
  "6+ months": 28,
};

export function temperatureOf(score: number): Temperature {
  if (score >= HOT_THRESHOLD) return "hot";
  if (score >= WARM_THRESHOLD) return "warm";
  return "cold";
}

export function scoreLead(i: LeadInterest, engagement: number, opts: { financingVerified?: boolean } = {}): LeadScore {
  const strongFinance = i.financing === "Cash buyer" || i.financing === "Mortgage pre-approved" || i.financing === "Financing confirmed";
  const budgetMatch = i.budget
    ? Math.min(100, 70 + (strongFinance ? 20 : i.financing === "Needs mortgage advice" ? 5 : 0))
    : 20;
  const purchaseIntent =
    i.intent === "Buy" ? 80 + (i.purpose ? 15 : 0) : i.intent === "Rent" ? 55 + (i.purpose ? 10 : 0) : 25 + (i.purpose ? 10 : 0);
  const timeline = i.timeline ? TIMELINE_SCORE[i.timeline] : 20;
  const propertyFit = Math.max(15, (i.bedrooms !== null ? 40 : 0) + (i.location ? 35 : 0) + (i.propertyType ? 10 : 0));

  const factors = { budgetMatch, purchaseIntent, timeline, propertyFit, engagement: Math.round(engagement) };
  const weighted =
    factors.budgetMatch * SCORE_WEIGHTS.budgetMatch +
    factors.purchaseIntent * SCORE_WEIGHTS.purchaseIntent +
    factors.timeline * SCORE_WEIGHTS.timeline +
    factors.propertyFit * SCORE_WEIGHTS.propertyFit +
    factors.engagement * SCORE_WEIGHTS.engagement;

  const adjustments: ScoreAdjustment[] = [];
  if (strongFinance && !opts.financingVerified) adjustments.push({ label: "Financing stated but not yet verified by an agent", points: -3 });
  if (i.intent === "Rent") adjustments.push({ label: "Rental enquiry (lower commission value)", points: -4 });

  const total = Math.max(0, Math.min(100, Math.round(weighted + adjustments.reduce((a, b) => a + b.points, 0))));
  const temperature = temperatureOf(total);
  return { total, temperature, factors, adjustments, explanation: explainScore(i, temperature) };
}

function explainScore(i: LeadInterest, t: Temperature) {
  const parts: string[] = [];
  const hasBudget = !!i.budget;
  const clearReq = i.bedrooms !== null && !!i.location;
  const fast = i.timeline === "Immediately" || i.timeline === "Within 30 days";
  if (t === "hot") {
    parts.push(i.intent === "Rent" ? "High-intent tenant" : "High-intent buyer");
    const bits = [hasBudget && "confirmed budget", clearReq && "clear property requirements", fast && "short purchase timeline"].filter(Boolean);
    return `${parts[0]} with ${bits.length ? joinList(bits as string[]) : "strong engagement"}.`;
  }
  if (t === "warm") {
    const missing = [!hasBudget && "budget", !i.timeline && "timeline", !clearReq && "exact requirements", !i.intent && "buy/rent intent"].filter(Boolean);
    const slow = i.timeline && !fast ? `a ${i.timeline.toLowerCase()} timeline` : null;
    return `Genuine interest${slow ? ` with ${slow}` : ""}${missing.length ? `; still missing ${joinList(missing as string[])}` : ""}. Nurture with targeted listings.`;
  }
  return "Early-stage enquiry with limited qualification data. Keep in automated nurture until intent is clearer.";
}

function joinList(a: string[]) {
  if (a.length <= 1) return a.join("");
  return `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
}

/* ------------------------------------------------------------------ */
/* 3. Conversation: next qualification question                        */
/* ------------------------------------------------------------------ */

export interface AiReply {
  text: string;
  done: boolean;
  /** When the customer proposes a day, the AI books it (weekday 0=Sun..6=Sat). */
  booking?: { weekday: number; hour: number; label: string };
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function detectBooking(text: string): AiReply["booking"] | undefined {
  const t = text.toLowerCase();
  let weekday = DAYS.findIndex((d) => t.includes(d));
  if (weekday < 0 && /tomorrow/.test(t)) weekday = (new Date().getDay() + 1) % 7;
  if (weekday < 0 && /weekend/.test(t)) weekday = 6;
  if (weekday < 0) return undefined;
  const hour = /morning/.test(t) ? 11 : /afternoon/.test(t) ? 15 : /evening|night|after work/.test(t) ? 17 : 17;
  const dayName = DAYS[weekday]!.charAt(0).toUpperCase() + DAYS[weekday]!.slice(1);
  const hh = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
  return { weekday, hour, label: `${dayName} at ${hh}` };
}

/**
 * Picks the next reply given what the lead has told us so far.
 * A real implementation would call an LLM with the agency's playbook as the system prompt.
 */
export function generateReply(i: LeadInterest, lastExtraction: Extraction, lastText: string): AiReply {
  const t = lastText.toLowerCase();
  if (/\b(price|how much|cost)\b/.test(t) && i.location) {
    return { text: `Prices for ${i.bedrooms ? `${i.bedrooms}-bedroom ` : ""}homes in ${i.location} vary by building and view. Once I know your budget I can share options that fit. What range are you considering?`, done: false };
  }
  if (!i.location && !i.bedrooms) return { text: "Happy to help. Which area of Dubai are you interested in, and how many bedrooms do you need?", done: false };
  if (!i.location) return { text: "Great. Which community are you considering? For example Dubai Marina, Downtown or Business Bay.", done: false };
  if (i.bedrooms === null) return { text: `${i.location} is a great choice. How many bedrooms are you looking for?`, done: false };
  if (!i.intent) {
    const opener = lastExtraction.location || lastExtraction.bedrooms !== undefined ? "Absolutely. I can help with that. " : "";
    return { text: `${opener}Are you looking to buy or rent?`, done: false };
  }
  if (!i.budget) return { text: i.intent === "Rent" ? "Great. What's your approximate annual rent budget?" : "Great. What's your approximate budget?", done: false };
  if (!i.timeline) return { text: i.intent === "Rent" ? "Thanks. When would you like to move in?" : "Thanks. And when are you planning to purchase?", done: false };
  const booking = detectBooking(lastText);
  if (booking) {
    return {
      text: `Noted. I've reserved ${booking.label} for a viewing in ${i.location} and I'll send you 3 shortlisted ${i.bedrooms === 0 ? "studio" : `${i.bedrooms}-bedroom`} options before then. Our consultant will confirm by WhatsApp.`,
      done: true,
      booking,
    };
  }
  if (/\b(yes|sure|ok|okay|sounds good|please|works)\b/.test(t) || lastExtraction.purpose || lastExtraction.financing) {
    if (/\b(yes|sure|ok|okay|please)\b/.test(t) && !lastExtraction.purpose && !lastExtraction.financing)
      return { text: "Great. Which day suits you best for a viewing? We have availability on Friday, Saturday and Sunday.", done: false };
    return {
      text: `Noted${i.purpose ? `: ${i.purpose.toLowerCase()} purchase` : ""}. I've shortlisted 3 ${i.bedrooms}-bedroom options in ${i.location} and passed your details to our property consultant, who will confirm a viewing time with you shortly.`,
      done: true,
    };
  }
  return {
    text: "Perfect. I have enough information to help narrow down suitable properties. Would you like to schedule a viewing?",
    done: false,
  };
}

/* ------------------------------------------------------------------ */
/* 4. Property matching (demo matching score)                          */
/* ------------------------------------------------------------------ */

const MATCH_WEIGHTS = { location: 34, bedrooms: 24, budget: 24, preferences: 18 };
const OVER_BUDGET_PENALTY = 6; // each 1% over budget costs 6% of the budget weight

export function matchProperties(i: LeadInterest, properties: Property[], limit = 3): PropertyMatch[] {
  return properties
    .filter((p) => p.availability !== "Sold")
    .filter((p) => (i.propertyType && i.propertyType !== "Apartment" ? p.type === i.propertyType || p.type === "Penthouse" : true))
    .map((p) => scoreMatch(i, p))
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function scoreMatch(i: LeadInterest, p: Property): PropertyMatch {
  const reasons: PropertyMatch["reasons"] = [];

  // Location
  let loc = 0.15;
  if (!i.location) loc = 0.5;
  else if (p.community === i.location) {
    loc = 1;
    reasons.push({ label: `In ${p.community}`, ok: true });
  } else if (NEARBY[i.location]?.includes(p.community)) {
    loc = 0.6;
    reasons.push({ label: `${p.community} (near ${i.location})`, ok: "partial" });
  } else reasons.push({ label: `${p.community}`, ok: false });

  // Bedrooms
  let bed = 0.5;
  if (i.bedrooms !== null) {
    const diff = Math.abs(p.bedrooms - i.bedrooms);
    bed = diff === 0 ? 1 : diff === 1 ? 0.4 : 0;
    reasons.push({ label: `${p.bedrooms === 0 ? "Studio" : `${p.bedrooms} bedroom${p.bedrooms > 1 ? "s" : ""}`}`, ok: diff === 0 ? true : diff === 1 ? "partial" : false });
  }

  // Budget
  let budget = 0.5;
  if (i.budget) {
    const over = (p.price - i.budget) / i.budget;
    if (over <= 0) {
      budget = over < -0.35 ? 0.7 : 1;
      reasons.push({ label: over < -0.02 ? `${Math.round(-over * 100)}% under budget` : "Within budget", ok: true });
    } else {
      budget = Math.max(0, 1 - over * 100 * (OVER_BUDGET_PENALTY / 100));
      reasons.push({ label: `${Math.max(1, Math.round(over * 100))}% over budget`, ok: over <= 0.05 ? "partial" : false });
    }
  }

  // Preferences
  let pref = 0.5;
  if (i.preferences.length) {
    const fits = i.preferences.map((pr) => {
      const table = PREFERENCE_FIT[pr] ?? { [pr]: 1 };
      return Math.max(0, ...p.features.map((f) => table[f] ?? 0));
    });
    pref = fits.reduce((a, b) => a + b, 0) / i.preferences.length;
    const hit = i.preferences.filter((_, idx) => fits[idx]! >= 0.99);
    if (hit.length) reasons.push({ label: hit.join(", "), ok: true });
    const partial = i.preferences.filter((_, idx) => fits[idx]! > 0 && fits[idx]! < 0.99);
    if (partial.length) reasons.push({ label: `Partly: ${partial.join(", ")}`, ok: "partial" });
  }

  const score = Math.round(
    loc * MATCH_WEIGHTS.location + bed * MATCH_WEIGHTS.bedrooms + budget * MATCH_WEIGHTS.budget + pref * MATCH_WEIGHTS.preferences,
  );
  return { property: p, score, reasons };
}

/* ------------------------------------------------------------------ */
/* 5. Summaries and drafted messages                                   */
/* ------------------------------------------------------------------ */

export function summarizeLead(name: string, i: LeadInterest): string {
  const first = name.split(" ")[0];
  const what = `${i.bedrooms === null ? "a" : i.bedrooms === 0 ? "a studio" : `a ${i.bedrooms}-bedroom`} ${(i.propertyType ?? "property").toLowerCase()}`;
  const verb = i.intent === "Rent" ? "rent" : "purchase";
  const parts = [`${first} is ${i.intent ? "actively " : ""}looking for ${what}${i.location ? ` in ${i.location}` : ""}${i.budget ? ` with a budget of ${formatAEDShort(i.budget)}` : ""}.`];
  if (i.timeline) {
    const when = i.timeline === "Within 30 days" ? "within 30 days" : i.timeline === "Immediately" ? "immediately" : i.timeline === "6+ months" ? "in 6+ months" : `in ${i.timeline}`;
    parts.push(`${i.intent === "Rent" ? `${first} wants to move in` : `${first} intends to ${verb}`} ${when}${financingClause(i.financing)}.`);
  } else if (i.financing && i.financing !== "Not discussed") parts.push(`${first}${financingClause(i.financing).replace(/^ and/, "")}.`);
  if (i.purpose) parts.push(`Purpose: ${i.purpose.toLowerCase()}.`);
  if (!i.budget || !i.timeline) parts.push(`Still to confirm: ${[!i.budget && "budget", !i.timeline && "timeline"].filter(Boolean).join(" and ")}.`);
  return parts.join(" ");
}

function financingClause(f: Financing | null) {
  switch (f) {
    case "Cash buyer":
      return " and is a cash buyer";
    case "Mortgage pre-approved":
      return " and has mortgage pre-approval";
    case "Financing confirmed":
      return " and has confirmed financing";
    case "Needs mortgage advice":
      return " and will need mortgage advice";
    default:
      return "";
  }
}

export function recommendAction(score: LeadScore, hasAppointment: boolean): string {
  if (hasAppointment) return "Prioritize this lead: viewing is booked. Send the shortlist and a reminder 24 hours before.";
  if (score.temperature === "hot") return "Prioritize this lead and schedule a property viewing.";
  if (score.temperature === "warm") return "Send 3 matching listings and follow up in 48 hours.";
  return "Keep in automated nurture; re-engage with new launches monthly.";
}

export function draftFollowUp(lead: Lead, topMatch?: Property): string {
  const first = lead.name.split(" ")[0];
  const i = lead.interest;
  if (lead.score.temperature === "hot" && topMatch)
    return `Hi ${first}, following up on your search for a ${i.bedrooms}-bedroom in ${i.location}. A unit in ${topMatch.building} at ${formatAEDShort(topMatch.price)} fits your brief closely. Would Friday or Saturday suit you for a viewing?`;
  if (lead.score.temperature === "warm")
    return `Hi ${first}, I've put together a few ${i.location ?? "Dubai"} options that match what you described. Shall I send them over, and would a quick 10-minute call this week help?`;
  return `Hi ${first}, just checking in. New ${i.location ?? "Dubai"} listings came in this week. Let me know if you'd like me to share any that match your requirements.`;
}
