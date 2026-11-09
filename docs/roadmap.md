# Roadmap da plataforma — Apresentação 3D e CRM de vendas para incorporadoras

**Versão:** v1.2 · **Data:** 06/11/2026

> Este arquivo é o "contrato" da **plataforma genérica** (o produto). Cada projeto específico tem o seu próprio roadmap em `projetos-especificos/<NN>-<id>/roadmap.md`.
> **Nenhuma ideia se perde:** todo pedido entra aqui (pedido, decisão, banco de ideias) e é atualizado a cada rodada.
> Convenção: ⭐ = minha recomendação; responda **"ok com as estrelas"** para aprovar todas. `[x]` feito · `[~]` parcial · `[ ]` a fazer.

---

## O que mudou nesta rodada (v1.2 — vitrine no GitHub)

- README reescrito como **vitrine da plataforma**: GIF do voo de drone, 20 imagens (maquete de dia e de noite, unidade, espelho, corte por pavimento, projeção solar, bairro, tour, CRM, relatórios, celular), destaques, lista completa de funcionalidades, diagrama de como funciona e "comece agora".
- Todas as imagens são do **projeto padrão** (sem marca) e ficam em `docs/imagens/`; são refeitas com `node scripts/capturas-readme.mjs <pasta> todos` + `python3 scripts/montar-imagens-readme.py <pasta>`.
- Trajetória do sol agora é um "tubo" visível de longe (antes era uma linha fina) e o brilho noturno ficou mais suave.

## Rodada anterior (v1.1 — generalização)


- O sistema virou uma **plataforma genérica**: o app, o repositório, o README e a descrição no GitHub não citam mais nenhuma incorporadora, logo ou identidade visual.
- Criado o **projeto padrão** (`projeto-padrao/`): empreendimento de demonstração "Modelo Residencial", sem logo, com cores neutras, endereço e localização de exemplo. A volumetria e as plantas vieram do primeiro projeto (24 unidades, 8 tipologias, coberturas duplex), sem nenhuma imagem ou texto dele.
- O **Missouri Residencial** virou o **Projeto específico 1**, numa pasta própria (`projetos-especificos/01-missouri/`) com seus dados, imagens do folder e roadmap.
- O que era "código especial do Missouri" (ruas Alagoas e Mato Grosso) passou a ser **dado do projeto** (`entorno.ruasAdicionais`), sem nenhum caso especial no código.
- Novo comando `npm run build:todos`: gera `dist/padrao-apresentacao-3d.html` e `dist/missouri-apresentacao-3d.html` de uma vez.
- Testes passam a validar **todos os projetos** automaticamente e conferem que o projeto padrão não contém nome, cidade ou incorporadora de nenhum projeto específico (15 testes).

---

## 1. Visão e premissas

- **Produto:** apresentar e vender os apartamentos de um empreendimento com maquete 3D navegável (sol real, noite, drone, tour virtual) e controlar as vendas (CRM, espelho, relatórios) sem depender de sistema externo.
- **Uma base, vários projetos:** o código é o mesmo; cada empreendimento é uma pasta de dados (`empreendimento.json` + imagens + identidade visual).
- **Hoje:** computador do plantão, **sem internet e sem servidor**, um único `.html` que abre por duplo clique no Chrome.
- **Depois:** link na internet, celular (PWA instalável), vários corretores com dados compartilhados.
- **Público:** dono/gerente comercial (leigo em tecnologia), corretores e clientes finais.

## 2. Estrutura

| Pasta | O que é |
|---|---|
| `projeto-padrao/` | Projeto genérico de demonstração e **ponto de partida** de todo projeto específico |
| `projetos-especificos/<NN>-<id>/` | Um empreendimento real: dados, imagens, identidade visual e roadmap próprio |
| `src/` | Código da plataforma (igual para todos) |
| `docs/` | Roadmap da plataforma, aprendizados e passo a passo para um projeto novo |

**Projetos específicos**

| Nº | Projeto | Incorporadora | Situação |
|---|---|---|---|
| 1 | Missouri Residencial — Divinópolis/MG | Costa Lacerda | Fase 1 entregue (v0.1); aguardando teste de campo · [roadmap](../projetos-especificos/01-missouri/roadmap.md) |

## 3. Pedidos registrados (plataforma)

| # | Pedido | Situação |
|---|---|---|
| P01 | Sistema de vendas/CRM para incorporadoras | [x] funil, clientes, unidades, alertas |
| P02 | Visualização 3D **realista** do empreendimento | [~] gerada por código com materiais realistas, céu físico e sombras; ver D11 (modelo 3D do arquiteto) |
| P03 | Vista do entorno e da localização | [~] ruas alinhadas ao terreno e orientação real; vizinhos ilustrativos (D03) |
| P04 | Projeção solar | [x] sol por data/hora/coordenada, trajetória, animação do dia, horas de sol por fachada |
| P05 | Vista noturna | [x] céu, estrelas, postes, janelas acesas, letreiro e LEDs |
| P06 | Visão "de drone" e navegação fluida | [x] órbita, drone automático, vistas prontas |
| P07 | Clicar na unidade e ver informações técnicas e comerciais | [x] painel lateral |
| P08 | Indicar disponibilidade (luz acesa à noite) | [x] acesa = disponível, meia-luz = reservado/negociação, apagada = vendido |
| P09 | Ao clicar: zoom na unidade + tela ao lado | [x] |
| P10 | Tour virtual 3D, visita guiada por todos os cômodos | [~] interiores gerados pelas plantas, vista real da janela; ver D11 |
| P11 | Modo gerente (controle total) e modo cliente (visualização) | [x] PIN |
| P12 | Local agora; depois link e celular | [x] arquivo único; pasta para publicar + PWA; layout de celular |
| P13 | Relatório de vendas em docx, pdf e excel | [x] |
| P14 | Backup .json sem banco de dados + importar ao abrir | [x] |
| P15 | Estrutura para outros empreendimentos/incorporadoras aproveitando o aprendizado | [x] projeto padrão + projetos específicos + `docs/novo-projeto-especifico.md` + skill |
| P16 | Roadmap com fases, decisões, ideias, atualizado passo a passo | [x] este arquivo + roadmap por projeto |
| P17 | Projeto no GitHub (victortlacerda/incorporadora) | [x] |
| P18 | Aproveitar skills anteriores (arena, showroom) e img2threejs | [x] ver `docs/aprendizados.md` |
| P20 | Deixar o GitHub mais apresentável, com prints e funcionalidades da plataforma | [x] v1.2 |
| P19 | **Versão genérica** sem nome de incorporadora, logo ou identidade visual; Missouri como Projeto específico 1 em pasta separada; app, GitHub e descrição genéricos | [x] v1.1 |

## 4. Decisões

### 4.A Decisões tomadas (padrão sensato — pode mudar)

| Nº | Decisão | Motivo / impacto |
|---|---|---|
| D-A1 | Vite + TypeScript + Three.js, tudo num **único .html**; relatórios no navegador (jsPDF, docx, ExcelJS) | Duplo clique hoje; o mesmo código vira link/PWA |
| D-A2 | Dados técnicos em `empreendimento.json`; dados comerciais no navegador + backup `.json` | Trocar de empreendimento sem mexer no código |
| D-A3 | Regras de negócio em funções puras testadas (`src/core`) | Menos erro; testes automáticos |
| D-A4 | Primeiro uso com **dados de exemplo** marcados; botão "Começar do zero" | Ver funcionando já; nada fictício sem aviso |
| D-A6 | Status: Disponível · Em negociação · Reservado · Vendido · Indisponível, sempre com cor + texto + ícone | Acessibilidade (contraste ≥ 4,5:1) |
| D-A7 | Funil: Novo → Contato → Visita → Proposta → Reserva → Contrato → Vendido / Perdido, com efeito automático na unidade | Espelho sempre certo; sem reserva dupla |
| D-A8 | PIN só trava a tela; segurança forte com login na fase online | — |
| D-A9 | Entorno com ruas alinhadas ao terreno; vizinhos ilustrativos | Sem dados de prédios reais (D03) |
| D-A10 | Tour com interiores gerados a partir das plantas + botão para os renders do folder | Funciona offline em qualquer tipologia |
| D-A11 | Drone automático após 2 min sem toque no modo cliente | TV do plantão |
| D-A12 | 2ª tela sincronizada para o cliente (TV) | Corretor no notebook, cliente na TV |
| D-A13 | **Projeto padrão** "Modelo Residencial": sem logo, cores neutras (azul-ardósia `#3f5873` e madeira `#7b6650`), endereço "Rua Principal, 100 — Sua Cidade/UF", localização de exemplo em Brasília com norte no topo da planta | Genérico, mas com sol plausível para o Brasil |
| D-A14 | Estrutura `projeto-padrao/` + `projetos-especificos/<NN>-<id>/`; o comando de montagem aceita `EMP=padrao` ou `EMP=<id>` | Numeração dos projetos específicos em ordem de chegada |
| D-A15 | Particularidades de um projeto viram **dado** no `empreendimento.json`, nunca `if (projeto === …)` no código | A plataforma continua genérica a cada projeto novo |
| D-A16 | O projeto padrão herda a volumetria do Projeto 1 (plantas viraram "plantas-modelo") sem imagens, textos ou endereço dele; um teste garante isso | Demonstração completa sem expor o cliente |

### 4.B Perguntas abertas da plataforma

**D03 — Entorno real.** ⭐ (a) fase online: Google Photorealistic 3D Tiles (cidade real em 3D, chave de API + internet) · (b) contornos do OpenStreetMap · (c) manter ilustrativo · Ajustar: ___

**D04 — Preço no modo cliente (padrão da plataforma).** ⭐ mostrar só das disponíveis/em negociação, com opção de desligar · "Preço sob consulta" sempre · Ajustar: ___

**D09 — Fase online (link + celular + vários corretores).** ⭐ (a) Supabase · (b) Firebase · (c) servidor próprio. Decidir na Fase 4.

**D10 — Publicação.** ⭐ GitHub Pages grátis: o projeto padrão no endereço principal e cada projeto específico numa subpasta (`…/missouri/`) · domínio próprio depois. A publicação **está ligada**: cada envio na `main` publica sozinho (GitHub Actions; em Settings → Pages a origem deve ser "GitHub Actions").

**D11 — Realismo com modelo 3D do arquiteto (recurso da plataforma).** ⭐ a plataforma passa a aceitar um `.glb` por projeto (fachada e/ou interiores) no lugar do prédio gerado, mantendo clique, status e tour · seguir só com geração por código · Ajustar: ___ *(antes D01/D02 do Missouri; as perguntas sobre o arquivo do Missouri continuam no roadmap dele)*

**D14 — Apresentação do repositório.** A descrição, os tópicos e a imagem de prévia (aparece quando o link é compartilhado no WhatsApp) só podem ser alterados por você em *Settings*. ⭐ usar a descrição e os tópicos sugeridos e a imagem `docs/imagens/maquete-dia.jpg` como prévia · Ajustar: ___

**D12 — Nome do produto.** Hoje o repositório se chama "incorporadora" e o app aparece como "Apresentação 3D". ⭐ manter o nome provisório "Incorporadora 3D" até você escolher · Ajustar: ___

**D13 — Repositório público.** O repositório é **público**: qualquer pessoa vê o código e a pasta do Projeto 1 (folder, renders e plantas do Missouri). Dados de clientes **nunca** vão para lá. ⭐ (a) tornar o repositório **privado** e publicar só o necessário (exige GitHub pago para Pages em repositório privado, ou publicar em outro serviço) · (b) manter público, mas deixar os projetos específicos num repositório privado separado · (c) manter como está · Ajustar: ___

## 5. Fases da plataforma

### Fase 0 — Planejamento ✅
### Fase 1 — Protótipo funcional ✅ (entregue com o Projeto 1)
### Fase 1.1 — Generalização ✅ *nesta rodada*
- [x] Projeto padrão genérico, sem marca
- [x] Projeto 1 em pasta própria com roadmap próprio
- [x] Particularidades do Projeto 1 transformadas em dados
- [x] Montagem de todos os projetos com um comando; testes para todos os projetos
- [x] README, descrição do GitHub, CLAUDE.md e skill genéricos
- [ ] Você abrir `dist/padrao-apresentacao-3d.html` e conferir que nada lembra uma incorporadora específica

### Fase 2 — Fidelidade e realismo
- [ ] Carregar modelo `.glb` do arquiteto (D11)
- [ ] Fotos 360° por cômodo no tour
- [ ] Importar tabela de preços e vagas por planilha Excel
- [ ] Qualidade gráfica automática conforme o computador (medir fps real)

### Fase 3 — Vendas no dia a dia
- [ ] Proposta em PDF para o cliente (unidade, imagem da maquete, condições, simulação)
- [ ] Simulador de pagamento (entrada, mensais, intercaladas, chaves, financiamento)
- [ ] Histórico de preços e reajuste (INCC)
- [ ] Comissão por corretor e metas
- [ ] Agenda de visitas e lembretes
- [ ] Importar clientes de planilha
- [ ] Comparar 2–3 unidades
- [ ] Manual do usuário (documento editável), depois da interface estabilizar

### Fase 4 — Online, link e celular (D09, D10, D13)
- [x] Publicar no GitHub Pages — automático a cada envio na `main` (09/11/2026)
- [ ] Banco online + login (gerente, corretor, cliente) e vários corretores
- [ ] Link de apresentação somente leitura para o cliente
- [ ] "Tenho interesse" → CRM
- [ ] Entorno real (D03)

### Fase 5 — Escala para várias incorporadoras
- [ ] Assistente "novo projeto específico": folder PDF + identidade → `empreendimento.json` revisável
- [ ] Editor visual de volumes/ambientes sobre a planta
- [ ] Vários empreendimentos no mesmo sistema (portfólio)
- [ ] Temas visuais por incorporadora

## 6. Banco de ideias (nada se perde)

- Vista 360° da varanda sem entrar no tour
- Sombra dos prédios vizinhos nas unidades (com entorno real)
- QR code no folder/estande abrindo direto a unidade
- Vídeo automático do voo de drone para redes sociais
- "Unidades parecidas disponíveis" quando a escolhida está vendida
- Mapa de calor de interesse (unidades mais clicadas/visitadas)
- Mensagem pronta de WhatsApp com a unidade
- Assinatura eletrônica da proposta
- Personalização de acabamentos no tour
- Pontos de interesse do bairro com distâncias
- Modo "TV do plantão" com carrossel de disponíveis
- Narração em áudio do tour
- Realidade aumentada (maquete sobre a mesa)
- Gerar o projeto padrão em variações (torre única, duas torres, casas em condomínio) para demonstrações a novos clientes

## 7. Riscos e cuidados

| Risco | Cuidado |
|---|---|
| Computador do plantão fraco | Qualidade alta/média/baixa; medir no computador real |
| Dados só no navegador | Aviso de backup; exportar .json; fase online resolve |
| Outro computador/navegador/link começa vazio | Levar os dados pelo backup |
| Maquete gerada diverge do projeto real | Avisos "ilustrativo/aproximado"; D11 |
| Backups com dados pessoais (LGPD) | Nunca no GitHub; guardar em local seguro |
| Repositório público com material de clientes | D13 |
| Código ganhar "jeitinhos" de um projeto específico | Regra D-A15 + teste que procura nomes de projetos no padrão |

## 8. Verificado nesta rodada (e o que não)

- ✅ 15 testes automáticos (regras + validação de todos os projetos + projeto padrão sem marca).
- ✅ Montagem dos dois arquivos (padrão 2,7 MB · Missouri 5,0 MB); busca no arquivo do padrão não encontrou "Missouri", "Lacerda", "Divinópolis" nem "Ceará".
- ✅ Teste de tela do projeto padrão (abertura, vista geral, unidade, rua, noite, espelho, pavimento, bairro).
- ⚠️ Fluidez (fps) só se mede no computador real.

## 9. Log

| Data | Versão | O que aconteceu |
|---|---|---|
| 06/11/2026 | v1.0 | Plataforma criada junto com o Projeto 1 (Missouri); Fases 0 e 1 |
| 06/11/2026 | v1.2 | README vitrine com GIF e prints do projeto padrão; trajetória do sol mais visível; brilho noturno suavizado |
| 09/11/2026 | v1.2 | GitHub Pages ligado: o workflow publica sozinho a cada envio na `main` (D10) |
| 06/11/2026 | v1.1 | Generalização: projeto padrão genérico, Missouri como Projeto específico 1 em pasta própria; D-A13 a D-A16; novas perguntas D11–D13; D01/D02 viraram D11 na plataforma |
