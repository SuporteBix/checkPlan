import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { calcularProgresso } from "@/lib/progresso";
import { PLANO_STATUS_LABEL, type Anotacao, type ChecklistItem, type Plano, type PlanoStatus } from "@/lib/types";

export const Route = createFileRoute("/app/planos/$planoId")({
  component: PlanoDetailPage,
});

const anotacaoSchema = z.object({
  texto: z.string().trim().min(1, "Escreva algo antes de salvar"),
});
type AnotacaoValues = z.infer<typeof anotacaoSchema>;

const checklistSchema = z.object({
  descricao: z.string().trim().min(1, "Informe a descrição"),
  prazo: z.string().optional(),
});
type ChecklistValues = z.infer<typeof checklistSchema>;

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatarPrazo(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

function PlanoDetailPage() {
  const { planoId } = Route.useParams();
  const queryClient = useQueryClient();

  const planoQuery = useQuery({
    queryKey: ["plano", planoId],
    queryFn: async (): Promise<Plano> => {
      const { data, error } = await supabase.from("planos").select("*").eq("id", planoId).single();
      if (error) throw error;
      return data;
    },
  });

  const anotacoesQuery = useQuery({
    queryKey: ["anotacoes", planoId],
    queryFn: async (): Promise<Anotacao[]> => {
      const { data, error } = await supabase
        .from("anotacoes")
        .select("*")
        .eq("plano_id", planoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: planoQuery.isSuccess,
  });

  const checklistQuery = useQuery({
    queryKey: ["checklist", planoId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      const { data, error } = await supabase
        .from("checklist_itens")
        .select("*")
        .eq("plano_id", planoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: planoQuery.isSuccess,
  });

  const anotacaoForm = useForm<AnotacaoValues>({
    resolver: zodResolver(anotacaoSchema),
    defaultValues: { texto: "" },
  });

  const checklistForm = useForm<ChecklistValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: { descricao: "", prazo: "" },
  });

  const criarAnotacao = useMutation({
    mutationFn: async (values: AnotacaoValues) => {
      const { error } = await supabase.from("anotacoes").insert({ plano_id: planoId, texto: values.texto });
      if (error) throw error;
    },
    onSuccess: () => {
      anotacaoForm.reset();
      queryClient.invalidateQueries({ queryKey: ["anotacoes", planoId] });
    },
  });

  const criarChecklistItem = useMutation({
    mutationFn: async (values: ChecklistValues) => {
      const { error } = await supabase.from("checklist_itens").insert({
        plano_id: planoId,
        descricao: values.descricao,
        prazo: values.prazo ? values.prazo : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      checklistForm.reset({ descricao: "", prazo: "" });
      queryClient.invalidateQueries({ queryKey: ["checklist", planoId] });
    },
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await supabase.from("checklist_itens").update({ concluido }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklist", planoId] }),
  });

  const atualizarStatus = useMutation({
    mutationFn: async (status: PlanoStatus) => {
      const { error } = await supabase.from("planos").update({ status }).eq("id", planoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plano", planoId] }),
  });

  // "Virar tarefa" promove a anotação inteira como ponto de partida editável
  // do novo item de Checklist — não é seleção de um trecho arbitrário do
  // texto (a UI de textarea não expõe isso). O usuário edita o campo antes
  // de confirmar, então a promoção continua sendo uma ação manual e revisável.
  function handleVirarTarefa(texto: string) {
    checklistForm.setValue("descricao", texto);
    checklistForm.setFocus("descricao");
  }

  if (planoQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando Plano…</p>;
  }

  if (planoQuery.isError || !planoQuery.data) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="text-destructive">Plano não encontrado ou você não tem acesso a ele.</p>
      </div>
    );
  }

  const plano = planoQuery.data;
  const totalItens = checklistQuery.data?.length ?? 0;
  const itensConcluidos = checklistQuery.data?.filter((item) => item.concluido).length ?? 0;
  const progresso = calcularProgresso(checklistQuery.data ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{plano.titulo}</h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
            </div>
            <span className="text-sm text-muted-foreground">
              {progresso}% concluído ({itensConcluidos}/{totalItens})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status" className="text-sm text-muted-foreground">
            Status
          </Label>
          <Select
            value={plano.status}
            onValueChange={(value) => atualizarStatus.mutate(value as PlanoStatus)}
          >
            <SelectTrigger id="status" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PLANO_STATUS_LABEL) as PlanoStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {PLANO_STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Notas</h2>

          <Card>
            <CardContent className="pt-6">
              <form
                onSubmit={anotacaoForm.handleSubmit((values) => criarAnotacao.mutate(values))}
                className="space-y-2"
              >
                <Textarea
                  placeholder="Escreva uma anotação…"
                  {...anotacaoForm.register("texto")}
                />
                {anotacaoForm.formState.errors.texto && (
                  <p className="text-sm text-destructive">{anotacaoForm.formState.errors.texto.message}</p>
                )}
                <Button type="submit" size="sm" disabled={criarAnotacao.isPending}>
                  {criarAnotacao.isPending ? "Salvando…" : "Salvar anotação"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {anotacoesQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando notas…</p>}

          {anotacoesQuery.isError && (
            <p className="text-sm text-destructive">Não foi possível carregar as anotações.</p>
          )}

          {anotacoesQuery.data && anotacoesQuery.data.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma anotação ainda neste Plano.</p>
          )}

          {anotacoesQuery.data?.map((anotacao) => (
            <Card key={anotacao.id}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{formatarData(anotacao.created_at)}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleVirarTarefa(anotacao.texto)}>
                    Virar tarefa
                  </Button>
                </div>
                <p className="whitespace-pre-wrap text-sm">{anotacao.texto}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Checklist</h2>

          <Card>
            <CardContent className="pt-6">
              <form
                onSubmit={checklistForm.handleSubmit((values) => criarChecklistItem.mutate(values))}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    placeholder="Ex.: Pedir orçamento ao pedreiro"
                    {...checklistForm.register("descricao")}
                  />
                  {checklistForm.formState.errors.descricao && (
                    <p className="text-sm text-destructive">
                      {checklistForm.formState.errors.descricao.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prazo">Prazo (opcional)</Label>
                  <Input id="prazo" type="date" {...checklistForm.register("prazo")} />
                </div>
                <Button type="submit" size="sm" disabled={criarChecklistItem.isPending}>
                  {criarChecklistItem.isPending ? "Adicionando…" : "Adicionar item"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {checklistQuery.isLoading && <p className="text-sm text-muted-foreground">Carregando checklist…</p>}

          {checklistQuery.isError && (
            <p className="text-sm text-destructive">Não foi possível carregar o checklist.</p>
          )}

          {checklistQuery.data && checklistQuery.data.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum item de checklist ainda neste Plano.</p>
          )}

          {checklistQuery.data && checklistQuery.data.length > 0 && (
            <ul className="space-y-2">
              {checklistQuery.data.map((item) => (
                <li key={item.id}>
                  <Card>
                    <CardContent className="flex items-start gap-3 pt-6">
                      <Checkbox
                        checked={item.concluido}
                        onCheckedChange={(checked) =>
                          toggleChecklistItem.mutate({ id: item.id, concluido: checked === true })
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={item.concluido ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                          {item.descricao}
                        </p>
                        {item.prazo && (
                          <Badge variant="outline" className="mt-1.5">
                            Prazo: {formatarPrazo(item.prazo)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
