// Tipos compartilhados de domínio — os mesmos valores usados como `text()`
// nas colunas "enum" do schema Drizzle (packages/database/src/schema.ts).
// SQLite não tem enum nativo; a validação de valor permitido acontece aqui
// e nos schemas Zod de apps/web/lib/validation.

export type ObraTipo = "CASA" | "APARTAMENTO" | "AMBIENTE_UNICO" | "OUTRO";
export type ObraStatus = "ATIVA" | "ARQUIVADA";
export type FonteMedida = "USUARIO" | "DOCUMENTO" | "VISAO_ESTIMADA" | "CONFIRMADA" | "DESCONHECIDA";
export type PapelColaborador = "DONO" | "COLABORADOR" | "VISUALIZADOR";
export type TipoLoja = "ONLINE" | "FISICA";
export type FonteOferta = "MANUAL" | "MERCADO_LIVRE" | "FEED_AFILIADO";
export type NivelConfianca = "CONFIRMADO" | "ESTIMADO" | "PROVAVEL" | "DESCONHECIDO";
export type PrioridadeItem = "BAIXA" | "MEDIA" | "ALTA";
export type StatusItemCompra = "PENDENTE" | "COMPRADO" | "CANCELADO";
export type OrigemEstoque = "MANUAL" | "NOTA_FISCAL" | "FOTO";
export type StatusTarefa = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA";
export type TipoDocumento = "ORCAMENTO" | "CONTRATO" | "NOTA" | "RECIBO" | "GARANTIA" | "PLANTA" | "OUTRO";
export type TipoFoto = "ANTES" | "DEPOIS" | "PROGRESSO";
export type StatusProblema = "ABERTO" | "RESOLVIDO";

export const OBRA_TIPOS: { value: ObraTipo; label: string }[] = [
  { value: "CASA", label: "Casa" },
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "AMBIENTE_UNICO", label: "Ambiente único" },
  { value: "OUTRO", label: "Outro" },
];

export const PRIORIDADES: { value: PrioridadeItem; label: string }[] = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
];

export const STATUS_ITEM_COMPRA_LABEL: Record<StatusItemCompra, string> = {
  PENDENTE: "Pendente",
  COMPRADO: "Comprado",
  CANCELADO: "Cancelado",
};

export const STATUS_TAREFA: { value: StatusTarefa; label: string }[] = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "ATRASADA", label: "Atrasada" },
];

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: "ORCAMENTO", label: "Orçamento" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "NOTA", label: "Nota fiscal" },
  { value: "RECIBO", label: "Recibo" },
  { value: "GARANTIA", label: "Garantia" },
  { value: "PLANTA", label: "Planta" },
  { value: "OUTRO", label: "Outro" },
];
