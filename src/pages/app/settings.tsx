import * as React from "react";
import { Check, Plug, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/store/demo-store";
import { HOT_THRESHOLD, SCORE_WEIGHTS, WARM_THRESHOLD } from "@/services/ai";
import { BRAND } from "@/config/brand";
import { cloudConfigured } from "@/services/cloud";

const QUESTIONS = [
  { id: "q1", label: "Buy or rent?", on: true },
  { id: "q2", label: "Preferred community", on: true },
  { id: "q3", label: "Number of bedrooms", on: true },
  { id: "q4", label: "Budget", on: true },
  { id: "q5", label: "Purchase timeline", on: true },
  { id: "q6", label: "Investment or end use", on: true },
  { id: "q7", label: "Financing (cash or mortgage)", on: true },
  { id: "q8", label: "Nationality / residency status", on: false },
];

const CHANNELS = [
  { name: "Website enquiry form", status: "Connected" },
  { name: "Local workspace storage", status: "Connected" },
  { name: "Supabase central database", status: cloudConfigured ? "Connected" : "Available" },
  { name: "Lead webhook", status: import.meta.env.VITE_LEAD_WEBHOOK_URL ? "Connected" : "Available" },
  { name: "WhatsApp Business", status: "Available" },
  { name: "Instagram DMs", status: "Available" },
  { name: "Facebook Lead Ads", status: "Available" },
  { name: "Property portal enquiries", status: "Available" },
  { name: "CRM sync", status: "Available" },
  { name: "Google / Outlook calendar", status: "Available" },
];

export default function SettingsPage() {
  const { state, actions } = useDemo();
  const [agency, setAgency] = React.useState(state.agencyName);
  const [questions, setQuestions] = React.useState(QUESTIONS);
  const [languages, setLanguages] = React.useState({ English: true, Arabic: true, Russian: true, Hindi: false, Chinese: false });

  return (
    <>
      <PageHeader title="Settings" description="Configure how qualification and lead routing work for your agency." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>Set the agency name displayed across the workspace and public enquiry form.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (!agency.trim()) return;
                actions.setAgencyName(agency.trim());
                actions.toast({ title: "Workspace renamed", description: `The demo now shows ${agency.trim()}.`, tone: "success" });
              }}
            >
              <div className="flex-1">
                <Label htmlFor="agency-name">Agency name</Label>
                <Input id="agency-name" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. Marina Heights Realty" />
              </div>
              <Button type="submit" disabled={!agency.trim() || agency.trim() === state.agencyName}>Save</Button>
            </form>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="assistant-name">AI assistant name</Label>
                <Input id="assistant-name" defaultValue={BRAND.aiAssistantName} />
              </div>
              <div>
                <Label htmlFor="hours">Office hours</Label>
                <Select id="hours" defaultValue="9-19">
                  <option value="9-19">9:00 AM – 7:00 PM, Mon–Sat</option>
                  <option value="9-18">9:00 AM – 6:00 PM, Mon–Fri</option>
                  <option value="10-20">10:00 AM – 8:00 PM, daily</option>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-[13.5px] font-semibold">Reset workspace data</p>
                <p className="text-[12px] text-muted-foreground">Restore the starter dataset and remove enquiries saved in this browser.</p>
              </div>
              <Button variant="outline" size="sm" onClick={actions.resetDemo}><RotateCcw />Reset</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Qualification questions</CardTitle>
              <CardDescription>What the AI asks before scoring a lead. Asked naturally, one at a time.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {questions.map((q) => (
                <li key={q.id} className="flex items-center justify-between py-2.5">
                  <label htmlFor={`q-${q.id}`} className="text-[13.5px]">{q.label}</label>
                  <Switch id={`q-${q.id}`} checked={q.on} onCheckedChange={(v) => setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, on: v } : x)))} label={q.label} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Lead scoring</CardTitle>
              <CardDescription>Transparent rules-based scoring. Weights and thresholds can be tuned for the agency.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {Object.entries(SCORE_WEIGHTS).map(([k, w]) => (
                <li key={k} className="flex items-center gap-3 text-[13px]">
                  <span className="w-36 capitalize">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle"><div className="h-full rounded-full bg-primary" style={{ width: `${w * 100 * 3}%` }} /></div>
                  <span className="num w-10 text-right font-mono">{Math.round(w * 100)}%</span>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-3 gap-2 text-center text-[12.5px]">
              <div className="rounded-lg bg-hot-soft p-2 text-hot"><p className="font-bold">Hot</p><p className="num font-mono">≥ {HOT_THRESHOLD}</p></div>
              <div className="rounded-lg bg-warm-soft p-2 text-warm"><p className="font-bold">Warm</p><p className="num font-mono">{WARM_THRESHOLD}–{HOT_THRESHOLD - 1}</p></div>
              <div className="rounded-lg bg-cold-soft p-2 text-cold"><p className="font-bold">Cold</p><p className="num font-mono">&lt; {WARM_THRESHOLD}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Languages</CardTitle>
              <CardDescription>The AI detects the lead's language and replies in it.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(languages).map(([lang, on]) => (
              <button
                key={lang}
                onClick={() => setLanguages((l) => ({ ...l, [lang]: !on }))}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${on ? "border-primary bg-primary-soft text-accent-foreground" : "text-muted-foreground hover:bg-subtle"}`}
              >
                {on && <Check className="size-3.5" />}
                {lang}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Channels & integrations</CardTitle>
              <CardDescription>The website form and browser workspace work now. External channels require the agency's own accounts.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CHANNELS.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <span className="flex items-center gap-2.5 text-[13.5px] font-medium"><Plug className="size-4 text-muted-foreground" />{c.name}</span>
                  {c.status === "Connected" ? <Badge variant="success">{c.status}</Badge> : (
                    <Button size="sm" variant="outline" onClick={() => actions.toast({ title: `${c.name}`, description: "Connected during onboarding with the AImagino team." })}>Connect</Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
