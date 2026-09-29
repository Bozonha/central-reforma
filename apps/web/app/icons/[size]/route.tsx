import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Ícones do manifesto PWA (192px e 512px), gerados sob demanda com o mesmo
 * estilo do favicon dinâmico em app/icon.tsx — evita manter arquivos .png
 * binários no repositório para um logo que é só texto "CR" num fundo sólido.
 * Rota dinâmica em vez da convenção icon.tsx porque o manifesto precisa de
 * dois tamanhos distintos com URLs estáveis.
 */
const TAMANHOS: Record<string, number> = { "192": 192, "512": 512 };

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = TAMANHOS[size];
  if (!px) return NextResponse.json({ error: "Tamanho de ícone não suportado." }, { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          color: "white",
          fontSize: Math.round(px * 0.42),
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        CR
      </div>
    ),
    { width: px, height: px },
  );
}
