import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "./components/theme-provider";
import { ServiceWorkerRegister } from "./components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central de Reforma",
  description:
    "Sistema Operacional da Reforma — planeje, compre e acompanhe sua reforma em um só lugar.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Central de Reforma",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
