// Conjunto de ícones em SVG inline (sem dependência externa) — mantém o
// pacote de UI enxuto, sem lib de ícones.
import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "obras"
  | "ambientes"
  | "orcamento"
  | "compras"
  | "estoque"
  | "cronograma"
  | "documentos"
  | "diario"
  | "search"
  | "menu"
  | "close"
  | "alert"
  | "check"
  | "clock"
  | "trend-up"
  | "trend-down"
  | "sun"
  | "moon"
  | "monitor"
  | "plus"
  | "trash"
  | "edit"
  | "map-pin"
  | "upload"
  | "chevron-right"
  | "chevron-down"
  | "logout"
  | "users"
  | "external-link"
  | "filter"
  | "archive"
  | "loader";

const paths: Record<IconName, ReactNode> = {
  dashboard: (
    <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Zm10-10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5Zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4Z" />
  ),
  obras: <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6M9 10h.01M15 10h.01" />,
  ambientes: <path d="M4 21V6a2 2 0 0 1 2-2h6l8 8v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm8-16v6h6" />,
  orcamento: (
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4M3 7l3-3h9M17 13h.01" />
  ),
  compras: (
    <path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H8.5a2 2 0 0 1-2-1.7L4.5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
  ),
  estoque: <path d="m3 8 9-5 9 5-9 5-9-5Zm0 0v8l9 5m0-13v13m0-13 9 5v8l-9 5" />,
  cronograma: (
    <path d="M8 3v3m8-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3 7h3" />
  ),
  documentos: <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h6" />,
  diario: <path d="M6 4h11a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z" />,
  search: <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5.6-5.6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  alert: <path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17a1.6 1.6 0 0 0 1.4 2.4h16.2a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" />,
  check: <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-3-10 2.2 2.2L15.5 9.5" />,
  clock: <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3.5 2" />,
  "trend-up": <path d="m3 17 6-6 4 4 8-8m0 0h-5m5 0v5" />,
  "trend-down": <path d="m3 7 6 6 4-4 8 8m0 0v-5m0 5h-5" />,
  sun: <path d="M12 4V2m0 20v-2M4 12H2m20 0h-2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4M5.6 18.4l-1.4 1.4M18.4 5.6l1.4-1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  monitor: <path d="M3 4h18v12H3zM8 20h8M12 16v4" />,
  plus: <path d="M12 4v16m-8-8h16" />,
  trash: <path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m2 0-.6 12.2A2 2 0 0 1 14.4 21H9.6a2 2 0 0 1-2-1.8L7 7h10Z" />,
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  "map-pin": <path d="M12 22s7-7.4 7-12.5A7 7 0 0 0 5 9.5C5 14.6 12 22 12 22Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  upload: <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m6 14 5-5-5-5m5 5H9" />,
  users: <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />,
  "external-link": <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m3-2h6v6m0-6L10 14" />,
  filter: <path d="M4 5h16l-6 8v6l-4 2v-8Z" />,
  archive: <path d="M3 5h18v4H3zM5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" />,
  loader: <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.5-6.5-2.1 2.1M8.6 15.4l-2.1 2.1m0-11 2.1 2.1m8.8 8.8 2.1 2.1" />,
};

export function Icon({
  name,
  className,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
