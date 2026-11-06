// Dados de EXEMPLO (determinísticos) para demonstração. Ficam marcados com exemplo=true
// e o modo gerente mostra um aviso com o botão "Começar do zero".
import type { Dados, Empreendimento, EtapaLead } from './tipos.ts';
import { criarLead, dadosVazios, moverLead, registrarInteracao } from './regras.ts';
import { addDias, rng } from './util.ts';

export const PRECO_M2_EXEMPLO = 7600;

export function precoExemplo(area: number, descoberta: number, pavimento: number, cobertura: boolean): number {
  const fatorAndar = 1 + 0.012 * Math.max(0, pavimento - 3);
  const v = area * PRECO_M2_EXEMPLO * fatorAndar * (cobertura ? 1.08 : 1) + descoberta * 1500;
  return Math.round(v / 1000) * 1000;
}

export function gerarExemplo(emp: Empreendimento, hoje: string): Dados {
  const d = dadosVazios(emp);
  d.exemplo = true;
  d.config.corretores = ['Ana Paula Ribeiro', 'Marcos Vinícius', 'Juliana Rocha'];
  for (const u of emp.unidades) {
    const uc = d.unidades[u.id];
    uc.preco = precoExemplo(u.areaPrivativa, u.areaDescoberta, u.pavimento, u.tipologia.startsWith('C'));
    uc.condicoes = 'Entrada de 20% + parcelas mensais até as chaves + financiamento bancário (exemplo).';
  }
  if (d.unidades['103']) { d.unidades['103'].status = 'bloqueado'; d.unidades['103'].obs = 'Permuta com o proprietário do terreno (exemplo).'; }

  const r = rng(361);
  const pessoas: [string, string, string, EtapaLead, string | null, number][] = [
    ['Carlos Henrique Souza', '(37) 99812-4410', 'Plantão de vendas', 'vendido', '201', -40],
    ['Fernanda Lima Duarte', '(37) 98822-1043', 'Indicação', 'vendido', '302', -33],
    ['Roberto Almeida', '(37) 99104-7721', 'Instagram', 'vendido', '403', -27],
    ['Patrícia e Gustavo Melo', '(37) 99931-0287', 'Imobiliária parceira', 'contrato', '502', -20],
    ['Dr. Luiz Fernando Castro', '(37) 98455-6630', 'Indicação', 'vendido', '901', -15],
    ['Mariana Teixeira', '(37) 99707-3318', 'Site', 'vendido', '603', -12],
    ['João Pedro Martins', '(37) 99601-2290', 'Placa / fachada', 'reserva', '602', -6],
    ['Camila Rezende', '(37) 98871-5524', 'Facebook', 'reserva', '702', -4],
    ['Eduardo Nogueira', '(37) 99244-9013', 'Instagram', 'proposta', '303', -5],
    ['Helena Barbosa', '(37) 98116-4407', 'Plantão de vendas', 'proposta', '801', -3],
    ['Ricardo Fonseca', '(37) 99358-6612', 'Indicação', 'visita', null, -2],
    ['Aline Cardoso', '(37) 99963-1175', 'Instagram', 'contato', null, -2],
    ['Thiago Moreira', '(37) 98540-2096', 'Site', 'novo', null, -1],
    ['Beatriz Andrade', '(37) 99172-8834', 'Facebook', 'perdido', null, -18],
  ];
  const disponiveis = emp.unidades.map((u) => u.id);
  pessoas.forEach(([nome, tel, origem, etapa, unid, dias], i) => {
    const corretor = d.config.corretores[i % 3];
    const dia = addDias(hoje, dias);
    const interesse = unid ? [unid] : [disponiveis[Math.floor(r() * disponiveis.length)], disponiveis[Math.floor(r() * disponiveis.length)]];
    const res = criarLead(d, { nome, telefone: tel, email: nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@exemplo.com', origem, corretor, unidadesInteresse: interesse, proximaAcao: addDias(hoje, i % 4 === 0 ? -1 : i % 3) }, dia);
    if (!res.ok || !res.valor) return;
    const l = res.valor;
    l.criadoEm = dia + 'T10:00:00.000Z';
    registrarInteracao(d, l.id, 'ligacao', 'Primeiro contato: interesse em 3 quartos, quer conhecer o decorado.', dia);
    const caminho: EtapaLead[] = ['contato', 'visita', 'proposta', 'reserva', 'contrato', 'vendido'];
    if (etapa === 'perdido') {
      moverLead(d, l.id, 'contato', {}, dia);
      moverLead(d, l.id, 'perdido', { motivo: 'Optou por imóvel pronto em outro bairro.' }, addDias(dia, 3));
      return;
    }
    const alvo = caminho.indexOf(etapa as EtapaLead);
    for (let k = 0; k <= alvo; k++) {
      const e = caminho[k];
      const quando = addDias(dia, Math.min(k * 2, -dias));
      const uc = unid ? d.unidades[unid] : undefined;
      const valor = uc?.preco ? Math.round((uc.preco * (0.96 + r() * 0.04)) / 1000) * 1000 : null;
      moverLead(d, l.id, e, e === 'contato' || e === 'visita' ? {} : { unidadeId: unid, valor }, quando);
    }
  });
  d.config.ultimoBackup = addDias(hoje, -3);
  return d;
}
