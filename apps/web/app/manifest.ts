import type { MetadataRoute } from "next";

/**
 * Rota de metadados dinâmica do Next.js (convenção de arquivo, como
 * icon.tsx) — serve automaticamente em /manifest.webmanifest e o Next já
 * injeta o <link rel="manifest"> no <head>, sem precisar declarar em
 * metadata.manifest em layout.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Central de Reforma",
    short_name: "C. Reforma",
    description: "Sistema Operacional da Reforma — planeje, compre e acompanhe sua reforma em um só lugar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0f19",
    theme_color: "#2563eb",
    lang: "pt-BR",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
