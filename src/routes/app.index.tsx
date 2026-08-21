import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { calcularProgresso } from "@/lib/progresso";
import { PLANO_STATUS_LABEL, type Plano, type PlanoStatus } from "@/lib/types";

export const Route = createFileRoute("/app/")({
  component: PlanosPage,
});

interface PlanoComProgresso extends Plano {
  totalItens: number;
  itensConcluidos: number;
  progresso: number;
}

async function fetchPlanosComProgresso(): Promise<PlanoComProgresso[]> {
  const { data: planos, error: planosError } = await supabase
    .from("planos")
    .select("*")
    .order("created_at", { ascending: false });
  if (planosError) throw planosError;

  const { data: itens, error: itensError } = await supabase
    .from("checklist_itens")
    .select("plano_id, concluido");
  if (itensError) throw itensError;

  return (planos ?? []).map((plano) => {
    const itensDoPlano = (itens ?? []).filter((item) => item.plano_id === plano.id);
    const totalItens = itensDoPlano.length;
    const itensConcluidos = itensDoPlano.filter((item) => item.concluido).length;
    return { ...plano, totalItens, itensConcluidos, progresso: calcularProgresso(itensDoPlano) };
  });
}

const novoPlanoSchema = z.object({
  titulo: z.string().trim().min(1, "Informe um título").max(200, "Título muito longo"),
});
type NovoPlanoValues = z.infer<typeof novoPlanoSchema>;

const STATUS_BADGE_VARIANT: Record<PlanoStatus, "success" | "secondary" | "outline"> = {
  ativo: "success",
  pausado: "secondary",
  concluido: "outline",
};

function PlanosPage() {
  const queryClient = useQueryClient();
  const planosQuery = useQuery({ queryKey: ["planos"], queryFn: fetchPlanosComProgresso });

  const form = useForm<NovoPlanoValues>({
    resolver: zodResolver(novoPlanoSchema),
    defaultValues: { titulo: "" },
  });

  const criarPlano = useMutation({
    mutationFn: async (values: NovoPlanoValues) => {
      const { error } = await supabase.from("planos").insert({ titulo: values.titulo, status: "ativo" });
      if (error) throw error;
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["planos"] });
    },
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => criarPlano.mutate(values))}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" placeholder="Ex.: Reforma do apartamento" {...form.register("titulo")} />
              {form.formState.errors.titulo && (
                <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
              )}
            </div>
            <Button type="submit" disabled={criarPlano.isPending}>
              {criarPlano.isPending ? "Criando…" : "Criar Plano"}
            </Button>
          </form>
          {criarPlano.isError && (
            <p className="mt-2 text-sm text-destructive">Não foi possível criar o Plano. Tente novamente.</p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Seus Planos</h2>

        {planosQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando Planos…</p>}

        {planosQuery.isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="text-destructive">Não foi possível carregar seus Planos.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => planosQuery.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {planosQuery.data && planosQuery.data.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum plano ainda — crie o primeiro acima.</p>
        )}

        {planosQuery.data && planosQuery.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planosQuery.data.map((plano) => (
              <Link key={plano.id} to="/app/planos/$planoId" params={{ planoId: plano.id }}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{plano.titulo}</CardTitle>
                      <Badge variant={STATUS_BADGE_VARIANT[plano.status]}>
                        {PLANO_STATUS_LABEL[plano.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${plano.progresso}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {plano.progresso}% concluído ({plano.itensConcluidos}/{plano.totalItens} itens)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
