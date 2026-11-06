# Como gerar o sistema de um novo empreendimento

O código é o mesmo para todos os empreendimentos. Cada projeto é **uma pasta** em `empreendimentos/<id>/` com:

```
empreendimentos/<id>/
  empreendimento.json   ← dados técnicos (identidade, endereço, coordenadas, pavimentos, tipologias, unidades)
  imagens/              ← logo, fachada, renders e plantas (JPG/PNG, ~1200 px, qualidade 70)
```

## O que pedir ao cliente (incorporadora)

1. Folder/book de vendas em PDF (renders, plantas humanizadas, diferenciais).
2. Identidade visual: logo (PNG, fundo transparente), cores, fontes.
3. Link do Google Maps do terreno (para coordenadas) e, se possível, planta de situação com o **norte verdadeiro**.
4. Quadro de áreas: unidades, pavimentos, tipologias, área privativa e descoberta, vagas.
5. Tabela de preços e condições (Excel).
6. Se existir: modelo 3D do arquiteto (SketchUp/Revit/FBX/GLB) e renders 360°.

## Passo a passo (o que Claude faz)

1. **Extrair o PDF** — `pdfimages -list` e `pdfimages -j` para pegar os renders e plantas; ler as páginas como imagem para entender as plantas e o quadro de áreas.
2. **Coordenadas** — abrir o link do Maps (navegador) e ler `!3d<lat>!4d<lon>` da URL; olhar a vista de satélite para medir o **rumo das ruas** e em qual esquina está o terreno.
3. **Referencial da planta** — x = para a direita da planta, z = para baixo, metros, origem no canto superior esquerdo da torre. `geo.azimuteTopoPlanta` = azimute (graus do Norte, horário) para onde aponta o topo da planta. Confira: a fachada do lado esquerdo da planta aponta para `azimuteTopoPlanta − 90`.
4. **Escala** — usar uma cota conhecida da planta (ex.: quarto de 3,85 m) para converter pixels em metros.
5. **Preencher `empreendimento.json`** copiando `empreendimentos/_modelo/empreendimento.json`:
   - `predio.torre` e `predio.embasamento` (retângulos), `entrada`, `garagem`, `peDireito`;
   - `pavimentos[]`: `nucleo` (escadas/elevadores), `vazios` (poços), `areasComuns`, `areasDescobertas` (terraços — com `unidade` se forem privativos);
   - `tipologias{}`: dados de venda + `ambientes[]` (retângulos dos cômodos, com `tipo`) — tipologias parecidas podem usar `"base": "II"`;
   - `unidades[]`: `id`, `pavimento`, `tipologia`, áreas, vagas e `volumes` (retângulos que a unidade ocupa no pavimento); coberturas duplex usam `pavimentosOcupados` e `volumesSuperiores`.
6. **Validar** — `npm test` (há um teste que roda `validarEmpreendimento`) e adaptar os números do teste do Missouri se for criar testes do novo projeto.
7. **Montar** — `EMP=<id> npm run build` → `dist/<id>-apresentacao-3d.html`.
8. **Conferir visualmente** — `node scripts/teste-visual.mjs <pasta> basico` (e `tour`, `gerente`, `celular`) e olhar as fotos.
9. **Roadmap do projeto** — criar a seção do empreendimento novo no `docs/roadmap.md` (ou um roadmap próprio) com as decisões D01… e o que depende do cliente.

## Tipos de ambiente aceitos no tour

`sala` · `cozinha` · `varanda` · `quarto` · `suite` · `banho` · `lavabo` · `gourmet` · `salaTv` · `terraco`

Cada tipo tem mobiliário e material de piso automáticos (laminado nos quartos, porcelanato na área social, deck no terraço). As janelas aparecem sozinhas nas paredes que dão para fora do prédio.

## Limitações conhecidas do gerador

- Plantas são aproximadas por **retângulos** (paredes curvas/diagonais não).
- O ritmo de janelas da fachada é automático pelo tipo de cômodo; para fidelidade total use o modelo do arquiteto (D01 do roadmap).
- Entorno: ruas alinhadas ao terreno; prédios vizinhos são ilustrativos. As ruas paralelas com nome estão em `ruasDoEmpreendimento()` (`src/cena/entorno.ts`).
