// Regras de negócio PURAS. A tela só chama e mostra. Toda função que muda dados
// recebe os dados, altera e devolve {ok:true} ou {ok:false, erro:"texto em português"}.
import type { Ambiente, Dados, Empreendimento, EtapaLead, Lead, Resultado, StatusUnidade, Tipologia, UnidadeComercial, UnidadeTecnica } from './tipos.ts';
import { ETAPAS, STATUS_INFO } from './tipos.ts';
import { addDias, diffDias, hojeISO, normalizar, sha256, uid } from './util.ts';

export const VERSAO_DADOS = 1;

// ---------- Empreendimento (dados técnicos) ----------

export function tipologia(emp: Empreendimento, id: string): Tipologia {
  const t = emp.tipologias[id];
  if (!t) throw new Error(`Tipologia ${id} não existe`);
  if (t.base && !t.ambientes) {
    const b = tipologia(emp, t.base);
    return { ...t, ambientes: b.ambientes };
  }
  return t;
}

export function ambientesDaUnidade(emp: Empreendimento, u: UnidadeTecnica): { ambiente: Ambiente; nivel: number }[] {
  const t = tipologia(emp, u.tipologia);
  const lista = (t.ambientes ?? []).map((a) => ({ ambiente: a, nivel: 0 }));
  for (const a of t.ambientesSuperiores ?? []) lista.push({ ambiente: a, nivel: 1 });
  // a sala sempre primeiro, depois a ordem do arquivo
  return lista;
}

export function unidadeTecnica(emp: Empreendimento, id: string): UnidadeTecnica | undefined {
  return emp.unidades.find((u) => u.id === id);
}

export function nomeUnidade(u: UnidadeTecnica): string {
  return u.nome ? `${u.nome} (${u.id})` : `Apto ${u.id}`;
}

export function pavimentoRotulo(emp: Empreendimento, numero: number): string {
  return emp.pavimentos.find((p) => p.numero === numero)?.nome ?? `${numero}º pavimento`;
}

/** Valida o empreendimento.json (para quando chegar um projeto novo). Devolve lista de problemas. */
export function validarEmpreendimento(emp: Empreendimento): string[] {
  const erros: string[] = [];
  const ids = new Set<string>();
  for (const u of emp.unidades) {
    if (ids.has(u.id)) erros.push(`Unidade ${u.id} repetida`);
    ids.add(u.id);
    if (!emp.tipologias[u.tipologia]) erros.push(`Unidade ${u.id}: tipologia ${u.tipologia} não existe`);
    if (!emp.pavimentos.some((p) => p.numero === u.pavimento)) erros.push(`Unidade ${u.id}: pavimento ${u.pavimento} não existe`);
    if (!u.volumes?.length) erros.push(`Unidade ${u.id}: sem volumes (posição no prédio)`);
    for (const v of u.volumes ?? []) if (v[1] <= v[0] || v[3] <= v[2]) erros.push(`Unidade ${u.id}: volume com medida invertida`);
    if (!(u.areaPrivativa > 0)) erros.push(`Unidade ${u.id}: área privativa inválida`);
  }
  for (const [id, t] of Object.entries(emp.tipologias)) {
    if (t.base && !emp.tipologias[t.base]) erros.push(`Tipologia ${id}: base ${t.base} não existe`);
    if (!t.base && !t.ambientes?.length) erros.push(`Tipologia ${id}: sem ambientes para o tour`);
  }
  return erros;
}

// ---------- Dados comerciais ----------

export function unidadeComercialVazia(u: UnidadeTecnica, agora: string): UnidadeComercial {
  return { id: u.id, status: 'disponivel', preco: null, condicoes: '', vagas: u.vagas ?? null, leadId: null, corretor: '', reservaAte: null, vendaData: null, vendaValor: null, obs: '', atualizadoEm: agora };
}

export function dadosVazios(emp: Empreendimento, agora = new Date().toISOString()): Dados {
  const unidades: Record<string, UnidadeComercial> = {};
  for (const u of emp.unidades) unidades[u.id] = unidadeComercialVazia(u, agora);
  return {
    app: 'incorporadora-3d',
    versao: VERSAO_DADOS,
    empreendimentoId: emp.id,
    exemplo: false,
    criadoEm: agora,
    atualizadoEm: agora,
    unidades,
    leads: [],
    config: {
      pinHash: null,
      pinSal: null,
      mostrarPrecoCliente: true,
      prazoReservaDias: 7,
      corretores: [],
      origens: ['Plantão de vendas', 'Indicação', 'Instagram', 'Facebook', 'Site', 'Placa / fachada', 'Imobiliária parceira', 'Outro'],
      ultimoBackup: null,
      diasAvisoBackup: 7,
    },
  };
}

/** Garante que toda unidade técnica tem registro comercial (ex.: projeto ganhou unidade nova). */
export function completarUnidades(emp: Empreendimento, d: Dados): void {
  const agora = new Date().toISOString();
  for (const u of emp.unidades) if (!d.unidades[u.id]) d.unidades[u.id] = unidadeComercialVazia(u, agora);
}

function tocar(d: Dados, uc?: UnidadeComercial, lead?: Lead) {
  const agora = new Date().toISOString();
  d.atualizadoEm = agora;
  if (uc) uc.atualizadoEm = agora;
  if (lead) lead.atualizadoEm = agora;
}

export function atualizarUnidade(d: Dados, id: string, mud: Partial<Omit<UnidadeComercial, 'id'>>): Resultado {
  const uc = d.unidades[id];
  if (!uc) return { ok: false, erro: `Unidade ${id} não encontrada.` };
  if (mud.preco != null && (!isFinite(mud.preco) || mud.preco < 0)) return { ok: false, erro: 'Preço inválido.' };
  if (mud.vendaValor != null && (!isFinite(mud.vendaValor) || mud.vendaValor < 0)) return { ok: false, erro: 'Valor de venda inválido.' };
  if (mud.status && !(mud.status in STATUS_INFO)) return { ok: false, erro: 'Status inválido.' };
  Object.assign(uc, mud);
  if (uc.status === 'disponivel' || uc.status === 'bloqueado') {
    uc.leadId = mud.leadId ?? (uc.status === 'disponivel' ? null : uc.leadId);
    uc.reservaAte = null;
    if (uc.status === 'disponivel') { uc.vendaData = null; uc.vendaValor = null; }
  }
  if (uc.status === 'vendido' && !uc.vendaData) uc.vendaData = hojeISO();
  if (uc.status === 'vendido' && uc.vendaValor == null) uc.vendaValor = uc.preco;
  tocar(d, uc);
  return { ok: true };
}

export function etapaRotulo(e: EtapaLead): string {
  return ETAPAS.find((x) => x.id === e)?.rotulo ?? e;
}

export interface NovoLead { nome: string; telefone?: string; email?: string; origem?: string; corretor?: string; unidadesInteresse?: string[]; obs?: string; proximaAcao?: string | null }

export function criarLead(d: Dados, n: NovoLead, hoje = hojeISO()): Resultado<Lead> {
  const nome = (n.nome ?? '').trim();
  if (nome.length < 2) return { ok: false, erro: 'Informe o nome do cliente.' };
  const tel = (n.telefone ?? '').trim();
  if (tel && tel.replace(/\D/g, '').length < 8) return { ok: false, erro: 'Telefone parece incompleto.' };
  const email = (n.email ?? '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, erro: 'E-mail inválido.' };
  for (const u of n.unidadesInteresse ?? []) if (!d.unidades[u]) return { ok: false, erro: `Unidade ${u} não existe.` };
  const agora = new Date().toISOString();
  const lead: Lead = {
    id: uid('lead'), nome, telefone: tel, email, origem: n.origem ?? '', corretor: n.corretor ?? '', etapa: 'novo',
    unidadesInteresse: [...new Set(n.unidadesInteresse ?? [])], unidadeId: null, valorProposta: null,
    proximaAcao: n.proximaAcao ?? addDias(hoje, 1), ultimoContato: hoje, motivoPerda: '', obs: n.obs ?? '',
    historico: [{ data: hoje, tipo: 'sistema', texto: 'Cliente cadastrado.' }], criadoEm: agora, atualizadoEm: agora,
  };
  d.leads.push(lead);
  tocar(d);
  return { ok: true, valor: lead };
}

export function editarLead(d: Dados, id: string, mud: Partial<Pick<Lead, 'nome' | 'telefone' | 'email' | 'origem' | 'corretor' | 'unidadesInteresse' | 'obs' | 'proximaAcao' | 'valorProposta'>>): Resultado {
  const l = d.leads.find((x) => x.id === id);
  if (!l) return { ok: false, erro: 'Cliente não encontrado.' };
  if (mud.nome != null && mud.nome.trim().length < 2) return { ok: false, erro: 'Informe o nome do cliente.' };
  if (mud.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mud.email)) return { ok: false, erro: 'E-mail inválido.' };
  Object.assign(l, mud);
  tocar(d, undefined, l);
  return { ok: true };
}

export function registrarInteracao(d: Dados, id: string, tipo: Lead['historico'][number]['tipo'], texto: string, hoje = hojeISO(), proximaAcao?: string | null): Resultado {
  const l = d.leads.find((x) => x.id === id);
  if (!l) return { ok: false, erro: 'Cliente não encontrado.' };
  if (!texto.trim()) return { ok: false, erro: 'Escreva o que aconteceu.' };
  l.historico.push({ data: hoje, tipo, texto: texto.trim() });
  l.ultimoContato = hoje;
  if (proximaAcao !== undefined) l.proximaAcao = proximaAcao;
  tocar(d, undefined, l);
  return { ok: true };
}

/**
 * Move o cliente no funil e aplica o efeito na unidade:
 * proposta → unidade "em negociação"; reserva → "reservado" com prazo; contrato/vendido → "vendido";
 * perdido → libera a unidade que estava presa a este cliente.
 */
export function moverLead(d: Dados, id: string, etapa: EtapaLead, opc: { unidadeId?: string | null; valor?: number | null; motivo?: string } = {}, hoje = hojeISO()): Resultado {
  const l = d.leads.find((x) => x.id === id);
  if (!l) return { ok: false, erro: 'Cliente não encontrado.' };
  if (!ETAPAS.some((e) => e.id === etapa)) return { ok: false, erro: 'Etapa inválida.' };
  const unidadeId = opc.unidadeId !== undefined ? opc.unidadeId : l.unidadeId;
  const precisaUnidade = etapa === 'proposta' || etapa === 'reserva' || etapa === 'contrato' || etapa === 'vendido';
  if (precisaUnidade && !unidadeId) return { ok: false, erro: 'Escolha a unidade desta negociação.' };
  const uc = unidadeId ? d.unidades[unidadeId] : undefined;
  if (unidadeId && !uc) return { ok: false, erro: `Unidade ${unidadeId} não existe.` };
  if (uc && precisaUnidade) {
    const deOutro = uc.leadId && uc.leadId !== l.id;
    if (uc.status === 'vendido' && deOutro) return { ok: false, erro: `A unidade ${uc.id} já foi vendida para outro cliente.` };
    if (uc.status === 'bloqueado') return { ok: false, erro: `A unidade ${uc.id} está indisponível.` };
    if (uc.status === 'reservado' && deOutro && etapa !== 'proposta') {
      const outro = d.leads.find((x) => x.id === uc.leadId);
      return { ok: false, erro: `A unidade ${uc.id} está reservada para ${outro?.nome ?? 'outro cliente'} até ${uc.reservaAte ?? '—'}.` };
    }
  }
  if (etapa === 'perdido' && !opc.motivo?.trim() && !l.motivoPerda) return { ok: false, erro: 'Informe o motivo da perda (ajuda a melhorar as vendas).' };

  // solta a unidade antiga se trocou de unidade ou perdeu
  const antiga = l.unidadeId ? d.unidades[l.unidadeId] : undefined;
  if (antiga && antiga.leadId === l.id && (etapa === 'perdido' || (unidadeId && unidadeId !== antiga.id))) {
    if (antiga.status !== 'vendido') {
      antiga.status = 'disponivel';
      antiga.leadId = null;
      antiga.reservaAte = null;
      tocar(d, antiga);
    }
  }

  const anterior = l.etapa;
  l.etapa = etapa;
  if (unidadeId !== undefined) l.unidadeId = etapa === 'perdido' ? l.unidadeId : unidadeId;
  if (opc.valor != null) l.valorProposta = opc.valor;
  if (etapa === 'perdido') { l.motivoPerda = opc.motivo?.trim() || l.motivoPerda; l.proximaAcao = null; }
  if (etapa === 'vendido') l.proximaAcao = null;

  if (uc && etapa !== 'perdido') {
    if (etapa === 'proposta' && (uc.status === 'disponivel' || uc.leadId === l.id)) {
      if (uc.status !== 'reservado' && uc.status !== 'vendido') { uc.status = 'negociacao'; uc.leadId = l.id; }
    }
    if (etapa === 'reserva') { uc.status = 'reservado'; uc.leadId = l.id; uc.reservaAte = addDias(hoje, d.config.prazoReservaDias); }
    if (etapa === 'contrato' || etapa === 'vendido') {
      uc.status = 'vendido'; uc.leadId = l.id; uc.reservaAte = null;
      uc.vendaData = uc.vendaData ?? hoje;
      uc.vendaValor = opc.valor ?? l.valorProposta ?? uc.vendaValor ?? uc.preco;
      if (l.corretor) uc.corretor = l.corretor;
    }
    tocar(d, uc);
  }
  l.historico.push({ data: hoje, tipo: 'sistema', texto: `Etapa: ${etapaRotulo(anterior)} → ${etapaRotulo(etapa)}${unidadeId ? ` (unidade ${unidadeId})` : ''}${opc.motivo ? ` — ${opc.motivo}` : ''}` });
  l.ultimoContato = hoje;
  tocar(d, undefined, l);
  return { ok: true };
}

export function excluirLead(d: Dados, id: string): Resultado {
  const i = d.leads.findIndex((x) => x.id === id);
  if (i < 0) return { ok: false, erro: 'Cliente não encontrado.' };
  for (const uc of Object.values(d.unidades)) {
    if (uc.leadId === id) {
      if (uc.status === 'vendido') return { ok: false, erro: `Este cliente comprou a unidade ${uc.id}. Mude a unidade antes de excluir.` };
      uc.leadId = null;
      if (uc.status === 'reservado' || uc.status === 'negociacao') { uc.status = 'disponivel'; uc.reservaAte = null; }
    }
  }
  d.leads.splice(i, 1);
  tocar(d);
  return { ok: true };
}

/** Libera reservas vencidas (o gerente decide quando rodar; a tela avisa antes). */
export function reservasVencidas(d: Dados, hoje = hojeISO()): UnidadeComercial[] {
  return Object.values(d.unidades).filter((u) => u.status === 'reservado' && u.reservaAte && diffDias(u.reservaAte, hoje) > 0);
}

// ---------- PIN (só trava a tela; não é segurança forte) ----------

export function definirPin(d: Dados, pin: string): Resultado {
  if (!/^\d{4,8}$/.test(pin)) return { ok: false, erro: 'O PIN deve ter de 4 a 8 números.' };
  const sal = Math.random().toString(36).slice(2, 10);
  d.config.pinSal = sal;
  d.config.pinHash = sha256(sal + ':' + pin);
  tocar(d);
  return { ok: true };
}

export function conferirPin(d: Dados, pin: string): boolean {
  if (!d.config.pinHash || !d.config.pinSal) return false;
  return sha256(d.config.pinSal + ':' + pin) === d.config.pinHash;
}

// ---------- Alertas e consultas ----------

export interface Alerta { nivel: 'alto' | 'medio' | 'info'; texto: string; leadId?: string; unidadeId?: string }

export function urgenciaLead(l: Lead, hoje = hojeISO()): 'atrasado' | 'hoje' | 'ok' | 'encerrado' {
  if (l.etapa === 'vendido' || l.etapa === 'perdido') return 'encerrado';
  if (!l.proximaAcao) return 'atrasado';
  const d = diffDias(l.proximaAcao, hoje);
  return d > 0 ? 'atrasado' : d === 0 ? 'hoje' : 'ok';
}

export function alertas(d: Dados, hoje = hojeISO()): Alerta[] {
  const lista: Alerta[] = [];
  for (const u of reservasVencidas(d, hoje)) lista.push({ nivel: 'alto', texto: `Reserva da unidade ${u.id} venceu em ${u.reservaAte?.split('-').reverse().join('/')}.`, unidadeId: u.id });
  for (const u of Object.values(d.unidades)) {
    if (u.status === 'reservado' && u.reservaAte && diffDias(hoje, u.reservaAte) >= 0 && diffDias(hoje, u.reservaAte) <= 1) lista.push({ nivel: 'medio', texto: `Reserva da unidade ${u.id} vence ${diffDias(hoje, u.reservaAte) === 0 ? 'hoje' : 'amanhã'}.`, unidadeId: u.id });
  }
  for (const l of d.leads) {
    const urg = urgenciaLead(l, hoje);
    if (urg === 'atrasado') lista.push({ nivel: 'alto', texto: `Retorno atrasado: ${l.nome} (${etapaRotulo(l.etapa)}).`, leadId: l.id });
    else if (urg === 'hoje') lista.push({ nivel: 'medio', texto: `Retornar hoje: ${l.nome} (${etapaRotulo(l.etapa)}).`, leadId: l.id });
  }
  const semPreco = Object.values(d.unidades).filter((u) => u.preco == null && u.status !== 'vendido').length;
  if (semPreco) lista.push({ nivel: 'info', texto: `${semPreco} unidade(s) sem preço cadastrado.` });
  if (!d.config.ultimoBackup) lista.push({ nivel: 'medio', texto: 'Nenhum backup feito ainda. Use "Exportar backup (.json)".' });
  else if (diffDias(d.config.ultimoBackup, hoje) > d.config.diasAvisoBackup) lista.push({ nivel: 'medio', texto: `Último backup há ${diffDias(d.config.ultimoBackup, hoje)} dias.` });
  return lista;
}

export function buscarLeads(d: Dados, termo: string): Lead[] {
  const t = normalizar(termo);
  if (!t) return d.leads;
  const dig = termo.replace(/\D/g, '');
  return d.leads.filter((l) => normalizar(l.nome).includes(t) || normalizar(l.email).includes(t) || (dig.length >= 3 && l.telefone.replace(/\D/g, '').includes(dig)) || l.unidadesInteresse.includes(termo.trim()) || l.unidadeId === termo.trim());
}

export function statusContagem(d: Dados): Record<StatusUnidade, number> {
  const c: Record<StatusUnidade, number> = { disponivel: 0, negociacao: 0, reservado: 0, vendido: 0, bloqueado: 0 };
  for (const u of Object.values(d.unidades)) c[u.status]++;
  return c;
}

/** Preço exibido ao cliente: só para unidades disponíveis/em negociação e se o gerente permitir. */
export function precoParaCliente(d: Dados, id: string): number | null {
  const uc = d.unidades[id];
  if (!uc || !d.config.mostrarPrecoCliente) return null;
  if (uc.status === 'vendido' || uc.status === 'bloqueado') return null;
  return uc.preco;
}
