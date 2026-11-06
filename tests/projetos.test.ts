// Validação de TODOS os projetos (padrão + específicos) e fatos conferidos de cada projeto específico.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import type { Empreendimento } from '../src/core/tipos.ts';
import { ambientesDaUnidade, validarEmpreendimento } from '../src/core/regras.ts';
import { azimuteDoLado, facesExternas, horasDeSol, instanteLocal, posicaoSol, resumoSolarUnidade } from '../src/core/sol.ts';

const ler = (rel: string): Empreendimento => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'));
const especificos = readdirSync(new URL('../projetos-especificos/', import.meta.url)).filter((d) => existsSync(new URL(`../projetos-especificos/${d}/empreendimento.json`, import.meta.url)));
const projetos: [string, Empreendimento][] = [['padrao', ler('../projeto-padrao/empreendimento.json')], ...especificos.map((d) => [d, ler(`../projetos-especificos/${d}/empreendimento.json`)] as [string, Empreendimento])];

for (const [nome, emp] of projetos) {
  test(`projeto ${nome}: empreendimento.json válido e tour para todas as unidades`, () => {
    assert.deepEqual(validarEmpreendimento(emp), []);
    for (const u of emp.unidades) assert.ok(ambientesDaUnidade(emp, u).length >= 5, `tour da ${u.id}`);
  });
}

test('projeto padrão é genérico: sem incorporadora, logo, imagens ou endereço real', () => {
  const p = ler('../projeto-padrao/empreendimento.json');
  assert.equal(p.incorporadora.logo, null);
  assert.equal(p.imagensGerais.length, 0);
  assert.ok(Object.values(p.tipologias).every((t) => t.imagens.length === 0));
  assert.equal(p.projetoEspecifico, undefined);
  const texto = JSON.stringify(p).toLowerCase();
  for (const proibido of especificos.flatMap((d) => { const e = ler(`../projetos-especificos/${d}/empreendimento.json`); return [e.nome, e.incorporadora.nome, e.endereco.cidade, e.endereco.logradouro.replace(/,.*$/, '')]; })) {
    assert.ok(!texto.includes(proibido.toLowerCase()), `projeto padrão contém "${proibido}"`);
  }
});

// ---------- Projeto específico 1: Missouri Residencial (Divinópolis/MG) ----------
const mo = ler('../projetos-especificos/01-missouri/empreendimento.json');

test('Missouri: 24 unidades com áreas do folder', () => {
  assert.equal(mo.projetoEspecifico?.numero, 1);
  assert.equal(mo.unidades.length, 24);
  const area = (id: string) => mo.unidades.find((u) => u.id === id)!.areaPrivativa;
  assert.equal(area('101'), 114); assert.equal(area('203'), 102); assert.equal(area('103'), 104); assert.equal(area('802'), 108);
});

test('Missouri: sol em Divinópolis — verão quase a pino, inverno mais baixo e ao norte', () => {
  const g = mo.geo;
  let maxV = -90, maxI = -90, azI = 0;
  for (let h = 10; h <= 14; h += 0.05) {
    const v = posicaoSol(instanteLocal('2026-12-21', h, g.fusoHoras), g.lat, g.lon);
    const i = posicaoSol(instanteLocal('2026-06-21', h, g.fusoHoras), g.lat, g.lon);
    maxV = Math.max(maxV, v.elevacao);
    if (i.elevacao > maxI) { maxI = i.elevacao; azI = i.azimute; }
  }
  assert.ok(maxV > 85 && maxV < 90, `verão ${maxV}`);
  assert.ok(Math.abs(maxI - (90 - 20.15 - 23.44)) < 1, `inverno ${maxI}`);
  assert.ok(azI < 10 || azI > 350, `azimute inverno ${azI}`);
  const nascer = posicaoSol(instanteLocal('2026-03-20', 6.2, g.fusoHoras), g.lat, g.lon);
  assert.ok(nascer.azimute > 80 && nascer.azimute < 100, 'nasce a leste no equinócio');
});

test('Missouri: unidade 102 (esquina) olha para Rua Ceará (NNE) e Rua Bahia (ONO)', () => {
  const u = mo.unidades.find((x) => x.id === '102')!;
  const lados = new Set(facesExternas(mo, u).map((f) => f.lado));
  assert.ok(lados.has('x0') && lados.has('z1'));
  assert.equal(azimuteDoLado('x0', mo.geo.azimuteTopoPlanta), 20);
  assert.ok(resumoSolarUnidade(mo, u).orientacoes.length >= 2);
  assert.ok(horasDeSol('2026-06-21', 0, mo.geo.lat, mo.geo.lon, -3) > horasDeSol('2026-12-21', 0, mo.geo.lat, mo.geo.lon, -3));
  assert.deepEqual(mo.entorno?.ruasAdicionais?.map((r) => r.nome), ['Rua Alagoas', 'Rua Mato Grosso']);
});
