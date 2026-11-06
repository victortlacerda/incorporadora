# Projeto específico 1 — Missouri Residencial

**Versão:** v1.1 · **Data:** 06/11/2026 · **Incorporadora:** Costa Lacerda Empreendimentos Imobiliários · **Endereço:** Rua Ceará, 361, Centro, Divinópolis/MG

> Roadmap **deste empreendimento**. O roadmap da plataforma (o que vale para todos os projetos) está em [`docs/roadmap.md`](../../docs/roadmap.md).
> Convenção: ⭐ = minha recomendação; responda **"ok com as estrelas"** para aprovar todas.

---

## O que mudou nesta rodada (v1.1)

- O Missouri agora é o **Projeto específico 1**, em pasta própria (`projetos-especificos/01-missouri/`). Nada mudou na apresentação dele: o arquivo continua sendo `dist/missouri-apresentacao-3d.html` (ou `npm run build:missouri`).
- As ruas Alagoas e Mato Grosso passaram a ser dado deste projeto (`entorno.ruasAdicionais`), não código.
- Perguntas que valem para todos os projetos (entorno real, preço no modo cliente, fase online, publicação, modelo 3D) foram para o roadmap da plataforma. Ficaram aqui as que dependem dos arquivos do Missouri.
- Os dados de vendas que você já tiver no navegador continuam valendo (a chave de armazenamento do Missouri não mudou).

---

## Rodada anterior (v1.0)

- Projeto criado do zero no GitHub, com a **Fase 0 (planejamento)** e a **Fase 1 (protótipo funcional)** entregues juntas, para você já ver funcionando.
- Maquete 3D do Missouri gerada a partir do folder (plantas do 3º ao 12º pavimento, 24 unidades, 8 tipologias), no **local e orientação reais** (coordenadas do link do Google Maps; ruas medidas na vista de satélite).
- Sol na posição real para qualquer data/hora, modo noturno com **luz acesa = unidade disponível**, câmera tipo drone, clique na unidade → voo até a fachada + painel com ficha técnica/comercial.
- **Tour virtual guiado** por todos os cômodos de cada tipologia, com a vista real da janela daquele andar.
- Modo **cliente** (só visualização) e modo **gerente** (PIN) com CRM (funil de clientes), espelho de vendas, edição de unidades, alertas.
- **Relatórios** em PDF, Word e Excel; **backup .json** (exportar/importar com validação).
- Estrutura multi-empreendimento criada (hoje: projeto padrão + `projetos-especificos/`).

---

## 1. Visão e premissas

- **Objetivo:** apresentar e vender os apartamentos de um empreendimento com uma maquete 3D navegável e realista, e ao mesmo tempo controlar as vendas (CRM) sem depender de sistema externo.
- **Uso na fase atual:** computador do plantão/escritório, **sem internet obrigatória e sem servidor**: um único arquivo `.html` que abre por duplo clique no Chrome.
- **Fases futuras:** link na internet (GitHub Pages ou domínio próprio), uso no **celular** (PWA instalável), dados compartilhados entre corretores (servidor/banco).
- **Reaproveitamento:** cada novo empreendimento/incorporadora = nova pasta de dados + identidade visual; o código é o mesmo.
- **Público:** dono/gerente comercial (leigo em tecnologia, português), corretores e clientes finais.

## 2. O que você pediu (registro fiel) e onde está

| # | Pedido | Situação |
|---|---|---|
| P01 | Sistema de vendas/CRM para incorporadoras, gestão das vendas de um empreendimento | [x] v1 (funil, clientes, unidades, alertas) |
| P02 | Visualização 3D **realista** do empreendimento | [~] procedural com materiais PBR, céu físico, sombras; ver D01 para o próximo salto de realismo |
| P03 | Vista do entorno e da localização | [~] ruas reais (Ceará, Bahia, Alagoas, Mato Grosso) e orientação real; prédios vizinhos ilustrativos (ver D03) |
| P04 | Projeção solar | [x] sol por data/hora/coordenada, trajetória, animação do dia, horas de sol por fachada em cada unidade |
| P05 | Vista noturna | [x] céu noturno, estrelas, postes, janelas dos vizinhos, letreiro e LEDs |
| P06 | Visão "de drone" e navegação fluida | [x] órbita livre, voo automático de drone, vistas prontas (rua, aérea, bairro) |
| P07 | Clicar em cada unidade e ver informações técnicas e comerciais | [x] painel lateral com ficha, preço, condições, orientação solar, planta, imagens |
| P08 | Indicar disponibilidade (ex.: luz acesa à noite) | [x] acesa = disponível, meia-luz = reservado/negociação, apagada = vendido; + modo "Disponibilidade" colorido de dia (cor + texto) |
| P09 | Ao clicar: zoom na unidade + tela ao lado | [x] voo de câmera até a fachada da unidade + painel |
| P10 | Tour virtual 3D realista do interior, visita guiada por todos os cômodos | [~] tour guiado por todos os cômodos com móveis e materiais inspirados nos renders, vista real da janela; ver D02 para o próximo salto de realismo |
| P11 | Modo gerente (controle total) e modo cliente (visualização) | [x] PIN de 4 a 8 números; modo cliente esconde nomes, CRM e relatórios |
| P12 | Local agora; depois link e celular | [x] arquivo único por duplo clique; build já gera pasta para publicar + PWA; layout de celular |
| P13 | Relatório de vendas em docx, pdf e excel | [x] os três, com imagem da maquete, KPIs, espelho, vendas, funil, corretores (Excel com fórmulas) |
| P14 | Backup em .json sem banco de dados + importar ao abrir | [x] exportar/importar com validação; botão "Importar backup" já na tela de abertura |
| P15 | Estrutura para gerar sistemas de outros empreendimentos/incorporadoras aproveitando o aprendizado | [x] ver roadmap da plataforma (P15, P19) |
| P16 | Roadmap com fases, decisões, ideias, sugestões, atualizado passo a passo | [x] este arquivo |
| P17 | Projeto no repositório github.com/victortlacerda/incorporadora | [x] |
| P18 | Usar as skills anteriores (arena, showroom) e img2threejs | [x] aplicadas (ver `docs/aprendizados.md` §Origem) |

## 3. Dados do empreendimento extraídos do folder

- 12 pavimentos: 1º térreo (portaria/garagem), 2º garagem, 3º ao 10º tipos, 11º–12º coberturas duplex. 24 apartamentos.
- **3º pav.:** 101 (Tipo I, 114 m² + 100 m² descobertos), 102 (Tipo II, 110 m²), 103 (Tipo III, 104 m² + 32 m² descobertos).
- **4º ao 8º:** x01 Tipo I 114 m² · x02 Tipo II 110 m² · x03 Tipo III 102 m² (unidades 201 a 603).
- **9º:** 701 Tipo IV 111 m² · 702 Tipo V 110 m² · sala de reuniões (área comum 41 m²) + 65 m² descobertos.
- **10º:** 801 Tipo VI 111 m² (+40 m² descobertos) · 802 Tipo V 108 m².
- **11º/12º:** Cobertura 1 (112 + 71 m² + 35 m² descobertos) · Cobertura 2 (108 + 70 m² + 30 m² descobertos).
- Diferenciais do folder: acabamento prime, portaria inteligente, quartos com piso laminado, aquecedor solar (9º ao 12º), até 3 vagas, infra para ar-condicionado, câmeras, gás canalizado e hidrômetro individuais, janelas com veneziana, tomadas USB, hall decorado. Memorial: 4536 do 2º CRI.
- **Localização:** −20,148008 / −44,895797. Rua Ceará corre a ~110° (ESE); o terreno fica na esquina sudeste com a Rua Bahia. Fachada da Rua Ceará olha para ~20° (NNE) e a da Rua Bahia para ~290° (ONO).

## 4. Decisões

### 4.A Decisões tomadas por mim nesta rodada (padrão sensato — pode mudar)

| Nº | Decisão | Motivo / impacto |
|---|---|---|
| D-A1 | Tecnologia: **Vite + TypeScript + Three.js**, tudo num **único .html** (sem servidor), relatórios gerados no navegador (jsPDF, docx, ExcelJS) | Abre por duplo clique hoje; o mesmo código vira link/PWA depois |
| D-A2 | Dados técnicos em `empreendimento.json` (não mudam com vendas); dados comerciais no navegador + backup `.json` | Separar o que é projeto do que é venda facilita trocar de empreendimento |
| D-A3 | Regras de negócio em funções puras testadas (`src/core`) — a tela só chama | Menos erro, testes automáticos (12 testes) |
| D-A4 | Primeiro uso abre com **dados de exemplo** (preços ~R$ 7.600/m², 14 clientes fictícios) marcados como exemplo; botão "Começar do zero" | Você vê tudo funcionando já; nada fictício vai para relatório sem aviso |
| D-A5 | Unidades das coberturas numeradas **901 e 902** | Sequência natural (701/702 no 9º, 801/802 no 10º); confirmar em D06 |
| D-A6 | Status: Disponível · Em negociação · Reservado · Vendido · Indisponível (permuta/bloqueio). Cores sempre com texto e ícone | Acessibilidade; contraste medido (≥ 4,5:1) |
| D-A7 | Funil: Novo → Em contato → Visita → Proposta → Reserva → Contrato → Vendido / Perdido. Proposta põe a unidade "em negociação"; Reserva bloqueia por 7 dias (configurável); Contrato/Vendido marca vendida; Perdido libera e exige motivo | Evita duas reservas na mesma unidade e mantém o espelho sempre certo |
| D-A8 | PIN só trava a tela (hash com sal); sessão vale até fechar o navegador | Segurança forte virá com login na fase online |
| D-A9 | Entorno: ruas e quadras alinhadas à realidade; prédios vizinhos **gerados** (ilustrativos) | Sem acesso a dados de prédios reais nesta fase (ver D03) |
| D-A10 | Tour: interiores **gerados por código** a partir das plantas do folder (medidas aproximadas), com botão para ver os **renders reais** do folder em cada ambiente | Funciona offline e em qualquer tipologia; ver D02 |
| D-A11 | Modo apresentação: depois de 2 min sem toque (modo cliente), o drone começa a voar sozinho | Bom para TV no plantão |
| D-A12 | Segunda tela: botão "Abrir 2ª tela para o cliente (TV)" no gerente; as janelas se sincronizam sozinhas | Corretor opera no notebook, cliente vê na TV |

### 4.B Perguntas para você (responda "ok com as estrelas" ou ajuste)

**D01 — Realismo máximo da fachada/maquete (arquivo do arquiteto do Missouri).** *(o recurso de carregar o modelo é a D11 da plataforma)* Hoje o prédio é gerado por código a partir das plantas.
- ⭐ (a) Me enviar o **modelo 3D do arquiteto** (SketchUp `.skp`, Revit, `.fbx`, `.obj` ou `.glb`). Eu converto para `.glb` otimizado e o sistema carrega no lugar do prédio gerado (a parte de clique/status continua igual). É o caminho para o realismo "de render".
- (b) Seguir refinando o prédio por código, a partir das imagens do folder (técnica img2threejs).
- Ajustar: ___

**D02 — Realismo do tour interno.**
- ⭐ (a) Usar o modelo 3D de interiores do arquiteto/decorador (o mesmo que gerou os renders do folder) + **fotos 360°** renderizadas por cômodo (o render 360° é a forma mais realista e leve de "visita").
- (b) Manter interiores gerados e melhorar móveis/iluminação aos poucos.
- Ajustar: ___

**D03 — Entorno real.** *(movida para o roadmap da plataforma)*
- ⭐ (a) Fase online: usar **Google Photorealistic 3D Tiles** (cidade real em 3D, requer chave de API Google e internet) com o nosso prédio inserido.
- (b) Importar contornos de prédios do **OpenStreetMap** (gratuito, mas altura nem sempre existe em Divinópolis).
- (c) Manter o entorno ilustrativo.
- Ajustar: ___

**D04 — Preço no modo cliente.** *(movida para o roadmap da plataforma)* ⭐ mostrar preço de tabela só das disponíveis/em negociação (já é o padrão, com opção de desligar) · ou "Preço sob consulta" sempre · Ajustar: ___

**D05 — Tabela de preços.** Me envie a tabela oficial (preço por unidade, condições, entrada/parcelas/chaves). ⭐ Eu importo de uma planilha Excel com colunas Unidade · Preço · Condições. Ajustar: ___

**D06 — Numeração e vagas.** Confirmar: coberturas são **901/902**? Vagas por unidade (hoje 2 para tipos e 3 para coberturas — o folder diz "até 3 vagas")? ⭐ Me envie a lista de vagas por unidade.

**D07 — Orientação do terreno.** Medi pela foto de satélite que a Rua Ceará corre a ~110°. ⭐ Conferir com a planta de situação do projeto (norte verdadeiro) — muda a projeção solar.

**D08 — Detalhes das tipologias.** O folder não informa nº exato de banheiros/lavabos nem medidas de todos os cômodos. ⭐ Me enviar o memorial descritivo e as plantas em PDF/DWG com cotas para o tour ficar fiel.

**D09 — Fase online *(movida para o roadmap da plataforma)* (link + celular + vários corretores).** ⭐ (a) Supabase (banco gratuito até certo uso, login por e-mail, dados em tempo real) · (b) Firebase · (c) servidor próprio. Decidir quando chegarmos na Fase 4.

**D10 — Domínio.** *(movida para o roadmap da plataforma; para este projeto, a sugestão é a subpasta `…/missouri/`)* ⭐ GitHub Pages grátis agora (link `victortlacerda.github.io/incorporadora`) · domínio próprio depois (ex.: missouri.costalacerda.com.br). Observação: o repositório é **público**; o arquivo publicado não contém dados de clientes (eles ficam no navegador), mas o código e as imagens do folder ficam visíveis.

## 5. Fases do projeto

### Fase 0 — Planejamento ✅
- [x] Ler folder, plantas, localização e skills anteriores
- [x] Definir arquitetura, modelo de dados, decisões e perguntas
- [x] Roadmap (este arquivo)

### Fase 1 — Protótipo funcional (v0.1) ✅ *entregue nesta rodada*
- [x] Maquete 3D procedural com materiais PBR (revestimento claro/grafite, ripado de madeira, vidros, guarda-corpos, faixas de madeira nas varandas, marquise com letreiro "MISSOURI Residencial", LEDs, portão, aquecedor solar no telhado)
- [x] Implantação com orientação real; ruas, calçadas, faixas, nomes de ruas, postes, árvores, carros, vizinhos, morros no horizonte
- [x] Céu físico com nuvens, sol real (data/hora), sombras, reflexos do céu, neblina; noite com estrelas, postes, janelas acesas e brilho (bloom)
- [x] Trajetória do sol, rosa dos ventos, animação do dia, horas de sol por fachada
- [x] Câmera: órbita, drone automático, vistas (geral, Rua Ceará, Rua Bahia, aérea, bairro), voo até a unidade, corte por pavimento, bússola
- [x] Clique na unidade (volumes clicáveis), destaque, rótulos, modo disponibilidade
- [x] Tour virtual guiado (todas as tipologias, incluindo 2º piso das coberturas)
- [x] Modo cliente / gerente (PIN), CRM, espelho de vendas, alertas, configurações
- [x] Relatórios PDF / Word / Excel; backup .json
- [x] Layout de celular; PWA preparado; testes automáticos; arquivo único
- [ ] **Teste de campo com você** (abrir no computador do plantão, testar desempenho, ver se a maquete "parece" o Missouri)

### Fase 2 — Fidelidade ao projeto (depende de D01, D02, D06, D07, D08)
- [ ] Carregar modelo 3D do arquiteto (.glb) para fachada e/ou interiores
- [ ] Ajustar fachada (cores/ritmo de janelas) comparando com o render da fachada
- [ ] Plantas com cotas exatas → ambientes do tour 1:1
- [ ] Hall de entrada e hall decorado no tour (renders existentes)
- [ ] Fotos 360° por cômodo (se D02-a)
- [ ] Importar tabela de preços oficial (Excel) e vagas
- [ ] Opção de qualidade gráfica automática conforme o computador (medir fps real)

### Fase 3 — Vendas no dia a dia
- [ ] Proposta em PDF para o cliente (unidade, imagem da maquete, condições, simulação)
- [ ] Simulador de pagamento (entrada, mensais, intercaladas, chaves, financiamento)
- [ ] Histórico de preços e tabela por período (reajuste INCC)
- [ ] Comissão por corretor e metas
- [ ] Agenda de visitas e lembretes
- [ ] Importar clientes de planilha (CSV/Excel)
- [ ] Comparar 2–3 unidades lado a lado
- [ ] Manual do usuário (documento editável) — escrever após a interface estabilizar

### Fase 4 — Online, link e celular (depende de D09, D10)
- [ ] Publicar no GitHub Pages (link) — já preparado (`dist/pages`)
- [ ] Banco de dados online + login (gerente, corretor, cliente)
- [ ] Vários corretores ao mesmo tempo, permissões
- [ ] Link de apresentação para o cliente (somente visualização, sem dados internos)
- [ ] "Tenho interesse" pelo cliente → entra no CRM
- [ ] Entorno real (Google 3D Tiles) se D03-a

### Fase 5 — Plataforma para outras incorporadoras
- [ ] Assistente "novo empreendimento": a partir de PDF do folder + identidade visual → `empreendimento.json` (com revisão)
- [ ] Editor visual de plantas/volumes (arrastar retângulos sobre a planta)
- [ ] Vários empreendimentos no mesmo sistema (portfólio da incorporadora)
- [ ] Temas visuais por incorporadora

## 6. Banco de ideias (nada se perde)

**Suas ideias:** luz acesa = disponível (feito) · tour como visita guiada (feito) · modo gerente/cliente (feito).

**Minhas sugestões:**
- Vista real da janela de cada unidade (feito no tour: as janelas mostram a cidade na altura certa)
- Horas de sol por fachada como argumento de venda (feito)
- "Vista do apartamento" a 360° sem entrar no tour (câmera na varanda)
- Simulação de sombra dos prédios vizinhos nas unidades (precisa de entorno real)
- QR code no folder/estande abrindo direto a unidade no celular
- Vídeo automático (gravação do voo de drone) para Instagram/WhatsApp
- Comparador de unidades e "unidades parecidas disponíveis" quando a escolhida está vendida
- Mapa de calor de interesse (quais unidades mais clicadas / mais visitadas no tour)
- Integração com WhatsApp (mensagem pronta com link da unidade)
- Assinatura eletrônica da proposta (fase online)
- Personalização de acabamentos no tour (piso, marcenaria) para coberturas
- Mostrar pontos de interesse do bairro (comércio, escolas, hospitais) com distâncias
- Modo "TV do plantão" com carrossel de unidades disponíveis e avisos
- Narração em áudio do tour (gravada pelo corretor)
- Realidade aumentada no celular (maquete sobre a mesa)

## 6.1 O que foi verificado nesta rodada (e o que não)

- ✅ 13 testes automáticos das regras (funil, reservas, PIN, backup, sol, relatório, validação do empreendimento).
- ✅ Arquivo único aberto por `file://` num Chrome sem tela: abertura, vista geral, foco na unidade, rua, noite, espelho, disponibilidade, corte por pavimento, bairro, tour (apto 502 e Cobertura 1, incluindo 2º piso), modo gerente, CRM, relatórios PDF/Word/Excel baixados e conferidos, backup exportado, layout de celular (390×844).
- ⚠️ **Não verificado:** fluidez (fps) no computador do plantão — o teste roda com placa de vídeo simulada, muito mais lenta que um PC real. Se ficar pesado, a qualidade pode ser reduzida (opção prevista).
- ⚠️ Medidas dos cômodos do tour e ritmo das janelas da fachada são aproximados (folder sem cotas completas).

## 7. Riscos e cuidados

| Risco | Cuidado |
|---|---|
| Computador do plantão fraco → 3D lento | Qualidade automática (alta/média/baixa); medir no computador real (não dá para medir aqui) |
| Dados só no navegador → perda ao limpar o Chrome | Aviso de backup a cada 7 dias; exportar .json; fase online resolve |
| Dados ficam por endereço: arquivo em outra pasta/computador/link começa vazio | Use o backup .json para levar os dados (dito na tela Dados) |
| Maquete gerada pode divergir do projeto real | Aviso "imagens ilustrativas / medidas aproximadas"; D01/D08 |
| Backups contêm dados pessoais (LGPD) | Não enviar backups ao GitHub; guardar em local seguro |
| Repositório público | Não versionar backups nem dados reais de clientes |

## 8. O que depende de você (teste de campo)

1. Abrir `dist/missouri-apresentacao-3d.html` (ou o arquivo baixado) no **Google Chrome** do computador de apresentação.
2. Testar: Iniciar apresentação → girar/zoom → Drone → clicar num apartamento → Tour virtual → Noite → Disponibilidade → Espelho.
3. Criar o PIN (Entrar como gerente) → ver Clientes, Relatórios (baixar PDF/Word/Excel) → Dados → Exportar backup.
4. Dizer: está fluido? A fachada lembra o Missouri? O que não gostou? Responder D01–D10.

## 9. Log de decisões e versões

| Data | Versão | O que aconteceu |
|---|---|---|
| 06/11/2026 | v1.0 | Projeto criado; Fases 0 e 1 entregues; decisões D-A1 a D-A12 tomadas; perguntas D01–D10 abertas |
| 06/11/2026 | v1.1 | Missouri vira Projeto específico 1 em pasta própria; D03, D04, D09, D10 movidas para a plataforma |
