import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const session = useSession();

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (session.data) {
    return <Navigate to="/app" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Agenda de Planos</h1>
      <p className="max-w-md text-muted-foreground">
        Escreva anotações livres dentro de cada Plano e promova manualmente os pontos que viraram
        ação para um Checklist rastreável.
      </p>
      <Button asChild>
        <Link to="/auth">Entrar</Link>
      </Button>
    </div>
  );
}
