# Como criar um novo projeto específico

A plataforma é a mesma para todos. Um projeto específico é **uma pasta** em `projetos-especificos/<NN>-<id>/`, criada a partir do projeto padrão:

```
projetos-especificos/<NN>-<id>/      NN = número na ordem de chegada (02, 03…), id = nome curto sem acento
  empreendimento.json   dados técnicos, identidade visual, endereço, coordenadas, plantas, unidades
  imagens/              logo, renders e plantas (JPG/PNG, ~1200 px, qualidade 70)
  roadmap.md            decisões e pendências deste empreendimento
  README.md             ficha do projeto
```

**Regra de ouro:** particularidades do projeto viram **dado** no `empreendimento.json`. Se faltar um campo, crie o campo na plataforma (genérico, opcional) — nunca escreva `if (projeto === '…')` no código.

## O que pedir ao cliente (incorporadora)

1. Folder/book de vendas em PDF (renders, plantas humanizadas, diferenciais).
2. Identidade visual: logo (PNG, fundo transparente), cores, fontes.
3. Link do Google Maps do terreno e, se possível, planta de situação com o **norte verdadeiro**.
4. Quadro de áreas: unidades, pavimentos, tipologias, área privativa e descoberta, vagas.
5. Tabela de preços e condições (Excel).
6. Se existir: modelo 3D do arquiteto (SketchUp/Revit/FBX/GLB) e renders 360°.

## Passo a passo (o que o Claude faz)

1. **Criar a pasta** copiando `projeto-padrao/` para `projetos-especificos/<NN>-<id>/`; trocar `id`, acrescentar `"projetoEspecifico": { "numero": NN, "status": "…" }`.
2. **Extrair o PDF** — `pdfimages -list` / `pdfimages -j` para renders e plantas; ler as páginas como imagem para entender plantas e quadro de áreas.
3. **Identidade** — logo (recortar da página com `pdftoppm -r 150` e tornar o fundo transparente se precisar), `identidade.corPrimaria/corSecundaria`, `predio.materiais` (cores da fachada), nome/subtítulo (vão para o letreiro).
4. **Coordenadas** — abrir o link do Maps no navegador e ler `!3d<lat>!4d<lon>` da URL; na vista de satélite, medir o **rumo das ruas** e a esquina do terreno.
5. **Referencial da planta** — x = para a direita da planta, z = para baixo, metros, origem no canto superior esquerdo da torre. `geo.azimuteTopoPlanta` = azimute (graus do Norte, horário) para onde aponta o topo da planta. A fachada do lado esquerdo da planta aponta para `azimuteTopoPlanta − 90`.
6. **Escala** — usar uma cota conhecida da planta para converter pixels em metros.
7. **Preencher o `empreendimento.json`**:
   - `endereco` (logradouro = rua do lado esquerdo da planta; `esquina` = rua de baixo), `entorno.ruasAdicionais` (ruas paralelas com nome, contadas em quadras);
   - `predio.torre`, `predio.embasamento`, `entrada`, `garagem`, `peDireito`;
   - `pavimentos[]`: `nucleo`, `vazios`, `areasComuns`, `areasDescobertas`, `planta` (imagem);
   - `tipologias{}`: dados de venda, `imagens` e `ambientes[]` (retângulos dos cômodos com `tipo`; tipologias parecidas podem usar `"base"`);
   - `unidades[]`: `id`, `pavimento`, `tipologia`, áreas, vagas, `volumes`; duplex com `pavimentosOcupados` e `volumesSuperiores`;
   - `imagensGerais`, `diferenciais`, `avisoLegal`.
8. **Testar** — `npm test` valida automaticamente todos os projetos; acrescente em `tests/projetos.test.ts` os fatos conferidos do projeto (áreas, orientação). O teste do projeto padrão garante que ele não ganhou nome, cidade ou incorporadora do projeto novo.
9. **Montar** — `EMP=<id> npm run build` → `dist/<id>-apresentacao-3d.html`.
10. **Conferir** — `EMP=<id> node scripts/teste-visual.mjs <pasta> basico` (e `tour`, `gerente`, `celular`) **em segundo plano**, e olhar as fotos.
11. **Registrar** — `roadmap.md` e `README.md` do projeto, linha na tabela de `projetos-especificos/README.md` e no roadmap da plataforma; aprendizados novos em `docs/aprendizados.md`.

## Tipos de ambiente aceitos no tour

`sala` · `cozinha` · `varanda` · `quarto` · `suite` · `banho` · `lavabo` · `gourmet` · `salaTv` · `terraco`

## Limitações conhecidas do gerador

- Plantas aproximadas por **retângulos** (sem paredes curvas/diagonais).
- Retângulos dos ambientes são **coordenadas absolutas** da planta: unidades em posições diferentes precisam de tipologia própria.
- Ritmo de janelas automático pelo tipo de cômodo; fidelidade total com o modelo do arquiteto (D11 da plataforma).
- Vizinhos ilustrativos; só ruas e orientação são reais.
