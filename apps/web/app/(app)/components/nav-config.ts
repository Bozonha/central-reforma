import type { IconName } from "../../components/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /**
   * true para os módulos "cross-obra" (resolvem a obra via
   * `?obraId=`/cookie — ver lib/obras/selecionar.ts). A barra lateral usa
   * essa marcação para levar a obra ativa junto ao trocar de aba, em vez de
   * sempre cair na primeira obra do usuário.
   */
  crossObra?: boolean;
  /**
   * true só para o item "Administração" — a barra lateral só o mostra
   * quando o papel de conta do usuário (SUPERADMIN/ADMIN) permite acessar o
   * painel (ver podeAcessarPainelAdmin em packages/domain/src/rbac.ts). A
   * página em si também checa isso de novo no servidor (defesa em
   * profundidade) — este filtro é só para não anunciar um link que 404.
   */
  admin?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Obras", href: "/obras", icon: "obras" },
  { label: "Ambientes", href: "/ambientes", icon: "ambientes" },
  { label: "Orçamento", href: "/orcamento", icon: "orcamento", crossObra: true },
  { label: "Compras", href: "/compras", icon: "compras", crossObra: true },
  { label: "Estoque", href: "/estoque", icon: "estoque", crossObra: true },
  { label: "Cronograma", href: "/cronograma", icon: "cronograma", crossObra: true },
  { label: "Documentos", href: "/documentos", icon: "documentos", crossObra: true },
  { label: "Diário", href: "/diario", icon: "diario", crossObra: true },
  { label: "Carregar", href: "/carregar", icon: "upload", crossObra: true },
  { label: "Administração", href: "/admin", icon: "users", admin: true },
];
