// Backup sem banco de dados: exportar e importar um .json com TODOS os dados comerciais.
// Arquivo ruim é recusado com explicação e não toca nos dados atuais.
import type { Dados, Empreendimento, Resultado } from './tipos.ts';
import { ETAPAS, STATUS_INFO } from './tipos.ts';
import { VERSAO_DADOS, completarUnidades, dadosVazios } from './regras.ts';

export function nomeArquivoBackup(emp: Empreendimento, agora = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const carimbo = `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}_${p(agora.getHours())}h${p(agora.getMinutes())}`;
  return `backup-${emp.id}-${carimbo}.json`;
}

export function exportarJSON(d: Dados): string {
  return JSON.stringify({ ...d, exportadoEm: new Date().toISOString() }, null, 2);
}

/** Migrações de formato. Cada nova versão de dados ganha um passo aqui (v1→v2…), preenchendo padrões. */
export function migrar(bruto: any, emp: Empreendimento): Dados {
  const base = dadosVazios(emp);
  const d: any = { ...base, ...bruto, config: { ...base.config, ...(bruto.config ?? {}) } };
  // (exemplo futuro) if (d.versao === 1) { ...; d.versao = 2; }
  d.versao = VERSAO_DADOS;
  for (const l of d.leads) {
    l.historico ??= [];
    l.unidadesInteresse ??= [];
    l.motivoPerda ??= '';
    l.obs ??= '';
  }
  completarUnidades(emp, d);
  return d as Dados;
}

export function validarImportacao(texto: string, emp: Empreendimento): Resultado<Dados> {
  let bruto: any;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, erro: 'Este arquivo não é um JSON válido (pode estar corrompido ou não ser um backup).' };
  }
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return { ok: false, erro: 'Arquivo sem o formato esperado.' };
  if (bruto.app !== 'incorporadora-3d') return { ok: false, erro: 'Este arquivo não é um backup deste sistema.' };
  if (typeof bruto.versao !== 'number' || bruto.versao < 1) return { ok: false, erro: 'Versão do backup desconhecida.' };
  if (bruto.versao > VERSAO_DADOS) return { ok: false, erro: `Backup feito numa versão mais nova do sistema (v${bruto.versao}). Atualize o sistema antes de importar.` };
  if (bruto.empreendimentoId !== emp.id) return { ok: false, erro: `Este backup é do empreendimento "${bruto.empreendimentoId}", não de "${emp.id}".` };
  if (!bruto.unidades || typeof bruto.unidades !== 'object' || Array.isArray(bruto.unidades)) return { ok: false, erro: 'Lista de unidades ausente ou com tipo errado.' };
  if (!Array.isArray(bruto.leads)) return { ok: false, erro: 'Lista de clientes ausente ou com tipo errado.' };
  for (const [id, u] of Object.entries<any>(bruto.unidades)) {
    if (!u || typeof u !== 'object') return { ok: false, erro: `Unidade ${id} com formato inválido.` };
    if (!(u.status in STATUS_INFO)) return { ok: false, erro: `Unidade ${id} com status desconhecido ("${u.status}").` };
    if (u.preco != null && typeof u.preco !== 'number') return { ok: false, erro: `Unidade ${id} com preço inválido.` };
  }
  const etapas = new Set(ETAPAS.map((e) => e.id));
  for (const l of bruto.leads) {
    if (!l || typeof l !== 'object' || typeof l.id !== 'string' || typeof l.nome !== 'string') return { ok: false, erro: 'Há um cliente sem identificação ou nome.' };
    if (!etapas.has(l.etapa)) return { ok: false, erro: `Cliente "${l.nome}" com etapa desconhecida.` };
    if (l.historico != null && !Array.isArray(l.historico)) return { ok: false, erro: `Cliente "${l.nome}" com histórico inválido.` };
  }
  return { ok: true, valor: migrar(bruto, emp) };
}
