import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O limite padrão do Next.js para o corpo de uma Server Action é 1MB —
      // baixo demais para upload de documento/planta (foto de celular ou PDF
      // de arquiteto costumam passar disso). O limite de negócio de verdade
      // (15MB) já é validado em lib/documentos/actions.ts; aqui só evitamos
      // que o próprio framework rejeite a requisição antes de chegar lá.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
