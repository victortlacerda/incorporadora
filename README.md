<div align="center">

# Incorporadora 3D

**Apresentação 3D interativa + CRM de vendas para incorporadoras**

Maquete navegável do empreendimento com sol real, noite, voo de drone e tour virtual pelos apartamentos —
e o controle das vendas no mesmo lugar. Um único arquivo, sem servidor, sem instalação.

[![Testes](https://github.com/victortlacerda/incorporadora/actions/workflows/testes.yml/badge.svg)](https://github.com/victortlacerda/incorporadora/actions/workflows/testes.yml)
![Three.js](https://img.shields.io/badge/Three.js-3D-000000?logo=threedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Offline](https://img.shields.io/badge/funciona-sem%20internet-2e7d32)
![PWA](https://img.shields.io/badge/celular-PWA-5a0fc8)

<img src="docs/imagens/voo-drone.gif" alt="Voo de drone em volta da maquete do projeto padrão" width="640">

</div>

---

## Por que usar

| | |
|---|---|
| 🏙️ **Maquete realista e navegável** | Prédio, ruas e bairro em 3D. Gire, aproxime, voe como um drone ou caminhe pela calçada. |
| ☀️ **Sol de verdade** | Posição real do sol para qualquer data e hora, no endereço do terreno. Mostra a trajetória do sol e as horas de sol de cada fachada. |
| 🌙 **Disponibilidade à noite** | No modo noturno, apartamento disponível fica com a **luz acesa**; reservado, meia-luz; vendido, apagado. |
| 🛋️ **Tour virtual guiado** | Visita automática cômodo a cômodo, com a **vista real da janela** daquele andar. |
| 📋 **CRM e espelho de vendas** | Clientes, funil de vendas, reservas com prazo, alertas de retorno e o espelho de vendas sempre atualizado. |
| 📊 **Relatórios e backup** | Relatório de vendas em **PDF, Word e Excel**. Backup completo num arquivo `.json`, sem banco de dados. |
| 🔒 **Modo cliente e modo gerente** | O cliente só visualiza; o gerente (com PIN) controla preços, clientes e vendas. |
| 📱 **Computador, TV e celular** | Abre por duplo clique no Chrome; tem segunda tela para a TV do plantão e layout para celular. |

> As imagens desta página são do **projeto padrão** — um empreendimento de demonstração genérico, sem marca de nenhuma incorporadora.

## A plataforma em imagens

### Maquete e entorno

<img src="docs/imagens/maquete-dia.jpg" alt="Vista geral da maquete de dia" width="100%">

Prédio gerado a partir das plantas (fachadas, varandas, guarda-corpos, letreiro, marquise), quadras alinhadas às ruas do terreno, árvores, postes, carros e morros no horizonte. Vistas prontas: **Geral, Drone, Rua principal, Rua lateral, Aérea e Bairro**.

<img src="docs/imagens/entorno-bairro.jpg" alt="Vista do bairro" width="100%">

### Clique no apartamento

<img src="docs/imagens/unidade-painel.jpg" alt="Unidade selecionada com painel de informações" width="100%">

A câmera voa até a fachada da unidade e abre o painel com **situação, preço, ficha técnica, quartos, vagas, orientação solar** (horas de sol no inverno e no verão), planta do pavimento e imagens do projeto — além do botão do **tour virtual**.

### Modo noturno

<table>
<tr>
<td width="50%"><img src="docs/imagens/maquete-noite.jpg" alt="Maquete à noite"></td>
<td width="50%"><img src="docs/imagens/noite-rua.jpg" alt="Vista da rua à noite"></td>
</tr>
</table>

Céu estrelado, postes acesos, janelas da vizinhança e letreiro iluminado. **Luz acesa = disponível · meia-luz = reservado ou em negociação · apagada = vendido.**

### Espelho de vendas e disponibilidade

<img src="docs/imagens/espelho-disponibilidade.jpg" alt="Espelho de vendas e modo disponibilidade" width="100%">

Cada unidade colorida pela situação, sempre com texto e ícone (não depende só da cor). Toque numa célula do espelho para voar até o apartamento.

### Corte por pavimento

<img src="docs/imagens/corte-pavimento.jpg" alt="Corte mostrando um pavimento" width="100%">

Esconde os andares de cima e mostra as unidades do pavimento escolhido com a situação de cada uma.

### Projeção solar

<img src="docs/imagens/projecao-solar.jpg" alt="Trajetória do sol sobre o empreendimento" width="100%">

Escolha a data (hoje, verão, inverno, equinócio ou qualquer dia) e a hora; veja a **trajetória do sol**, a rosa dos ventos e a **animação do dia** com as sombras se movendo.

### Tour virtual guiado

<table>
<tr>
<td width="33%"><img src="docs/imagens/tour-502-0.jpg" alt="Tour: sala de estar e jantar"></td>
<td width="33%"><img src="docs/imagens/tour-502-1.jpg" alt="Tour: varanda gourmet com vista real do andar"></td>
<td width="33%"><img src="docs/imagens/tour-502-3.jpg" alt="Tour: suíte"></td>
</tr>
<tr>
<td width="33%"><img src="docs/imagens/tour-901-8.jpg" alt="Tour: espaço gourmet da cobertura"></td>
<td width="33%"><img src="docs/imagens/tour-901-9.jpg" alt="Tour: sala de TV da cobertura"></td>
<td width="33%"><img src="docs/imagens/tour-901-10.jpg" alt="Tour: terraço descoberto da cobertura"></td>
</tr>
</table>

Todos os cômodos de cada tipologia — inclusive o 2º piso das coberturas — com móveis, piso laminado nos quartos, porcelanato na área social, iluminação embutida e a **vista verdadeira** daquele andar pela janela. Visita automática ou livre (arrastar para olhar em volta), de dia ou à noite.

### CRM, relatórios e dados (modo gerente)

<table>
<tr>
<td width="50%"><img src="docs/imagens/crm-clientes.jpg" alt="Lista de clientes e funil"></td>
<td width="50%"><img src="docs/imagens/crm-ficha-cliente.jpg" alt="Ficha do cliente"></td>
</tr>
<tr>
<td width="50%"><img src="docs/imagens/relatorios.jpg" alt="Painel de relatórios"></td>
<td width="50%"><img src="docs/imagens/relatorio-pdf.jpg" alt="Relatório de vendas em PDF"></td>
</tr>
</table>

- **Funil de vendas:** novo contato → em contato → visita → proposta → reserva → contrato → vendido (ou perdido, com motivo).
- A etapa do cliente **muda a unidade sozinha**: proposta deixa "em negociação", reserva bloqueia por um prazo, contrato marca como vendida, perda libera.
- **Impede reserva dupla** e avisa quem está com a unidade e até quando.
- **Alertas:** retorno atrasado ou para hoje, reserva vencendo ou vencida, unidade sem preço, backup antigo.
- **Relatórios** com a imagem atual da maquete, indicadores (VGV, vendido, estoque, ticket médio, R$/m²), espelho, vendas, funil, origem dos clientes e corretores. O Excel sai com fórmulas e filtros.

### No celular

<div align="center"><img src="docs/imagens/celular.jpg" alt="Telas no celular" width="760"></div>

## Funcionalidades

<details>
<summary><b>Maquete 3D</b></summary>

- Prédio gerado a partir dos dados das plantas: pavimentos, unidades, núcleo, poços, terraços, coberturas duplex
- Janelas e portas automáticas conforme o tipo de cômodo (sala, quarto, cozinha, banheiro), venezianas, guarda-corpos de vidro, faixas de madeira nas varandas
- Embasamento com portaria, marquise, letreiro iluminado, LEDs e portão da garagem
- Entorno: ruas e quadras alinhadas ao terreno, nomes das ruas, faixas de pedestre, árvores, postes, carros, vizinhança e morros
- Céu com nuvens, sombras em tempo real, reflexos do céu nos vidros, neblina de distância
- Câmera em órbita, drone automático, vistas prontas, voo até a unidade, corte por pavimento, bússola
- Drone automático depois de 2 minutos sem uso no modo cliente (bom para TV)
</details>

<details>
<summary><b>Sol e noite</b></summary>

- Posição astronômica do sol pela latitude, longitude, data e hora do terreno
- Trajetória do sol, animação do dia, atalhos (manhã, meio-dia, pôr do sol, noite, agora)
- Horas de sol direto por fachada no inverno e no verão, com explicação (ex.: "sol da manhã")
- Noite com estrelas, postes, janelas acesas, letreiro e brilho suave
- Disponibilidade pelas luzes das janelas
</details>

<details>
<summary><b>Tour virtual</b></summary>

- Interiores gerados a partir dos cômodos de cada tipologia, montados no lugar real do apartamento
- Visita guiada automática com legenda (nome, medidas, área, tipo de piso) e transições suaves
- Arrastar para olhar, rolar para aproximar, teclas ← → para trocar de cômodo
- Botão com as imagens do folder de cada cômodo (quando o projeto tem imagens)
</details>

<details>
<summary><b>Vendas (CRM)</b></summary>

- Cadastro de clientes (telefone com link de WhatsApp, e-mail, origem, corretor, unidades de interesse)
- Funil com efeito automático na unidade, histórico de contatos e próximo retorno
- Espelho de vendas, edição de preço, condições, vagas, cliente, data e valor da venda
- Alertas, busca por nome/telefone/unidade, configurações (prazo de reserva, corretores, preço visível ao cliente)
- Segunda tela para a TV, sincronizada automaticamente
- PIN do gerente (4 a 8 números)
</details>

<details>
<summary><b>Relatórios, dados e privacidade</b></summary>

- Relatório de vendas em PDF, Word (.docx) e Excel (.xlsx)
- Backup `.json` com todos os dados; importação com validação (arquivo inválido é recusado sem apagar nada)
- Aviso quando passa tempo demais sem backup
- Dados ficam no navegador do computador — nada vai para a internet
- Dados de exemplo na primeira abertura (marcados como exemplo) e botão "Começar do zero"
</details>

## Comece agora

1. Baixe [`dist/padrao-apresentacao-3d.html`](dist/padrao-apresentacao-3d.html) (botão *Download raw file*).
2. Dê **duplo clique** — abre no Google Chrome, sem internet.
3. **Iniciar apresentação** para ver como cliente, ou **Entrar como gerente** (no primeiro acesso você cria um PIN).
4. Experimente: Drone · ☀ · Noite · Disponibilidade · Pavimentos · clique num apartamento → **Tour virtual**.
5. No modo gerente: Clientes · Relatórios · Dados → **Exportar backup (.json)**.

> Os dados de vendas ficam guardados no navegador do computador onde você usa. Para levar a outro computador, use o backup.

## Como funciona

```mermaid
flowchart LR
  A["Folder, plantas e<br/>identidade visual"] --> B["empreendimento.json<br/>+ imagens"]
  B --> C["Plataforma<br/>(mesmo código para todos)"]
  C --> D["Arquivo único .html<br/>duplo clique, offline"]
  C --> E["Link + celular (PWA)<br/>fase futura"]
  D --> F[("Dados de vendas<br/>no navegador")]
  F <--> G["Backup .json"]
  F --> H["Relatórios<br/>PDF · Word · Excel"]
```

Cada empreendimento é só uma **pasta de dados**. O código da plataforma é o mesmo para todos, então cada melhoria vale para todos os projetos.

| | Pasta | Arquivo pronto |
|---|---|---|
| **Projeto padrão** (genérico, demonstração) | [`projeto-padrao/`](projeto-padrao/) | [`dist/padrao-apresentacao-3d.html`](dist/padrao-apresentacao-3d.html) |
| **Projeto específico 1** — Missouri Residencial (Divinópolis/MG) | [`projetos-especificos/01-missouri/`](projetos-especificos/01-missouri/) | [`dist/missouri-apresentacao-3d.html`](dist/missouri-apresentacao-3d.html) |

Para criar um novo: [`docs/novo-projeto-especifico.md`](docs/novo-projeto-especifico.md).

## Roadmap

Fases, decisões e banco de ideias em [`docs/roadmap.md`](docs/roadmap.md). Próximos passos: modelo 3D do arquiteto para realismo de render, fotos 360° no tour, proposta em PDF e simulador de pagamento, versão online com login e vários corretores, e escala para várias incorporadoras.

## Para desenvolvedores

```bash
npm install
npm run dev                 # desenvolvimento (projeto padrão) — EMP=missouri npm run dev para outro
npm test                    # regras de negócio + validação de todos os projetos
npm run build               # projeto padrão → dist/padrao-apresentacao-3d.html
EMP=missouri npm run build  # um projeto específico
npm run build:todos         # todos os projetos
EMP=padrao node scripts/teste-visual.mjs saida basico|tour|gerente|celular   # fotos de tela (Chromium sem janela)
node scripts/capturas-readme.mjs pasta todos && python3 scripts/montar-imagens-readme.py pasta   # imagens deste README
```

<details>
<summary>Estrutura e tecnologia</summary>

```
projeto-padrao/             projeto genérico de demonstração (ponto de partida)
projetos-especificos/       um subdiretório por empreendimento real (01-missouri, ...)
src/core/                   regras de negócio puras e testadas (funil, reservas, sol, backup)
src/cena/                   Three.js: prédio gerado, entorno, céu/sol, câmeras, clique
src/tour/                   tour virtual (interiores gerados + visita guiada)
src/ui/                     interface (abertura, painel, CRM, relatórios, dados)
src/relatorios/             relatório de vendas (PDF, Word, Excel)
docs/                       roadmap, aprendizados, passo a passo, imagens do README
.claude/skills/incorporadora-3d/   receita completa para o Claude reaproveitar
```

- **3D:** Three.js (céu físico, sombras, pós-processamento com brilho noturno), geometria fundida por material para desempenho
- **App:** TypeScript + Vite + `vite-plugin-singlefile` (tudo num `.html`), sem framework de interface
- **Relatórios:** jsPDF + AutoTable, docx, ExcelJS — gerados no próprio navegador
- **Testes:** `node --test` nas regras e nos dados de todos os projetos; testes de tela com Playwright
- **Publicação:** PWA pronto e GitHub Pages publicado automaticamente a cada envio na `main`
</details>

## Privacidade

Os dados de clientes ficam só no navegador e nos backups que você exporta. **Nunca envie backups `.json` ao repositório** — eles têm nomes e telefones.
