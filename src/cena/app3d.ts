// Orquestra a cena: renderizador, câmeras (órbita, drone, voo até a unidade), clique nas unidades, dia/noite e tour.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Empreendimento, StatusUnidade } from '../core/tipos.ts';
import { criarPredio, type PredioCena } from './predio.ts';
import { criarEntorno, ruasDoEmpreendimento, type EntornoCena } from './entorno.ts';
import { criarCeu, type CeuCena } from './ceu.ts';
import { definirAnisotropia } from './texturas.ts';
import { criarTour, type Tour } from '../tour/tour.ts';

export type Qualidade = 'alta' | 'media' | 'baixa';
export type Vista = 'geral' | 'ruaPrincipal' | 'ruaLateral' | 'aerea' | 'bairro' | 'cobertura';

export interface Opcoes3D {
  emp: Empreendimento;
  container: HTMLElement;
  qualidade: Qualidade;
  aoSelecionar(id: string | null): void;
  aoPassar(id: string | null): void;
  aoMudarHora?(hora: number): void;
  aoFimTour?(): void;
  aoMudarVista?(nome: string): void;
}

export interface App3D {
  definirHorario(dataISO: string, hora: number): { noite: number; elevacao: number; azimute: number };
  definirStatus(status: Record<string, StatusUnidade>): void;
  focarUnidade(id: string): void;
  vista(v: Vista): void;
  drone(on: boolean): void;
  emDrone(): boolean;
  realce(on: boolean): void;
  trilhaSolar(on: boolean, dataISO: string): void;
  isolarPavimento(n: number | null): void;
  selecionar(id: string | null): void;
  timelapse(on: boolean): void;
  iniciarTour(id: string): Tour;
  tourAtivo(): Tour | null;
  rumoCamera(): number;
  rotulos(on: boolean, textos: Record<string, { texto: string; cor: string }>): void;
  qualidade(q: Qualidade): void;
  capturar(): string;
  predio: PredioCena;
  dispose(): void;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function ehCelular(): boolean {
  return matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
}

export function criarApp3D(o: Opcoes3D): App3D {
  const { emp, container } = o;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  definirAnisotropia(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', `Maquete 3D do ${emp.nome}`);
  renderer.domElement.tabIndex = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.25, 6000);
  const predio = criarPredio(emp);
  scene.add(predio.grupo);
  const entorno: EntornoCena = criarEntorno(emp, ruasDoEmpreendimento(emp));
  scene.add(entorno.grupo);
  const centro = predio.centro.clone();
  let q: Qualidade = o.qualidade;
  const ceu: CeuCena = criarCeu(scene, renderer, emp, centro, q === 'alta' ? 4096 : q === 'media' ? 2048 : 1024);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 6;
  controls.maxDistance = 900;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.copy(centro);
  controls.zoomToCursor = true;
  controls.screenSpacePanning = false;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.8, 0.45, 0.8);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function aplicarQualidade() {
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(q === 'alta' ? Math.min(dpr, 2) : q === 'media' ? Math.min(dpr, 1.25) : 1);
    renderer.shadowMap.enabled = q !== 'baixa';
    const tam = q === 'alta' ? 4096 : q === 'media' ? 2048 : 1024;
    if (ceu.sol.shadow.mapSize.x !== tam) { ceu.sol.shadow.mapSize.set(tam, tam); ceu.sol.shadow.map?.dispose(); (ceu.sol.shadow as any).map = null; }
    redimensionar();
  }
  function redimensionar() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    composer.setPixelRatio(renderer.getPixelRatio());
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(redimensionar);
  ro.observe(container);
  aplicarQualidade();

  // ---------- câmera: voos, drone e vistas ----------
  let voo: { de: THREE.Vector3; ate: THREE.Vector3; alvoDe: THREE.Vector3; alvoAte: THREE.Vector3; t0: number; dur: number } | null = null;
  let droneOn = false;
  let droneAng = 0;
  let timelapseOn = false;
  let estadoHora = { data: '2026-11-06', hora: 10 };

  function voar(pos: THREE.Vector3, alvo: THREE.Vector3, dur = 1.6) {
    droneOn = false;
    voo = { de: camera.position.clone(), ate: pos, alvoDe: controls.target.clone(), alvoAte: alvo, t0: performance.now(), dur };
  }

  const E = emp.predio.embasamento;
  const vistas: Record<Vista, () => [THREE.Vector3, THREE.Vector3]> = {
    geral: () => [new THREE.Vector3(E.x0 - 48, 30, E.z1 + 62), centro.clone().setY(centro.y * 0.9)],
    ruaPrincipal: () => [new THREE.Vector3(E.x0 - 14.5, 1.7, E.z1 + 12), new THREE.Vector3(E.x0 + 4, 13, (E.z0 + E.z1) / 2)],
    ruaLateral: () => [new THREE.Vector3(E.x0 + 2, 1.7, E.z1 + 14.5), new THREE.Vector3((E.x0 + E.x1) / 2, 14, E.z1 - 6)],
    aerea: () => [new THREE.Vector3(centro.x + 0.01, 190, centro.z + 0.01), centro.clone().setY(0)],
    bairro: () => [new THREE.Vector3(E.x0 - 190, 140, E.z1 + 230), centro.clone().setY(10)],
    cobertura: () => [new THREE.Vector3(centro.x - 20, predio.altura + 14, E.z1 + 22), centro.clone().setY(predio.altura - 4)],
  };
  const [p0, a0] = vistas.bairro();
  camera.position.copy(p0); controls.target.copy(a0);

  // ---------- seleção ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let selecionado: string | null = null;
  let hoverId: string | null = null;
  function picar(cx: number, cy: number): string | null {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    camera.updateMatrixWorld();
    ray.setFromCamera(ndc, camera);
    const alvos: THREE.Object3D[] = [];
    for (const uc of predio.unidades.values()) if (uc.pick.parent?.visible) alvos.push(uc.pick);
    const hit = ray.intersectObjects(alvos, false)[0];
    if (!hit) return null;
    // se um prédio vizinho estiver na frente, não seleciona
    const viz = entorno.grupo.getObjectByName('vizinhos');
    const obst = viz ? ray.intersectObject(viz, true)[0] : undefined;
    if (obst && obst.distance < hit.distance - 1) return null;
    return hit.object.userData.unidadeId ?? null;
  }
  let down: { x: number; y: number; t: number } | null = null;
  const el = renderer.domElement;
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    if (droneOn) { droneOn = false; o.aoMudarVista?.('livre'); }
    voo = null;
  };
  const onUp = (e: PointerEvent) => {
    if (!down || tour) { down = null; return; }
    const mov = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (mov <= 6 && e.timeStamp - down.t <= 600) {
      const id = picar(e.clientX, e.clientY);
      api.selecionar(id);
      o.aoSelecionar(id);
    }
    down = null;
  };
  let ultimoHover = 0;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || tour || e.timeStamp - ultimoHover < 40) return;
    ultimoHover = e.timeStamp;
    const id = picar(e.clientX, e.clientY);
    if (id !== hoverId) { hoverId = id; predio.destacar(id, 'hover'); el.style.cursor = id ? 'pointer' : ''; o.aoPassar(id); }
  };
  el.addEventListener('pointerdown', onDown, { capture: true });
  window.addEventListener('pointerup', onUp);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('wheel', () => { if (droneOn) { droneOn = false; o.aoMudarVista?.('livre'); } voo = null; }, { passive: true });

  // ---------- rótulos HTML das unidades ----------
  const camadaRotulos = document.createElement('div');
  camadaRotulos.className = 'rotulos-3d';
  container.appendChild(camadaRotulos);
  let rotulosOn = false;
  const rotulos = new Map<string, HTMLElement>();
  const vtmp = new THREE.Vector3();
  function atualizarRotulos() {
    if (!rotulosOn) return;
    const w = container.clientWidth, h = container.clientHeight;
    for (const [id, div] of rotulos) {
      const uc = predio.unidades.get(id)!;
      if (div.hidden || !uc.pick.parent?.visible) { div.style.display = 'none'; continue; }
      vtmp.copy(uc.foco.ponto).addScaledVector(uc.foco.normal, 0.6).project(camera);
      const ve = vtmp.z < 1 && Math.abs(vtmp.x) < 1.05 && Math.abs(vtmp.y) < 1.05;
      const lado = new THREE.Vector3().subVectors(camera.position, uc.foco.ponto).dot(uc.foco.normal) > 0;
      div.style.display = ve && lado ? '' : 'none';
      div.style.transform = `translate(-50%,-50%) translate(${((vtmp.x + 1) / 2) * w}px,${((1 - vtmp.y) / 2) * h}px)`;
    }
  }

  // ---------- tour ----------
  let tour: Tour | null = null;

  // ---------- laço ----------
  const relogio = new THREE.Timer();
  let rodando = true;
  let acumuladoEnv = 0;
  function quadro() {
    if (!rodando) return;
    requestAnimationFrame(quadro);
    if (document.hidden) return;
    relogio.update();
    const dt = Math.min(relogio.getDelta(), 0.1);
    if (tour) {
      tour.atualizar(dt);
    } else {
      if (voo) {
        // progresso pelo relógio real: o voo termina no tempo certo mesmo em computador lento
        const t = (performance.now() - voo.t0) / 1000 / voo.dur;
        const k = ease(Math.min(1, t));
        camera.position.lerpVectors(voo.de, voo.ate, k);
        controls.target.lerpVectors(voo.alvoDe, voo.alvoAte, k);
        if (t >= 1) voo = null;
      } else if (droneOn) {
        droneAng += dt * 0.07;
        const raio = 78 + 26 * Math.sin(droneAng * 0.8);
        const alt = 26 + 18 * Math.sin(droneAng * 0.55 + 1);
        const alvo = centro.clone().setY(centro.y * 0.85);
        const pos = new THREE.Vector3(alvo.x + Math.cos(droneAng) * raio, alt, alvo.z + Math.sin(droneAng) * raio);
        camera.position.lerp(pos, 1 - Math.exp(-dt * 1.5));
        controls.target.lerp(alvo, 1 - Math.exp(-dt * 2));
      }
      controls.update();
    }
    if (timelapseOn) {
      estadoHora.hora += dt * 0.9;
      if (estadoHora.hora > 20.5) estadoHora.hora = 5;
      api.definirHorario(estadoHora.data, estadoHora.hora);
      o.aoMudarHora?.(estadoHora.hora);
    }
    (scene.children.find((c) => (c as any).isSky) as any)?.material.uniforms.time && ((scene.children.find((c) => (c as any).isSky) as any).material.uniforms.time.value += dt);
    acumuladoEnv += dt;
    if (acumuladoEnv > 0.25) { acumuladoEnv = 0; ceu.atualizarAmbiente(); }
    bloom.enabled = !tour && q !== 'baixa' && ceu.noite > 0.05;
    if (tour) renderer.toneMappingExposure = 0.55;
    bloom.strength = 0.6 * ceu.noite;
    atualizarRotulos();
    composer.render(dt);
  }

  let ultimoStatus: Record<string, StatusUnidade> = {};

  const api: App3D = {
    predio,
    definirHorario(dataISO, hora) {
      estadoHora = { data: dataISO, hora };
      const { pos, noite } = ceu.definir(dataISO, hora);
      entorno.aplicarNoite(noite);
      predio.aplicarStatus(ultimoStatus, noite);
      tour?.aplicarNoite(noite);
      return { noite, elevacao: pos.elevacao, azimute: pos.azimute };
    },
    definirStatus(status) {
      ultimoStatus = status;
      predio.aplicarStatus(status, ceu.noite);
    },
    focarUnidade(id) {
      const uc = predio.unidades.get(id);
      if (!uc) return;
      const dist = Math.min(34, Math.max(16, uc.foco.largura * 1.9));
      const lateral = new THREE.Vector3(-uc.foco.normal.z, 0, uc.foco.normal.x).multiplyScalar(dist * 0.28);
      const pos = uc.foco.ponto.clone().addScaledVector(uc.foco.normal, dist).add(lateral).add(new THREE.Vector3(0, 3.5, 0));
      if (pos.y < 2) pos.y = 2;
      voar(pos, uc.foco.ponto.clone(), 1.8);
    },
    vista(v) {
      const [p, a] = vistas[v]();
      voar(p, a, v === 'bairro' ? 2.2 : 1.8);
      o.aoMudarVista?.(v);
    },
    drone(on) {
      droneOn = on;
      voo = null;
      if (on) {
        const d = camera.position.clone().sub(centro);
        droneAng = Math.atan2(d.z, d.x);
        o.aoMudarVista?.('drone');
      }
    },
    emDrone: () => droneOn,
    realce(on) { predio.mostrarRealce(on); },
    trilhaSolar(on, dataISO) { if (on) ceu.desenharTrilha(dataISO); ceu.trilha.visible = on; },
    isolarPavimento(n) {
      predio.isolarPavimento(n);
      if (n != null) {
        const H = emp.predio.peDireito;
        const y = (n - 1) * H;
        voar(new THREE.Vector3(centro.x - 30, y + 34, centro.z + 34), new THREE.Vector3(centro.x, y, centro.z), 1.4);
      }
    },
    selecionar(id) { selecionado = id; predio.destacar(id, 'selecao'); },
    timelapse(on) { timelapseOn = on; },
    iniciarTour(id) {
      tour?.encerrar();
      api.drone(false);
      const salvo = { pos: camera.position.clone(), alvo: controls.target.clone() };
      controls.enabled = false;
      tour = criarTour({
        emp, unidadeId: id, scene, camera, dom: renderer.domElement, container, predio, noite: ceu.noite,
        aoEncerrar: () => {
          tour = null;
          controls.enabled = true;
          camera.fov = 45; camera.updateProjectionMatrix();
          camera.position.copy(salvo.pos); controls.target.copy(salvo.alvo);
          api.definirHorario(estadoHora.data, estadoHora.hora);
          o.aoFimTour?.();
        },
      });
      return tour;
    },
    tourAtivo: () => tour,
    rumoCamera() {
      const d = new THREE.Vector3(); camera.getWorldDirection(d);
      const angPlanta = Math.atan2(d.x, -d.z) * 180 / Math.PI; // 0 = topo da planta
      return (((angPlanta + emp.geo.azimuteTopoPlanta) % 360) + 360) % 360;
    },
    rotulos(on, textos) {
      rotulosOn = on;
      camadaRotulos.style.display = on ? '' : 'none';
      if (!on) return;
      for (const [id, div] of rotulos) if (!textos[id]) div.hidden = true;
      for (const [id, t] of Object.entries(textos)) {
        let div = rotulos.get(id);
        if (!div) {
          div = document.createElement('button');
          div.className = 'rotulo-unidade';
          div.addEventListener('click', (ev) => { ev.stopPropagation(); api.selecionar(id); o.aoSelecionar(id); });
          camadaRotulos.appendChild(div);
          rotulos.set(id, div);
        }
        div.hidden = false;
        div.textContent = t.texto;
        div.style.setProperty('--cor', t.cor);
        div.setAttribute('aria-label', `Unidade ${t.texto}`);
      }
    },
    qualidade(nova) { q = nova; aplicarQualidade(); },
    capturar() { composer.render(0); return renderer.domElement.toDataURL('image/jpeg', 0.92); },
    dispose() { rodando = false; ro.disconnect(); renderer.dispose(); },
  };
  void selecionado;
  api.definirHorario(estadoHora.data, estadoHora.hora);
  ceu.atualizarAmbiente();
  quadro();
  (window as any).__app3d = { scene, camera, renderer, controls, predio, entorno, ceu, api };
  return api;
}
