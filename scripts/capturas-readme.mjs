// Gera as imagens do README a partir do PROJETO PADRÃO (genérico, sem marca).
// Uso: node scripts/capturas-readme.mjs [pasta-saida] [grupo]   grupo: cena | tour | gerente | celular | gif | todos
// É lento (WebGL por software): rode em segundo plano.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const saida = process.argv[2] || 'docs/imagens/bruto';
const grupo = process.argv[3] || 'todos';
mkdirSync(saida, { recursive: true });
const arquivo = 'file://' + resolve('dist/padrao-apresentacao-3d.html');
const navegador = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const t0 = Date.now();
const log = (s) => console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s ${s}`);

async function abrir(opcoes) {
  const ctx = await navegador.newContext({ deviceScaleFactor: 1, acceptDownloads: true, ...opcoes });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => log('ERRO ' + e.message));
  await pg.goto(arquivo);
  await pg.waitForSelector('[data-act="iniciar"]:not([disabled])', { timeout: 240000 });
  await pg.click('[data-act="iniciar"]');
  await pg.waitForTimeout(1500);
  // mantém o modo apresentação "acordado" (sem drone automático) e sem toasts antigos
  await pg.evaluate(() => setInterval(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true })), 20000));
  return pg;
}
const cam = (pg, p, a) => pg.evaluate(([p, a]) => { const x = window.__app3d; x.api.drone(false); x.camera.position.set(...p); x.controls.target.set(...a); x.controls.update(); }, [p, a]);
const limpar = (pg) => pg.evaluate(() => document.querySelectorAll('.toast, .pop').forEach((e) => (e.classList.contains('pop') ? (e.hidden = true) : e.remove())));
async function foto(pg, nome, espera = 2500) {
  await pg.waitForTimeout(espera);
  await limpar(pg);
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${saida}/${nome}.png` });
  log('foto ' + nome);
}
const js = (pg, f, arg) => pg.evaluate(f, arg);

const GERAL = [[-52, 26, 66], [9, 15, 10]];

if (grupo === 'cena' || grupo === 'todos') {
  const pg = await abrir({ viewport: { width: 1440, height: 860 } });
  await js(pg, () => window.__ui.definirHora(15.5, '2026-06-21'));
  await cam(pg, ...GERAL); await foto(pg, '01-geral', 4000);
  await js(pg, () => window.__ui.selecionarUnidade('402', true)); await foto(pg, '02-unidade', 5000);
  await js(pg, () => window.__ui.fechar());
  await js(pg, () => window.__ui.definirHora(19.6)); await cam(pg, [-46, 18, 58], [9, 17, 10]); await foto(pg, '03-noite', 4000);
  await cam(pg, [-16, 1.7, 36], [6, 16, 8]); await foto(pg, '04-noite-rua', 3500);
  await js(pg, () => { window.__ui.definirHora(10.5); window.__ui.abrir({ t: 'espelho' }); document.querySelector('[data-act="realce"]').click(); });
  await cam(pg, [-42, 30, 56], [9, 17, 10]); await foto(pg, '05-espelho-disponibilidade', 4000);
  await js(pg, () => { document.querySelector('[data-act="realce"]').click(); window.__ui.fechar(); window.__ui.definirIsolado(8); });
  await foto(pg, '06-pavimento', 5000);
  await js(pg, () => { window.__ui.definirIsolado(null); window.__ui.definirHora(9, '2026-06-21'); document.querySelector('[data-act="sol"]').click(); document.querySelector('#pop-sol [data-x="trilha"]').click(); });
  await cam(pg, [9, 58, 135], [9, 2, 5]);
  await pg.waitForTimeout(3000);
  await pg.screenshot({ path: `${saida}/07-sol.png` }); log('foto 07-sol');
  await js(pg, () => { document.querySelector('#pop-sol [data-x="trilha"]').click(); document.querySelector('#pop-sol').hidden = true; window.__ui.definirHora(16.8, '2026-11-06'); });
  await cam(pg, [-200, 120, 240], [9, 10, 10]); await foto(pg, '08-bairro', 4000);
  await pg.context().close();
}

if (grupo === 'sol') {
  const pg = await abrir({ viewport: { width: 1440, height: 860 } });
  await js(pg, () => { window.__ui.definirHora(9, '2026-06-21'); document.querySelector('[data-act="sol"]').click(); document.querySelector('#pop-sol [data-x="trilha"]').click(); });
  await cam(pg, [9, 58, 135], [9, 2, 5]);
  await pg.waitForTimeout(3500);
  await pg.screenshot({ path: `${saida}/07-sol.png` }); log('foto 07-sol');
  await pg.context().close();
}

if (grupo === 'tour' || grupo === 'todos') {
  const pg = await abrir({ viewport: { width: 1440, height: 860 } });
  await js(pg, () => window.__ui.definirHora(10.5, '2026-06-21'));
  for (const [id, salas] of [['502', [0, 1, 2, 3, 6]], ['901', [7, 8, 9, 10]]]) {
    await js(pg, (id) => window.__ui.iniciarTour(id), id);
    await pg.waitForTimeout(2500);
    await pg.keyboard.press('Space'); // pausa a visita guiada: fica no enquadramento pensado para cada cômodo
    for (const i of salas) {
      const n = await js(pg, () => window.__app3d.api.tourAtivo().total());
      if (i >= n) continue;
      await js(pg, (i) => window.__app3d.api.tourAtivo().ir(i), i);
      await foto(pg, `10-tour-${id}-${i}`, 3500);
    }
    await js(pg, () => window.__app3d.api.tourAtivo().encerrar());
  }
  await pg.context().close();
}

if (grupo === 'gerente' || grupo === 'todos') {
  const pg = await abrir({ viewport: { width: 1440, height: 860 } });
  await js(pg, () => window.__ui.definirHora(11, '2026-06-21'));
  await cam(pg, [-60, 34, 40], [9, 16, 6]);
  await pg.click('[data-act="modo"]');
  await pg.fill('.modal input >> nth=0', '2468'); await pg.fill('.modal input >> nth=1', '2468');
  await pg.click('.modal .btn-primario'); await pg.waitForTimeout(800);
  await js(pg, () => window.__ui.abrir({ t: 'clientes' })); await foto(pg, '20-crm', 2500);
  await js(pg, () => window.__ui.abrir({ t: 'cliente', id: window.__ui.est.dados.leads.find((l) => l.etapa === 'reserva').id })); await foto(pg, '21-cliente', 2500);
  await js(pg, () => window.__ui.abrir({ t: 'relatorios' })); await foto(pg, '22-relatorios', 2500);
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 180000 }), pg.click('[data-act="rel"][data-f="pdf"]')]);
  await dl.saveAs(`${saida}/relatorio.pdf`); log('pdf');
  await js(pg, () => window.__ui.abrir({ t: 'dados' })); await foto(pg, '23-dados', 2500);
  await pg.context().close();
}

if (grupo === 'celular' || grupo === 'todos') {
  const pg = await abrir({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await js(pg, () => window.__ui.definirHora(15.5, '2026-06-21'));
  await cam(pg, [-50, 30, 75], [9, 18, 10]); await foto(pg, '30-celular-geral', 4000);
  await js(pg, () => window.__ui.selecionarUnidade('401', true)); await foto(pg, '31-celular-unidade', 5000);
  await js(pg, () => window.__ui.fechar());
  await js(pg, () => window.__ui.iniciarTour('602')); await pg.waitForTimeout(2500); await pg.keyboard.press('Space');
  await foto(pg, '32-celular-tour', 3500);
  await pg.context().close();
}

if (grupo === 'gif' || grupo === 'todos') {
  // voo de drone: quadros com a câmera em órbita (posição calculada, não depende do fps)
  const pg = await abrir({ viewport: { width: 880, height: 495 } });
  await js(pg, () => { window.__ui.definirHora(16.2, '2026-06-21'); document.querySelectorAll('.topo,.dock,.legenda,.bussola').forEach((e) => (e.style.visibility = 'hidden')); });
  mkdirSync(`${saida}/gif`, { recursive: true });
  const N = 36;
  for (let k = 0; k < N; k++) {
    const a = 2.3 + (k / N) * Math.PI * 2;
    const r = 60 + 8 * Math.sin(k / N * Math.PI * 2);
    const y = 36 + 8 * Math.sin(k / N * Math.PI * 4 + 1);
    await cam(pg, [9 + Math.cos(a) * r, y, 10 + Math.sin(a) * r], [9, 17, 10]);
    await pg.waitForTimeout(900);
    await pg.screenshot({ path: `${saida}/gif/q${String(k).padStart(3, '0')}.png` });
    if (k % 6 === 0) log('quadro ' + k);
  }
  await pg.context().close();
}

await navegador.close();
log('fim');
