export type PlanoStatus = "ativo" | "pausado" | "concluido";

export interface Plano {
  id: string;
  titulo: string;
  status: PlanoStatus;
  created_at: string;
  updated_at: string;
}

export interface Anotacao {
  id: string;
  plano_id: string;
  texto: string;
  created_at: string;
}

/** Anotação com o título do plano de origem, usada na visão global (join com `planos`). */
export interface AnotacaoComPlano extends Anotacao {
  plano_titulo: string;
}

export interface ChecklistItem {
  id: string;
  plano_id: string;
  descricao: string;
  concluido: boolean;
  prazo: string | null;
  created_at: string;
  updated_at: string;
}

export const PLANO_STATUS_LABEL: Record<PlanoStatus, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  concluido: "Concluído",
};
