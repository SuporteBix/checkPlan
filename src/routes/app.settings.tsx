import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { sessionQueryKey, useSession } from "@/lib/auth";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      navigate({ to: "/auth" });
    },
  });

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>Dados da sua conta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">E-mail</p>
          <p className="text-sm font-medium">{session.data?.user.email ?? "—"}</p>
        </div>
        <Button variant="outline" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
          {signOut.isPending ? "Saindo…" : "Sair"}
        </Button>
        {signOut.isError && (
          <p className="text-sm text-destructive">Não foi possível sair. Tente novamente.</p>
        )}
      </CardContent>
    </Card>
  );
}
