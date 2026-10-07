export type LeadSource = "Website" | "WhatsApp" | "Instagram" | "Facebook" | "Property Portal" | "Referral";
export type Temperature = "hot" | "warm" | "cold";
export type LeadStatus = "new" | "contacted" | "qualified" | "appointment";
export type Intent = "Buy" | "Rent";
export type Purpose = "Investment" | "End use";
export type Timeline = "Immediately" | "Within 30 days" | "1–3 months" | "3–6 months" | "6+ months";
export type Financing = "Cash buyer" | "Mortgage pre-approved" | "Financing confirmed" | "Needs mortgage advice" | "Not discussed";

export interface LeadInterest {
  bedrooms: number | null; // 0 = studio
  propertyType: PropertyType | null;
  location: string | null;
  budget: number | null; // AED
  intent: Intent | null;
  purpose: Purpose | null;
  timeline: Timeline | null;
  financing: Financing | null;
  preferences: string[];
}

export interface ScoreFactors {
  budgetMatch: number;
  purchaseIntent: number;
  timeline: number;
  propertyFit: number;
  engagement: number;
}

export interface ScoreAdjustment {
  label: string;
  points: number;
}

export interface LeadScore {
  total: number;
  temperature: Temperature;
  factors: ScoreFactors;
  adjustments: ScoreAdjustment[];
  explanation: string;
}

export interface ActivityItem {
  id: string;
  at: string;
  kind: "created" | "ai" | "qualified" | "scored" | "crm" | "followup" | "appointment" | "agent" | "note";
  text: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  language: string;
  nationality?: string;
  interest: LeadInterest;
  engagement: number;
  score: LeadScore;
  status: LeadStatus;
  agentId: string | null;
  createdAt: string;
  lastContact: string;
  nextFollowUp: string | null;
  summary: string;
  recommendedAction: string;
  afterHours?: boolean;
  activity: ActivityItem[];
  isNew?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  focus: string;
}

export type MessageFrom = "lead" | "ai" | "agent" | "system";
export interface Message {
  id: string;
  from: MessageFrom;
  text: string;
  at: string;
  translation?: string;
  extracted?: string[]; // chips shown under customer messages: "Budget: AED 1.5M"
}

export interface Conversation {
  leadId: string;
  channel: "WhatsApp" | "Instagram" | "Website chat" | "Facebook";
  messages: Message[];
  mode: "ai" | "agent";
  unread: number;
}

export type PropertyType = "Apartment" | "Villa" | "Townhouse" | "Penthouse";
export type Availability = "Available" | "Reserved" | "Off-plan" | "Sold";

export interface Property {
  id: string;
  ref: string;
  title: string;
  community: string;
  building: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  price: number;
  type: PropertyType;
  availability: Availability;
  features: string[];
  hue: number; // placeholder art tint
}

export interface PropertyMatch {
  property: Property;
  score: number;
  reasons: { label: string; ok: boolean | "partial" }[];
}

export type FollowUpStatus = "scheduled" | "running" | "sent" | "replied";
export interface FollowUp {
  id: string;
  leadId: string;
  dueAt: string;
  channel: "WhatsApp" | "Email" | "Call task";
  reason: string;
  message: string;
  status: FollowUpStatus;
  progress: number; // index of timeline step reached (0-5)
  sentAt?: string;
}

export type AppointmentType = "Property Viewing" | "Property Consultation" | "Video Call" | "Off-plan Presentation";
export interface Appointment {
  id: string;
  leadId: string;
  type: AppointmentType;
  location: string;
  propertyId?: string;
  at: string;
  durationMin: number;
  agentId: string;
  status: "confirmed" | "pending" | "cancelled";
  bookedBy: "AI" | "Agent";
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: string[];
  active: boolean;
  runsToday: number;
  lastRun: string;
  icon: "zap" | "repeat" | "calendar" | "moon" | "users";
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  tone: "hot" | "primary" | "success" | "warm";
  link?: string;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "hot";
}
