import { RouterProvider, matchPath, useRouter } from "@/lib/router";
import { DemoProvider } from "@/store/demo-store";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/shared/toaster";
import LandingPage from "@/pages/landing";
import OverviewPage from "@/pages/app/overview";
import LeadsPage from "@/pages/app/leads";
import LeadProfilePage from "@/pages/app/lead-profile";
import ConversationsPage from "@/pages/app/conversations";
import FollowUpsPage from "@/pages/app/follow-ups";
import AppointmentsPage from "@/pages/app/appointments";
import PropertiesPage from "@/pages/app/properties";
import AnalyticsPage from "@/pages/app/analytics";
import AutomationsPage from "@/pages/app/automations";
import SettingsPage from "@/pages/app/settings";
import NotFound from "@/pages/app/not-found";

function Routes() {
  const { path } = useRouter();
  if (!path.startsWith("/app")) return <LandingPage />;

  let page: React.ReactNode;
  let params: Record<string, string> | null;
  if (path === "/app" || path === "/app/") page = <OverviewPage />;
  else if (path === "/app/leads") page = <LeadsPage />;
  else if ((params = matchPath("/app/leads/:id", path))) page = <LeadProfilePage id={params.id!} />;
  else if (path === "/app/conversations") page = <ConversationsPage />;
  else if ((params = matchPath("/app/conversations/:id", path))) page = <ConversationsPage id={params.id} />;
  else if (path === "/app/follow-ups") page = <FollowUpsPage />;
  else if (path === "/app/appointments") page = <AppointmentsPage />;
  else if (path === "/app/properties") page = <PropertiesPage />;
  else if (path === "/app/analytics") page = <AnalyticsPage />;
  else if (path === "/app/automations") page = <AutomationsPage />;
  else if (path === "/app/settings") page = <SettingsPage />;
  else page = <NotFound />;

  return <AppShell key="shell">{page}</AppShell>;
}

export default function App() {
  return (
    <RouterProvider>
      <DemoProvider>
        <Routes />
        <Toaster />
      </DemoProvider>
    </RouterProvider>
  );
}
