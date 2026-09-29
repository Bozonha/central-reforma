/**
 * Envio de e-mail transacional via Resend (https://resend.com/docs/api-reference/emails/send-email)
 * — escolhido por ser uma chamada HTTP simples (sem SDK/dependência pesada).
 *
 * Só ativo quando RESEND_API_KEY e EMAIL_REMETENTE estão configurados nas
 * variáveis de ambiente. Sem eles, esta função NUNCA finge que enviou
 * (CLAUDE.md #1: nunca inventar/disfarçar um resultado) — só registra no
 * log do servidor e devolve `enviado: false` para quem chamou decidir o
 * que fazer (ex.: lib/auth/reset-senha.ts ainda responde ao usuário de
 * forma genérica, mas sem prometer um e-mail que não saiu).
 */
import "server-only";

export interface EmailParams {
  para: string;
  assunto: string;
  textoSimples: string;
  html?: string;
}

export interface ResultadoEnvioEmail {
  enviado: boolean;
  motivo?: "PROVEDOR_NAO_CONFIGURADO" | "FALHA_PROVEDOR";
}

export async function enviarEmail(params: EmailParams): Promise<ResultadoEnvioEmail> {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_REMETENTE;

  if (!apiKey || !remetente) {
    console.warn(
      `[email] Provedor não configurado (RESEND_API_KEY/EMAIL_REMETENTE ausentes) — e-mail para ${params.para} com assunto "${params.assunto}" não foi enviado.`,
    );
    return { enviado: false, motivo: "PROVEDOR_NAO_CONFIGURADO" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remetente,
        to: [params.para],
        subject: params.assunto,
        text: params.textoSimples,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const corpo = await res.text().catch(() => "");
      console.error(`[email] Resend respondeu ${res.status} ao enviar para ${params.para}:`, corpo);
      return { enviado: false, motivo: "FALHA_PROVEDOR" };
    }

    return { enviado: true };
  } catch (err) {
    console.error(`[email] Falha de rede ao enviar para ${params.para}:`, err);
    return { enviado: false, motivo: "FALHA_PROVEDOR" };
  }
}
