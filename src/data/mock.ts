/**
 * Demo dataset. All people, listings and numbers are fictional sample data
 * for AImagino sales demonstrations. Dates are generated relative to "now"
 * so the demo always looks current.
 */
import type {
  Agent,
  AppNotification,
  Appointment,
  Conversation,
  FollowUp,
  Lead,
  LeadInterest,
  LeadSource,
  LeadStatus,
  Message,
  Property,
  Workflow,
} from "@/types";
import { atDayOffset, minutesAgo, nextWeekday } from "@/lib/utils";
import { describeExtraction, extractLeadData, recommendAction, scoreLead, summarizeLead } from "@/services/ai";

/* ------------------------------------------------------------------ */
/* Agents                                                              */
/* ------------------------------------------------------------------ */

export const AGENTS: Agent[] = [
  { id: "a1", name: "Omar Saleh", role: "Senior Property Consultant", focus: "Dubai Marina & JLT" },
  { id: "a2", name: "Nadia Rahman", role: "Property Consultant", focus: "Downtown & Business Bay" },
  { id: "a3", name: "Daniel Brooks", role: "Luxury Specialist", focus: "Palm Jumeirah & City Walk" },
  { id: "a4", name: "Layla Mansour", role: "Villa & Family Homes", focus: "Dubai Hills & Arabian Ranches" },
];

export const CURRENT_USER = { name: "Sara Mitchell", role: "Sales Director" };

/* ------------------------------------------------------------------ */
/* Properties                                                          */
/* ------------------------------------------------------------------ */

export const PROPERTIES: Property[] = [
  { id: "p1", ref: "AIM-DM-2041", title: "2BR Apartment", community: "Dubai Marina", building: "Marina Vista Tower", bedrooms: 2, bathrooms: 2, sizeSqft: 1_210, price: 1_450_000, type: "Apartment", availability: "Available", features: ["Marina view", "High floor", "Balcony", "Ready to move"], hue: 214 },
  { id: "p2", ref: "AIM-DM-2057", title: "2BR Apartment", community: "Dubai Marina", building: "Harbour Crest Residences", bedrooms: 2, bathrooms: 3, sizeSqft: 1_285, price: 1_550_000, type: "Apartment", availability: "Available", features: ["Marina view", "High floor", "Maid's room", "Ready to move"], hue: 200 },
  { id: "p3", ref: "AIM-DM-2063", title: "2BR Apartment", community: "Dubai Marina", building: "Bayside Point", bedrooms: 2, bathrooms: 2, sizeSqft: 1_340, price: 1_650_000, type: "Apartment", availability: "Available", features: ["Marina view", "High floor", "Metro 15 min walk", "Upgraded kitchen"], hue: 226 },
  { id: "p4", ref: "AIM-DD-1108", title: "1BR Apartment", community: "Downtown Dubai", building: "Opera Crest Residences", bedrooms: 1, bathrooms: 1, sizeSqft: 760, price: 950_000, type: "Apartment", availability: "Available", features: ["Partial Burj view", "Close to metro", "Ready to move"], hue: 32 },
  { id: "p5", ref: "AIM-BB-3312", title: "2BR Apartment", community: "Business Bay", building: "Canal Edge Tower", bedrooms: 2, bathrooms: 2, sizeSqft: 1_190, price: 1_850_000, type: "Apartment", availability: "Available", features: ["Canal view", "High floor", "Metro within 10 min"], hue: 190 },
  { id: "p6", ref: "AIM-PJ-0420", title: "3BR Apartment", community: "Palm Jumeirah", building: "Crescent Shore Residences", bedrooms: 3, bathrooms: 4, sizeSqft: 2_050, price: 3_200_000, type: "Apartment", availability: "Available", features: ["Sea view", "Beach access", "Ready to move"], hue: 180 },
  { id: "p7", ref: "AIM-JL-0918", title: "2BR Apartment", community: "Jumeirah Lake Towers", building: "Lakeview Cluster Tower", bedrooms: 2, bathrooms: 2, sizeSqft: 1_260, price: 1_400_000, type: "Apartment", availability: "Available", features: ["Close to metro", "Partial marina view", "Mid floor"], hue: 160 },
  { id: "p8", ref: "AIM-DD-1142", title: "1BR Apartment", community: "Downtown Dubai", building: "Boulevard Loft Residences", bedrooms: 1, bathrooms: 2, sizeSqft: 810, price: 880_000, type: "Apartment", availability: "Reserved", features: ["Boulevard view", "Close to metro"], hue: 24 },
  { id: "p9", ref: "AIM-BB-3350", title: "2BR Apartment", community: "Business Bay", building: "Executive Canal Residences", bedrooms: 2, bathrooms: 3, sizeSqft: 1_420, price: 2_050_000, type: "Apartment", availability: "Available", features: ["Burj Khalifa view", "High floor", "Ready to move"], hue: 236 },
  { id: "p10", ref: "AIM-DH-5520", title: "3BR Townhouse", community: "Dubai Hills Estate", building: "Parkside Grove", bedrooms: 3, bathrooms: 4, sizeSqft: 2_480, price: 3_450_000, type: "Townhouse", availability: "Available", features: ["Garden", "Near schools", "Ready to move"], hue: 140 },
  { id: "p11", ref: "AIM-CH-7701", title: "1BR Apartment", community: "Dubai Creek Harbour", building: "Creek Horizon Tower", bedrooms: 1, bathrooms: 1, sizeSqft: 740, price: 1_200_000, type: "Apartment", availability: "Off-plan", features: ["Payment plan", "Handover in 6 months", "Creek view"], hue: 205 },
  { id: "p12", ref: "AIM-JV-6604", title: "1BR Apartment", community: "Jumeirah Village Circle", building: "Circle Park Residences", bedrooms: 1, bathrooms: 2, sizeSqft: 780, price: 780_000, type: "Apartment", availability: "Available", features: ["Rental demand", "Pool", "Ready to move"], hue: 12 },
  { id: "p13", ref: "AIM-PJ-0488", title: "5BR Signature Villa", community: "Palm Jumeirah", building: "Frond G Villas", bedrooms: 5, bathrooms: 6, sizeSqft: 7_100, price: 14_500_000, type: "Villa", availability: "Reserved", features: ["Private pool", "Sea view", "Beach access"], hue: 176 },
  { id: "p14", ref: "AIM-AR-8120", title: "4BR Villa", community: "Arabian Ranches", building: "Meadow Lane Villas", bedrooms: 4, bathrooms: 5, sizeSqft: 3_900, price: 4_900_000, type: "Villa", availability: "Sold", features: ["Garden", "Near schools", "Private pool"], hue: 44 },
  { id: "p15", ref: "AIM-CW-2230", title: "2BR Apartment", community: "City Walk", building: "Walkside Residences", bedrooms: 2, bathrooms: 3, sizeSqft: 1_380, price: 2_600_000, type: "Apartment", availability: "Available", features: ["Terrace", "Burj Khalifa view", "Ready to move"], hue: 262 },
  { id: "p16", ref: "AIM-DM-2011", title: "1BR Apartment", community: "Dubai Marina", building: "Marina Vista Tower", bedrooms: 1, bathrooms: 2, sizeSqft: 820, price: 1_100_000, type: "Apartment", availability: "Available", features: ["Partial marina view", "Close to metro"], hue: 218 },
  { id: "p17", ref: "AIM-DH-5544", title: "3BR Apartment", community: "Dubai Hills Estate", building: "Park Heights", bedrooms: 3, bathrooms: 3, sizeSqft: 1_720, price: 2_300_000, type: "Apartment", availability: "Available", features: ["Park view", "Near schools"], hue: 128 },
  { id: "p18", ref: "AIM-DD-1190", title: "Penthouse", community: "Downtown Dubai", building: "Opera Crest Residences", bedrooms: 4, bathrooms: 5, sizeSqft: 4_300, price: 11_800_000, type: "Penthouse", availability: "Available", features: ["Burj Khalifa view", "Private pool", "High floor"], hue: 40 },
];

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

const I = (p: Partial<LeadInterest>): LeadInterest => ({
  bedrooms: null,
  propertyType: null,
  location: null,
  budget: null,
  intent: null,
  purpose: null,
  timeline: null,
  financing: null,
  preferences: [],
  ...p,
});

interface Seed {
  id: string;
  name: string;
  phone: string;
  source: LeadSource;
  language?: string;
  nationality?: string;
  interest: LeadInterest;
  engagement: number;
  status: LeadStatus;
  agentId: string | null;
  createdMin: number; // minutes ago
  lastContactMin: number;
  afterHours?: boolean;
  summary?: string;
}

const SEEDS: Seed[] = [
  { id: "l1", name: "Ahmed Khan", phone: "+971 50 214 7789", source: "Website", nationality: "Pakistan", interest: I({ bedrooms: 2, propertyType: "Apartment", location: "Dubai Marina", budget: 1_500_000, intent: "Buy", purpose: "Investment", timeline: "Within 30 days", financing: "Financing confirmed", preferences: ["Marina view", "High floor", "Close to metro"] }), engagement: 90, status: "appointment", agentId: "a1", createdMin: 190, lastContactMin: 12,
    summary: "Ahmed is actively looking for a 2-bedroom apartment in Dubai Marina with a budget of AED 1.5M. He intends to purchase within 30 days and has confirmed financing." },
  { id: "l2", name: "Sarah Ali", phone: "+971 55 381 0462", source: "Instagram", nationality: "UAE", interest: I({ bedrooms: 1, propertyType: "Apartment", location: "Downtown Dubai", budget: 900_000, intent: "Buy", timeline: "3–6 months", financing: "Not discussed", preferences: ["Close to metro"] }), engagement: 70, status: "appointment", agentId: "a2", createdMin: 60 * 26, lastContactMin: 95 },
  { id: "l3", name: "John Smith", phone: "+971 52 907 3318", source: "Property Portal", nationality: "United Kingdom", interest: I({ bedrooms: 2, propertyType: "Apartment", location: "Business Bay", budget: 2_100_000, intent: "Buy", purpose: "Investment", timeline: "Immediately", financing: "Cash buyer", preferences: ["Burj Khalifa view", "High floor"] }), engagement: 88, status: "qualified", agentId: "a2", createdMin: 60 * 14, lastContactMin: 60 * 9, afterHours: true },
  { id: "l4", name: "Fatima Al Mansoori", phone: "+971 50 662 1904", source: "WhatsApp", language: "Arabic", nationality: "UAE", interest: I({ bedrooms: 3, propertyType: "Apartment", location: "Palm Jumeirah", budget: 3_300_000, intent: "Buy", purpose: "End use", timeline: "Within 30 days", financing: "Mortgage pre-approved", preferences: ["Sea view"] }), engagement: 85, status: "appointment", agentId: "a3", createdMin: 60 * 30, lastContactMin: 60 * 3 },
  { id: "l5", name: "Rahul Mehta", phone: "+971 56 118 4520", source: "Referral", nationality: "India", interest: I({ bedrooms: 3, propertyType: "Townhouse", location: "Dubai Hills Estate", budget: 3_500_000, intent: "Buy", purpose: "End use", timeline: "1–3 months", financing: "Mortgage pre-approved", preferences: ["Garden", "Near schools"] }), engagement: 80, status: "appointment", agentId: "a4", createdMin: 60 * 52, lastContactMin: 60 * 5 },
  { id: "l6", name: "Elena Petrova", phone: "+971 58 430 2271", source: "Facebook", language: "Russian", nationality: "Russia", interest: I({ bedrooms: 2, propertyType: "Apartment", location: "Downtown Dubai", budget: 2_400_000, intent: "Buy", purpose: "Investment", timeline: "Within 30 days", financing: "Cash buyer", preferences: ["Burj Khalifa view"] }), engagement: 76, status: "appointment", agentId: "a2", createdMin: 60 * 70, lastContactMin: 60 * 20 },
  { id: "l7", name: "Mohammed Rashid", phone: "+971 50 775 9036", source: "WhatsApp", nationality: "Saudi Arabia", interest: I({ bedrooms: 1, propertyType: "Apartment", location: "Dubai Creek Harbour", budget: 1_200_000, intent: "Buy", purpose: "Investment", timeline: "1–3 months", financing: "Cash buyer", preferences: ["Payment plan"] }), engagement: 70, status: "appointment", agentId: "a1", createdMin: 60 * 96, lastContactMin: 60 * 26 },
  { id: "l8", name: "Chloe Bennett", phone: "+971 54 209 6613", source: "Website", nationality: "Australia", interest: I({ bedrooms: 1, propertyType: "Apartment", location: "Jumeirah Village Circle", budget: 800_000, intent: "Buy", purpose: "Investment", timeline: "Within 30 days", financing: "Mortgage pre-approved", preferences: ["Rental demand"] }), engagement: 74, status: "qualified", agentId: "a1", createdMin: 60 * 7, lastContactMin: 60 * 2 },
  { id: "l9", name: "Yusuf Demir", phone: "+971 52 340 8857", source: "Instagram", nationality: "Türkiye", interest: I({ bedrooms: 2, propertyType: "Apartment", location: "Jumeirah Lake Towers", budget: 1_300_000, intent: "Buy", timeline: "3–6 months" }), engagement: 66, status: "qualified", agentId: "a1", createdMin: 60 * 40, lastContactMin: 60 * 22 },
  { id: "l10", name: "Aisha Siddiqui", phone: "+971 55 902 1147", source: "Website", nationality: "Canada", interest: I({ bedrooms: 2, propertyType: "Apartment", location: "Dubai Hills Estate", budget: 1_900_000, intent: "Buy", purpose: "End use", timeline: "3–6 months", financing: "Needs mortgage advice" }), engagement: 60, status: "qualified", agentId: "a4", createdMin: 60 * 60, lastContactMin: 60 * 30 },
  { id: "l11", name: "Liam O'Connor", phone: "+971 56 671 3380", source: "Property Portal", nationality: "Ireland", interest: I({ bedrooms: 1, propertyType: "Apartment", location: "Business Bay", budget: 110_000, intent: "Rent", purpose: "End use", timeline: "Immediately" }), engagement: 78, status: "qualified", agentId: "a2", createdMin: 60 * 20, lastContactMin: 60 * 4 },
  { id: "l12", name: "Hana Kobayashi", phone: "+971 58 245 7710", source: "Facebook", nationality: "Japan", interest: I({ bedrooms: 2, propertyType: "Apartment", location: "City Walk", budget: 2_500_000, intent: "Buy", purpose: "Investment", timeline: "6+ months", financing: "Cash buyer" }), engagement: 55, status: "qualified", agentId: "a3", createdMin: 60 * 110, lastContactMin: 60 * 48 },
  { id: "l13", name: "Omar Farouk", phone: "+971 50 818 2295", source: "WhatsApp", language: "Arabic", nationality: "Egypt", interest: I({ bedrooms: 3, propertyType: "Villa", location: "Arabian Ranches", intent: "Buy", purpose: "End use", timeline: "1–3 months", preferences: ["Near schools"] }), engagement: 68, status: "qualified", agentId: "a4", createdMin: 60 * 34, lastContactMin: 60 * 11 },
  { id: "l14", name: "Priyanka Sharma", phone: "+971 52 144 6029", source: "Website", nationality: "India", interest: I({ bedrooms: 1, propertyType: "Apartment", location: "Downtown Dubai", budget: 1_100_000, timeline: "1–3 months" }), engagement: 62, status: "contacted", agentId: "a2", createdMin: 60 * 9, lastContactMin: 60 * 8 },
  { id: "l15", name: "Karim Haddad", phone: "+971 55 530 9981", source: "Referral", nationality: "Lebanon", interest: I({ bedrooms: 2, propertyType: "Apartment", location: "Palm Jumeirah", budget: 2_800_000, intent: "Buy" }), engagement: 58, status: "qualified", agentId: "a3", createdMin: 60 * 80, lastContactMin: 60 * 36 },
  { id: "l16", name: "Sophie Laurent", phone: "+971 54 377 0158", source: "Instagram", nationality: "France", interest: I({ bedrooms: 2, propertyType: "Apartment", location: "Dubai Marina", budget: 150_000, intent: "Rent", purpose: "End use", timeline: "1–3 months", preferences: ["Marina view"] }), engagement: 64, status: "qualified", agentId: "a1", createdMin: 60 * 44, lastContactMin: 60 * 18 },
  { id: "l17", name: "Ali Raza", phone: "+971 50 603 7742", source: "Facebook", nationality: "Pakistan", interest: I({ location: "Jumeirah Village Circle" }), engagement: 40, status: "new", agentId: null, createdMin: 38, lastContactMin: 37 },
  { id: "l18", name: "Natalia Kowalski", phone: "+971 58 912 4406", source: "Instagram", nationality: "Poland", interest: I({ bedrooms: 1, intent: "Rent" }), engagement: 45, status: "new", agentId: null, createdMin: 75, lastContactMin: 74 },
  { id: "l19", name: "Imran Qureshi", phone: "+971 56 227 5913", source: "Property Portal", nationality: "UK", interest: I({ location: "Business Bay", budget: 700_000, timeline: "6+ months" }), engagement: 38, status: "contacted", agentId: "a2", createdMin: 60 * 100, lastContactMin: 60 * 70 },
  { id: "l20", name: "Grace Thompson", phone: "+971 52 468 3307", source: "Website", nationality: "USA", interest: I({ bedrooms: 2, location: "Dubai Hills Estate", timeline: "6+ months" }), engagement: 42, status: "contacted", agentId: "a4", createdMin: 60 * 120, lastContactMin: 60 * 90 },
  { id: "l21", name: "Tariq Aziz", phone: "+971 50 390 6624", source: "WhatsApp", nationality: "Jordan", interest: I({ budget: 3_000_000 }), engagement: 30, status: "new", agentId: null, createdMin: 140, lastContactMin: 139, afterHours: true },
  { id: "l22", name: "Mei Lin", phone: "+971 55 716 0839", source: "Website", nationality: "Singapore", interest: I({ bedrooms: 0, location: "Downtown Dubai", intent: "Buy", timeline: "6+ months", propertyType: "Apartment" }), engagement: 50, status: "contacted", agentId: "a2", createdMin: 60 * 130, lastContactMin: 60 * 60 },
  { id: "l23", name: "Zain Malik", phone: "+971 54 851 2270", source: "Instagram", nationality: "UAE", interest: I({}), engagement: 35, status: "new", agentId: null, createdMin: 210, lastContactMin: 208 },
  { id: "l24", name: "Victoria Hughes", phone: "+971 58 303 9145", source: "Facebook", nationality: "United Kingdom", interest: I({ location: "Palm Jumeirah", propertyType: "Villa" }), engagement: 48, status: "new", agentId: null, createdMin: 260, lastContactMin: 255 },
];

function emailFor(name: string) {
  return `${name.toLowerCase().split(" ")[0]!.replace(/[^a-z]/g, "")}@example.com`;
}

export function buildLeads(): Lead[] {
  return SEEDS.map((s) => {
    const score = scoreLead(s.interest, s.engagement);
    const created = minutesAgo(s.createdMin);
    const hasAppt = s.status === "appointment";
    const qualifiedAt = new Date(new Date(created).getTime() + 4 * 60_000).toISOString();
    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      email: emailFor(s.name),
      source: s.source,
      language: s.language ?? "English",
      nationality: s.nationality,
      interest: s.interest,
      engagement: s.engagement,
      score,
      status: s.status,
      agentId: s.agentId,
      createdAt: created,
      lastContact: minutesAgo(s.lastContactMin),
      nextFollowUp: null,
      summary: s.summary ?? summarizeLead(s.name, s.interest),
      recommendedAction: recommendAction(score, hasAppt),
      afterHours: s.afterHours,
      activity: [
        { id: `${s.id}-a1`, at: created, kind: "created", text: `Lead received from ${s.source}${s.afterHours ? " (after hours)" : ""}` },
        { id: `${s.id}-a2`, at: new Date(new Date(created).getTime() + 20_000).toISOString(), kind: "ai", text: `AI replied in ${s.afterHours ? 18 : 9} seconds on ${s.source === "WhatsApp" ? "WhatsApp" : s.source === "Instagram" ? "Instagram DM" : "WhatsApp"}` },
        ...(s.status !== "new"
          ? [
              { id: `${s.id}-a3`, at: qualifiedAt, kind: "qualified" as const, text: "Qualification questions answered" },
              { id: `${s.id}-a4`, at: qualifiedAt, kind: "scored" as const, text: `AI lead score: ${score.total}/100 (${score.temperature.toUpperCase()})` },
              { id: `${s.id}-a5`, at: qualifiedAt, kind: "crm" as const, text: "CRM record created and requirements saved" },
            ]
          : []),
        ...(s.agentId
          ? [{ id: `${s.id}-a6`, at: qualifiedAt, kind: "agent" as const, text: `Assigned to ${AGENTS.find((a) => a.id === s.agentId)!.name}` }]
          : []),
      ],
    };
  });
}

/* ------------------------------------------------------------------ */
/* Conversations                                                       */
/* ------------------------------------------------------------------ */

type ScriptLine = { from: Message["from"]; text: string; translation?: string };

/** The flagship script used on the AI Conversations screen (also replayable). */
export const AHMED_SCRIPT: ScriptLine[] = [
  { from: "lead", text: "Hi, I'm looking for a 2 bedroom apartment in Dubai Marina." },
  { from: "ai", text: "Absolutely. I can help with that. Are you looking to buy or rent?" },
  { from: "lead", text: "Buy." },
  { from: "ai", text: "Great. What's your approximate budget?" },
  { from: "lead", text: "Around AED 1.5 million." },
  { from: "ai", text: "Thanks. And when are you planning to purchase?" },
  { from: "lead", text: "Within the next month." },
  { from: "ai", text: "Perfect. I have enough information to help narrow down suitable properties. Would you like to schedule a viewing?" },
  { from: "lead", text: "Yes, Friday evening works. It's an investment and my financing is already approved. Ideally a high floor with a marina view, close to the metro." },
  { from: "ai", text: "Noted. I've reserved Friday at 5:00 PM for a viewing in Dubai Marina with Omar Saleh, our Marina specialist. I'll send you 3 shortlisted apartments before then." },
  { from: "system", text: "Viewing booked · Assigned to Omar Saleh · CRM record updated" },
];

function fromScript(leadId: string, lines: ScriptLine[], startMin: number, stepMin = 1): Message[] {
  return lines.map((l, idx) => {
    const ex = l.from === "lead" ? describeExtraction(extractLeadData(l.text)) : undefined;
    return {
      id: `${leadId}-m${idx}`,
      from: l.from,
      text: l.text,
      translation: l.translation,
      at: minutesAgo(Math.max(0, startMin - idx * stepMin)),
      extracted: ex && ex.length ? ex : undefined,
    };
  });
}

export function buildConversations(): Conversation[] {
  return [
    { leadId: "l1", channel: "WhatsApp", mode: "ai", unread: 0, messages: fromScript("l1", AHMED_SCRIPT, 22) },
    {
      leadId: "l17",
      channel: "Facebook",
      mode: "ai",
      unread: 1,
      messages: fromScript("l17", [
        { from: "lead", text: "Hello, do you have anything in JVC?" },
        { from: "ai", text: "Hi Ali, thanks for reaching out. Yes, we have several options in Jumeirah Village Circle. How many bedrooms are you looking for?" },
      ], 38),
    },
    {
      leadId: "l3",
      channel: "WhatsApp",
      mode: "ai",
      unread: 0,
      messages: fromScript("l3", [
        { from: "system", text: "After-hours enquiry · 11:42 PM · answered automatically" },
        { from: "lead", text: "Saw your Business Bay listing on the portal. I want to buy a 2 bed, budget about 2.1m." },
        { from: "ai", text: "Thanks for your message, John. Happy to help. Is this for investment or to live in, and when are you looking to complete?" },
        { from: "lead", text: "Investment. Cash buyer, I can move immediately if the numbers work." },
        { from: "ai", text: "Understood. I've shortlisted 2-bedroom units in Business Bay around AED 2.1M with strong rental demand. Nadia Rahman will call you at 10:00 AM with rental yield details. Does that time work?" },
        { from: "lead", text: "Yes, 10 works." },
      ], 60 * 14, 2),
    },
    {
      leadId: "l4",
      channel: "WhatsApp",
      mode: "ai",
      unread: 0,
      messages: fromScript("l4", [
        { from: "lead", text: "مرحبا، أبحث عن شقة بثلاث غرف نوم في نخلة جميرا للشراء", translation: "Hello, I'm looking to buy a three-bedroom apartment on Palm Jumeirah." },
        { from: "system", text: "Language detected: Arabic · AI replying in Arabic" },
        { from: "ai", text: "أهلاً فاطمة! يسعدني مساعدتك. ما هي الميزانية التقريبية، ومتى تخططين للشراء؟", translation: "Welcome Fatima! Happy to help. What is your approximate budget, and when are you planning to buy?" },
        { from: "lead", text: "حوالي 3.3 مليون درهم، خلال شهر. التمويل معتمد مسبقاً", translation: "Around AED 3.3 million, within a month. Financing is pre-approved." },
        { from: "ai", text: "ممتاز. لدينا خيارات بإطلالة على البحر ضمن ميزانيتك. هل يناسبك موعد للمعاينة يوم الخميس الساعة 4 مساءً؟", translation: "Excellent. We have sea-view options within your budget. Would Thursday at 4 PM suit you for a viewing?" },
        { from: "lead", text: "نعم مناسب", translation: "Yes, that works." },
      ], 60 * 30, 3),
    },
    {
      leadId: "l2",
      channel: "Instagram",
      mode: "agent",
      unread: 0,
      messages: fromScript("l2", [
        { from: "lead", text: "Hi! Saw your reel about Downtown. Looking for a 1 bedroom to buy, around 900k." },
        { from: "ai", text: "Hi Sarah, thanks for getting in touch. Downtown has some good 1-bedroom options around AED 900K. When are you planning to buy?" },
        { from: "lead", text: "Probably in 4 or 5 months, still figuring out the mortgage side." },
        { from: "ai", text: "That's helpful, thank you. Would a short consultation with our Downtown specialist help? She can walk you through mortgage options and current listings." },
        { from: "lead", text: "Yes please, Saturday morning if possible." },
        { from: "system", text: "Consultation booked for Saturday 11:00 AM · Nadia Rahman took over the conversation" },
        { from: "agent", text: "Hi Sarah, Nadia here. Looking forward to Saturday. I'll bring 3 options near the metro and a mortgage adviser contact." },
      ], 60 * 26, 5),
    },
    {
      leadId: "l21",
      channel: "WhatsApp",
      mode: "ai",
      unread: 1,
      messages: fromScript("l21", [
        { from: "system", text: "After-hours enquiry · answered automatically" },
        { from: "lead", text: "What can I get for 3 million?" },
        { from: "ai", text: "Good evening, Tariq. With around AED 3M there are strong options across Dubai. Are you considering an apartment or a villa, and do you have a preferred area?" },
      ], 140),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Follow-ups                                                          */
/* ------------------------------------------------------------------ */

/** "Today at 4 PM", or a little later today if that time has already passed. */
function todayAtOrSoon(hour: number) {
  const iso = atDayOffset(0, hour);
  if (new Date(iso).getTime() > Date.now() + 20 * 60_000) return iso;
  const d = new Date(Date.now() + 45 * 60_000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return d.toISOString();
}

export function buildFollowUps(): FollowUp[] {
  return [
    { id: "f1", leadId: "l1", dueAt: todayAtOrSoon(16), channel: "WhatsApp", reason: "Send shortlist before Friday viewing", message: "Hi Ahmed, here are the 3 Dubai Marina apartments we'll view on Friday at 5:00 PM. The Marina Vista Tower unit at AED 1.45M is the closest match to your brief. See you then.", status: "scheduled", progress: 3 },
    { id: "f2", leadId: "l2", dueAt: atDayOffset(1, 11), channel: "WhatsApp", reason: "Confirm Saturday consultation", message: "Hi Sarah, a quick reminder about your consultation with Nadia on Saturday at 11:00 AM. Would you like us to include a mortgage adviser?", status: "scheduled", progress: 3 },
    { id: "f3", leadId: "l3", dueAt: atDayOffset(2, 10), channel: "Email", reason: "Share rental yield comparison", message: "Hi John, as promised, attached is a rental yield comparison for the two Business Bay units we discussed. Happy to arrange viewings this week.", status: "scheduled", progress: 3 },
    { id: "f4", leadId: "l8", dueAt: todayAtOrSoon(18), channel: "WhatsApp", reason: "No reply for 24 hours", message: "Hi Chloe, I found two JVC 1-bedroom apartments under AED 800K with strong rental demand. Would you like the details?", status: "scheduled", progress: 3 },
    { id: "f5", leadId: "l9", dueAt: atDayOffset(1, 15), channel: "WhatsApp", reason: "Re-engage with new JLT listings", message: "Hi Yusuf, three new 2-bedroom listings came up in JLT this week within your budget. Shall I send them over?", status: "scheduled", progress: 3 },
    { id: "f6", leadId: "l11", dueAt: atDayOffset(1, 10), channel: "Call task", reason: "Tenant wants to move immediately", message: "Call Liam to confirm move-in date and share 2 Business Bay 1-bedroom rentals.", status: "scheduled", progress: 3 },
    { id: "f7", leadId: "l10", dueAt: atDayOffset(3, 12), channel: "Email", reason: "Mortgage advice requested", message: "Hi Aisha, I've connected you with our mortgage partner and attached 3 Dubai Hills options that fit your budget.", status: "scheduled", progress: 3 },
    { id: "f8", leadId: "l12", dueAt: atDayOffset(4, 16), channel: "WhatsApp", reason: "Long timeline — monthly nurture", message: "Hi Hana, sharing this month's City Walk market update and two new investment listings.", status: "scheduled", progress: 3 },
  ];
}

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */

export function buildAppointments(): Appointment[] {
  return [
    { id: "ap1", leadId: "l1", type: "Property Viewing", location: "Dubai Marina", propertyId: "p1", at: nextWeekday(5, 17), durationMin: 60, agentId: "a1", status: "confirmed", bookedBy: "AI" },
    { id: "ap2", leadId: "l2", type: "Property Consultation", location: "Downtown Dubai", at: nextWeekday(6, 11), durationMin: 45, agentId: "a2", status: "confirmed", bookedBy: "AI" },
    { id: "ap3", leadId: "l4", type: "Property Viewing", location: "Palm Jumeirah", propertyId: "p6", at: nextWeekday(4, 16), durationMin: 60, agentId: "a3", status: "confirmed", bookedBy: "AI" },
    { id: "ap4", leadId: "l5", type: "Property Viewing", location: "Dubai Hills Estate", propertyId: "p10", at: nextWeekday(6, 15), durationMin: 75, agentId: "a4", status: "confirmed", bookedBy: "Agent" },
    { id: "ap5", leadId: "l6", type: "Video Call", location: "Downtown Dubai", at: nextWeekday(0, 12), durationMin: 30, agentId: "a2", status: "pending", bookedBy: "AI" },
    { id: "ap6", leadId: "l7", type: "Off-plan Presentation", location: "Dubai Creek Harbour", propertyId: "p11", at: nextWeekday(1, 11), durationMin: 60, agentId: "a1", status: "confirmed", bookedBy: "AI" },
  ];
}

/* ------------------------------------------------------------------ */
/* Automations                                                         */
/* ------------------------------------------------------------------ */

export function buildWorkflows(): Workflow[] {
  return [
    { id: "w1", name: "New Lead Qualification", description: "Replies to every new enquiry within seconds, asks the qualification questions and creates the CRM record.", steps: ["Website lead", "AI response", "Qualification", "Lead score", "CRM"], active: true, runsToday: 11, lastRun: minutesAgo(12), icon: "zap" },
    { id: "w2", name: "Follow-up Automation", description: "Chases leads who go quiet, with a personalised message and an agent alert.", steps: ["No response", "Wait 24 hours", "AI follow-up", "Notify agent"], active: true, runsToday: 7, lastRun: minutesAgo(48), icon: "repeat" },
    { id: "w3", name: "Appointment Automation", description: "Offers qualified leads real agent availability and books the viewing.", steps: ["Qualified lead", "Offer available slots", "Booking", "Agent notification"], active: true, runsToday: 4, lastRun: minutesAgo(22), icon: "calendar" },
    { id: "w4", name: "After-hours Response", description: "Covers evenings, weekends and holidays so no enquiry waits until morning.", steps: ["Enquiry after 7 PM", "AI response", "Qualification", "Morning summary to team"], active: true, runsToday: 3, lastRun: minutesAgo(60 * 9), icon: "moon" },
    { id: "w5", name: "Hot Lead Routing", description: "Sends hot leads to the right specialist by community and alerts them instantly.", steps: ["Score ≥ 75", "Match community specialist", "Assign agent", "WhatsApp alert"], active: false, runsToday: 0, lastRun: minutesAgo(60 * 30), icon: "users" },
  ];
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function buildNotifications(): AppNotification[] {
  return [
    { id: "n1", title: "Viewing booked by AI", body: "Ahmed Khan · Dubai Marina · Friday 5:00 PM", at: minutesAgo(12), read: false, tone: "success", link: "/app/appointments" },
    { id: "n2", title: "New lead: Ali Raza", body: "Facebook enquiry about JVC · AI replied in 9s", at: minutesAgo(38), read: false, tone: "primary", link: "/app/leads/l17" },
    { id: "n3", title: "Hot lead qualified", body: "Chloe Bennett scored 85/100 · assigned to Omar Saleh", at: minutesAgo(60 * 2), read: false, tone: "hot", link: "/app/leads/l8" },
    { id: "n4", title: "After-hours enquiry handled", body: "Tariq Aziz · WhatsApp · answered automatically", at: minutesAgo(139), read: true, tone: "warm", link: "/app/conversations/l21" },
  ];
}

/* ------------------------------------------------------------------ */
/* Analytics series (last 14 days)                                     */
/* ------------------------------------------------------------------ */

export function buildDailySeries() {
  const newLeads = [2, 3, 1, 4, 3, 2, 4, 3, 4, 2, 5, 3, 4, 3];
  const qualified = [1, 2, 1, 2, 2, 1, 3, 2, 3, 1, 3, 2, 2, 2];
  const hot = [0, 1, 0, 1, 1, 0, 2, 1, 1, 0, 2, 1, 1, 1];
  return newLeads.map((n, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    return {
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      newLeads: n,
      qualified: qualified[idx]!,
      hot: hot[idx]!,
    };
  });
}

/** Seed for the lead that "arrives" when the presenter clicks Simulate new lead. */
export const INCOMING_LEAD_SCRIPT = {
  name: "Mariam Hassan",
  phone: "+971 55 460 1182",
  source: "WhatsApp" as LeadSource,
  nationality: "UAE",
  lines: [
    { from: "lead", text: "Hi, is the 2 bedroom in Dubai Marina still available? I'd like to buy." },
    { from: "ai", text: "Hi Mariam, thanks for your message. Yes, we have 2-bedroom apartments available in Dubai Marina. What's your approximate budget?" },
    { from: "lead", text: "Up to 1.6 million. Hoping to buy within the next month, cash." },
    { from: "ai", text: "Great, that fits several options. Would you like to see them this weekend? I can offer Saturday at 2:00 PM or Sunday at 11:00 AM." },
  ] as ScriptLine[],
};
