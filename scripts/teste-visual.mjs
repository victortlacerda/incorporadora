// Teste de tela (navegador sem janela, WebGL por software). Uso: node scripts/teste-visual.mjs [saida] [cenario]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const saida = process.argv[2] || 'tmp-telas';
const cenario = process.argv[3] || 'basico';
mkdirSync(saida, { recursive: true });
const arquivo = 'file://' + resolve('dist/missouri-apresentacao-3d.html');
const navegador = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const celular = cenario === 'celular';
const ctx = await navegador.newContext(celular ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1, acceptDownloads: true });
const pg = await ctx.newPage();
const erros = [];
pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(`[${m.type()}] ${m.text()}`); });
pg.on('pageerror', (e) => erros.push('[pageerror] ' + e.message));
const t0 = Date.now();
const log = (s) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${s}`);
const foto = async (n) => { await pg.screenshot({ path: `${saida}/${n}.png` }); log('foto ' + n); };
await pg.goto(arquivo);
await pg.waitForSelector('[data-act="iniciar"]:not([disabled])', { timeout: 180000 });
log('3D pronto');
await foto('00-abertura');
await pg.click('[data-act="iniciar"]');
await pg.waitForTimeout(4000);
await foto('01-geral');
const passo = async (js, espera, nome) => { await pg.evaluate(js); await pg.waitForTimeout(espera); await foto(nome); };
if (cenario === 'basico' || cenario === 'celular') {
  await passo(`__ui.selecionarUnidade('502', true)`, 3500, '02-unidade-502');
  await passo(`__ui.app3d.vista('ruaPrincipal')`, 3000, '03-rua');
  await passo(`__ui.definirHora(20)`, 1500, '04-noite-rua');
  await passo(`__ui.app3d.vista('geral')`, 3000, '05-noite-geral');
  await passo(`__ui.definirHora(10.5); __ui.abrir({t:'espelho'}); document.querySelector('[data-act="realce"]').click()`, 2500, '06-espelho-realce');
  await passo(`document.querySelector('[data-act="realce"]').click(); __ui.fechar(); __ui.definirIsolado(7)`, 3000, '07-pavimento');
  await passo(`__ui.definirIsolado(null); __ui.app3d.vista('bairro')`, 3500, '08-bairro');
}
if (cenario === 'tour') {
  await passo(`__ui.app3d.iniciarTour('502')`, 3000, '10-tour-sala');
  for (let i = 1; i < 8; i++) await passo(`__ui.app3d.tourAtivo().ir(${i})`, 1500, `11-tour-${i}`);
  await passo(`__ui.definirHora(19.5); __ui.app3d.tourAtivo().ir(0)`, 1500, '12-tour-noite');
  await passo(`__ui.app3d.tourAtivo().encerrar(); __ui.definirHora(10.5); __ui.app3d.iniciarTour('901')`, 3000, '13-tour-cob');
  for (let i = 1; i < 12; i++) { const n = await pg.evaluate(`__ui.app3d.tourAtivo().total()`); if (i >= n) break; await passo(`__ui.app3d.tourAtivo().ir(${i})`, 1500, `14-cob-${i}`); }
}
if (cenario === 'gerente') {
  await pg.evaluate(`(() => { const e = __ui.est; e.dados.config.pinHash = null; })()`);
  await pg.click('[data-act="modo"]');
  await pg.fill('.modal input >> nth=0', '2468'); await pg.fill('.modal input >> nth=1', '2468');
  await pg.click('.modal .btn-primario'); await pg.waitForTimeout(800);
  await passo(`__ui.abrir({t:'clientes'})`, 800, '20-clientes');
  await passo(`__ui.abrir({t:'cliente', id: __ui.est.dados.leads[6].id})`, 800, '21-cliente');
  await passo(`__ui.selecionarUnidade('602', false)`, 1200, '22-unidade-gerente');
  await passo(`__ui.abrir({t:'relatorios'})`, 800, '23-relatorios');
  for (const f of ['pdf', 'docx', 'xlsx']) {
    const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 120000 }), pg.click(`[data-act="rel"][data-f="${f}"]`)]);
    await dl.saveAs(`${saida}/relatorio.${f}`); log('baixou ' + f);
  }
  await passo(`__ui.abrir({t:'dados'})`, 800, '24-dados');
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act="exportar"]')]);
  await dl.saveAs(`${saida}/backup.json`); log('backup');
  await passo(`__ui.abrir({t:'alertas'})`, 800, '25-alertas');
}
console.log('ERROS/AVISOS:', erros.length ? '\n' + erros.slice(0, 30).join('\n') : 'nenhum');
await navegador.close();
log('fim');
