CENTRAL DE REFORMA — ESCOPO MESTRE E GUIA DE DESENVOLVIMENTO PARA CLAUDE

Versão: 1.0
Objetivo: servir como documento-base para o Claude entender o produto, sua arquitetura, regras de negócio e estratégia de desenvolvimento.

1. VISÃO DO PRODUTO

O projeto é uma plataforma web responsiva para funcionar como um verdadeiro "Sistema Operacional da Reforma".

A plataforma deve ajudar uma pessoa a planejar, pesquisar, comprar, organizar e acompanhar uma reforma do início ao fim.

O produto NÃO deve parecer um chatbot com algumas telas ao redor. A interface principal deve ser um SaaS moderno, profissional, visual e intuitivo. A inteligência artificial deve funcionar como uma camada contextual de inteligência, aparecendo quando for útil e podendo ser consultada pelo usuário, mas sem dominar a experiência.

A plataforma deve começar simples, barata e modular, mas sua arquitetura precisa permitir crescimento futuro.

Visão de evolução:

FASE A — Pessoa física reformando a própria casa/apartamento
FASE B — Pedreiros, mestres de obra, arquitetos e engenheiros
FASE C — Pequenas empresas e empreiteiras
FASE D — Plataforma/ecossistema de reformas e compras

2. PROBLEMA QUE O PRODUTO RESOLVE

Uma reforma normalmente exige lidar simultaneamente com:

orçamento;

materiais;

preços em várias lojas;

promoções;

frete;

retirada;

deslocamento;

estoque;

compras;

notas fiscais e recibos;

mão de obra;

cronograma;

medidas;

plantas;

documentos;

fotos;

problemas;

alterações de projeto;

desperdício;

decisões técnicas;

acompanhamento de progresso.

Hoje essas informações ficam espalhadas entre WhatsApp, planilhas, fotos, PDFs, sites, lojas e anotações.

O produto deve centralizar essas informações e transformar os dados em decisões úteis.

3. PRINCÍPIO CENTRAL

A plataforma deve responder a uma pergunta:

"Qual é a melhor decisão para esta reforma, considerando o contexto real da obra?"

Não basta encontrar o menor preço.

O sistema deve considerar, quando houver dados:

preço;

preço por unidade;

preço por m²;

quantidade necessária;

quantidade da embalagem;

frete;

distância;

custo estimado de deslocamento;

pedágios;

estacionamento;

retirada;

prazo;

disponibilidade;

qualidade/avaliações;

histórico de preços;

orçamento da obra;

etapa atual;

necessidade daquele material;

risco de esperar;

possibilidade de desperdício;

compatibilidade com o projeto.

O resultado deve ser baseado em dados reais e rastreáveis.

4. REGRA ABSOLUTA DE INTEGRIDADE DOS DADOS

NUNCA inventar:

preços;

lojas;

produtos;

estoque;

fornecedores;

profissionais;

avaliações;

promoções;

prazos;

características técnicas;

disponibilidade;

dados de mercado.

Todo dado externo deve possuir, sempre que possível:

fonte;

URL ou identificador da fonte;

data/hora de coleta;

localização;

tipo da fonte;

status de verificação;

confiança;

condições da oferta;

quantidade de observações, quando aplicável.

Exemplo correto:

Produto: Porcelanato X
Preço: R$ 39,90/m²
Fonte: varejista X
Coletado em: data/hora
Local: região informada
Estoque: confirmado na consulta
Status: verificado

Exemplo correto quando não há confirmação:

"Preço encontrado na fonte há 5 dias. Estoque atual não confirmado."

Nunca transformar uma estimativa em fato.

Quando a informação não estiver disponível, apresentar:

"Informação não disponível."

5. PERSONA PRINCIPAL

MVP:

Pessoa física que está reformando:

casa;

apartamento;

banheiro;

cozinha;

quarto;

sala;

área externa;

escritório;

ou qualquer outro ambiente.

O usuário deve poder criar uma obra completa ou apenas um projeto específico.

Exemplos:

"Reforma do apartamento"

ou

"Reforma do banheiro"

O contexto cadastrado deve influenciar todas as funcionalidades posteriores.

6. ESTRUTURA CONCEITUAL

Modelo inicial:

Usuário
|
+-- Obras/Projetos
|
+-- Localização
+-- Ambientes
+-- Orçamento
+-- Materiais
+-- Produtos
+-- Compras
+-- Estoque
+-- Lojas
+-- Fornecedores
+-- Mão de obra
+-- Cronograma
+-- Documentos
+-- Diário
+-- Fotos
+-- Vídeos
+-- Plantas
+-- Medidas
+-- Problemas
+-- Decisões
+-- Histórico
+-- Inteligência

7. DASHBOARD

O dashboard deve ser a principal tela operacional.

Deve mostrar de maneira visual:

nome da obra;

progresso;

orçamento total;

valor planejado;

valor gasto;

valor restante;

economia;

compras pendentes;

compras realizadas;

materiais em estoque;

próximas tarefas;

tarefas atrasadas;

alertas;

oportunidades de preço;

andamento da mão de obra;

últimos registros;

documentos recentes;

fotos/progresso.

O dashboard deve responder:

"O que está acontecendo na minha reforma agora?"

8. NAVEGAÇÃO

A navegação deve ser híbrida.

O usuário deve conseguir navegar por menus e módulos tradicionais, mas também ter uma área do tipo:

"De que você precisa?"

Exemplos:

Pesquisar material

Comparar preços

Atualizar orçamento

Ver próximas tarefas

Registrar compra

Adicionar nota fiscal

Consultar estoque

Registrar problema

Analisar foto

Perguntar sobre a obra

A IA pode ajudar, mas nunca deve ser a única maneira de utilizar o sistema.

9. MÓDULO DE OBRAS

Permitir:

criar obra;

editar obra;

arquivar obra;

excluir obra;

duplicar estrutura quando apropriado;

adicionar localização;

adicionar ambientes;

definir objetivo;

definir orçamento;

definir datas;

definir observações;

adicionar documentos;

adicionar fotos.

Campos devem ser extensíveis.

10. AMBIENTES

Cada obra pode conter vários ambientes.

Exemplo:

Apartamento

Banheiro

Cozinha

Sala

Quarto

Área externa

Cada ambiente pode possuir:

dimensões;

área;

altura;

perímetro;

portas;

janelas;

fotos;

vídeos;

medidas;

planta;

materiais;

produtos;

orçamento;

tarefas;

problemas;

observações.

11. PLANEJAMENTO TÉCNICO

O sistema deve futuramente ajudar com:

área de piso;

área de parede;

perímetro;

quantidade de revestimento;

quantidade de argamassa;

quantidade de rejunte;

tinta;

rodapé;

acabamentos;

margem de perda;

quantidade de embalagens.

IMPORTANTE:

Cálculos determinísticos devem ser realizados por código, não pelo LLM.

O sistema deve diferenciar:

medida informada pelo usuário;

medida extraída de documento;

medida estimada por visão computacional;

medida confirmada;

medida desconhecida.

Nunca apresentar estimativa visual como medida confirmada.

12. PRODUTOS

Criar uma entidade normalizada de produto.

Um produto pode possuir:

nome;

fabricante;

marca;

modelo;

SKU;

EAN/GTIN;

categoria;

subcategoria;

dimensões;

unidade;

embalagem;

quantidade por embalagem;

cor;

acabamento;

especificações;

imagens;

características técnicas.

Produtos de fontes diferentes precisam ser identificados/matchados.

O sistema deve priorizar identificadores determinísticos:

EAN/GTIN;

SKU;

fabricante + modelo;

características técnicas;

matching semântico/IA somente quando necessário.

Quando houver ambiguidade, não assumir automaticamente que dois produtos são iguais.

13. LOJAS E OFERTAS

Separar:

PRODUTO

de:

OFERTA

Exemplo:

Produto:
Porcelanato X

Oferta:
Loja Y
R$ 49,90/m²
Estoque confirmado
Retirada disponível
Frete R$ 30
Coletado em determinada data

Estrutura conceitual de oferta:

product_id;

seller_id;

price;

currency;

unit;

package_quantity;

shipping;

stock_status;

pickup_available;

location;

source_url;

source_type;

captured_at;

verified_at;

confidence;

conditions.

14. PESQUISA DE MERCADO

O sistema deve pesquisar:

lojas online;

marketplaces;

sites de fabricantes;

catálogos;

promoções;

fontes públicas;

APIs;

integrações;

lojas físicas quando houver fonte confiável;

dados fornecidos pelo usuário;

fotos de folhetos;

screenshots;

PDFs.

Fontes devem ser identificadas.

A plataforma deve preferir fontes oficiais e dados verificáveis.

15. COMPARADOR

O comparador deve permitir comparar:

preço;

preço por unidade;

preço por m²;

embalagem;

quantidade;

frete;

retirada;

distância;

prazo;

estoque;

avaliação quando disponível;

histórico;

custo total.

A melhor oferta não é necessariamente a de menor preço anunciado.

Exemplo:

Oferta A:
R$ 40
Loja a 5 km

Oferta B:
R$ 35
Loja a 50 km

O sistema pode calcular custo efetivo de aquisição quando os dados necessários estiverem disponíveis.

16. MOTOR DE LOGÍSTICA

Calcular deterministicamente:

custo do produto

frete

combustível

pedágio

estacionamento

outras despesas informadas
= custo efetivo

Quando aplicável, considerar:

distância;

número de viagens;

quantidade;

capacidade de transporte;

retirada;

entrega.

Não inventar custos.

Se algum componente não estiver disponível:

"Não foi possível calcular o custo total porque X não está disponível."

17. HISTÓRICO DE PREÇOS

Para produtos com dados suficientes:

menor preço;

maior preço;

média;

mediana;

quantidade de observações;

período analisado;

tendência;

posição do preço atual no histórico;

sazonalidade quando houver dados suficientes.

Classificação possível:

VERDE:
Preço historicamente muito bom.

AMARELO:
Preço dentro do comportamento normal.

VERMELHO:
Preço acima do histórico.

CINZA:
Dados insuficientes.

Nunca gerar uma conclusão histórica sem dados suficientes.

18. ALERTAS

O usuário pode configurar:

"Avise quando este produto ficar abaixo de R$ 45/m²."

O sistema monitora fontes disponíveis.

Quando houver confirmação:

registrar ocorrência;

registrar fonte;

registrar data/hora;

informar condições;

alertar usuário.

Nunca alertar baseado em preço inventado ou desatualizado sem deixar claro o estado da informação.

19. LISTA DE COMPRAS

Gerar lista baseada em:

projeto;

ambientes;

planejamento técnico;

orçamento;

cronograma;

estoque;

compras já realizadas.

Cada item deve possuir:

produto;

quantidade;

unidade;

quantidade necessária;

quantidade comprada;

quantidade em estoque;

quantidade faltante;

prioridade;

etapa em que será usado;

orçamento;

status.

20. ORÇAMENTO

Controlar:

orçamento inicial;

orçamento por ambiente;

orçamento por categoria;

orçamento por produto;

planejado;

comprado;

pago;

restante;

variação;

economia;

excesso.

Exibir gráficos.

Cálculos devem ser determinísticos.

21. ESTOQUE

O usuário poderá adicionar estoque por:

entrada manual;

nota fiscal;

recibo;

PDF;

foto;

screenshot.

OCR/IA pode extrair:

produto;

quantidade;

unidade;

preço;

loja;

data.

Se houver ambiguidade, perguntar.

Não assumir produto incorreto.

Estoque deve ser vinculado ao projeto/ambiente quando possível.

22. COMPRAS

Registrar:

produto;

quantidade;

preço;

loja;

data;

pagamento;

frete;

pedido;

nota fiscal;

garantia;

status;

entrega;

retirada.

Futuramente:

monitorar pedidos;

detectar atrasos;

sugerir recompra;

acompanhar devoluções;

auxiliar no processo de compra.

Ações externas devem exigir autorização apropriada do usuário.

23. CRONOGRAMA

Criar sistema de tarefas com:

tarefa;

descrição;

responsável;

ambiente;

início;

fim;

duração;

status;

dependências;

prioridade;

percentual de conclusão.

Visualizações:

lista;

calendário;

Gantt;

timeline.

O Gantt deve ser ajustável.

Se uma tarefa atrasar, o sistema deve recalcular impactos usando lógica determinística.

24. MÃO DE OBRA

Futuramente permitir:

profissionais;

empresas;

pedreiros;

eletricistas;

encanadores;

pintores;

marceneiros;

outros.

Dados devem vir de fontes confiáveis.

Não inventar profissionais.

Possíveis dados:

nome;

localização;

especialidade;

contato;

avaliações;

origem da avaliação;

disponibilidade;

orçamento;

histórico do projeto.

25. DIÁRIO DA OBRA

Registro diário contendo:

data;

texto;

fotos;

vídeos;

tarefas executadas;

problemas;

decisões;

alterações;

profissionais presentes;

materiais utilizados.

A plataforma deve permitir acompanhar a evolução cronológica da obra.

26. FOTOS E VISÃO COMPUTACIONAL

Permitir:

fotos de ambientes;

antes/depois;

análise visual;

identificação de possíveis materiais;

leitura de documentos;

leitura de notas;

análise de plantas;

comparação de evolução.

A visão computacional deve diferenciar claramente:

CONFIRMADO
ESTIMADO
PROVÁVEL
DESCONHECIDO

Nunca inventar dimensões ou características técnicas.

27. PLANTAS E REPRESENTAÇÃO DA OBRA

Futuramente permitir:

upload de planta;

desenho simples;

medidas;

ambientes;

versões;

anotações;

referências;

fotos vinculadas a pontos da planta.

A IA poderá consultar esse contexto posteriormente.

28. DOCUMENTOS

Armazenar:

orçamentos;

contratos;

notas fiscais;

recibos;

garantias;

plantas;

manuais;

documentos técnicos;

PDFs;

imagens.

Permitir classificação e pesquisa.

29. IA — CAMADA DE INTELIGÊNCIA

A IA deve conhecer o contexto da obra.

Exemplo:

Usuário:
"Qual revestimento usamos no banheiro?"

O sistema deve buscar dados estruturados do projeto antes de responder.

Outras perguntas:

Estou gastando demais?

Qual a próxima etapa?

Qual produto está mais vantajoso?

Devo comprar agora?

Quanto ainda falta?

O cronograma está atrasado?

Quanto material falta?

Onde encontramos esse produto?

Qual foi o preço anterior?

Existe uma alternativa mais barata?

Essa compra está dentro do orçamento?

A IA deve consultar dados reais do sistema.

30. QUATRO GRANDES MOTORES

O sistema pode ser organizado conceitualmente em quatro engines:

MARKET ENGINE
Pesquisa e normalização de mercado.

WORK ENGINE
Obra, ambientes, materiais, compras, estoque, cronograma etc.

INTELLIGENCE ENGINE
Histórico, cálculos, análise e recomendações.

AGENT LAYER
Agentes especializados executando tarefas.

31. AGENTES

Arquitetura inicial sugerida:

orchestrator
market-research
product-matching
price-validation
price-history
logistics
inventory
budget
schedule
construction
document
vision
labor
alert

Não é obrigatório ativar todos desde o início.

O agente orquestrador deve delegar apenas o trabalho necessário.

32. AGENTE ORQUESTRADOR

Responsável por:

entender intenção;

identificar contexto;

selecionar agente especializado;

fornecer apenas contexto necessário;

combinar resultados;

devolver resposta ao usuário.

Não deve executar todo o trabalho sozinho.

Exemplo:

Usuário:
"Quero comprar o porcelanato do banheiro."

Orquestrador:

consulta projeto;

consulta medidas;

consulta necessidade;

chama market-research;

chama product-matching;

chama price-validation;

chama logistics;

consolida;

apresenta opções.

33. SUBAGENTES

Subagentes devem ser usados para tarefas isoladas ou complexas.

Exemplos:

pesquisar 20 fontes;

analisar grande conjunto de arquivos;

revisar código;

testar uma funcionalidade;

validar preços;

comparar produtos;

analisar documentos.

Regra:

Não passar todo o contexto da aplicação para cada subagente.

Cada subagente recebe somente:

objetivo;

dados necessários;

arquivos necessários;

regras relevantes;

formato de saída.

Deve retornar resumo estruturado e curto.

Isso reduz consumo de tokens e melhora a qualidade.

Subagentes NÃO devem ser criados em excesso.

34. SKILLS

Skills representam conhecimento/instruções reutilizáveis.

Sugestões:

skills/

data-integrity

product-research

product-matching

price-validation

price-history

logistics-calculation

construction-calculation

frontend-design

testing

security

document-analysis

vision-analysis

Exemplo:

price-validation deve ensinar:

exigir fonte;

exigir data;

verificar unidade;

verificar embalagem;

diferenciar preço unitário de preço por m²;

verificar condições;

indicar ausência de estoque;

não inventar.

Skills devem ser carregadas somente quando relevantes.

35. MCP

MCP deve ser entendido como camada de conexão com ferramentas/serviços externos.

Usar somente quando trouxer benefício real.

MCPs candidatos:

documentação/bibliotecas;

navegador;

Git/GitHub;

banco de dados;

arquivos;

outras integrações necessárias.

Inicialmente considerar:

Context7:
documentação atualizada de bibliotecas e frameworks.

Playwright:
navegação/testes de navegador e futuramente pesquisa automatizada.

Git/GitHub:
versionamento e colaboração.

Banco de dados:
somente quando houver necessidade operacional clara.

Não instalar dezenas de MCPs.

Excesso de ferramentas aumenta contexto e complexidade.

36. PLUGINS

Plugins podem agrupar:

skills;

agentes;

hooks;

MCPs;

workflows.

Plugins recomendados inicialmente para desenvolvimento:

feature-dev;

frontend-design;

security-guidance;

pr-review-toolkit;

commit-commands;

workflows de simplificação/revisão.

Não instalar tudo indiscriminadamente.

Plugins devem ser avaliados pelo benefício real para o projeto.

37. HOOKS

Hooks são automações acionadas por eventos.

Possíveis usos:

validar código;

rodar testes;

verificar formatação;

impedir secrets;

executar verificações de segurança;

atualizar determinadas rotinas;

impedir commits problemáticos.

Não criar hooks excessivos.

38. ARQUITETURA DE DESENVOLVIMENTO

Estrutura conceitual:

central-reforma/
|
+-- CLAUDE.md
|
+-- .claude/
|   +-- agents/
|   +-- skills/
|   +-- hooks/
|   +-- settings.json
|
+-- apps/
|   +-- web/
|   +-- api/
|
+-- packages/
|   +-- database/
|   +-- domain/
|   +-- ui/
|   +-- shared/
|
+-- docs/
|   +-- architecture/
|   +-- product/
|   +-- data/
|   +-- agents/

A stack definitiva deve ser decidida após análise técnica.

Direção inicial possível:

Frontend:
React/Next.js

Backend:
TypeScript

Database:
PostgreSQL

Mas NÃO assumir essas tecnologias sem validar requisitos, custo, manutenção, deploy e integrações.

39. PRINCÍPIO DE ECONOMIA DE TOKENS

Usar:

DETERMINÍSTICO → CÓDIGO
CONHECIMENTO REUTILIZÁVEL → SKILL
TAREFA ISOLADA/GRANDE → SUBAGENT
FERRAMENTA EXTERNA → MCP
REGRA PERSISTENTE → CLAUDE.md / RULES
AUTOMAÇÃO POR EVENTO → HOOK

Não utilizar LLM para:

somas;

médias;

medianas;

cálculos de área;

cálculos de quantidade;

datas;

dependências;

regras matemáticas;

validações que podem ser determinísticas.

LLM deve interpretar, raciocinar sobre contexto e explicar resultados.

40. CONTROLE DE CONTEXTO

Nunca carregar:

banco inteiro;

todos os documentos;

todos os preços;

todos os produtos;

todo histórico.

Buscar somente o contexto necessário.

Exemplo:

Pergunta sobre banheiro:

carregar:

obra;

banheiro;

materiais do banheiro;

compras relevantes;

estoque relevante;

histórico relevante.

Não carregar a obra inteira se não for necessário.

41. PIPELINE DE DADOS DE MERCADO

Arquitetura:

Fonte
→ crawler/API/browser
→ extractor
→ normalizer
→ product matcher
→ validator
→ price engine
→ database

Nunca:

site
→ Claude
→ "acho que custa R$ X"

O dado deve ser estruturado antes de entrar no sistema.

42. HISTÓRICO E OBSERVAÇÕES

Cada observação de preço deve ser armazenada como evento histórico.

Exemplo:

product_id
seller_id
price
unit
source
captured_at
availability
conditions

Isso permite construir histórico real.

43. SEGURANÇA

Desde o início considerar:

autenticação;

autorização;

isolamento de dados entre usuários;

proteção de documentos;

secrets;

validação de inputs;

proteção contra XSS;

proteção contra SQL injection;

SSRF;

IDOR;

exposição de APIs;

upload seguro;

limites de arquivos;

logs;

auditoria.

Nenhum usuário deve conseguir consultar a obra de outro usuário.

44. ROADMAP

MVP 0 — FUNDAÇÃO

autenticação;

usuários;

obras;

ambientes;

localização;

dashboard básico;

banco;

UI responsiva.

MVP 1 — MERCADO

produtos;

lojas;

ofertas;

busca;

filtros;

comparação;

fonte/proveniência.

MVP 2 — COMPRAS

lista de compras;

orçamento;

compras;

estoque;

notas;

documentos.

MVP 3 — GESTÃO

cronograma;

Gantt;

diário;

mão de obra;

progresso.

MVP 4 — INTELIGÊNCIA

recomendações;

visão;

análise de documentos;

agentes;

alertas;

histórico.

MVP 5 — AUTOMAÇÃO

monitoramento;

oportunidades;

acompanhamento de pedidos;

ações autorizadas;

compras assistidas.

45. METODOLOGIA DE DESENVOLVIMENTO

NUNCA construir o sistema inteiro em uma única tarefa.

Fluxo:

IDEIA
→ REQUISITOS
→ ARQUITETURA
→ PLANO
→ IMPLEMENTAÇÃO PEQUENA
→ TESTE
→ SIMPLIFY
→ SECURITY REVIEW
→ DOCUMENTAÇÃO
→ COMMIT

Cada funcionalidade deve ser uma unidade pequena e verificável.

46. PAPEL DO CLAUDE CODE

Claude Code será o principal ambiente de engenharia.

Responsabilidades:

analisar código;

criar arquivos;

modificar código;

implementar funcionalidades;

executar testes;

revisar;

corrigir bugs;

trabalhar com Git;

ajudar na arquitetura;

executar agentes especializados.

Não deve tomar decisões irreversíveis sem explicar o impacto quando a decisão for arquitetural.

47. PAPEL DO CLAUDE COWORK

Cowork pode ser usado para:

pesquisa;

análise de documentos;

organização;

levantamento de requisitos;

estudos de mercado;

consolidação de informações;

planejamento;

preparação de especificações.

Depois o resultado pode alimentar o Claude Code.

48. REGRAS PARA TODA IMPLEMENTAÇÃO

Antes de implementar uma mudança relevante:

entender o estado atual;

localizar os arquivos envolvidos;

verificar arquitetura existente;

avaliar impacto;

propor plano;

implementar;

testar;

revisar;

simplificar;

documentar quando necessário.

Nunca reescrever grandes partes sem necessidade.

Preferir mudanças pequenas.

49. TESTES

Cada módulo importante deve possuir testes.

Testar principalmente:

regras de negócio;

cálculos;

autenticação;

autorização;

isolamento de usuários;

preços;

matching de produtos;

estoque;

orçamento;

cronograma;

integrações.

Testes determinísticos devem ser automatizados.

50. INTERFACE

A interface deve ser:

moderna;

profissional;

limpa;

responsiva;

acessível;

rápida;

intuitiva;

consistente.

Referência conceitual:

SaaS profissional + produtividade + gestão de projetos.

Evitar:

interface excessivamente futurista;

excesso de chat;

telas cheias;

IA como elemento dominante;

animações sem propósito.

51. FILOSOFIA DO PRODUTO

O usuário não deveria precisar pensar:

"Qual prompt eu tenho que escrever?"

Ele deve pensar:

"Quero comprar o revestimento do banheiro."

E o sistema deve entender o contexto.

O produto deve ser:

proativo;

contextual;

transparente;

rastreável;

confiável;

simples de usar.

Mas nunca deve esconder a origem dos dados.

52. FUTURO — AGENTE DE COMPRAS

A evolução pode permitir:

pesquisar;

comparar;

monitorar;

avisar;

preparar carrinho;

pedir autorização;

executar ação autorizada;

acompanhar pedido;

atualizar estoque.

Ações que envolvam dinheiro ou compromisso externo devem possuir autorização explícita e controles apropriados.

53. FUTURO — ECOSSISTEMA

Possíveis expansões:

profissionais;

fornecedores;

lojas;

arquitetos;

engenheiros;

empreiteiros;

transportadoras;

marketplaces;

fabricantes;

serviços;

financiamento;

seguros;

garantia;

manutenção pós-obra.

Isso não faz parte do MVP.

A arquitetura deve permitir evolução sem obrigar o MVP a carregar toda essa complexidade.

54. INSTRUÇÃO PRINCIPAL AO CLAUDE

Você está trabalhando em um produto de longo prazo.

Não tente impressionar criando muitas funcionalidades.

Priorize:

corretude;

segurança;

simplicidade;

arquitetura sustentável;

experiência do usuário;

dados reais;

rastreabilidade;

testes;

baixo acoplamento;

baixo consumo de contexto/tokens.

Quando houver dúvida:

não invente;

identifique a dúvida;

apresente opções;

recomende uma;

explique o impacto;

espere decisão quando a decisão for importante.

55. PRIMEIRA TAREFA RECOMENDADA

Ao iniciar o projeto no Claude Code, NÃO programe imediatamente.

Primeiro:

leia este documento;

analise os requisitos;

identifique inconsistências;

identifique requisitos ausentes;

proponha arquitetura;

proponha stack;

proponha modelo inicial de dados;

proponha estrutura de pastas;

proponha estratégia de agentes;

proponha skills;

proponha MCPs;

proponha plugins;

proponha estratégia de testes;

proponha estratégia de segurança;

proponha roadmap técnico.

Depois apresente:

A. decisões que podem ser tomadas automaticamente;
B. decisões que precisam da aprovação do proprietário do produto;
C. riscos;
D. dependências;
E. custo/complexidade potencial;
F. plano de implementação por etapas.

NÃO escreva código nesta primeira etapa.

56. PROMPT DE INICIALIZAÇÃO PARA COLAR NO CLAUDE

Use o texto abaixo depois de colocar este documento no projeto:

"Leia integralmente o documento CENTRAL DE REFORMA — ESCOPO MESTRE.

Este documento é a especificação inicial do produto.

Quero que você atue como um arquiteto de software sênior, engenheiro de produto e líder técnico.

NÃO comece programando.

Primeiro analise criticamente o escopo.

Quero que você:

identifique conflitos ou ambiguidades;

identifique requisitos ausentes;

proponha arquitetura;

proponha stack;

proponha modelo de dados;

proponha estrutura do repositório;

proponha agentes;

proponha subagentes;

proponha skills;

proponha MCPs;

proponha plugins;

proponha hooks;

proponha estratégia de contexto e economia de tokens;

proponha segurança;

proponha testes;

proponha roadmap técnico.

Não assuma que toda tecnologia sugerida no documento é obrigatória.

Valide as escolhas tecnicamente.

Não invente capacidades de serviços, APIs, preços, fornecedores ou dados externos.

Para cálculos determinísticos, prefira código.

Para conhecimento reutilizável, prefira skills.

Para tarefas isoladas ou grandes, prefira subagentes.

Para ferramentas externas, use MCP somente quando necessário.

Para regras persistentes do projeto, use CLAUDE.md/rules.

Para automações baseadas em eventos, considere hooks.

Mantenha o contexto enxuto.

Não carregue dados desnecessários.

Não implemente nada ainda.

Ao final, entregue uma proposta técnica dividida em pequenas etapas, começando pela fundação do MVP 0.

Aguarde minha aprovação antes de começar a implementação."

57. RESULTADO ESPERADO

O produto final deve ser muito mais do que um comparador de preços.

Deve funcionar como uma central inteligente onde o usuário consegue:

PLANEJAR
→ MEDIR
→ PESQUISAR
→ COMPARAR
→ COMPRAR
→ CONTROLAR
→ ARMAZENAR
→ EXECUTAR
→ ACOMPANHAR
→ ANALISAR
→ DECIDIR

Tudo dentro do contexto da mesma obra.

A IA deve ser a inteligência por trás do sistema.

O sistema deve ser a interface principal.

E os dados devem ser rastreáveis.