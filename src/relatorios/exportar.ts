// Gera o relatório de vendas em PDF, Word (.docx) e Excel (.xlsx), tudo no navegador (sem servidor).
import type { Relatorio } from './dados.ts';
import { brl, m2, pct, num } from '../core/util.ts';
import { STATUS_INFO } from '../core/tipos.ts';

export function baixar(blob: Blob, nome: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

function hexRgb(h: string): [number, number, number] {
  const v = parseInt(h.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

const kpis = (r: Relatorio): [string, string][] => [
  ['Unidades', String(r.totais.unidades)],
  ['Vendidas', `${r.porStatus.find((s) => s.status === 'vendido')!.qtd} (${pct(r.totais.percUnidadesVendidas)})`],
  ['VGV (tabela)', brl(r.totais.vgvTabela)],
  ['VGV vendido', brl(r.totais.vgvVendido)],
  ['Estoque à venda', brl(r.totais.vgvDisponivel)],
  ['Ticket médio', brl(r.totais.ticketMedio)],
  ['R$/m² médio vendido', brl(r.totais.precoM2Medio)],
  ['Área privativa total', m2(r.totais.areaTotal)],
];

// ---------------- PDF ----------------
const semSobrescrito = (x: unknown): any => (typeof x === 'string' ? x.replace(/²/g, '2') : Array.isArray(x) ? x.map(semSobrescrito) : x);

export async function gerarPDF(r0: Relatorio, cor: string, logo: string | null, imagem3d: string | null): Promise<Blob> {
  const r: Relatorio = JSON.parse(JSON.stringify(r0), (_k, v) => semSobrescrito(v));
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const at = (d: any, o: any) => autoTable(d, { ...o, head: semSobrescrito(o.head), body: semSobrescrito(o.body) });
  const [cr, cg, cb] = hexRgb(cor);
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(cr, cg, cb); doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255); doc.setFontSize(18); doc.text(`${r.titulo} — ${r.empreendimento}`, 14, 13);
  doc.setFontSize(9); doc.text(`${r.incorporadora} · ${r.endereco}`, 14, 20); doc.text(`Gerado em ${r.geradoEm}`, 14, 25);
  if (logo) try { doc.setFillColor(255, 255, 255); doc.roundedRect(W - 32, 2.5, 26, 23, 2, 2, 'F'); doc.addImage(logo, 'PNG', W - 30, 4, 22, 20); } catch { /* sem logo */ }
  doc.setTextColor(30);
  let y = 36;
  if (r.exemplo) { doc.setTextColor(180, 80, 0); doc.setFontSize(9); doc.text('ATENÇÃO: relatório com DADOS DE EXEMPLO (demonstração).', 14, y); doc.setTextColor(30); y += 6; }
  if (imagem3d) { try { doc.addImage(imagem3d, 'JPEG', 14, y, W - 28, (W - 28) * 0.42); y += (W - 28) * 0.42 + 4; } catch { /* ignora */ } }
  const k = kpis(r);
  const colW = (W - 28) / 4;
  doc.setFontSize(8);
  k.forEach(([t, v], i) => {
    const x = 14 + (i % 4) * colW, yy = y + Math.floor(i / 4) * 16;
    doc.setDrawColor(220); doc.roundedRect(x, yy, colW - 3, 13, 2, 2);
    doc.setTextColor(110); doc.text(semSobrescrito(t), x + 3, yy + 5);
    doc.setTextColor(20); doc.setFontSize(11); doc.text(semSobrescrito(v), x + 3, yy + 10.5); doc.setFontSize(8);
  });
  y += 36;
  const cab = { fillColor: [cr, cg, cb] as [number, number, number], textColor: 255, fontStyle: 'bold' as const };
  at(doc, { startY: y, head: [['Situação', 'Unidades', '%', 'Valor']], body: r.porStatus.map((s) => [s.rotulo, s.qtd, pct(s.perc), brl(s.valor)]), headStyles: cab, styles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
  at(doc, { head: [['Tipologia', 'Área', 'Unid.', 'Vendidas', 'Disponíveis', 'Valor vendido']], body: r.porTipologia.map((t) => [t.nome, m2(t.area), t.qtd, t.vendidas, t.disponiveis, brl(t.valorVendido)]), headStyles: cab, styles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
  // espelho de vendas
  doc.addPage();
  doc.setFontSize(13); doc.text('Espelho de vendas', 14, 16);
  let ey = 22;
  const larg = 26;
  for (const linha of r.espelho) {
    doc.setFontSize(8); doc.setTextColor(90); doc.text(`${linha.pavimento}º`, 14, ey + 6);
    linha.unidades.forEach((u, i) => {
      const [sr, sg, sb] = hexRgb(STATUS_INFO[u.status].cor);
      doc.setFillColor(sr, sg, sb); doc.roundedRect(24 + i * (larg + 2), ey, larg, 9, 1.5, 1.5, 'F');
      doc.setTextColor(255); doc.text(`${u.id} · ${STATUS_INFO[u.status].rotulo}`, 25.5 + i * (larg + 2), ey + 5.8);
    });
    ey += 11;
  }
  doc.setTextColor(30);
  at(doc, {
    startY: ey + 4,
    head: [['Unid.', 'Pav.', 'Tipologia', 'Área', 'Situação', 'Preço tabela', 'R$/m²', 'Cliente', 'Data venda', 'Valor venda']],
    body: r.unidades.map((u) => [u.id, u.pavimento, u.tipologia, m2(u.area), u.statusRotulo, brl(u.preco), u.precoM2 ? brl(u.precoM2) : '—', u.cliente, u.vendaData, u.vendaValor != null ? brl(u.vendaValor) : '']),
    headStyles: cab, styles: { fontSize: 7 }, margin: { left: 14, right: 14 },
  });
  doc.addPage();
  doc.setFontSize(13); doc.text('Clientes e funil de vendas', 14, 16);
  at(doc, { startY: 22, head: [['Etapa do funil', 'Clientes']], body: r.funil.map((f) => [f.etapa, f.qtd]), headStyles: cab, styles: { fontSize: 8 }, margin: { left: 14, right: W / 2 + 4 } });
  at(doc, { startY: 22, head: [['Origem', 'Clientes', 'Vendas']], body: r.origens.map((o) => [o.origem, o.qtd, o.vendas]), headStyles: cab, styles: { fontSize: 8 }, margin: { left: W / 2 + 2, right: 14 } });
  at(doc, { head: [['Corretor', 'Vendas', 'Valor vendido', 'Negociações ativas']], body: r.corretores.map((c) => [c.corretor, c.vendas, brl(c.valor), c.ativos]), headStyles: cab, styles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
  if (r.perdas.length) at(doc, { head: [['Cliente perdido', 'Motivo']], body: r.perdas.map((p) => [p.cliente, p.motivo]), headStyles: cab, styles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) { doc.setPage(p); doc.setFontSize(7); doc.setTextColor(140); doc.text(`${r.empreendimento} · página ${p} de ${n}`, 14, 290); }
  return doc.output('blob');
}

// ---------------- Word ----------------
export async function gerarDOCX(r: Relatorio, cor: string, imagem3d: string | null): Promise<Blob> {
  const d = await import('docx');
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType, ImageRun } = d;
  const c = cor.replace('#', '');
  const cel = (t: string | number, cab = false, fundo?: string) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(t), bold: cab, color: cab || fundo ? 'FFFFFF' : undefined, size: 18 })] })],
    shading: cab ? { type: ShadingType.CLEAR, fill: c, color: 'auto' } : fundo ? { type: ShadingType.CLEAR, fill: fundo.replace('#', ''), color: 'auto' } : undefined,
  });
  const tabela = (cab: string[], linhas: (string | number)[][]) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ tableHeader: true, children: cab.map((h) => cel(h, true)) }), ...linhas.map((l) => new TableRow({ children: l.map((v) => cel(v)) }))],
  });
  const filhos: any[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: `${r.titulo} — ${r.empreendimento}`, color: c })] }),
    new Paragraph({ children: [new TextRun({ text: `${r.incorporadora} · ${r.endereco}`, size: 20 })] }),
    new Paragraph({ children: [new TextRun({ text: `Gerado em ${r.geradoEm}`, size: 18, color: '777777' })] }),
  ];
  if (r.exemplo) filhos.push(new Paragraph({ children: [new TextRun({ text: 'ATENÇÃO: relatório com DADOS DE EXEMPLO (demonstração).', bold: true, color: 'B45000' })] }));
  if (imagem3d) {
    try {
      const bin = Uint8Array.from(atob(imagem3d.split(',')[1]), (ch) => ch.charCodeAt(0));
      filhos.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'jpg', data: bin, transformation: { width: 600, height: 300 } })] }));
    } catch { /* ignora */ }
  }
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Resumo')] }));
  filhos.push(tabela(['Indicador', 'Valor'], kpis(r)));
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Situação das unidades')] }));
  filhos.push(tabela(['Situação', 'Unidades', '%', 'Valor'], r.porStatus.map((s) => [s.rotulo, s.qtd, pct(s.perc), brl(s.valor)])));
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Por tipologia')] }));
  filhos.push(tabela(['Tipologia', 'Área', 'Unid.', 'Vendidas', 'Disponíveis', 'Valor vendido'], r.porTipologia.map((t) => [t.nome, m2(t.area), t.qtd, t.vendidas, t.disponiveis, brl(t.valorVendido)])));
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Espelho de vendas')] }));
  filhos.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: r.espelho.map((l) => new TableRow({ children: [cel(`${l.pavimento}º`, true), ...l.unidades.map((u) => cel(`${u.id} · ${STATUS_INFO[u.status].rotulo}`, false, STATUS_INFO[u.status].cor)), ...Array(Math.max(0, 3 - l.unidades.length)).fill(0).map(() => cel(''))] })),
  }));
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Vendas realizadas')] }));
  filhos.push(r.vendas.length ? tabela(['Unid.', 'Tipologia', 'Área', 'Cliente', 'Corretor', 'Data', 'Valor'], r.vendas.map((v) => [v.id, v.tipologia, m2(v.area), v.cliente, v.corretor, v.vendaData, brl(v.vendaValor)])) : new Paragraph('Nenhuma venda registrada.'));
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Funil de clientes')] }));
  filhos.push(tabela(['Etapa', 'Clientes'], r.funil.map((f) => [f.etapa, f.qtd])));
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Origem dos clientes')] }));
  filhos.push(tabela(['Origem', 'Clientes', 'Vendas'], r.origens.map((o) => [o.origem, o.qtd, o.vendas])));
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Corretores')] }));
  filhos.push(tabela(['Corretor', 'Vendas', 'Valor vendido', 'Ativos'], r.corretores.map((x) => [x.corretor, x.vendas, brl(x.valor), x.ativos])));
  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Todas as unidades')] }));
  filhos.push(tabela(['Unid.', 'Pav.', 'Tipologia', 'Área', 'Situação', 'Preço', 'R$/m²'], r.unidades.map((u) => [u.id, u.pavimento, u.tipologia, m2(u.area), u.statusRotulo, brl(u.preco), u.precoM2 ? brl(u.precoM2) : '—'])));
  const doc = new Document({ creator: r.incorporadora, title: `${r.titulo} ${r.empreendimento}`, sections: [{ children: filhos }] });
  return Packer.toBlob(doc);
}

// ---------------- Excel ----------------
export async function gerarXLSX(r: Relatorio, cor: string): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = r.incorporadora;
  const argb = 'FF' + cor.replace('#', '').toUpperCase();
  const cabecalho = (ws: any, linha: number) => {
    ws.getRow(linha).eachCell((c: any) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }; });
  };
  const moeda = '"R$" #,##0';
  // Resumo
  const res = wb.addWorksheet('Resumo');
  res.addRow([`${r.titulo} — ${r.empreendimento}`]).font = { bold: true, size: 14 };
  res.addRow([`${r.incorporadora} · ${r.endereco}`]);
  res.addRow([`Gerado em ${r.geradoEm}${r.exemplo ? ' — DADOS DE EXEMPLO' : ''}`]);
  res.addRow([]);
  res.addRow(['Indicador', 'Valor']); cabecalho(res, 5);
  const t = r.totais;
  const linhasKpi: [string, number, string?][] = [
    ['Unidades', t.unidades], ['% unidades vendidas', t.percUnidadesVendidas, '0.0%'], ['VGV tabela', t.vgvTabela, moeda], ['VGV vendido', t.vgvVendido, moeda],
    ['Estoque à venda', t.vgvDisponivel, moeda], ['Ticket médio', t.ticketMedio, moeda], ['R$/m² médio vendido', t.precoM2Medio, moeda], ['Área privativa total (m²)', t.areaTotal],
  ];
  for (const [k, v, f] of linhasKpi) { const row = res.addRow([k, v]); if (f) row.getCell(2).numFmt = f; }
  res.addRow([]);
  const ini = res.rowCount + 1;
  res.addRow(['Situação', 'Unidades', '%', 'Valor']); cabecalho(res, ini);
  for (const s of r.porStatus) { const row = res.addRow([s.rotulo, s.qtd, s.perc, s.valor]); row.getCell(3).numFmt = '0.0%'; row.getCell(4).numFmt = moeda; }
  res.columns = [{ width: 32 }, { width: 18 }, { width: 10 }, { width: 18 }];
  // Unidades (com fórmulas de R$/m²)
  const un = wb.addWorksheet('Unidades');
  un.addRow(['Unidade', 'Pavimento', 'Tipologia', 'Área privativa (m²)', 'Área descoberta (m²)', 'Vagas', 'Situação', 'Preço tabela', 'R$/m²', 'Cliente', 'Corretor', 'Reserva até', 'Data venda', 'Valor venda']);
  cabecalho(un, 1);
  r.unidades.forEach((u, i) => {
    const n = i + 2;
    const row = un.addRow([u.id, u.pavimento, u.tipologia, u.area, u.areaDescoberta, u.vagas, u.statusRotulo, u.preco, u.preco ? { formula: `H${n}/D${n}` } : null, u.cliente, u.corretor, u.reservaAte, u.vendaData, u.vendaValor]);
    row.getCell(8).numFmt = moeda; row.getCell(9).numFmt = moeda; row.getCell(14).numFmt = moeda;
    const c = row.getCell(7); c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + STATUS_INFO[u.status].cor.slice(1).toUpperCase() } }; c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });
  const tot = un.addRow(['TOTAL', '', '', { formula: `SUM(D2:D${r.unidades.length + 1})` }, { formula: `SUM(E2:E${r.unidades.length + 1})` }, '', '', { formula: `SUM(H2:H${r.unidades.length + 1})` }, '', '', '', '', '', { formula: `SUM(N2:N${r.unidades.length + 1})` }]);
  tot.font = { bold: true }; tot.getCell(8).numFmt = moeda; tot.getCell(14).numFmt = moeda;
  un.columns.forEach((c: any, i: number) => { c.width = [10, 10, 22, 16, 18, 8, 16, 16, 12, 26, 20, 12, 12, 16][i]; });
  un.autoFilter = { from: 'A1', to: 'N1' };
  un.views = [{ state: 'frozen', ySplit: 1 }];
  // Espelho
  const es = wb.addWorksheet('Espelho de vendas');
  es.addRow(['Pavimento', 'Unidades']); cabecalho(es, 1);
  for (const l of r.espelho) {
    const row = es.addRow([`${l.pavimento}º`, ...l.unidades.map((u) => `${u.id} · ${STATUS_INFO[u.status].rotulo}`)]);
    l.unidades.forEach((u, i) => { const c = row.getCell(i + 2); c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + STATUS_INFO[u.status].cor.slice(1).toUpperCase() } }; c.font = { color: { argb: 'FFFFFFFF' }, bold: true }; });
  }
  es.columns = [{ width: 12 }, { width: 24 }, { width: 24 }, { width: 24 }];
  // Vendas
  const ve = wb.addWorksheet('Vendas');
  ve.addRow(['Unidade', 'Tipologia', 'Área (m²)', 'Cliente', 'Corretor', 'Data', 'Valor']); cabecalho(ve, 1);
  for (const v of r.vendas) { const row = ve.addRow([v.id, v.tipologia, v.area, v.cliente, v.corretor, v.vendaData, v.vendaValor]); row.getCell(7).numFmt = moeda; }
  ve.columns = [{ width: 10 }, { width: 22 }, { width: 10 }, { width: 28 }, { width: 22 }, { width: 12 }, { width: 16 }];
  // Funil
  const fu = wb.addWorksheet('Funil e corretores');
  fu.addRow(['Etapa', 'Clientes']); cabecalho(fu, 1);
  for (const f of r.funil) fu.addRow([f.etapa, f.qtd]);
  fu.addRow([]);
  const i2 = fu.rowCount + 1;
  fu.addRow(['Origem', 'Clientes', 'Vendas']); cabecalho(fu, i2);
  for (const o of r.origens) fu.addRow([o.origem, o.qtd, o.vendas]);
  fu.addRow([]);
  const i3 = fu.rowCount + 1;
  fu.addRow(['Corretor', 'Vendas', 'Valor vendido', 'Ativos']); cabecalho(fu, i3);
  for (const c of r.corretores) { const row = fu.addRow([c.corretor, c.vendas, c.valor, c.ativos]); row.getCell(3).numFmt = moeda; }
  fu.columns = [{ width: 28 }, { width: 12 }, { width: 18 }, { width: 12 }];
  const buf = await wb.xlsx.writeBuffer();
  void num;
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
