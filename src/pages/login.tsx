import * as React from "react";
import { LockKeyhole } from "lucide-react";
import { Logo } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { signIn } from "@/services/cloud";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center"><Logo /></div>
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><LockKeyhole className="size-5 text-primary" />Secure workspace</CardTitle>
              <CardDescription>Sign in with the agency account to view leads, conversations and appointments.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div><Label htmlFor="login-email">Email address</Label><Input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <div><Label htmlFor="login-password">Password</Label><Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" size="lg" loading={loading} className="w-full">Sign in</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
