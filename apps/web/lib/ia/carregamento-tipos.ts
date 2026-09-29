import type { TipoDocumento } from "@central-reforma/domain";

/**
 * Tipos e constantes compartilhados entre a UI da aba "Carregar" e as
 * server actions em analisar-carregamento.ts. Ficam num módulo à parte
 * porque um arquivo "use server" só pode exportar funções async — nenhuma
 * constante ou tipo pode ser exportado direto de lá.
 */
export const CATEGORIAS_CARREGAMENTO = [
  { value: "RECIBO", label: "Recibo / nota" },
  { value: "PRODUTO", label: "Produto" },
  { value: "ORCAMENTO", label: "Orçamento de fornecedor" },
  { value: "OUTRO", label: "Outro" },
] as const;

export type CategoriaCarregamento = (typeof CATEGORIAS_CARREGAMENTO)[number]["value"];

export function tipoDocumentoDaCategoria(categoria: CategoriaCarregamento): TipoDocumento {
  if (categoria === "RECIBO") return "RECIBO";
  if (categoria === "ORCAMENTO") return "ORCAMENTO";
  return "OUTRO";
}

export type ItemReciboRascunho = {
  nomeLivre: string;
  quantidade: number | null;
  precoUnitarioTexto: string | null;
  valorTotalTexto: string | null;
  confianca: "ALTA" | "MEDIA" | "BAIXA";
};

export type ItemReciboConfirmado = { nomeLivre: string; quantidade: number; precoUnitario: number };

export type EstadoCarregamento =
  | { status: "IDLE" }
  | { fieldErrors: Record<string, string>; status?: undefined }
  | { error: string; status?: undefined }
  | {
      status: "RASCUNHO_RECIBO";
      documentoId: string;
      loja: string | null;
      data: string | null;
      observacoes: string | null;
      itens: ItemReciboRascunho[];
      provedor: string;
    }
  | {
      status: "RESUMO_GENERICO";
      documentoId: string;
      tipoIdentificado: string | null;
      resumo: string;
      pontosChave: string[];
      valores: string[];
      alertas: string[];
      provedor: string;
    };

export const ESTADO_INICIAL_CARREGAMENTO: EstadoCarregamento = { status: "IDLE" };
