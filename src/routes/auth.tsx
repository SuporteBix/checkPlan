import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const session = useSession();

  if (session.data) {
    return <Navigate to="/app" />;
  }

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Agenda de Planos</CardTitle>
          <CardDescription>Entre para acessar seus Planos e Anotações.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleLogin} disabled={session.isLoading}>
            Entrar com Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
