// Agrega os números do relatório de vendas (função pura; PDF, Word e Excel usam a mesma fonte).
import type { Dados, Empreendimento, StatusUnidade } from '../core/tipos.ts';
import { ETAPAS, STATUS_INFO } from '../core/tipos.ts';
import { etapaRotulo, statusContagem, tipologia } from '../core/regras.ts';
import { dataBR } from '../core/util.ts';

export interface LinhaUnidade {
  id: string; nome: string; pavimento: number; tipologia: string; area: number; areaDescoberta: number; vagas: number | null;
  status: StatusUnidade; statusRotulo: string; preco: number | null; precoM2: number | null; cliente: string; corretor: string;
  vendaData: string; vendaValor: number | null; reservaAte: string;
}

export interface Relatorio {
  titulo: string; empreendimento: string; incorporadora: string; endereco: string; geradoEm: string; exemplo: boolean;
  totais: { unidades: number; areaTotal: number; vgvTabela: number; vgvVendido: number; vgvDisponivel: number; percUnidadesVendidas: number; percVgvVendido: number; ticketMedio: number; precoM2Medio: number; unidadesSemPreco: number };
  porStatus: { status: StatusUnidade; rotulo: string; qtd: number; perc: number; valor: number }[];
  porTipologia: { tipologia: string; nome: string; qtd: number; vendidas: number; disponiveis: number; area: number; valorVendido: number }[];
  espelho: { pavimento: number; unidades: { id: string; status: StatusUnidade }[] }[];
  unidades: LinhaUnidade[];
  vendas: LinhaUnidade[];
  funil: { etapa: string; qtd: number }[];
  origens: { origem: string; qtd: number; vendas: number }[];
  corretores: { corretor: string; vendas: number; valor: number; ativos: number }[];
  perdas: { cliente: string; motivo: string }[];
}

export function montarRelatorio(emp: Empreendimento, d: Dados, agora = new Date()): Relatorio {
  const nomeLead = (id: string | null) => (id ? d.leads.find((l) => l.id === id)?.nome ?? '' : '');
  const unidades: LinhaUnidade[] = emp.unidades.map((u) => {
    const c = d.unidades[u.id];
    const t = tipologia(emp, u.tipologia);
    return {
      id: u.id, nome: u.nome ?? `Apto ${u.id}`, pavimento: u.pavimento, tipologia: t.nome, area: u.areaPrivativa, areaDescoberta: u.areaDescoberta,
      vagas: c.vagas ?? u.vagas, status: c.status, statusRotulo: STATUS_INFO[c.status].rotulo, preco: c.preco,
      precoM2: c.preco ? Math.round(c.preco / u.areaPrivativa) : null, cliente: nomeLead(c.leadId), corretor: c.corretor,
      vendaData: c.vendaData ? dataBR(c.vendaData) : '', vendaValor: c.status === 'vendido' ? c.vendaValor ?? c.preco : null,
      reservaAte: c.reservaAte ? dataBR(c.reservaAte) : '',
    };
  });
  const cont = statusContagem(d);
  const total = unidades.length;
  const valorDe = (l: LinhaUnidade) => (l.status === 'vendido' ? l.vendaValor ?? 0 : l.preco ?? 0);
  const vgvTabela = unidades.reduce((s, l) => s + (l.preco ?? 0), 0);
  const vendidas = unidades.filter((l) => l.status === 'vendido');
  const vgvVendido = vendidas.reduce((s, l) => s + (l.vendaValor ?? 0), 0);
  const vgvDisponivel = unidades.filter((l) => l.status === 'disponivel' || l.status === 'negociacao').reduce((s, l) => s + (l.preco ?? 0), 0);
  const areaVendida = vendidas.reduce((s, l) => s + l.area, 0);

  const porTip = new Map<string, Relatorio['porTipologia'][number]>();
  for (const u of emp.unidades) {
    const l = unidades.find((x) => x.id === u.id)!;
    const k = u.tipologia;
    const r = porTip.get(k) ?? { tipologia: k, nome: l.tipologia, qtd: 0, vendidas: 0, disponiveis: 0, area: u.areaPrivativa, valorVendido: 0 };
    r.qtd++;
    if (l.status === 'vendido') { r.vendidas++; r.valorVendido += l.vendaValor ?? 0; }
    if (l.status === 'disponivel') r.disponiveis++;
    porTip.set(k, r);
  }

  const pavs = [...new Set(emp.unidades.map((u) => u.pavimento))].sort((a, b) => b - a);
  const espelho = pavs.map((p) => ({ pavimento: p, unidades: emp.unidades.filter((u) => u.pavimento === p).map((u) => ({ id: u.id, status: d.unidades[u.id].status })) }));

  const origens = new Map<string, { origem: string; qtd: number; vendas: number }>();
  const corretores = new Map<string, { corretor: string; vendas: number; valor: number; ativos: number }>();
  for (const l of d.leads) {
    const o = origens.get(l.origem || 'Não informado') ?? { origem: l.origem || 'Não informado', qtd: 0, vendas: 0 };
    o.qtd++;
    if (l.etapa === 'vendido' || l.etapa === 'contrato') o.vendas++;
    origens.set(o.origem, o);
    const nomeC = l.corretor || 'Sem corretor';
    const c = corretores.get(nomeC) ?? { corretor: nomeC, vendas: 0, valor: 0, ativos: 0 };
    if (l.etapa === 'vendido' || l.etapa === 'contrato') {
      c.vendas++;
      c.valor += (l.unidadeId && d.unidades[l.unidadeId]?.vendaValor) || l.valorProposta || 0;
    } else if (l.etapa !== 'perdido') c.ativos++;
    corretores.set(nomeC, c);
  }

  const e = emp.endereco;
  return {
    titulo: 'Relatório de vendas',
    empreendimento: `${emp.nome} ${emp.subtitulo}`,
    incorporadora: emp.incorporadora.nome,
    endereco: `${e.logradouro} – ${e.bairro}, ${e.cidade}/${e.uf}`,
    geradoEm: agora.toLocaleString('pt-BR'),
    exemplo: d.exemplo,
    totais: {
      unidades: total,
      areaTotal: unidades.reduce((s, l) => s + l.area, 0),
      vgvTabela, vgvVendido, vgvDisponivel,
      percUnidadesVendidas: total ? cont.vendido / total : 0,
      percVgvVendido: vgvTabela ? vgvVendido / Math.max(vgvTabela, 1) : 0,
      ticketMedio: vendidas.length ? vgvVendido / vendidas.length : 0,
      precoM2Medio: areaVendida ? vgvVendido / areaVendida : 0,
      unidadesSemPreco: unidades.filter((l) => l.preco == null).length,
    },
    porStatus: (Object.keys(STATUS_INFO) as StatusUnidade[]).map((s) => ({ status: s, rotulo: STATUS_INFO[s].rotulo, qtd: cont[s], perc: total ? cont[s] / total : 0, valor: unidades.filter((l) => l.status === s).reduce((acc, l) => acc + valorDe(l), 0) })),
    porTipologia: [...porTip.values()],
    espelho,
    unidades,
    vendas: vendidas.sort((a, b) => a.id.localeCompare(b.id)),
    funil: ETAPAS.map((et) => ({ etapa: etapaRotulo(et.id), qtd: d.leads.filter((l) => l.etapa === et.id).length })),
    origens: [...origens.values()].sort((a, b) => b.qtd - a.qtd),
    corretores: [...corretores.values()].sort((a, b) => b.valor - a.valor),
    perdas: d.leads.filter((l) => l.etapa === 'perdido').map((l) => ({ cliente: l.nome, motivo: l.motivoPerda || '—' })),
  };
}
