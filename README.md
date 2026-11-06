# Incorporadora 3D — apresentação e CRM de vendas para incorporadoras

Plataforma para **apresentar e vender** apartamentos de qualquer empreendimento com uma maquete 3D navegável — sol na posição real, modo noturno, voo de drone, clique na unidade e **tour virtual guiado** pelos cômodos — e um **CRM** simples: clientes e funil de vendas, espelho de vendas, relatórios em PDF, Word e Excel e backup em `.json`.

Funciona **sem internet e sem servidor**: cada empreendimento vira um único arquivo `.html` que abre com duplo clique no Chrome. Está preparada para virar link e aplicativo de celular (PWA).

## Experimente

Abra `dist/padrao-apresentacao-3d.html` — o **projeto padrão**, um empreendimento de demonstração genérico ("Modelo Residencial", 24 apartamentos, coberturas duplex), sem marca de nenhuma incorporadora.

1. **Iniciar apresentação** (modo cliente, só visualização) ou **Entrar como gerente** (no primeiro acesso você cria um PIN).
2. Explore: Drone, Noite, ☀ (sol por data e hora), Disponibilidade, Pavimentos, clique num apartamento → Tour virtual.
3. No modo gerente: Clientes, Relatórios, Dados → **Exportar backup (.json)**.

> Os dados de vendas ficam no navegador do computador onde você usa. Para levar a outro computador, use o backup.

## Projetos

| | Pasta | Arquivo pronto |
|---|---|---|
| Projeto padrão (genérico) | `projeto-padrao/` | `dist/padrao-apresentacao-3d.html` |
| Projeto específico 1 — Missouri Residencial (Divinópolis/MG) | `projetos-especificos/01-missouri/` | `dist/missouri-apresentacao-3d.html` |

Cada projeto específico é só uma **pasta de dados** (`empreendimento.json` + imagens + identidade visual + roadmap próprio). O código é o mesmo para todos. Para começar um novo, veja [`docs/novo-projeto-especifico.md`](docs/novo-projeto-especifico.md).

## Comandos (para quem desenvolve)

```bash
npm install
npm run dev                 # desenvolvimento (projeto padrão) — EMP=missouri npm run dev para outro
npm test                    # testes das regras e validação de todos os projetos
npm run build               # projeto padrão → dist/padrao-apresentacao-3d.html
EMP=missouri npm run build  # um projeto específico
npm run build:todos         # todos os projetos
EMP=padrao node scripts/teste-visual.mjs saida basico|tour|gerente|celular   # fotos de tela
```

## Estrutura

```
projeto-padrao/             projeto genérico de demonstração (ponto de partida)
projetos-especificos/       um subdiretório por empreendimento real (01-missouri, ...)
src/core/                   regras de negócio puras e testadas (funil, reservas, sol, backup)
src/cena/                   Three.js: prédio gerado a partir das plantas, entorno, céu/sol, câmeras
src/tour/                   tour virtual (interiores gerados + visita guiada)
src/ui/                     interface (abertura, painel, CRM, relatórios, dados)
src/relatorios/             relatório de vendas (PDF, Word, Excel)
docs/roadmap.md             roadmap da plataforma (fases, decisões, ideias)
docs/aprendizados.md        o que deu certo e errado — ler antes de cada projeto novo
docs/novo-projeto-especifico.md   passo a passo para um novo empreendimento
.claude/skills/incorporadora-3d/  receita completa para o Claude reaproveitar
```

## Publicar como link

`npm run build:todos` gera `dist/pages/` (cada projeto numa subpasta, com PWA; o endereço principal abre o projeto padrão). O workflow "Publicar no GitHub Pages" está pronto e **desligado** até a decisão D10 do roadmap. **Nunca envie backups `.json` ao repositório** (têm dados de clientes).
