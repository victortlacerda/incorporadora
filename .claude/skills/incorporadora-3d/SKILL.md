---
name: incorporadora-3d
description: Gerar ou evoluir um sistema de vendas 3D para incorporadoras (maquete realista navegável com sol real, noite, drone, clique na unidade, tour virtual guiado, modo cliente/gerente, CRM, espelho de vendas, relatórios PDF/Word/Excel e backup .json) a partir do folder, plantas e identidade visual de um empreendimento. Use ao iniciar um empreendimento novo, retomar o Missouri ou adaptar para outra incorporadora.
---

# Incorporadora 3D — receita completa

Repositório de referência: `github.com/victortlacerda/incorporadora`. Leia **antes**: `docs/roadmap.md` (contrato), `docs/aprendizados.md` (o que deu certo/errado), `docs/novo-empreendimento.md` (passo a passo).

## 1. Conduzir com o usuário
- Dono/gerente leigo, pt-BR simples. Começar construindo; perguntar junto com os primeiros resultados.
- Roadmap vivo: pedidos P01…, decisões tomadas D-A…, perguntas D01… com ⭐ e "Ajustar: ___" ("ok com as estrelas" aplica todas), fases com checkbox, banco de ideias, riscos, log. **Nenhuma ideia se perde.**
- Entregar a cada rodada: arquivo único `.html`, roadmap atualizado, commit no GitHub, mensagem curta com o que testar e o que não foi verificado (fps real só no PC dele).

## 2. Entrada típica e extração
- Folder PDF: `pdfimages -list/-j` para renders e plantas (redimensionar ~1200 px, JPEG q70); ler páginas como imagem para o quadro de áreas.
- Coordenadas: abrir o link do Maps no navegador e ler `!3d<lat>!4d<lon>`; olhar o satélite para o **rumo das ruas** e a esquina do terreno.
- Logo: recortar da página renderizada (`pdftoppm -r 150`) e tornar o fundo transparente por cor.

## 3. Arquitetura (o que funcionou)
- Vite + TypeScript + Three.js + `vite-plugin-singlefile` → `dist/<id>-apresentacao-3d.html` abre por duplo clique (file://). `scripts/pos-build.mjs` gera também `dist/pages/` com manifest + service worker (PWA) para GitHub Pages.
- Apelido `@emp` → `empreendimentos/<id>` (variável `EMP`). Imagens via `import.meta.glob('@emp/imagens/*')`.
- `src/core` puro e testado com `node --test tests/*.test.ts` (Node 22 executa TS sem build; usar `import type` e extensões `.ts`).
- Dados técnicos (`empreendimento.json`) ≠ dados comerciais (`Dados` no localStorage com `versao`, migração, backup validado).
- Referencial da planta: x = direita, z = para baixo, metros. `geo.azimuteTopoPlanta` gira sol e bússola; o mundo fica alinhado às plantas e às ruas.
- `segmentosLivres(volumes, ocupados)` é a peça central: fachadas, janelas por tipo de cômodo, guarda-corpos, platibandas, insolação e janelas do tour.
- Prédio por pavimento (`Lote` funde geometria por material), vidro por unidade (status → emissivo à noite), volumes invisíveis clicáveis + realce colorido + contorno.
- Céu `Sky` (nuvens) + `DirectionalLight` na posição real do sol (NOAA) + PMREM do céu para reflexos; noite com estrelas, postes ("poças" de luz falsas + 4 luzes reais), janelas acesas nos vizinhos, bloom.
- Câmera: OrbitControls com amortecimento, voos com relógio real, drone automático, vistas prontas, corte por pavimento, foco na maior fachada externa da unidade.
- Tour: ambientes (retângulos absolutos da planta, com `tipo`) montados **no lugar real** do apartamento com a torre escondida → janela mostra a vista verdadeira. Visita guiada (9 s por cômodo, varredura suave, fade), arrastar para olhar, imagens do folder por tipo de cômodo.
- Relatórios no navegador: jsPDF+autotable, docx, ExcelJS (fórmulas, cores por status); imagem da maquete via `renderer.toDataURL` logo após `composer.render`.

## 4. Regras de negócio padrão
- Status: disponível · em negociação · reservado · vendido · indisponível (cor + texto + ícone, contraste ≥ 4,5:1).
- Funil: novo → contato → visita → proposta (unidade "em negociação") → reserva (prazo configurável, impede 2ª reserva com mensagem "reservada para Fulano até…") → contrato/vendido (vendida) · perdido (exige motivo, libera a unidade).
- Alertas: reserva vencida/vencendo, retorno atrasado/hoje, unidade sem preço, backup antigo.
- Noite: luz acesa = disponível; meia-luz = reservado/negociação; apagada = vendido.
- Primeiro uso com dados de exemplo marcados (`exemplo: true`) + "Começar do zero".
- Modo cliente: sem nomes, CRM e relatórios; preço só de disponíveis (configurável). PIN 4–8 dígitos com sal (só trava a tela).

## 5. Armadilhas (ver tabela completa em docs/aprendizados.md)
- Sky deixa tudo estourado: exposição ~0,5, `environmentIntensity` ≤ 0,5.
- Vizinhos altos perto escondem o prédio e prendem a câmera: só casas num raio de ~75 m.
- Animações por `dt` não terminam em PC lento/headless: usar relógio real.
- Playwright em `.mjs`: `createRequire(import.meta.url)('playwright')`; WebGL por SwiftShader é lento (≈20 s por foto) → rodar em segundo plano e ler o log.
- Ambientes são coordenadas absolutas: unidades em posições diferentes precisam de tipologia própria.
- Painel lateral desloca topo e dock (`.com-painel`); no celular vira bottom sheet.

## 6. Checklist de um projeto novo
- [ ] Copiar `empreendimentos/_modelo` → `empreendimentos/<id>`; preencher JSON e imagens
- [ ] `npm test` (validarEmpreendimento) · `EMP=<id> npm run build`
- [ ] Fotos: `node scripts/teste-visual.mjs <pasta> basico|tour|gerente|celular` e olhar todas
- [ ] Roadmap do empreendimento com D01… (pedir modelo 3D do arquiteto, tabela de preços, vagas, norte verdadeiro, memorial)
- [ ] Commit + push; mensagem final curta com o que testar
