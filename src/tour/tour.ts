// Tour virtual guiado: visita cômodo a cômodo, com legenda, comandos e imagens do projeto.
import * as THREE from 'three';
import type { Ambiente, Empreendimento, Ret } from '../core/tipos.ts';
import { ambientesDaUnidade, nomeUnidade, tipologia, unidadeTecnica } from '../core/regras.ts';
import { ocupacaoPavimento, segmentosLivres, type Segmento } from '../core/sol.ts';
import { esc, num } from '../core/util.ts';
import type { PredioCena } from '../cena/predio.ts';
import { imagem } from '../recursos.ts';
import { materiaisInterior, montarAmbiente, type AmbienteMontado } from './interior.ts';

export interface Tour {
  atualizar(dt: number): void;
  encerrar(): void;
  ir(i: number): void;
  aplicarNoite(f: number): void;
  indice(): number;
  total(): number;
}

interface Ctx {
  emp: Empreendimento; unidadeId: string; scene: THREE.Scene; camera: THREE.PerspectiveCamera; dom: HTMLElement; container: HTMLElement;
  predio: PredioCena; noite: number; aoEncerrar(): void;
}

const PISO: Record<string, string> = { quarto: 'Piso laminado', suite: 'Piso laminado', varanda: 'Porcelanato externo', terraco: 'Deck de madeira', banho: 'Porcelanato e bancada em pedra', lavabo: 'Bancada em pedra' };
const IMAGENS_POR_TIPO: Record<string, string[]> = {
  sala: ['sala-estar', 'sala-jantar'], salaTv: ['cobertura-estar', 'sala-estar'], cozinha: ['sala-jantar-2', 'cobertura-gourmet-3', 'sala-jantar-1'],
  quarto: ['suite'], suite: ['suite'], banho: ['banho'], lavabo: ['lavabo'], gourmet: ['cobertura-gourmet'], terraco: ['cobertura-gourmet'], varanda: [],
};

function clipar(segs: Segmento[], a: Ret): Segmento[] {
  const out: Segmento[] = [];
  for (const s of segs) {
    const coord = s.lado === 'x0' ? a[0] : s.lado === 'x1' ? a[1] : s.lado === 'z0' ? a[2] : a[3];
    if (Math.abs(coord - s.fixo) > 0.06) continue;
    const h = s.lado === 'z0' || s.lado === 'z1';
    const a0 = Math.max(s.a0, h ? a[0] : a[2]), a1 = Math.min(s.a1, h ? a[1] : a[3]);
    if (a1 - a0 > 0.4) out.push({ ...s, a0, a1, comprimento: a1 - a0 });
  }
  return out;
}

export function criarTour(c: Ctx): Tour {
  const { emp, camera } = c;
  const u = unidadeTecnica(emp, c.unidadeId)!;
  const t = tipologia(emp, u.tipologia);
  const H = emp.predio.peDireito;
  const M = materiaisInterior();
  const grupo = new THREE.Group(); grupo.name = 'tour';
  const lista = ambientesDaUnidade(emp, u);
  // ordem: social primeiro, depois íntimo, depois piso superior
  const ordem = ['sala', 'varanda', 'cozinha', 'gourmet', 'salaTv', 'terraco', 'suite', 'quarto', 'banho', 'lavabo'];
  lista.sort((p, q) => p.nivel - q.nivel || ordem.indexOf(p.ambiente.tipo) - ordem.indexOf(q.ambiente.tipo));
  const montados: { a: Ambiente; nivel: number; m: AmbienteMontado }[] = [];
  for (const { ambiente, nivel } of lista) {
    const pav = u.pavimento + nivel;
    const vols = nivel === 0 ? u.volumes : u.volumesSuperiores ?? [];
    const ocup = ocupacaoPavimento(emp, pav, false);
    const ext = ambiente.tipo === 'terraco' ? segmentosLivres([ambiente.ret], ocup, 0.4) : clipar(segmentosLivres(vols, ocup, 0.3), ambiente.ret);
    const m = montarAmbiente(ambiente, (pav - 1) * H, ext, M);
    grupo.add(m.grupo);
    montados.push({ a: ambiente, nivel, m });
  }
  const ambiente = new THREE.AmbientLight('#fff1e0', 0.25);
  grupo.add(ambiente);
  c.scene.add(grupo);
  c.predio.torre.visible = false;
  const fovOriginal = camera.fov;
  camera.fov = 68; camera.updateProjectionMatrix();

  // ---------- interface ----------
  const ui = document.createElement('div');
  ui.className = 'tour';
  ui.innerHTML = `
    <div class="tour-topo">
      <div class="tour-titulo"><span class="selo">Tour virtual</span> ${esc(nomeUnidade(u))} · ${esc(t.nome)}</div>
      <button class="btn btn-escuro" data-t="sair" aria-label="Sair do tour">✕ Sair do tour</button>
    </div>
    <div class="tour-legenda" aria-live="polite"></div>
    <div class="tour-barra">
      <button class="btn-ico" data-t="ant" aria-label="Ambiente anterior">‹</button>
      <button class="btn-ico" data-t="play" aria-label="Pausar visita guiada">❚❚</button>
      <button class="btn-ico" data-t="prox" aria-label="Próximo ambiente">›</button>
      <div class="tour-chips"></div>
      <button class="btn btn-claro" data-t="img">🖼 Imagens do projeto</button>
    </div>
    <div class="tour-dica">Arraste para olhar em volta · role para aproximar · ← → trocam de ambiente</div>
    <div class="tour-fade"></div>
    <div class="tour-lightbox" hidden><button class="btn-ico" data-t="fechar-img" aria-label="Fechar imagem">✕</button><img alt=""><p></p><div class="tour-lb-nav"><button class="btn-ico" data-t="img-ant" aria-label="Imagem anterior">‹</button><button class="btn-ico" data-t="img-prox" aria-label="Próxima imagem">›</button></div></div>`;
  c.container.appendChild(ui);
  const chips = ui.querySelector('.tour-chips')!;
  chips.innerHTML = montados.map((x, i) => `<button class="chip" data-i="${i}">${esc(x.a.nome)}</button>`).join('');
  const legenda = ui.querySelector('.tour-legenda') as HTMLElement;
  const fade = ui.querySelector('.tour-fade') as HTMLElement;
  const btnPlay = ui.querySelector('[data-t="play"]') as HTMLElement;
  const lb = ui.querySelector('.tour-lightbox') as HTMLElement;

  let i = 0, tempo = 0, auto = true, yaw0 = 0, pitch0 = 0, dYaw = 0, dPitch = 0, transicao = 0, proximo = -1;
  const DUR = 9;

  function posicionar(k: number) {
    const v = montados[k].m.vista;
    camera.position.copy(v.pos);
    const d = v.olhar.clone().sub(v.pos);
    yaw0 = Math.atan2(d.x, d.z);
    pitch0 = Math.atan2(d.y, Math.hypot(d.x, d.z)) * 0.6;
    dYaw = 0; dPitch = 0; tempo = 0;
    const a = montados[k].a;
    const [x0, x1, z0, z1] = a.ret;
    const w = x1 - x0, dd = z1 - z0;
    legenda.innerHTML = `<strong>${esc(a.nome)}</strong><span>${num(Math.max(w, dd), 1)} × ${num(Math.min(w, dd), 1)} m · ≈ ${num(w * dd, 1)} m² · ${PISO[a.tipo] ?? 'Porcelanato'}</span>`;
    chips.querySelectorAll('.chip').forEach((el, j) => el.classList.toggle('ativo', j === k));
    (chips.children[k] as HTMLElement)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function ir(k: number) {
    const n = montados.length;
    proximo = ((k % n) + n) % n;
    transicao = 0.0001;
  }
  function olhar() {
    const yaw = yaw0 + dYaw + (auto ? Math.sin((tempo / DUR) * Math.PI * 2 - Math.PI / 2) * 0.42 : 0);
    const pitch = THREE.MathUtils.clamp(pitch0 + dPitch, -0.9, 0.7);
    const alvo = camera.position.clone().add(new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)));
    camera.lookAt(alvo);
  }
  posicionar(0);

  // imagens do projeto (renders do folder) para o ambiente atual
  let imgs: string[] = [], imgI = 0;
  function abrirImagens() {
    const prefs = IMAGENS_POR_TIPO[montados[i].a.tipo] ?? [];
    const daTip = t.imagens;
    const escolhidas = daTip.filter((n) => prefs.some((p) => n.startsWith(p)));
    imgs = (escolhidas.length ? escolhidas : daTip).filter((n) => imagem(n));
    if (!imgs.length) return;
    imgI = 0; mostrarImg(); lb.hidden = false;
  }
  function mostrarImg() {
    (lb.querySelector('img') as HTMLImageElement).src = imagem(imgs[imgI])!;
    (lb.querySelector('p') as HTMLElement).textContent = `Imagem ilustrativa do projeto (${imgI + 1}/${imgs.length}). ${emp.avisoLegal}`;
  }

  ui.addEventListener('click', (e) => {
    const alvo = (e.target as HTMLElement).closest('button') as HTMLElement | null;
    if (!alvo) return;
    const acao = alvo.dataset.t;
    if (alvo.dataset.i) { auto = false; atualizarPlay(); ir(Number(alvo.dataset.i)); }
    else if (acao === 'sair') api.encerrar();
    else if (acao === 'prox') ir(i + 1);
    else if (acao === 'ant') ir(i - 1);
    else if (acao === 'play') { auto = !auto; tempo = 0; atualizarPlay(); }
    else if (acao === 'img') abrirImagens();
    else if (acao === 'fechar-img') lb.hidden = true;
    else if (acao === 'img-prox') { imgI = (imgI + 1) % imgs.length; mostrarImg(); }
    else if (acao === 'img-ant') { imgI = (imgI - 1 + imgs.length) % imgs.length; mostrarImg(); }
  });
  function atualizarPlay() { btnPlay.textContent = auto ? '❚❚' : '▶'; btnPlay.setAttribute('aria-label', auto ? 'Pausar visita guiada' : 'Retomar visita guiada'); }

  // olhar em volta (arrastar), zoom (roda), teclado
  let arrasto: { x: number; y: number } | null = null;
  const pd = (e: PointerEvent) => { arrasto = { x: e.clientX, y: e.clientY }; };
  const pm = (e: PointerEvent) => {
    if (!arrasto) return;
    if (auto) { auto = false; atualizarPlay(); }
    dYaw -= (e.clientX - arrasto.x) * 0.004; dPitch -= (e.clientY - arrasto.y) * 0.003;
    arrasto = { x: e.clientX, y: e.clientY };
  };
  const pu = () => { arrasto = null; };
  const wh = (e: WheelEvent) => { camera.fov = THREE.MathUtils.clamp(camera.fov + Math.sign(e.deltaY) * 4, 38, 85); camera.updateProjectionMatrix(); };
  const kd = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') ir(i + 1);
    else if (e.key === 'ArrowLeft') ir(i - 1);
    else if (e.key === 'Escape') { if (!lb.hidden) lb.hidden = true; else api.encerrar(); }
    else if (e.key === ' ') { auto = !auto; atualizarPlay(); e.preventDefault(); }
  };
  c.dom.addEventListener('pointerdown', pd);
  window.addEventListener('pointermove', pm);
  window.addEventListener('pointerup', pu);
  c.dom.addEventListener('wheel', wh, { passive: true });
  window.addEventListener('keydown', kd);

  let encerrado = false;
  const api: Tour = {
    indice: () => i,
    total: () => montados.length,
    ir,
    atualizar(dt) {
      if (transicao > 0) {
        transicao += dt / 0.35;
        fade.style.opacity = String(Math.min(1, transicao));
        if (transicao >= 1 && proximo >= 0) { i = proximo; proximo = -1; posicionar(i); transicao = -1; }
      } else if (transicao < 0) {
        transicao += dt / 0.35;
        fade.style.opacity = String(Math.max(0, -transicao));
        if (transicao >= 0) transicao = 0;
      } else if (auto && lb.hidden) {
        tempo += dt;
        if (tempo >= DUR) ir(i + 1);
      }
      olhar();
    },
    aplicarNoite(f) {
      for (const x of montados) for (const p of x.m.luzes) p.intensity = p.userData.base * (0.6 + 1.6 * f);
      ambiente.intensity = 0.25 + 0.1 * f;
    },
    encerrar() {
      if (encerrado) return;
      encerrado = true;
      c.dom.removeEventListener('pointerdown', pd);
      window.removeEventListener('pointermove', pm);
      window.removeEventListener('pointerup', pu);
      c.dom.removeEventListener('wheel', wh);
      window.removeEventListener('keydown', kd);
      ui.remove();
      c.scene.remove(grupo);
      grupo.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
      Object.values(M).forEach((m) => m.dispose());
      c.predio.torre.visible = true;
      camera.fov = fovOriginal; camera.updateProjectionMatrix();
      c.aoEncerrar();
    },
  };
  for (const x of montados) for (const p of x.m.luzes) p.userData.base = p.intensity;
  api.aplicarNoite(c.noite);
  return api;
}
