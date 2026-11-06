import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Empreendimento } from '../src/core/tipos.ts';
import { alertas, conferirPin, criarLead, dadosVazios, definirPin, excluirLead, moverLead, precoParaCliente, reservasVencidas, validarEmpreendimento, atualizarUnidade, buscarLeads, ambientesDaUnidade } from '../src/core/regras.ts';
import { exportarJSON, validarImportacao } from '../src/core/backup.ts';
import { gerarExemplo } from '../src/core/exemplo.ts';
import { posicaoSol, instanteLocal, facesExternas, resumoSolarUnidade, azimuteDoLado, horasDeSol } from '../src/core/sol.ts';
import { addDias, diffDias, esc, linkSeguro, sha256 } from '../src/core/util.ts';
import { montarRelatorio } from '../src/relatorios/dados.ts';

// Regras testadas sobre o PROJETO PADRÃO (genérico). Fatos de cada projeto específico ficam em tests/projetos.test.ts.
const emp: Empreendimento = JSON.parse(readFileSync(new URL('../projeto-padrao/empreendimento.json', import.meta.url), 'utf8'));
const HOJE = '2026-11-06';


test('datas: diffDias/addDias estáveis', () => {
  assert.equal(diffDias('2026-02-27', '2026-03-01'), 2);
  assert.equal(addDias('2026-12-31', 1), '2027-01-01');
  assert.equal(diffDias(HOJE, addDias(HOJE, 7)), 7);
});

test('sha256 confere com vetor conhecido', () => {
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('esc e linkSeguro', () => {
  assert.equal(esc('<b a="1">'), '&lt;b a=&quot;1&quot;&gt;');
  assert.equal(linkSeguro('javascript:alert(1)'), null);
  assert.ok(linkSeguro('https://drive.google.com/x'));
});



test('funil: proposta → reserva → venda muda a unidade; perda libera', () => {
  const d = dadosVazios(emp);
  d.unidades['202'].preco = 900000;
  const r = criarLead(d, { nome: 'Cliente Teste', telefone: '(37) 99999-0000', unidadesInteresse: ['202'] }, HOJE);
  assert.ok(r.ok && r.valor);
  const id = (r as any).valor.id;
  assert.equal(moverLead(d, id, 'proposta', {}, HOJE).ok, false, 'proposta exige unidade');
  assert.ok(moverLead(d, id, 'proposta', { unidadeId: '202', valor: 880000 }, HOJE).ok);
  assert.equal(d.unidades['202'].status, 'negociacao');
  assert.ok(moverLead(d, id, 'reserva', {}, HOJE).ok);
  assert.equal(d.unidades['202'].status, 'reservado');
  assert.equal(d.unidades['202'].reservaAte, addDias(HOJE, 7));
  // outro cliente não consegue reservar a mesma unidade
  const r2 = criarLead(d, { nome: 'Outro' }, HOJE);
  const m2 = moverLead(d, (r2 as any).valor.id, 'reserva', { unidadeId: '202' }, HOJE);
  assert.equal(m2.ok, false);
  assert.match((m2 as any).erro, /reservada para Cliente Teste/);
  // vencimento
  assert.equal(reservasVencidas(d, addDias(HOJE, 8)).length, 1);
  assert.ok(alertas(d, addDias(HOJE, 8)).some((a) => a.texto.includes('venceu')));
  // perda sem motivo é recusada; com motivo libera
  assert.equal(moverLead(d, id, 'perdido', {}, HOJE).ok, false);
  assert.ok(moverLead(d, id, 'perdido', { motivo: 'Desistiu' }, HOJE).ok);
  assert.equal(d.unidades['202'].status, 'disponivel');
  // venda
  assert.ok(moverLead(d, (r2 as any).valor.id, 'vendido', { unidadeId: '202', valor: 870000 }, HOJE).ok);
  assert.equal(d.unidades['202'].status, 'vendido');
  assert.equal(d.unidades['202'].vendaValor, 870000);
  assert.equal(excluirLead(d, (r2 as any).valor.id).ok, false, 'não exclui comprador');
});

test('cadastro recusa dados ruins com mensagem em português', () => {
  const d = dadosVazios(emp);
  assert.match((criarLead(d, { nome: 'A' }) as any).erro, /nome/);
  assert.match((criarLead(d, { nome: 'Ana', email: 'x@' }) as any).erro, /E-mail/);
  assert.match((criarLead(d, { nome: 'Ana', unidadesInteresse: ['999'] }) as any).erro, /não existe/);
  assert.match((atualizarUnidade(d, '101', { preco: -5 }) as any).erro, /Preço/);
  criarLead(d, { nome: 'Joana Prado', telefone: '37 98888-1234' });
  assert.equal(buscarLeads(d, 'joana').length, 1);
  assert.equal(buscarLeads(d, '8888').length, 1);
});

test('PIN: 4 a 8 números, com sal', () => {
  const d = dadosVazios(emp);
  assert.equal(definirPin(d, '12').ok, false);
  assert.ok(definirPin(d, '2468').ok);
  assert.ok(conferirPin(d, '2468'));
  assert.ok(!conferirPin(d, '1111'));
  assert.notEqual(d.config.pinHash, sha256('2468'));
});

test('preço para cliente respeita status e configuração', () => {
  const d = dadosVazios(emp);
  d.unidades['101'].preco = 1000000;
  assert.equal(precoParaCliente(d, '101'), 1000000);
  d.unidades['101'].status = 'vendido';
  assert.equal(precoParaCliente(d, '101'), null);
  d.unidades['102'].preco = 5; d.config.mostrarPrecoCliente = false;
  assert.equal(precoParaCliente(d, '102'), null);
});

test('backup: exportar → importar idêntico; arquivos ruins recusados', () => {
  const d = gerarExemplo(emp, HOJE);
  const txt = exportarJSON(d);
  const r = validarImportacao(txt, emp);
  assert.ok(r.ok);
  assert.deepEqual(r.valor!.unidades, d.unidades);
  assert.deepEqual(r.valor!.leads, d.leads);
  assert.equal(validarImportacao('{não é json', emp).ok, false);
  assert.match((validarImportacao('{"app":"outro"}', emp) as any).erro, /não é um backup/);
  const outro = JSON.parse(txt); outro.empreendimentoId = 'xyz';
  assert.match((validarImportacao(JSON.stringify(outro), emp) as any).erro, /xyz/);
  const futuro = JSON.parse(txt); futuro.versao = 99;
  assert.match((validarImportacao(JSON.stringify(futuro), emp) as any).erro, /mais nova/);
  const ruim = JSON.parse(txt); ruim.unidades['101'].status = 'talvez';
  assert.equal(validarImportacao(JSON.stringify(ruim), emp).ok, false);
  const extra = JSON.parse(txt); extra.campoNovo = 1; delete extra.unidades['902'];
  const r3 = validarImportacao(JSON.stringify(extra), emp);
  assert.ok(r3.ok && r3.valor!.unidades['902'], 'tolera campo extra e completa unidade faltante');
  assert.ok(txt.length < 400_000);
});

test('exemplo + relatório: números batem', () => {
  const d = gerarExemplo(emp, HOJE);
  const rel = montarRelatorio(emp, d);
  assert.equal(rel.totais.unidades, 24);
  const somaStatus = rel.porStatus.reduce((s, x) => s + x.qtd, 0);
  assert.equal(somaStatus, 24);
  assert.ok(rel.vendas.length >= 5);
  assert.equal(rel.vendas.reduce((s, v) => s + (v.vendaValor ?? 0), 0), rel.totais.vgvVendido);
  assert.equal(rel.funil.reduce((s, f) => s + f.qtd, 0), d.leads.length);
  assert.equal(rel.espelho.length, 9);
  assert.ok(d.leads.every((l) => l.historico.length > 0));
});
