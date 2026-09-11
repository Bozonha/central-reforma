import { db, schema } from "@central-reforma/database";
import { desc, eq, inArray } from "drizzle-orm";
import {
  centsToBRL,
  classificarPreco,
  haversineDistanceKm,
  PRIORIDADES,
  STATUS_ITEM_COMPRA_LABEL,
  type StatusItemCompra,
} from "@central-reforma/domain";
import { requireSession } from "../../../lib/auth/actions";
import { resolverObraSelecionada } from "../../../lib/obras/selecionar";
import { criarItemLista, atualizarStatusItemLista, excluirItemLista, criarCompra, excluirCompra } from "../../../lib/compras/actions";
import {
  criarProduto,
  criarLojaManual,
  criarOferta,
  geocodificarObra,
  buscarOfertasMercadoLivre,
  importarOfertaMercadoLivre,
} from "../../../lib/mercado/actions";
import { buscarLojasProximas } from "../../../lib/mercado/overpass";
import { calcularCustoEfetivo, type ObraLogisticaPerfil } from "../../../lib/mercado/custo-efetivo";
import { statusConexaoMercadoLivre, mercadoLivreConfigurado } from "../../../lib/mercado/mercadolivre/client";
import { atualizarLogisticaObra } from "../../../lib/obras/actions";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { LinkButton } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Icon } from "../../components/icons";
import { ObraSelector } from "../components/obra-selector";
import { Tabs } from "./components/tabs";
import { ItemListaForm } from "./components/item-lista-form";
import { CompraForm } from "./components/compra-form";
import { ProdutoForm } from "./components/produto-form";
import { LojaForm } from "./components/loja-form";
import { OfertaForm } from "./components/oferta-form";
import { LogisticaForm } from "./components/logistica-form";
import { MercadoLivreBusca } from "./components/mercado-livre-busca";
import { GeocodificarButton } from "./components/geocodificar-button";
import { LojasMapClient as LojasMap } from "./components/lojas-map-client";
import type { LojaDescobertaMapa, LojaMapa } from "./components/lojas-map";

const PRIORIDADE_LABEL = Object.fromEntries(PRIORIDADES.map((p) => [p.value, p.label]));

const CLASSIFICACAO_BADGE: Record<string, string> = {
  VERDE: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  AMARELO: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  VERMELHO: "bg-[var(--color-serious-soft)] text-[var(--color-serious)]",
  CINZA: "bg-[var(--color-neutral-status-soft)] text-[var(--color-neutral-status)]",
};

const STATUS_ITEM_BADGE: Record<StatusItemCompra, string> = {
  PENDENTE: "bg-[var(--color-neutral-status-soft)] text-[var(--color-neutral-status)]",
  COMPRADO: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  CANCELADO: "bg-[var(--color-serious-soft)] text-[var(--color-serious)]",
};

function formatData(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ obraId?: string; ml?: string; detalhe?: string }>;
}) {
  const sessao = await requireSession();
  const { obraId: obraIdParam, ml: mlStatus, detalhe: mlDetalhe } = await searchParams;
  const { obras, obraId } = await resolverObraSelecionada(sessao.usuarioId, obraIdParam);
  const mlConexao = await statusConexaoMercadoLivre();
  const mlConfigurado = mercadoLivreConfigurado();

  if (!obraId) {
    return (
      <Card>
        <EmptyState
          icon="compras"
          title="Crie uma obra primeiro"
          description="Compras e lista de materiais são organizadas por obra."
          action={
            <LinkButton href="/obras/nova" icon="plus">
              Nova obra
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const [obra, itensLista, comprasLog, produtos, lojas, ofertas, observacoes] = await Promise.all([
    db.select().from(schema.obras).where(eq(schema.obras.id, obraId)).limit(1).then((r) => r[0]),
    db.select().from(schema.itensListaCompras).where(eq(schema.itensListaCompras.obraId, obraId)),
    db.select().from(schema.compras).where(eq(schema.compras.obraId, obraId)).orderBy(desc(schema.compras.data)).limit(20),
    db.select().from(schema.produtos),
    db.select().from(schema.lojas),
    db.select().from(schema.ofertas).orderBy(desc(schema.ofertas.atualizadoEm)),
    db.select().from(schema.priceObservations),
  ]);

  const produtoNome = new Map(produtos.map((p) => [p.id, p.nome]));
  const lojaNome = new Map(lojas.map((l) => [l.id, l.nome]));
  const lojaTipo = new Map(lojas.map((l) => [l.id, l.tipo as "ONLINE" | "FISICA"]));
  const lojaCoord = new Map(
    lojas.filter((l) => l.latitude != null && l.longitude != null).map((l) => [l.id, { lat: l.latitude!, lng: l.longitude! }]),
  );

  const itensPendentes = itensLista.filter((i) => i.status === "PENDENTE");
  const criarItemComObra = criarItemLista.bind(null, obraId);
  const criarCompraComObra = criarCompra.bind(null, obraId);
  const geocodificarObraComId = geocodificarObra.bind(null, obraId);
  const atualizarLogisticaComObra = atualizarLogisticaObra.bind(null, obraId);

  const totalGastoCent = comprasLog.reduce((acc, c) => acc + c.valorTotalCent, 0);

  const observacoesPorProduto = new Map<string, { precoCent: number; capturadoEm: Date }[]>();
  const historicoPorProduto = new Map<
    string,
    { precoCent: number; capturadoEm: Date; lojaNome: string; fonte: string; fonteUrl: string | null }[]
  >();
  for (const obs of observacoes) {
    const lista = observacoesPorProduto.get(obs.produtoId) ?? [];
    lista.push({ precoCent: obs.precoCent, capturadoEm: obs.capturadoEm });
    observacoesPorProduto.set(obs.produtoId, lista);

    const historico = historicoPorProduto.get(obs.produtoId) ?? [];
    historico.push({
      precoCent: obs.precoCent,
      capturadoEm: obs.capturadoEm,
      lojaNome: obs.lojaId ? (lojaNome.get(obs.lojaId) ?? "—") : "—",
      fonte: obs.fonte,
      fonteUrl: obs.fonteUrl,
    });
    historicoPorProduto.set(obs.produtoId, historico);
  }
  for (const historico of historicoPorProduto.values()) {
    historico.sort((a, b) => b.capturadoEm.getTime() - a.capturadoEm.getTime());
  }

  const obraCoord = obra?.latitude != null && obra?.longitude != null ? { lat: obra.latitude, lng: obra.longitude } : null;
  const perfilLogistica: ObraLogisticaPerfil = {
    combustivelPrecoLitroCent: obra?.combustivelPrecoLitroCent ?? null,
    veiculoKmPorLitro: obra?.veiculoKmPorLitro ?? null,
    pedagioCent: obra?.pedagioCent ?? null,
    estacionamentoCent: obra?.estacionamentoCent ?? null,
  };
  const centsParaInput = (v: number | null) => (v != null ? (v / 100).toFixed(2).replace(".", ",") : "");
  const logisticaDefaults = {
    combustivelPrecoLitro: centsParaInput(perfilLogistica.combustivelPrecoLitroCent),
    veiculoKmPorLitro: perfilLogistica.veiculoKmPorLitro != null ? String(perfilLogistica.veiculoKmPorLitro).replace(".", ",") : "",
    pedagio: centsParaInput(perfilLogistica.pedagioCent),
    estacionamento: centsParaInput(perfilLogistica.estacionamentoCent),
  };

  const ofertasComClassificacao = ofertas
    .map((o) => {
      const historico = observacoesPorProduto.get(o.produtoId) ?? [];
      const resultado = classificarPreco(o.precoCent, historico);
      const custo = calcularCustoEfetivo(
        { precoCent: o.precoCent, freteCent: o.freteCent, lojaTipo: lojaTipo.get(o.lojaId) ?? "ONLINE", lojaCoord: lojaCoord.get(o.lojaId) ?? null },
        obraCoord,
        perfilLogistica,
      );
      return {
        ...o,
        produtoNome: produtoNome.get(o.produtoId) ?? "—",
        lojaNomeExibicao: lojaNome.get(o.lojaId) ?? "—",
        resultado,
        custo,
        historico: historicoPorProduto.get(o.produtoId)?.slice(0, 5) ?? [],
      };
    })
    .sort((a, b) => {
      if (a.custo.effectiveCostCent == null && b.custo.effectiveCostCent == null) return 0;
      if (a.custo.effectiveCostCent == null) return 1;
      if (b.custo.effectiveCostCent == null) return -1;
      return a.custo.effectiveCostCent - b.custo.effectiveCostCent;
    });

  const menorCustoEfetivoCent = ofertasComClassificacao.reduce<number | null>((min, o) => {
    if (o.custo.effectiveCostCent == null) return min;
    return min == null ? o.custo.effectiveCostCent : Math.min(min, o.custo.effectiveCostCent);
  }, null);

  // ---------------------------------------------------------------------
  // Mapa de lojas próximas — só roda se a obra já tem endereço geocodificado.
  // A chamada ao Overpass depende de acesso de rede de saída no servidor;
  // se falhar, retorna lista vazia (nunca inventa lojas).
  // ---------------------------------------------------------------------
  const temCoordenadas = obra?.latitude != null && obra?.longitude != null;
  let lojasDescobertas: LojaDescobertaMapa[] = [];
  let lojasProximasSalvas: LojaMapa[] = [];

  if (temCoordenadas && obra) {
    const lat = obra.latitude!;
    const lon = obra.longitude!;
    const [descobertas] = await Promise.all([buscarLojasProximas(lat, lon)]);
    const jaSalvos = new Set(lojas.filter((l) => l.fonte === "OSM").map((l) => l.fonteId));
    lojasDescobertas = descobertas.filter((d) => !jaSalvos.has(d.osmId));

    lojasProximasSalvas = lojas
      .filter((l): l is typeof l & { latitude: number; longitude: number } => l.latitude != null && l.longitude != null)
      .filter((l) => haversineDistanceKm({ lat, lng: lon }, { lat: l.latitude, lng: l.longitude }) <= 30)
      .map((l) => ({ id: l.id, nome: l.nome, latitude: l.latitude, longitude: l.longitude, tipo: l.tipo }));
  }

  const opcoesProdutos = produtos.map((p) => ({ id: p.id, nome: p.nome }));
  const opcoesLojas = lojas.map((l) => ({ id: l.id, nome: l.nome }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Compras</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Lista de materiais, registro de compras e comparação de preços.</p>
        </div>
        <ObraSelector obras={obras} obraId={obraId} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Itens pendentes</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{itensPendentes.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Compras registradas</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{comprasLog.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Total gasto (últimas 20)</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{centsToBRL(totalGastoCent)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-[var(--color-text-muted)]">Produtos no catálogo</p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{produtos.length}</p>
          </CardBody>
        </Card>
      </div>

      <Tabs
        tabs={[
          {
            id: "lista",
            label: "Lista de compras",
            content: (
              <Card>
                <CardHeader title="O que falta comprar" />
                <CardBody className="flex flex-col gap-4">
                  <ItemListaForm action={criarItemComObra} />
                  {itensLista.length === 0 ? (
                    <EmptyState icon="compras" title="Nenhum item ainda" description="Adicione o primeiro item acima." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                            <th className="py-2 font-medium">Item</th>
                            <th className="py-2 font-medium">Qtd. necessária</th>
                            <th className="py-2 font-medium">Prioridade</th>
                            <th className="py-2 font-medium">Etapa</th>
                            <th className="py-2 font-medium">Status</th>
                            <th className="py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {itensLista.map((item) => (
                            <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                              <td className="py-2.5 font-medium text-[var(--color-text)]">{item.nomeLivre ?? "Item sem nome"}</td>
                              <td className="py-2.5 text-[var(--color-text-muted)]">{item.quantidadeNecessaria}</td>
                              <td className="py-2.5 text-[var(--color-text-muted)]">{PRIORIDADE_LABEL[item.prioridade]}</td>
                              <td className="py-2.5 text-[var(--color-text-muted)]">{item.etapa ?? "—"}</td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_ITEM_BADGE[item.status as StatusItemCompra]}`}>
                                    {STATUS_ITEM_COMPRA_LABEL[item.status as StatusItemCompra]}
                                  </span>
                                  {item.status === "PENDENTE" ? (
                                    <form action={async () => { "use server"; await atualizarStatusItemLista(obraId, item.id, "CANCELADO"); }}>
                                      <button type="submit" className="text-xs text-[var(--color-text-faint)] hover:underline">
                                        Cancelar
                                      </button>
                                    </form>
                                  ) : null}
                                  {item.status === "CANCELADO" ? (
                                    <form action={async () => { "use server"; await atualizarStatusItemLista(obraId, item.id, "PENDENTE"); }}>
                                      <button type="submit" className="text-xs text-[var(--color-primary)] hover:underline">
                                        Reabrir
                                      </button>
                                    </form>
                                  ) : null}
                                </div>
                              </td>
                              <td className="py-2.5 text-right">
                                <form action={excluirItemLista.bind(null, obraId, item.id)}>
                                  <button
                                    type="submit"
                                    className="rounded-md p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-serious-soft)] hover:text-[var(--color-serious)]"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            id: "registro",
            label: "Registro de compras",
            content: (
              <Card>
                <CardHeader title="Compras realizadas" description="Registre o que já foi efetivamente comprado" />
                <CardBody className="flex flex-col gap-4">
                  <CompraForm action={criarCompraComObra} produtos={opcoesProdutos} lojas={opcoesLojas} />
                  {comprasLog.length === 0 ? (
                    <EmptyState icon="compras" title="Nenhuma compra registrada ainda" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                            <th className="py-2 font-medium">Item</th>
                            <th className="py-2 font-medium">Loja</th>
                            <th className="py-2 font-medium">Qtd.</th>
                            <th className="py-2 font-medium">Valor total</th>
                            <th className="py-2 font-medium">Data</th>
                            <th className="py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {comprasLog.map((c) => (
                            <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
                              <td className="py-2.5 font-medium text-[var(--color-text)]">{c.nomeLivre ?? "Item sem nome"}</td>
                              <td className="py-2.5 text-[var(--color-text-muted)]">{c.lojaId ? lojaNome.get(c.lojaId) ?? "—" : "—"}</td>
                              <td className="py-2.5 text-[var(--color-text-muted)]">{c.quantidade}</td>
                              <td className="py-2.5 text-[var(--color-text-muted)]">{centsToBRL(c.valorTotalCent)}</td>
                              <td className="py-2.5 text-[var(--color-text-muted)]">{formatData(c.data)}</td>
                              <td className="py-2.5 text-right">
                                <form action={excluirCompra.bind(null, obraId, c.id)}>
                                  <button
                                    type="submit"
                                    className="rounded-md p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-serious-soft)] hover:text-[var(--color-serious)]"
                                  >
                                    <Icon name="trash" className="h-4 w-4" />
                                  </button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            id: "mercado",
            label: "Mercado & preços",
            content: (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader
                    title="Catálogo de produtos e lojas"
                    description="Cadastro manual real, sempre disponível como fallback universal."
                  />
                  <CardBody className="flex flex-col gap-5">
                    <ProdutoForm action={criarProduto} />
                    <LojaForm action={criarLojaManual} />
                    <OfertaForm action={criarOferta} produtos={opcoesProdutos} lojas={opcoesLojas} />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Mercado Livre"
                    description="API oficial (OAuth2, app registrado) — nunca scraping. Cobre também grandes redes que vendem através do marketplace deles."
                    action={
                      mlConexao.conectado ? (
                        <Badge tone="good">Conectado</Badge>
                      ) : mlConfigurado ? (
                        <LinkButton href="/api/integracoes/mercado-livre/connect" size="sm" icon="check">
                          Conectar
                        </LinkButton>
                      ) : (
                        <Badge tone="neutral">Não configurado</Badge>
                      )
                    }
                  />
                  <CardBody className="flex flex-col gap-3">
                    {mlStatus === "conectado" ? (
                      <p className="rounded-lg bg-[var(--color-good-soft)] px-3 py-2 text-xs text-[var(--color-good)]">
                        Conta conectada com sucesso.
                      </p>
                    ) : mlStatus === "erro" ? (
                      <p className="rounded-lg bg-[var(--color-serious-soft)] px-3 py-2 text-xs text-[var(--color-serious)]">
                        Não foi possível conectar: {mlDetalhe ?? "erro desconhecido"}.
                      </p>
                    ) : mlStatus === "sem_configuracao" ? (
                      <p className="rounded-lg bg-[var(--color-warning-soft)] px-3 py-2 text-xs text-[var(--color-warning)]">
                        Configure MERCADOLIVRE_CLIENT_ID, MERCADOLIVRE_CLIENT_SECRET e MERCADOLIVRE_REDIRECT_URI antes de conectar (ver
                        CONFIGURAR.md).
                      </p>
                    ) : mlStatus === "estado_invalido" ? (
                      <p className="rounded-lg bg-[var(--color-serious-soft)] px-3 py-2 text-xs text-[var(--color-serious)]">
                        A autorização expirou ou foi reiniciada — tente conectar de novo.
                      </p>
                    ) : null}
                    <MercadoLivreBusca
                      produtos={opcoesProdutos}
                      conectado={mlConexao.conectado}
                      buscar={buscarOfertasMercadoLivre}
                      importar={importarOfertaMercadoLivre}
                    />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Parâmetros de deslocamento"
                    description="Usados para calcular o custo efetivo de ofertas com retirada em loja física — nunca assumidos, só entram na conta se você informar."
                  />
                  <CardBody>
                    <LogisticaForm action={atualizarLogisticaComObra} defaults={logisticaDefaults} />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader
                    title="Comparador de preços"
                    description="Ordenado por custo efetivo (produto + frete ou deslocamento) — não pelo preço anunciado. Classificação com base no histórico de observações (90 dias)."
                  />
                  <CardBody>
                    {ofertasComClassificacao.length === 0 ? (
                      <EmptyState icon="orcamento" title="Nenhum preço registrado ainda" description="Cadastre produtos, lojas e um preço observado acima." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                              <th className="py-2 font-medium">Produto</th>
                              <th className="py-2 font-medium">Loja</th>
                              <th className="py-2 font-medium">Preço</th>
                              <th className="py-2 font-medium">Frete / deslocamento</th>
                              <th className="py-2 font-medium">Custo efetivo</th>
                              <th className="py-2 font-medium">Histórico</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ofertasComClassificacao.map((o) => (
                              <tr key={o.id} className="border-b border-[var(--color-border)] last:border-0 align-top">
                                <td className="py-2.5 font-medium text-[var(--color-text)]">
                                  {o.produtoNome}
                                  {o.custo.effectiveCostCent != null && o.custo.effectiveCostCent === menorCustoEfetivoCent ? (
                                    <Badge tone="good" className="ml-2">
                                      Melhor custo
                                    </Badge>
                                  ) : null}
                                </td>
                                <td className="py-2.5 text-[var(--color-text-muted)]">
                                  {o.lojaNomeExibicao}
                                  <span className="ml-1.5 text-xs text-[var(--color-text-faint)]">
                                    ({lojaTipo.get(o.lojaId) === "FISICA" ? "física" : "online"})
                                  </span>
                                </td>
                                <td className="py-2.5 text-[var(--color-text-muted)]">{centsToBRL(o.precoCent)}</td>
                                <td className="py-2.5 text-xs text-[var(--color-text-muted)]" title={o.custo.nota}>
                                  {o.custo.deslocamentoCent != null
                                    ? `${centsToBRL(o.custo.deslocamentoCent)} (${o.custo.distanceKm!.toFixed(1)} km)`
                                    : o.freteCent != null
                                      ? centsToBRL(o.freteCent)
                                      : "—"}
                                  <p className="mt-0.5 text-[var(--color-text-faint)]">{o.custo.nota}</p>
                                </td>
                                <td className="py-2.5 font-medium text-[var(--color-text)]">
                                  {o.custo.effectiveCostCent != null ? centsToBRL(o.custo.effectiveCostCent) : "Não calculável"}
                                </td>
                                <td className="py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASSIFICACAO_BADGE[o.resultado.classificacao]}`}
                                      title={o.resultado.motivo}
                                    >
                                      {o.resultado.classificacao}
                                    </span>
                                    {o.historico.length > 0 ? (
                                      <details className="text-xs text-[var(--color-text-muted)]">
                                        <summary className="cursor-pointer text-[var(--color-primary)]">
                                          {o.historico.length} registro{o.historico.length > 1 ? "s" : ""}
                                        </summary>
                                        <ul className="mt-1 flex flex-col gap-0.5">
                                          {o.historico.map((h, i) => (
                                            <li key={i}>
                                              {formatData(h.capturadoEm)} · {h.lojaNome} · {centsToBRL(h.precoCent)}
                                              {h.fonteUrl ? (
                                                <>
                                                  {" "}
                                                  ·{" "}
                                                  <a href={h.fonteUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">
                                                    fonte
                                                  </a>
                                                </>
                                              ) : null}
                                            </li>
                                          ))}
                                        </ul>
                                      </details>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            ),
          },
          {
            id: "mapa",
            label: "Lojas próximas",
            content: (
              <Card>
                <CardHeader title="Mapa de lojas próximas" description="Descoberta via OpenStreetMap — dado real, nunca inventado" />
                <CardBody className="flex flex-col gap-4">
                  {!temCoordenadas || !obra ? (
                    <div className="flex flex-col items-start gap-3">
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Ainda não localizamos o endereço desta obra no mapa.
                      </p>
                      <GeocodificarButton action={geocodificarObraComId} />
                    </div>
                  ) : (
                    <>
                      <LojasMap
                        obra={{ nome: obra.nome, latitude: obra.latitude!, longitude: obra.longitude! }}
                        lojasSalvas={lojasProximasSalvas}
                        lojasDescobertas={lojasDescobertas}
                      />
                      {lojasDescobertas.length === 0 && lojasProximasSalvas.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-faint)]">
                          Nenhuma loja encontrada perto desta obra no momento (ou a busca não pôde ser concluída agora).
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1.5 text-xs text-[var(--color-text-muted)]">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Localização da obra
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#16a34a]" /> Já no seu catálogo ({lojasProximasSalvas.length})
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-[#d97706]" /> Descobertas agora, clique para salvar ({lojasDescobertas.length})
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </CardBody>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
