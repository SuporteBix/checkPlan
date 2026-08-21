import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sessionQueryKey } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
      if (!active) return;
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      navigate({ to: "/app", replace: true });
    });

    return () => {
      active = false;
    };
  }, [navigate, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      {errorMessage ? (
        <div>
          <p className="text-lg font-semibold">Não foi possível concluir o login.</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Entrando…</p>
      )}
    </div>
  );
}
