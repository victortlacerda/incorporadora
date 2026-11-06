// Onde fica cada projeto. "padrao" = projeto genérico (projeto-padrao/).
// Projetos específicos: projetos-especificos/<NN>-<id>/ (ex.: 01-missouri → EMP=missouri).
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const RAIZ = resolve(import.meta.dirname, '..');

export function pastaDoProjeto(emp = 'padrao') {
  if (emp === 'padrao') return resolve(RAIZ, 'projeto-padrao');
  const base = resolve(RAIZ, 'projetos-especificos');
  const nome = existsSync(base) ? readdirSync(base).find((d) => d === emp || d.replace(/^\d+-/, '') === emp) : undefined;
  const pasta = nome ? resolve(base, nome) : null;
  if (!pasta || !existsSync(resolve(pasta, 'empreendimento.json'))) throw new Error(`Projeto "${emp}" não encontrado (use "padrao" ou uma pasta de projetos-especificos/).`);
  return pasta;
}

export function listarProjetos() {
  const base = resolve(RAIZ, 'projetos-especificos');
  const especificos = existsSync(base) ? readdirSync(base).filter((d) => existsSync(resolve(base, d, 'empreendimento.json'))).map((d) => d.replace(/^\d+-/, '')) : [];
  return ['padrao', ...especificos];
}
