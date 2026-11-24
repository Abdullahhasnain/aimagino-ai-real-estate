import * as React from "react";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/brand";
import { PropertyMatches } from "@/components/shared/property";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { BRAND } from "@/config/brand";
import { useDemo } from "@/store/demo-store";
import type { Intent, Lead, LeadInterest, PropertyType, Purpose, Timeline } from "@/types";

const LOCATIONS = ["Dubai Marina", "Downtown Dubai", "Business Bay", "Palm Jumeirah", "Dubai Hills Estate", "Jumeirah Village Circle", "Dubai Creek Harbour", "Arabian Ranches"];

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  intent: "Buy" as Intent,
  propertyType: "Apartment" as PropertyType,
  bedrooms: "2",
  location: "Dubai Marina",
  budget: "",
  purpose: "End use" as Purpose,
  timeline: "1–3 months" as Timeline,
  message: "",
};

export default function EnquirePage() {
  const { actions, state } = useDemo();
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [submitted, setSubmitted] = React.useState<Lead | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const budget = Number(form.budget);
    if (!Number.isFinite(budget) || budget <= 0) {
      setError("Please enter a valid budget in AED.");
      return;
    }
    const interest: LeadInterest = {
      intent: form.intent,
      propertyType: form.propertyType,
      bedrooms: Number(form.bedrooms),
      location: form.location,
      budget,
      purpose: form.purpose,
      timeline: form.timeline,
      financing: null,
      preferences: [],
    };
    setLoading(true);
    try {
      const lead = await actions.createLead({ name: form.name, phone: form.phone, email: form.email, message: form.message, interest });
      setSubmitted(lead);
      setForm(EMPTY_FORM);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("We could not save your enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <span className="hidden text-sm text-muted-foreground sm:inline">{state.agencyName}</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <section className="max-w-xl">
          <p className="eyebrow mb-3">Property enquiry</p>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Tell us what you are looking for.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">Share your requirements once. We will qualify your enquiry, find suitable properties and connect you with the right consultant.</p>
          <ul className="mt-8 space-y-4 text-sm">
            {["Requirements saved instantly", "Properties matched against your budget", "A consultant receives the complete brief"].map((item) => (
              <li key={item} className="flex items-center gap-3"><CheckCircle2 className="size-5 text-success" />{item}</li>
            ))}
          </ul>
          <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" />Your details are used only to respond to this property enquiry.</p>
        </section>

        {submitted ? (
          <Card className="self-start border-success/30">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="size-5 text-success" />Enquiry received</CardTitle>
                <CardDescription>Thank you, {submitted.name}. Your requirements have been scored and saved for the sales team.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-subtle p-4 text-sm">
                <div><p className="text-muted-foreground">Lead score</p><p className="font-bold">{submitted.score.total}/100 · {submitted.score.temperature.toUpperCase()}</p></div>
                <div><p className="text-muted-foreground">Status</p><p className="font-bold capitalize">{submitted.status}</p></div>
              </div>
              <PropertyMatches interest={submitted.interest} leadName={submitted.name} />
              <Button className="w-full" onClick={() => setSubmitted(null)}>Submit another enquiry <ArrowRight /></Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="self-start">
            <CardHeader>
              <div>
                <CardTitle>Your requirements</CardTitle>
                <CardDescription>All fields below are used to prepare relevant property matches.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                <div><Label htmlFor="enquiry-name">Full name</Label><Input id="enquiry-name" autoComplete="name" required value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
                <div><Label htmlFor="enquiry-phone">Phone number</Label><Input id="enquiry-phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
                <div className="sm:col-span-2"><Label htmlFor="enquiry-email">Email address</Label><Input id="enquiry-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
                <div><Label htmlFor="enquiry-intent">I want to</Label><Select id="enquiry-intent" value={form.intent} onChange={(e) => update("intent", e.target.value as Intent)}><option>Buy</option><option>Rent</option></Select></div>
                <div><Label htmlFor="enquiry-type">Property type</Label><Select id="enquiry-type" value={form.propertyType} onChange={(e) => update("propertyType", e.target.value as PropertyType)}>{["Apartment", "Villa", "Townhouse", "Penthouse"].map((value) => <option key={value}>{value}</option>)}</Select></div>
                <div><Label htmlFor="enquiry-bedrooms">Bedrooms</Label><Select id="enquiry-bedrooms" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)}><option value="0">Studio</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</Select></div>
                <div><Label htmlFor="enquiry-location">Preferred area</Label><Select id="enquiry-location" value={form.location} onChange={(e) => update("location", e.target.value)}>{LOCATIONS.map((value) => <option key={value}>{value}</option>)}</Select></div>
                <div><Label htmlFor="enquiry-budget">Budget (AED)</Label><Input id="enquiry-budget" inputMode="numeric" min="1" type="number" required placeholder="e.g. 1500000" value={form.budget} onChange={(e) => update("budget", e.target.value)} /></div>
                <div><Label htmlFor="enquiry-timeline">Timeline</Label><Select id="enquiry-timeline" value={form.timeline} onChange={(e) => update("timeline", e.target.value as Timeline)}>{["Immediately", "Within 30 days", "1–3 months", "3–6 months", "6+ months"].map((value) => <option key={value}>{value}</option>)}</Select></div>
                <div className="sm:col-span-2"><Label htmlFor="enquiry-purpose">Purpose</Label><Select id="enquiry-purpose" value={form.purpose} onChange={(e) => update("purpose", e.target.value as Purpose)}><option>End use</option><option>Investment</option></Select></div>
                <div className="sm:col-span-2"><Label htmlFor="enquiry-message">Anything else?</Label><Textarea id="enquiry-message" placeholder="Preferred building, view, payment plan or other requirements" value={form.message} onChange={(e) => update("message", e.target.value)} /></div>
                {error ? <p role="alert" className="sm:col-span-2 text-sm text-danger">{error}</p> : null}
                <Button type="submit" size="lg" loading={loading} className="sm:col-span-2">Send property enquiry <ArrowRight /></Button>
                <p className="sm:col-span-2 text-center text-xs text-muted-foreground">Powered by {BRAND.product}</p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
