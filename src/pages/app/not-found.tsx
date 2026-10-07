import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/router";

export default function NotFound() {
  const { navigate } = useRouter();
  return (
    <EmptyState
      icon={Compass}
      title="This page isn't part of the demo"
      description="Use the sidebar to explore leads, conversations, follow-ups and appointments."
      action={<Button onClick={() => navigate("/app")}>Back to overview</Button>}
      className="py-24"
    />
  );
}
