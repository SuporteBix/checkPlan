import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import type { AnotacaoComPlano } from "@/lib/types";

export const Route = createFileRoute("/app/anotacoes")({
  component: TodasAnotacoesPage,
});

interface AnotacaoJoinRow {
  id: string;
  plano_id: string;
  texto: string;
  created_at: string;
  planos: { titulo: string } | null;
}

async function fetchTodasAnotacoes(): Promise<AnotacaoComPlano[]> {
  const { data, error } = await supabase
    .from("anotacoes")
    .select("id, plano_id, texto, created_at, planos(titulo)")
    .order("created_at", { ascending: false })
    .returns<AnotacaoJoinRow[]>();
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    plano_id: row.plano_id,
    texto: row.texto,
    created_at: row.created_at,
    plano_titulo: row.planos?.titulo ?? "Plano removido",
  }));
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function TodasAnotacoesPage() {
  const anotacoesQuery = useQuery({ queryKey: ["anotacoes-todas"], queryFn: fetchTodasAnotacoes });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Todas as Anotações</h2>

      {anotacoesQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {anotacoesQuery.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="text-destructive">Não foi possível carregar as anotações.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => anotacoesQuery.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {anotacoesQuery.data && anotacoesQuery.data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma anotação ainda. Escreva a primeira dentro de um Plano.
        </p>
      )}

      {anotacoesQuery.data && anotacoesQuery.data.length > 0 && (
        <div className="space-y-3">
          {anotacoesQuery.data.map((anotacao) => (
            <Card key={anotacao.id}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Link
                    to="/app/planos/$planoId"
                    params={{ planoId: anotacao.plano_id }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {anotacao.plano_titulo}
                  </Link>
                  <span className="text-xs text-muted-foreground">{formatarData(anotacao.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{anotacao.texto}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
