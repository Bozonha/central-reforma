import type { IconName } from "./icons";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

// Módulos do MVP 0. Todas as rotas (exceto o Dashboard) ainda não existem —
// são placeholders visuais até as próximas etapas do roadmap implementarem
// cada módulo.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Obras", href: "#", icon: "obras" },
  { label: "Ambientes", href: "#", icon: "ambientes" },
  { label: "Orçamento", href: "#", icon: "orcamento" },
  { label: "Compras", href: "#", icon: "compras" },
  { label: "Estoque", href: "#", icon: "estoque" },
  { label: "Cronograma", href: "#", icon: "cronograma" },
  { label: "Documentos", href: "#", icon: "documentos" },
  { label: "Diário", href: "#", icon: "diario" },
];
