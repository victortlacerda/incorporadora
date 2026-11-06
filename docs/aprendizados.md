# Aprendizados (o que deu certo, o que deu errado, o que o cliente não gostou)

Este arquivo é a memória do projeto. Antes de começar um empreendimento novo, leia tudo. A cada rodada, acrescente.

## Origem: o que veio das skills anteriores

| Aprendizado | Origem | Como foi aplicado aqui |
|---|---|---|
| "O 3D é visualização dos dados, não o banco de dados" | showroom-3d-crm | Status/preço/cliente vivem em `Dados`; a cena só reflete (`definirStatus`) |
| Regras puras devolvendo `{ok, erro}` em português; tela só chama | arena / showroom | `src/core/regras.ts` + 13 testes em Node |
| Roadmap vivo com D01…, ⭐ e "ok com as estrelas"; nenhuma ideia se perde | ambos | `docs/roadmap.md` |
| Arquivo único que abre por duplo clique (`vite-plugin-singlefile`) | showroom | `dist/<id>-apresentacao-3d.html` |
| localStorage versionado + migração + backup .json validado; arquivo ruim não toca nos dados | arena | `src/core/backup.ts` |
| PIN com hash + sal, sessão em sessionStorage, "só trava a tela" | arena | `definirPin/conferirPin` (SHA-256 em JS puro: funciona em file://) |
| Cores sempre com texto + ícone; contraste medido, não "no olho" | arena | Cores de status ajustadas para ≥ 4,5:1 com texto branco |
| Não redesenhar painel enquanto o usuário digita (form "sujo") | arena | `sujo` em `ui/app.ts` |
| Mensagens de conflito com nomes reais ("reservada para Fulano até…") | arena | `moverLead` |
| Clique = ≤ 6 px e ≤ 600 ms medidos com `e.timeStamp`; `camera.updateMatrixWorld()` antes do raycast | showroom | `app3d.ts` |
| Fundir malhas estáticas por material para reduzir chamadas de desenho | showroom | `Lote` em `cena/geo.ts` |
| `emissiveMap` junto com `emissive` (letreiro não fica branco à noite) | showroom | letreiro do prédio |
| Teste de tela com Chromium já instalado + SwiftShader; rodar em segundo plano | ambos | `scripts/teste-visual.mjs` |
| Datas ISO e diferença ao meio-dia UTC | showroom | `diffDias` |
| Duas janelas sincronizadas (BroadcastChannel + evento storage) | arena | 2ª tela para TV |
| Reconstruir por código a partir de imagem, em passes (bloco → forma → material → luz) e conferir com screenshot | img2threejs | Prédio e interiores gerados a partir das plantas/renders do folder |

## Novos aprendizados deste projeto

### Deu certo
- **Referencial da planta** (x direita, z para baixo, metros) + `azimuteTopoPlanta`: o mundo 3D fica alinhado com as plantas do folder, e o sol/bússola giram pelo azimute. Ruas viram eixos retos.
- Coordenadas exatas: abrir o link curto do Google Maps no navegador e ler `!3d…!4d…` da URL final. A vista de satélite mostrou o rumo das ruas (Rua Ceará ≈ 110°).
- `segmentosLivres(volumes, ocupados)` resolve fachadas, guarda-corpos, platibandas, insolação e janelas do tour com uma única função.
- Tour com o interior montado **no lugar real** do apartamento: a janela mostra a vista verdadeira daquele andar (argumento de venda forte).
- Horas de sol por fachada (inverno/verão) calculadas — argumento de venda objetivo.
- Dados de exemplo marcados `exemplo: true` + aviso no gerente e nos relatórios.

### Deu errado (e a correção)
| Problema | Causa | Correção |
|---|---|---|
| Cena toda "estourada" (branca) | Céu físico (Sky) gera luz ambiente muito forte; exposição alta | Exposição ~0,5, `environmentIntensity` ≤ 0,5, hemisférica baixa |
| Prédio "sumia" entre torres vizinhas e a câmera de foco ficava dentro de um vizinho | Vizinhos altos demais e perto | Raio de 75 m só com casas/sobrados; torres raras e longe |
| Voos de câmera não terminavam no teste (e em PC lento) | Progresso por `dt` limitado a 0,1 s por quadro | Progresso pelo relógio real (`performance.now()`) |
| Painel cobria o menu do topo e cortava o dock | Posições fixas | `.com-painel` desloca topo e dock |
| Fachada lavada por luz laranja à noite | PointLights de rua fortes demais | intensidade 14, bloom 0,6 |
| `import 'playwright'` falha em script .mjs | Pacote global só via require | `createRequire(import.meta.url)('playwright')` |
| Tour à noite totalmente estourado | Bloom + exposição noturna + luzes internas | Sem bloom no tour, exposição fixa 0,55, luzes internas moderadas |
| Interior azulado/lavado de dia | Reflexo do céu (environment) iluminando tudo por igual | `envMult` 0,35 durante o tour; paredes em tom quente |
| "m²" saía "m" no PDF | Fontes padrão do jsPDF sem "²" | Trocar "²" por "2" só no PDF |
| Campos do formulário vazando o painel | `select` com largura mínima intrínseca no grid | `width:100%; min-width:0` nos campos e filhos do grid |
| Erro repetido após sair da abertura | Temporizador procurava elemento já removido | Usar variável `iniciado` em vez de consultar o DOM |
| Ambientes de tipologias "espelhadas" no lugar errado | Retângulos dos ambientes são absolutos | Cada posição de unidade precisa de tipologia própria (ou `base` com mesma posição) |

### O que o cliente não gostou
- (aguardando o primeiro teste de campo)

## Regras práticas para a próxima vez
1. Pedir **modelo 3D do arquiteto** logo no início — é o que dá realismo de render (roadmap D01/D02).
2. Medir o norte verdadeiro na planta de situação; não confiar só no satélite.
3. Conferir as primeiras screenshots **antes** de detalhar móveis: exposição e escala do entorno são os erros mais visíveis.
4. Manter vizinhos baixos perto do terreno, ou o prédio do cliente perde protagonismo.
5. Em teste headless, tudo que anima deve usar relógio real, não número de quadros.
