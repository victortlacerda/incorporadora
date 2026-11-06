// Recursos do empreendimento ativo. O apelido @emp aponta para empreendimentos/<id> (definido no vite.config.ts
// pela variável EMP). Trocar de empreendimento = trocar a pasta, sem mexer no código.
import empJson from '@emp/empreendimento.json';
import type { Empreendimento } from './core/tipos.ts';

const arquivos = import.meta.glob('@emp/imagens/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const EMP = empJson as unknown as Empreendimento;

export function imagem(nome: string | undefined | null): string | null {
  if (!nome) return null;
  const k = Object.keys(arquivos).find((p) => p.endsWith('/' + nome));
  return k ? arquivos[k] : null;
}
