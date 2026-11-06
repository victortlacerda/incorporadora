# Incorporadora 3D — apresentação e CRM de vendas

Sistema para **apresentar e vender** apartamentos de um empreendimento com uma maquete 3D navegável (sol real, noite, drone, tour virtual guiado) e um **CRM** simples (clientes, funil, espelho de vendas, relatórios PDF/Word/Excel, backup .json).

Empreendimento piloto: **Residencial** — Empreendimentos Imobiliários.

## Como usar (sem instalar nada)

1. Baixe `dist/missouri-apresentacao-3d.html` (ou peça o arquivo pronto).
2. Dê **duplo clique** — abre no Google Chrome. Funciona sem internet.
3. **Iniciar apresentação** (modo cliente) ou **Entrar como gerente** (no primeiro acesso você cria um PIN).
4. Faça **backup** com frequência: Dados → Exportar backup (.json). Para levar a outro computador, importe o backup lá.

> Os dados ficam guardados no navegador do computador onde você usa. Outro computador, outro navegador ou o link online começam vazios — use o backup para levar os dados.

## Comandos (para quem desenvolve)

```bash
npm install
npm run dev            # servidor de desenvolvimento (http://localhost:5173)
npm test               # testes das regras (Node, sem navegador)
npm run build          # gera dist/missouri-apresentacao-3d.html e dist/pages/
EMP=outro npm run build   # monta outro empreendimento (pasta empreendimentos/outro)
node scripts/teste-visual.mjs saida basico|tour|gerente|celular   # fotos de tela (Chromium headless)
```

## Estrutura

```
empreendimentos/<id>/     dados técnicos (empreendimento.json) + imagens do folder
src/core/                 regras de negócio puras (testadas): tipos, regras, sol, backup, exemplo
src/cena/                 Three.js: prédio gerado, entorno, céu/sol, câmeras, clique
src/tour/                 tour virtual (interiores gerados + visita guiada)
src/ui/                   interface (abertura, painel, CRM, relatórios, dados)
src/relatorios/           relatório de vendas (dados + PDF/Word/Excel)
docs/roadmap.md           fases, decisões, ideias — atualizado a cada rodada
docs/aprendizados.md      o que deu certo/errado (ler antes de um projeto novo)
docs/novo-empreendimento.md   passo a passo para outro empreendimento/incorporadora
.claude/skills/incorporadora-3d/SKILL.md   receita completa para o Claude reaproveitar
```

## Publicar como link (fase futura)

`npm run build` gera `dist/pages/` (index.html + PWA). Há um workflow do GitHub Actions que publica no GitHub Pages; basta ativar em *Settings → Pages → Source: GitHub Actions*. **Nunca envie backups .json ao repositório** (têm dados de clientes).
