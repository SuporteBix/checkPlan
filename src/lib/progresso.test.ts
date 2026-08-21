import { describe, expect, it } from "vitest";
import { calcularProgresso } from "@/lib/progresso";

describe("calcularProgresso", () => {
  it("retorna 0 quando não há itens", () => {
    expect(calcularProgresso([])).toBe(0);
  });

  it("retorna 100 quando todos os itens estão concluídos", () => {
    expect(calcularProgresso([{ concluido: true }, { concluido: true }])).toBe(100);
  });

  it("arredonda a porcentagem de itens concluídos", () => {
    expect(calcularProgresso([{ concluido: true }, { concluido: false }, { concluido: false }])).toBe(33);
  });

  it("não conta itens não concluídos", () => {
    expect(calcularProgresso([{ concluido: false }, { concluido: false }])).toBe(0);
  });
});
