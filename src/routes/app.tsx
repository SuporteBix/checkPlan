import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app")({
  // Checagem client-side (sessão vem do localStorage do Supabase client).
  // Não há bridge de cookies para SSR nesta versão — fora do escopo do MVP.
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              to="/app"
              activeOptions={{ exact: true }}
              className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
              activeProps={{ className: "active" }}
            >
              Planos
            </Link>
            <Link
              to="/app/anotacoes"
              className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
              activeProps={{ className: "active" }}
            >
              Todas as Anotações
            </Link>
          </nav>
          <Link
            to="/app/settings"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
