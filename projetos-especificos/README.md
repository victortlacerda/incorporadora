# Projetos específicos

Cada pasta é um empreendimento real, numerado na ordem em que chegou. Todos usam o mesmo código da plataforma; aqui ficam só os **dados** do projeto.

| Nº | Pasta | Empreendimento | Incorporadora | Situação |
|---|---|---|---|---|
| 1 | `01-missouri/` | Missouri Residencial — Rua Ceará, 361, Centro, Divinópolis/MG | Costa Lacerda Empreendimentos Imobiliários | Fase 1 (v0.1) entregue; aguardando teste de campo |

Conteúdo de cada pasta:

```
<NN>-<id>/
  empreendimento.json   dados técnicos, identidade visual, endereço, coordenadas, plantas, unidades
  imagens/              logo, renders e plantas do folder
  roadmap.md            decisões, pendências e histórico DESTE empreendimento
  README.md             ficha do projeto
```

Montar: `EMP=<id> npm run build` (ex.: `EMP=missouri`). Novo projeto: [`docs/novo-projeto-especifico.md`](../docs/novo-projeto-especifico.md).
