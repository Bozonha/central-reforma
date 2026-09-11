import type { IconName } from "../../components/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Obras", href: "/obras", icon: "obras" },
  { label: "Ambientes", href: "/ambientes", icon: "ambientes" },
  { label: "Orçamento", href: "/orcamento", icon: "orcamento" },
  { label: "Compras", href: "/compras", icon: "compras" },
  { label: "Estoque", href: "/estoque", icon: "estoque" },
  { label: "Cronograma", href: "/cronograma", icon: "cronograma" },
  { label: "Documentos", href: "/documentos", icon: "documentos" },
  { label: "Diário", href: "/diario", icon: "diario" },
];
