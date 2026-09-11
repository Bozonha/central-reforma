/**
 * SPIKE — não é código de produção.
 *
 * Objetivo: mostrar a FORMA como o Market Engine deve tratar qualquer fonte
 * de oferta (API oficial, feed de afiliado ou scraper), garantindo que:
 *   1. Nenhum dado é inventado (toda observação carrega proveniência).
 *   2. Um scraper só roda depois de uma checklist de conformidade explícita
 *      (robots.txt + Termos de Uso), aprovada por uma pessoa — não pelo código.
 *   3. Scraping tem rate limit obrigatório, nunca "melhor esforço".
 *
 * Este arquivo foi validado apenas com `tsc --noEmit` (checagem de tipos).
 * NÃO foi testado contra um site real: este ambiente de execução não tem
 * saída de rede para os domínios pesquisados (ver nota no documento
 * principal). Os seletores de extração de HTML são deixados como
 * responsabilidade explícita de quem for validar contra a página real —
 * não inventamos seletores porque isso seria o mesmo erro que a seção 4
 * do escopo mestre proíbe para preços e produtos.
 */

// ---------------------------------------------------------------------------
// Tipos de domínio (compatíveis com o modelo de dados da seção 6 do documento
// de arquitetura: Produto / Oferta / PriceObservation)
// ---------------------------------------------------------------------------

export type CollectionMethod =
  | "official_api" // ex.: Mercado Livre, Leroy Merlin Marketplace API
  | "affiliate_feed" // ex.: feed de produtos via Awin/Lomadee
  | "compliant_scraper" // scraping com checklist de conformidade aprovada
  | "manual_entry" // usuário digitou
  | "user_upload"; // usuário enviou foto/nota fiscal/PDF (OCR)

export type Confidence = "confirmado" | "estimado" | "provavel" | "desconhecido";

export interface RawOfferObservation {
  productQuery: string;
  sellerName: string;
  price: number | null;
  currency: "BRL";
  unit: string | null;
  sourceUrl: string;
  capturedAt: string; // ISO 8601
  collectionMethod: CollectionMethod;
  confidence: Confidence;
  notes?: string;
}

export interface OfferSource {
  readonly name: string;
  fetchOffers(productQuery: string): Promise<RawOfferObservation[]>;
}

// ---------------------------------------------------------------------------
// 1. Checklist de conformidade — obrigatória para qualquer scraper
// ---------------------------------------------------------------------------

export interface ComplianceRecord {
  siteDomain: string;
  robotsTxtCheckedAt: string; // ISO date da verificação
  robotsTxtAllowsPaths: boolean; // resultado da checagem de robots.txt
  termsOfServiceReviewed: boolean; // revisão humana dos Termos de Uso, não só robots.txt
  termsOfServiceNote: string; // resumo de quem revisou e o que concluiu
  approvedBy: string; // nome de quem aprovou usar este scraper
  approvedAt: string | null; // null enquanto não aprovado
  requestsPerMinute: number; // limite de taxa — obrigatório, sem valor default "alto"
  userAgent: string; // identificação honesta do bot + contato, nunca UA de navegador falso
}

export class ComplianceError extends Error {}

/** Lança erro se a checklist não estiver completa — "fail closed" por padrão. */
function assertCompliant(record: ComplianceRecord): void {
  if (!record.robotsTxtAllowsPaths) {
    throw new ComplianceError(
      `${record.siteDomain}: robots.txt não permite os caminhos necessários. Não prosseguir.`
    );
  }
  if (!record.termsOfServiceReviewed || !record.approvedBy || !record.approvedAt) {
    throw new ComplianceError(
      `${record.siteDomain}: Termos de Uso ainda não revisados/aprovados por uma pessoa responsável. ` +
        `Verificação de robots.txt sozinha NÃO é suficiente para autorizar scraping.`
    );
  }
  if (record.requestsPerMinute <= 0 || record.requestsPerMinute > 6) {
    throw new ComplianceError(
      `${record.siteDomain}: limite de requisições por minuto ausente ou não conservador (${record.requestsPerMinute}).`
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Rate limiter simples (um scraper nunca deve rodar "o mais rápido possível")
// ---------------------------------------------------------------------------

class MinIntervalLimiter {
  private lastRequestAt = 0;
  constructor(private readonly minIntervalMs: number) {}

  async wait(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    const remaining = this.minIntervalMs - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    this.lastRequestAt = Date.now();
  }
}

// ---------------------------------------------------------------------------
// 3. Fonte via scraper compatível — só instancia se a checklist passar
// ---------------------------------------------------------------------------

export interface HtmlExtractor {
  /**
   * Deve ser implementado e validado manualmente contra o HTML real do
   * site-alvo, em um ambiente com acesso de rede. Este arquivo não inclui
   * nenhuma implementação para um site específico de propósito: escrever
   * seletores sem ter visto o HTML real seria inventar uma capacidade que
   * não foi verificada — exatamente o que a seção 4 do escopo mestre proíbe.
   */
  extract(html: string, productQuery: string): RawOfferObservation[];
}

export class CompliantScraperOfferSource implements OfferSource {
  readonly name: string;
  private readonly limiter: MinIntervalLimiter;

  constructor(
    private readonly compliance: ComplianceRecord,
    private readonly extractor: HtmlExtractor,
    private readonly buildSearchUrl: (productQuery: string) => string
  ) {
    assertCompliant(compliance); // lança erro se a checklist não estiver completa
    this.name = `scraper:${compliance.siteDomain}`;
    this.limiter = new MinIntervalLimiter(60_000 / compliance.requestsPerMinute);
  }

  async fetchOffers(productQuery: string): Promise<RawOfferObservation[]> {
    await this.limiter.wait();
    const url = this.buildSearchUrl(productQuery);

    const response = await fetch(url, {
      headers: { "User-Agent": this.compliance.userAgent },
    });

    if (!response.ok) {
      // Nunca inventar uma oferta quando a fonte falha — reportar ausência.
      return [
        {
          productQuery,
          sellerName: this.compliance.siteDomain,
          price: null,
          currency: "BRL",
          unit: null,
          sourceUrl: url,
          capturedAt: new Date().toISOString(),
          collectionMethod: "compliant_scraper",
          confidence: "desconhecido",
          notes: `Falha ao coletar: HTTP ${response.status}. Informação não disponível.`,
        },
      ];
    }

    const html = await response.text();
    return this.extractor.extract(html, productQuery);
  }
}

// ---------------------------------------------------------------------------
// 4. Fonte via API oficial — esqueleto (ex.: Mercado Livre, com app registrado)
// ---------------------------------------------------------------------------

export class OfficialApiOfferSource implements OfferSource {
  readonly name: string;

  constructor(
    private readonly siteDomain: string,
    private readonly search: (productQuery: string) => Promise<RawOfferObservation[]>
  ) {
    this.name = `api:${siteDomain}`;
  }

  async fetchOffers(productQuery: string): Promise<RawOfferObservation[]> {
    // Toda a lógica de autenticação (OAuth app do Mercado Livre, por exemplo)
    // fica encapsulada na função `search` injetada — este harness só garante
    // que o formato de saída seja o mesmo de qualquer outra fonte.
    return this.search(productQuery);
  }
}

// ---------------------------------------------------------------------------
// 5. Exemplo de configuração (NÃO instanciado automaticamente)
// ---------------------------------------------------------------------------

/**
 * Exemplo de como a checklist ficaria hoje para um varejista cujo robots.txt
 * permite crawlear páginas de produto (verificado nesta pesquisa), mas cujos
 * Termos de Uso ainda NÃO foram lidos por uma pessoa responsável do projeto.
 * `assertCompliant` vai lançar erro ao tentar instanciar — de propósito.
 */
export const EXAMPLE_PENDING_COMPLIANCE: ComplianceRecord = {
  siteDomain: "exemplo-varejista-local.com.br",
  robotsTxtCheckedAt: new Date().toISOString(),
  robotsTxtAllowsPaths: true,
  termsOfServiceReviewed: false, // <- precisa virar `true` por decisão humana, não automática
  termsOfServiceNote: "Pendente: ler Termos de Uso do site antes de habilitar este scraper.",
  approvedBy: "",
  approvedAt: null,
  requestsPerMinute: 3,
  userAgent: "CentralDeReformaBot/0.1 (+contato: matheusinho.leo@gmail.com)",
};
