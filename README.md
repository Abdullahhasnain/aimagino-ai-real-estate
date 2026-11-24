# AImagino AI Real Estate — Sales Demo

A clickable SaaS demo for **AImagino Solution** showing how AI turns property enquiries into qualified appointments:

**New lead → AI conversation → Qualification → AI lead scoring → CRM record → Follow-up → Appointment → Sales dashboard**

All people, listings and numbers are fictional sample data. The app shows a **DEMO MODE** label throughout.

## Run it locally

Requires Node.js 18+.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # production build in dist/
npm run build:single # ONE self-contained HTML file in dist-single/index.html
npm run preview      # serve the production build
```

## Working zero-cost intake

Open `/#/enquire` to use the real property-enquiry form. Submissions are qualified, scored, matched to listings and persisted in the browser workspace. They appear immediately in Leads and Conversations.

For cross-device delivery, copy `.env.example` to `.env.local` and set `VITE_LEAD_WEBHOOK_URL` to an HTTPS endpoint such as a Google Apps Script web app. Each submission sends `{ lead, message }` as JSON while retaining a local copy.

### Supabase Free central database and login

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Create the agency user under Authentication → Users.
3. Insert that user's UUID and a workspace slug into `workspace_members` using the final statement documented in the schema.
4. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and the matching `VITE_WORKSPACE_SLUG`.
5. Rebuild the app. Public enquiries will be stored centrally, and `/#/app` will require the agency user's login.

The browser receives only Supabase's public anonymous key. Row-level security restricts dashboard reads to users assigned to the matching workspace.

### Optional production integrations on Vercel

`api/lead.js` is a server-side lead-delivery endpoint. Configure only the integrations the agency owns:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WORKSPACE_SLUG` for server-side central storage.
- `HUBSPOT_PRIVATE_APP_TOKEN` for contact upsert into the existing CRM.
- `RESEND_API_KEY`, `LEAD_NOTIFICATION_EMAIL`, `LEAD_FROM_EMAIL` for real new-lead email alerts.
- `ALLOWED_ORIGIN` to restrict production submissions to the deployed site origin.

Secrets must be stored in Vercel project environment variables, never in `VITE_*` variables or committed files. Appointments include an **Add to Google** action that opens a pre-filled real Google Calendar event without requiring paid infrastructure.

`dist-single/index.html` can be emailed, hosted on any static host, or opened straight from disk.

## Before you send it to a prospect

Edit `src/config/brand.ts`:

| Field | What it does |
|---|---|
| `bookingUrl` | Your Calendly / booking link. When set, **Book an AI Automation Demo** opens it. |
| `contactEmail`, `contactPhone` | Shown after someone submits the booking form. |
| `defaultAgencyName` | Workspace name shown in the sidebar. |

You can also rename the workspace live in **Settings → Agency name** to show the prospect their own agency name during a call. **Settings → Reset demo data** (or the profile menu) restores everything between presentations.

## Suggested demo script (5 minutes)

1. **Landing page** — the problem and the 8-step workflow. Click **View Live Demo**.
2. **Overview** — click **Simulate new lead**. Watch a WhatsApp enquiry get answered, qualified, scored, saved to the CRM, scheduled for follow-up and assigned to an agent. KPIs update live.
3. **AI Conversations** — open Ahmed Khan and click **Replay live**. The right panel fills in property, location, budget, purpose and timeline as he replies; the score climbs from cold to 87/100 HOT and a Friday viewing is booked.
4. **Test the AI yourself** — type as the customer (for example “2 bed in JVC”, “buy, around 900k”, “in 2 months”, “Saturday morning works”).
5. **Lead profile** — AI summary, recommended action, score breakdown, property matches, CRM activity; try Schedule Viewing, Send Follow-up, Assign Agent.
6. **Follow-ups** — click **Run Follow-up** on Ahmed and watch the automation timeline complete; he replies a few seconds later.
7. **Automations** — pause **New Lead Qualification**, then simulate a new lead to show what happens without automation.
8. **Analytics** — funnel 24 → 15 → 7 → 6, sources, after-hours enquiries.

## Project structure

```
src/
  config/brand.ts          Branding, CTA and contact settings
  types.ts                 Domain types (Lead, Conversation, Property, ...)
  data/mock.ts             Demo dataset (dates generated relative to "now")
  services/ai.ts           Mock AI: extraction, scoring, replies, property matching, drafts
  services/integrations.ts Adapters for WhatsApp, CRM, calendar, agent alerts (stubbed)
  store/demo-store.tsx     App state + simulated workflows
  lib/router.tsx           Tiny hash router (works from file:// and static hosts)
  components/ui/           Button, Card, Badge, Dialog, Switch, Popover, ...
  components/shared/       Score ring & breakdown, property matching, workflow strip, dialogs
  components/layout/       Sidebar, top bar (search, notifications, profile)
  pages/                   Landing + dashboard pages
```

## Connecting real systems later

* **AI** — replace the bodies in `services/ai.ts` (`extractLeadData`, `generateReply`, `scoreLead`, `matchProperties`, `draftFollowUp`) with calls to your backend / LLM. The signatures stay the same.
* **Channels & CRM** — implement `services/integrations.ts` (`sendMessage`, `upsertCrmRecord`, `notifyAgent`, `bookCalendarSlot`).
* **Data** — swap the `build*()` functions in `data/mock.ts` for API fetches.

## Notes on the numbers

* Lead scores come from a transparent weighted checklist (budget match, purchase intent, timeline, property fit, engagement) and are labelled as a demo scoring model, not a validated prediction.
* Property match percentages are labelled as demo matching scores, not valuations.
* The ROI calculator on the landing page is an illustrative estimate from the visitor's own inputs, not a guarantee.

Stack: React 18, TypeScript, Vite, Tailwind CSS, shadcn-style components, Lucide icons, Recharts.

## Deploy to Netlify

**Fastest (no account setup beyond login):** unzip `aimagino-netlify-deploy.zip` (or run `npm run build`), then drag the folder onto https://app.netlify.com/drop.

**From Git (auto-deploys on every push):** push this project to GitHub/GitLab, then in Netlify choose *Add new site → Import an existing project*. `netlify.toml` already sets the build command (`npm run build`) and publish folder (`dist`).

**From the CLI:**

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

## Google Search Console

The build adds everything Search Console needs: verification tag, `robots.txt`, `sitemap.xml`, canonical URL, and social-share preview tags (with `public/og-image.png`). Settings live in `site.config.ts`.

1. Deploy the site and note its final address (e.g. `https://aimagino-realestate.netlify.app` or your own domain).
2. In [Google Search Console](https://search.google.com/search-console) choose **Add property → URL prefix** and enter that address.
3. Pick the **HTML tag** method and copy only the `content="…"` value.
4. Add it in **one** of these places:
   * **Netlify (no code change):** *Site configuration → Environment variables* → add `GOOGLE_SITE_VERIFICATION` = your code, and `SITE_URL` = your address. Then *Deploys → Trigger deploy → Clear cache and deploy site*.
   * **Or in code:** set `googleSiteVerification` and `siteUrl` in `site.config.ts`, run `npm run build`, and redeploy.
5. Back in Search Console click **Verify**, then go to **Sitemaps** and submit `sitemap.xml`.

Using a custom domain? You can verify the whole domain with the **Domain** property type and a DNS TXT record instead. That needs no code change.
