import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { initSentry } from "@/lib/sentry";
import { queryClient } from "@/lib/query-client";
import { useAuthSync } from "@/lib/auth";
import globalsCss from "@/styles/globals.css?url";

initSentry();

// Error Boundary obrigatório — ver rules/AGENT_RULES.md.
// Sem isso, um erro não tratado no render derruba a aplicação inteira e
// deixa a tela em branco sem nenhuma mensagem.
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center p-6 text-center">
          <div>
            <p className="text-lg font-semibold">Algo deu errado.</p>
            <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Agenda de Planos" },
    ],
    links: [{ rel: "stylesheet", href: globalsCss }],
  }),
  component: RootComponent,
  notFoundComponent: () => <p>Página não encontrada.</p>,
});

function RootComponent() {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <RootErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthSyncBoundary />
            <Outlet />
          </QueryClientProvider>
        </RootErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}

function AuthSyncBoundary() {
  useAuthSync();
  return null;
}
