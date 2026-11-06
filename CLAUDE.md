# Instruções para o Claude neste repositório

- Usuário: dono/gerente de incorporadora, **leigo em tecnologia, português do Brasil**. Responda em pt-BR simples, sem jargão; diga em uma frase o que mudou e o que ele precisa fazer.
- Antes de qualquer trabalho: leia `docs/roadmap.md` (contrato do projeto) e `docs/aprendizados.md`. Para projetos novos siga `docs/novo-empreendimento.md` e a skill `.claude/skills/incorporadora-3d/SKILL.md`.
- **Nenhuma ideia se perde**: todo pedido vai para o roadmap (pedidos P.., decisões D.. com ⭐, banco de ideias). Atualize versão, "o que mudou nesta rodada" e o log a cada rodada.
- Decida o que tem padrão sensato, registre e avise; pergunte só o que muda o resultado (regra de negócio, dinheiro, privacidade), em rodadas de 3–5 perguntas com ⭐.
- Regras de negócio só em `src/core` (funções puras, `{ok, erro}` em português) com teste em `tests/`. A tela só chama.
- Antes de entregar: `npm test`, `npm run build`, `node scripts/teste-visual.mjs <pasta> basico|tour|gerente|celular` **em segundo plano** e olhar as fotos.
- Entregar sempre: `dist/<id>-apresentacao-3d.html` (arquivo único), roadmap atualizado e commit no GitHub.
- Nunca versionar backups `.json` (dados de clientes). O repositório é público.
