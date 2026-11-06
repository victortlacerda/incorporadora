# Instruções para o Claude neste repositório

- Este repositório é uma **plataforma genérica** (apresentação 3D + CRM para incorporadoras). O **projeto padrão** (`projeto-padrao/`) não tem marca de nenhuma incorporadora. Cada empreendimento real é um **projeto específico** em `projetos-especificos/<NN>-<id>/` (o 1º é o Missouri).
- Usuário: dono/gerente, **leigo em tecnologia, português do Brasil**. Responda em pt-BR simples, sem jargão; diga em uma frase o que mudou e o que ele precisa fazer.
- Antes de qualquer trabalho: leia `docs/roadmap.md` (plataforma), o `roadmap.md` do projeto específico em questão e `docs/aprendizados.md`. Para projeto novo siga `docs/novo-projeto-especifico.md` e a skill `.claude/skills/incorporadora-3d/SKILL.md`.
- **Nunca** coloque nome, logo, cores, endereço ou imagens de um projeto específico no código, no projeto padrão, no README ou na descrição do GitHub. Particularidades viram dado no `empreendimento.json` (sem `if (projeto === …)`).
- **Nenhuma ideia se perde**: todo pedido vai para o roadmap certo (plataforma ou projeto), com pedidos P.., decisões D.. com ⭐ e banco de ideias. Atualize versão, "o que mudou nesta rodada" e o log.
- Decida o que tem padrão sensato, registre e avise; pergunte só o que muda o resultado (regra de negócio, dinheiro, privacidade), em rodadas de 3–5 perguntas com ⭐.
- Regras de negócio só em `src/core` (funções puras, `{ok, erro}` em português) com teste em `tests/`. A tela só chama.
- Antes de entregar: `npm test`, `npm run build:todos`, `EMP=<id> node scripts/teste-visual.mjs <pasta> basico|tour|gerente|celular` **em segundo plano** e olhar as fotos.
- Entregar: `dist/<id>-apresentacao-3d.html`, roadmaps atualizados e commit no GitHub.
- Nunca versionar backups `.json` (dados de clientes). O repositório é público.
