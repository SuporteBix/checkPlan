import type { ChecklistItem } from "@/lib/types";

export function calcularProgresso(itens: Pick<ChecklistItem, "concluido">[]): number {
  if (itens.length === 0) return 0;
  const concluidos = itens.filter((item) => item.concluido).length;
  return Math.round((concluidos / itens.length) * 100);
}
