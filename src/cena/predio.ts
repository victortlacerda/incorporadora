// Prédio gerado a partir do empreendimento.json (genérico: serve para outros projetos com plantas retangulares).
import * as THREE from 'three';
import type { Ambiente, Empreendimento, Ret, StatusUnidade, UnidadeTecnica } from '../core/tipos.ts';
import { STATUS_INFO } from '../core/tipos.ts';
import { ambientesDaUnidade } from '../core/regras.ts';
import { facesExternas, ocupacaoPavimento, segmentosLivres, type Lado, type Segmento } from '../core/sol.ts';
import { caixa, Lote, plano } from './geo.ts';
import { texLetreiro, texMadeira, texPorcelanato, texRevestimento, texRipado, texVeneziana } from './texturas.ts';

export interface UnidadeCena {
  id: string;
  pavimento: number;
  pavimentos: number[];
  vidro: THREE.MeshPhysicalMaterial;
  pick: THREE.Mesh;
  realce: THREE.Mesh;
  contorno: THREE.LineSegments;
  centro: THREE.Vector3;
  foco: { ponto: THREE.Vector3; normal: THREE.Vector3; largura: number };
}

export interface PredioCena {
  grupo: THREE.Group;
  torre: THREE.Group;
  pavimentos: Map<number, THREE.Group>;
  unidades: Map<string, UnidadeCena>;
  centro: THREE.Vector3;
  altura: number;
  aplicarStatus(status: Record<string, StatusUnidade>, noite: number): void;
  mostrarRealce(on: boolean): void;
  destacar(id: string | null, tipo: 'hover' | 'selecao'): void;
  isolarPavimento(n: number | null): void;
}

const NORMAL: Record<Lado, [number, number]> = { x0: [-1, 0], x1: [1, 0], z0: [0, -1], z1: [0, 1] };
const DENTRO: Record<Lado, number> = { x0: 1, x1: -1, z0: 1, z1: -1 };

export function criarMateriais(emp: Empreendimento) {
  const c = emp.predio.materiais;
  const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
  return {
    claro: std({ map: texRevestimento(c.revestimentoClaro ?? '#cfccc6', true, 21), color: '#f3eadf', roughness: 0.82 }),
    escuro: std({ map: texRevestimento(c.revestimentoEscuro ?? '#3a3b3e', true, 23), roughness: 0.55, metalness: 0.08 }),
    divisa: std({ map: texRevestimento('#bdb8ae', false, 25), roughness: 0.95 }),
    ripado: std({ map: texRipado(), roughness: 0.62 }),
    laje: std({ color: c.laje ?? '#f1f0eb', roughness: 0.75 }),
    faixaMadeira: std({ map: texMadeira(false), roughness: 0.55 }),
    caixilho: std({ color: '#151618', metalness: 0.55, roughness: 0.35 }),
    guarda: std({ color: '#b9d2da', transparent: true, opacity: 0.26, roughness: 0.04, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide }),
    venez: std({ map: texVeneziana(), roughness: 0.55, metalness: 0.25 }),
    deck: std({ map: texMadeira(true), color: '#c7b49a', roughness: 0.8 }),
    pisoExt: std({ map: texPorcelanato('#b9b3a8'), roughness: 0.7 }),
    portao: std({ color: '#2a2b2e', metalness: 0.65, roughness: 0.38 }),
    vegetacao: std({ color: '#4c6a32', roughness: 0.95, flatShading: true }),
    vaso: std({ color: '#1e1f21', roughness: 0.5 }),
    terra: std({ color: '#4a3a2c', roughness: 1 }),
    solar: std({ color: '#1d2b4a', metalness: 0.6, roughness: 0.2 }),
    vidroComum: new THREE.MeshPhysicalMaterial({ color: '#2b3942', metalness: 0.15, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4, emissive: '#000000' }),
    led: std({ color: '#fff4dc', emissive: '#ffe2ad', emissiveIntensity: 0.4, roughness: 0.3 }),
  };
}

type Mats = ReturnType<typeof criarMateriais>;

function novoVidroUnidade(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color: '#26343d', metalness: 0.15, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.5, emissive: '#000000' });
}

/** Caixa "na fachada": s ao longo da face, profundidade para dentro a partir do plano da face. */
function naFace(lado: Lado, fixo: number, s0: number, s1: number, y0: number, y1: number, recuo: number, esp: number, escala = 1) {
  const sg = DENTRO[lado];
  const n0 = fixo + sg * recuo, n1 = fixo + sg * (recuo + esp);
  const a = Math.min(n0, n1), b = Math.max(n0, n1);
  return lado === 'x0' || lado === 'x1' ? caixa(a, b, y0, y1, s0, s1, escala) : caixa(s0, s1, y0, y1, a, b, escala);
}

interface Abertura { s0: number; s1: number; y0: number; y1: number; tipo: 'vidro' | 'janela' | 'pequena' | 'aberto' }

function tocaFace(a: Ambiente, seg: Segmento): [number, number] | null {
  const r = a.ret;
  const eps = 0.06;
  const coord = seg.lado === 'x0' ? r[0] : seg.lado === 'x1' ? r[1] : seg.lado === 'z0' ? r[2] : r[3];
  if (Math.abs(coord - seg.fixo) > eps) return null;
  const horizontal = seg.lado === 'z0' || seg.lado === 'z1';
  const b0 = Math.max(horizontal ? r[0] : r[2], seg.a0), b1 = Math.min(horizontal ? r[1] : r[3], seg.a1);
  return b1 - b0 > 0.5 ? [b0, b1] : null;
}

function aberturas(seg: Segmento, ambientes: Ambiente[], H: number): Abertura[] {
  const lista: Abertura[] = [];
  for (const a of ambientes) {
    const t = tocaFace(a, seg);
    if (!t) continue;
    const [b0, b1] = t;
    const L = b1 - b0, mid = (b0 + b1) / 2;
    const larg = (w: number) => [mid - w / 2, mid + w / 2] as [number, number];
    switch (a.tipo) {
      case 'varanda': case 'terraco': lista.push({ s0: b0 + 0.02, s1: b1 - 0.02, y0: 0, y1: H, tipo: 'aberto' }); break;
      case 'sala': case 'gourmet': case 'salaTv': {
        const [s0, s1] = larg(Math.min(L - 0.5, 4.2)); if (s1 - s0 > 0.6) lista.push({ s0, s1, y0: 0.15, y1: 2.55, tipo: 'vidro' }); break;
      }
      case 'quarto': case 'suite': { const [s0, s1] = larg(Math.min(L - 0.7, 2.0)); if (s1 - s0 > 0.6) lista.push({ s0, s1, y0: 0.95, y1: 2.45, tipo: 'janela' }); break; }
      case 'cozinha': { const [s0, s1] = larg(Math.min(L - 0.6, 1.6)); if (s1 - s0 > 0.5) lista.push({ s0, s1, y0: 1.15, y1: 2.35, tipo: 'janela' }); break; }
      default: { const [s0, s1] = larg(Math.min(L - 0.4, 0.8)); lista.push({ s0, s1, y0: 1.65, y1: 2.3, tipo: 'pequena' }); }
    }
  }
  return lista.sort((a, b) => a.s0 - b.s0);
}

/** Monta uma face de fachada com janelas, vidros e guarda-corpos. */
function montarFace(L: Lote, M: Mats, seg: Segmento, y: number, H: number, abs: Abertura[], parede: THREE.Material, vidro: THREE.Material) {
  const e = 0.18; // espessura da parede
  const lajeInf = 0.15, lajeSup = 0.25;
  const yb = y + lajeInf, yt = y + H - lajeSup;
  const h = yt - yb;
  let cursor = seg.a0;
  const [nx, nz] = NORMAL[seg.lado];
  for (const a of abs) {
    if (a.s0 > cursor + 0.01) L.add(parede, naFace(seg.lado, seg.fixo, cursor, a.s0, yb, yt, 0, e, 3));
    const ya = yb + Math.min(a.y0, h), yz = yb + Math.min(a.y1, h);
    if (a.tipo === 'aberto') {
      // guarda-corpo de vidro + corrimão + faixa de madeira na borda da laje (como no render)
      L.add(M.guarda, naFace(seg.lado, seg.fixo, a.s0, a.s1, yb, yb + 1.1, 0.03, 0.02));
      L.add(M.caixilho, naFace(seg.lado, seg.fixo, a.s0, a.s1, yb + 1.08, yb + 1.13, 0.01, 0.06));
      L.add(M.faixaMadeira, naFace(seg.lado, seg.fixo, a.s0 - 0.15, a.s1 + 0.15, y - 0.32, y + lajeInf, -0.28, 0.28, 1.5));
    } else {
      if (ya > yb + 0.01) L.add(parede, naFace(seg.lado, seg.fixo, a.s0, a.s1, yb, ya, 0, e, 3));
      if (yz < yt - 0.01) L.add(parede, naFace(seg.lado, seg.fixo, a.s0, a.s1, yz, yt, 0, e, 3));
      L.add(vidro, naFace(seg.lado, seg.fixo, a.s0, a.s1, ya, yz, 0.09, 0.03));
      const f = 0.05;
      L.add(M.caixilho, naFace(seg.lado, seg.fixo, a.s0, a.s1, ya, ya + f, 0.04, 0.1));
      L.add(M.caixilho, naFace(seg.lado, seg.fixo, a.s0, a.s1, yz - f, yz, 0.04, 0.1));
      L.add(M.caixilho, naFace(seg.lado, seg.fixo, a.s0, a.s0 + f, ya, yz, 0.04, 0.1));
      L.add(M.caixilho, naFace(seg.lado, seg.fixo, a.s1 - f, a.s1, ya, yz, 0.04, 0.1));
      if (a.s1 - a.s0 > 1.1) { const m = (a.s0 + a.s1) / 2; L.add(M.caixilho, naFace(seg.lado, seg.fixo, m - 0.025, m + 0.025, ya, yz, 0.05, 0.08)); }
      if (a.tipo === 'janela') L.add(M.venez, naFace(seg.lado, seg.fixo, a.s0 + f, a.s1 - f, yz - 0.42, yz - f, 0.06, 0.03, 0.5));
      // peitoril
      L.add(M.laje, naFace(seg.lado, seg.fixo, a.s0 - 0.05, a.s1 + 0.05, ya - 0.04, ya, -0.04, 0.1));
    }
    cursor = Math.max(cursor, a.s1);
  }
  if (cursor < seg.a1 - 0.01) L.add(parede, naFace(seg.lado, seg.fixo, cursor, seg.a1, yb, yt, 0, e, 3));
  void nx; void nz;
}

function lajes(L: Lote, M: Mats, rets: Ret[], y0: number, y1: number, borda = 0.06) {
  for (const r of rets) L.add(M.laje, caixa(r[0] - borda, r[1] + borda, y0, y1, r[2] - borda, r[3] + borda, 2));
}

function planta(L: Lote, M: Mats, x: number, y: number, z: number, escala = 1) {
  L.add(M.vaso, caixa(x - 0.25 * escala, x + 0.25 * escala, y, y + 0.6 * escala, z - 0.25 * escala, z + 0.25 * escala));
  const g = new THREE.IcosahedronGeometry(0.55 * escala, 0);
  g.scale(1, 1.5, 1);
  g.translate(x, y + 1.35 * escala, z);
  L.add(M.vegetacao, g);
}

function floreira(L: Lote, M: Mats, seg: Segmento, y: number) {
  const s0 = seg.a0 + 0.2, s1 = seg.a1 - 0.2;
  if (s1 - s0 < 0.8) return;
  L.add(M.escuro, naFace(seg.lado, seg.fixo, s0, s1, y, y + 0.45, 0.05, 0.5, 2));
  L.add(M.vegetacao, naFace(seg.lado, seg.fixo, s0 + 0.05, s1 - 0.05, y + 0.45, y + 0.75, 0.1, 0.4));
}

export function criarPredio(emp: Empreendimento): PredioCena {
  const M = criarMateriais(emp);
  const H = emp.predio.peDireito;
  const grupo = new THREE.Group(); grupo.name = 'predio';
  const torre = new THREE.Group(); torre.name = 'torre';
  grupo.add(torre);
  const pavGrupos = new Map<number, THREE.Group>();
  const unidades = new Map<string, UnidadeCena>();
  const vidros = new Map<string, THREE.MeshPhysicalMaterial>();
  for (const u of emp.unidades) vidros.set(u.id, novoVidroUnidade());

  // ---------- Embasamento (térreo + garagem) ----------
  const E = emp.predio.embasamento;
  const Lb = new Lote();
  const hBase = E.pavimentos.length * H;
  Lb.add(M.laje, caixa(E.x0 - 0.05, E.x1 + 0.05, hBase - 0.3, hBase, E.z0 - 0.05, E.z1 + 0.05, 2));
  Lb.add(M.divisa, caixa(E.x1 - 0.2, E.x1, 0, hBase, E.z0, E.z1, 3));
  Lb.add(M.divisa, caixa(E.x0, E.x1, 0, hBase, E.z0, E.z0 + 0.2, 3));
  const ent = emp.predio.entrada, gar = emp.predio.garagem;
  // Fachada principal (lado x0): ripado envolvendo a entrada, vidro na portaria
  const segX0: Segmento = { lado: 'x0', ret: [E.x0, E.x0, E.z0, E.z1], fixo: E.x0, a0: E.z0, a1: E.z1, comprimento: E.z1 - E.z0 };
  Lb.add(M.escuro, naFace('x0', E.x0, E.z0, ent.z0 - 2, 0, hBase, 0, 0.2, 3));
  Lb.add(M.ripado, naFace('x0', E.x0, ent.z0 - 2, ent.z0, 0, hBase - 0.3, 0, 0.2, 1));
  Lb.add(M.vidroComum, naFace('x0', E.x0, ent.z0, ent.z1, 0, 2.8, 0.15, 0.03));
  Lb.add(M.caixilho, naFace('x0', E.x0, ent.z0 + 1.95, ent.z0 + 2.05, 0, 2.8, 0.1, 0.08));
  Lb.add(M.ripado, naFace('x0', E.x0, ent.z0, ent.z1, 2.8, hBase - 0.3, 0, 0.2, 1));
  Lb.add(M.ripado, naFace('x0', E.x0, ent.z1, E.z1, 0, H, 0, 0.2, 1));
  Lb.add(M.escuro, naFace('x0', E.x0, ent.z1, E.z1, H, hBase, 0, 0.2, 3));
  for (let i = 0; i < 6; i++) Lb.add(M.caixilho, naFace('x0', E.x0, ent.z1 + 1 + i * 1.4, ent.z1 + 1.9 + i * 1.4, H + 1.0, H + 1.6, -0.01, 0.05));
  // portaria: piso e interior
  Lb.add(M.pisoExt, caixa(E.x0 + 0.2, E.x0 + 6, 0, 0.05, ent.z0, ent.z1, 1.8));
  Lb.add(M.claro, caixa(E.x0 + 6, E.x0 + 6.2, 0, 2.9, ent.z0, ent.z1, 3));
  // marquise com letreiro e LEDs verticais
  Lb.add(M.escuro, caixa(E.x0 - 2.6, E.x0, 3.0, 3.35, ent.z0 - 1, ent.z1 + 1.2, 2));
  Lb.add(M.led, caixa(E.x0 - 2.5, E.x0 - 0.1, 2.985, 3.0, ent.z0 + 0.3, ent.z0 + 0.36));
  Lb.add(M.led, caixa(E.x0 - 2.5, E.x0 - 0.1, 2.985, 3.0, ent.z1 - 0.36, ent.z1 - 0.3));
  for (const dz of [0.4, 0.75, 1.1]) Lb.add(M.led, caixa(E.x0 - 0.04, E.x0, 3.5, hBase - 0.5, ent.z0 - 2 + dz, ent.z0 - 2 + dz + 0.05));
  planta(Lb, M, E.x0 - 0.6, 0, ent.z0 - 0.6, 1);
  planta(Lb, M, E.x0 - 0.6, 0, ent.z1 + 0.6, 0.9);
  // fachada lateral (lado z1): portão da garagem
  Lb.add(M.ripado, naFace('z1', E.z1, E.x0, gar.x0, 0, H, 0, 0.2, 1));
  Lb.add(M.portao, naFace('z1', E.z1, gar.x0, gar.x1, 0, 2.7, 0.25, 0.08, 1));
  for (let i = 0; i < 9; i++) Lb.add(M.caixilho, naFace('z1', E.z1, gar.x0, gar.x1, 0.2 + i * 0.28, 0.24 + i * 0.28, 0.22, 0.04));
  Lb.add(M.escuro, naFace('z1', E.z1, gar.x0, gar.x1, 2.7, H, 0, 0.2, 3));
  Lb.add(M.escuro, naFace('z1', E.z1, gar.x1, E.x1, 0, H, 0, 0.2, 3));
  Lb.add(M.escuro, naFace('z1', E.z1, E.x0, E.x1, H, hBase, 0, 0.2, 3));
  for (let i = 0; i < 7; i++) Lb.add(M.caixilho, naFace('z1', E.z1, E.x0 + 1 + i * 2.8, E.x0 + 2.6 + i * 2.8, H + 1.0, H + 1.6, -0.01, 0.05));
  void segX0;
  const base = Lb.construir('embasamento');
  // letreiro
  const texL = texLetreiro(emp.nome, emp.subtitulo, emp.identidade.fonteAssinatura);
  const matL = new THREE.MeshStandardMaterial({ map: texL, transparent: true, emissiveMap: texL, emissive: '#ffffff', emissiveIntensity: 0.25, roughness: 0.4, depthWrite: false });
  const letreiro = new THREE.Mesh(plano(4.8, 1.2), matL);
  letreiro.position.set(E.x0 - 0.03, 4.15, (ent.z0 + ent.z1) / 2);
  letreiro.rotation.y = -Math.PI / 2;
  letreiro.name = 'letreiro';
  base.add(letreiro);
  const g1 = new THREE.Group(); g1.name = 'pav-base'; g1.add(base);
  grupo.add(g1);
  for (const n of E.pavimentos) pavGrupos.set(n, g1);

  // ---------- Pavimentos tipo ----------
  const residenciais = emp.pavimentos.filter((p) => p.tipo !== 'embasamento').map((p) => p.numero).sort((a, b) => a - b);
  const topo = residenciais[residenciais.length - 1];
  for (const n of residenciais) {
    const pav = emp.pavimentos.find((p) => p.numero === n)!;
    const y = (n - 1) * H;
    const L = new Lote();
    const ocupados = ocupacaoPavimento(emp, n, false);
    const descobertas = (pav.areasDescobertas ?? []).map((a) => a.ret);
    lajes(L, M, [...ocupados, ...descobertas], y - 0.05, y + 0.15);
    const Lt = new Lote();
    lajes(Lt, M, ocupados, y + H - 0.25, y + H, 0.06);
    // terraços / áreas descobertas: deck, guarda-corpo, floreiras
    for (const d of descobertas) {
      L.add(M.deck, caixa(d[0] + 0.02, d[1] - 0.02, y + 0.15, y + 0.17, d[2] + 0.02, d[3] - 0.02, 1.2));
      for (const s of segmentosLivres([d], [...ocupados, ...descobertas.filter((x) => x !== d)], 0.8)) {
        L.add(M.guarda, naFace(s.lado, s.fixo, s.a0, s.a1, y + 0.17, y + 1.27, 0.03, 0.02));
        L.add(M.caixilho, naFace(s.lado, s.fixo, s.a0, s.a1, y + 1.25, y + 1.3, 0.01, 0.06));
        if (s.comprimento > 4) floreira(L, M, { ...s, a0: s.a0 + 0.3, a1: Math.min(s.a1 - 0.3, s.a0 + 3.5) }, y + 0.17);
      }
    }
    // núcleo (escadas/elevadores): paredes escuras
    for (const s of segmentosLivres(pav.nucleo ?? [], ocupados, 0.5)) L.add(M.escuro, naFace(s.lado, s.fixo, s.a0, s.a1, y + 0.15, y + H - 0.25, 0, 0.2, 3));
    // áreas comuns fechadas (ex.: sala de reuniões): pele de vidro
    for (const ac of pav.areasComuns ?? []) {
      for (const s of segmentosLivres([ac.ret], ocupados.filter((o) => o !== ac.ret), 0.5)) {
        montarFace(L, M, s, y, H, [{ s0: s.a0 + 0.1, s1: s.a1 - 0.1, y0: 0.1, y1: 2.5, tipo: 'vidro' }], M.escuro, M.vidroComum);
      }
    }
    // unidades
    const doPavimento = emp.unidades.filter((u) => u.pavimento === n || u.pavimentosOcupados?.includes(n));
    for (const u of doPavimento) {
      const superior = u.pavimento !== n;
      const vols = superior ? u.volumesSuperiores ?? [] : u.volumes;
      const ambs = ambientesDaUnidade(emp, u).filter((a) => a.nivel === (superior ? 1 : 0)).map((a) => a.ambiente);
      const vidro = vidros.get(u.id)!;
      for (const s of segmentosLivres(vols, ocupados, 0.3)) {
        const parede = s.comprimento < 1.2 ? M.escuro : M.claro;
        montarFace(L, M, s, y, H, aberturas(s, ambs, H), parede, vidro);
      }
      // varandas: paredes internas (porta de vidro para a sala, ripado no fundo)
      for (const a of ambs.filter((x) => x.tipo === 'varanda')) {
        const internos = segmentosLivres([a.ret], [], 0.5).filter((s) => !segmentosLivres(vols, ocupados, 0.3).some((e) => e.lado === s.lado && Math.abs(e.fixo - s.fixo) < 0.05));
        internos.sort((p, q) => q.comprimento - p.comprimento);
        internos.forEach((s, i) => {
          const inv: Segmento = { ...s, lado: ({ x0: 'x1', x1: 'x0', z0: 'z1', z1: 'z0' } as const)[s.lado] };
          if (i === 0) montarFace(L, M, inv, y, H, [{ s0: s.a0 + 0.25, s1: s.a1 - 0.25, y0: 0.05, y1: 2.5, tipo: 'vidro' }], M.ripado, vidro);
          else L.add(M.ripado, naFace(inv.lado, inv.fixo, s.a0, s.a1, y + 0.15, y + H - 0.25, 0, 0.12, 1));
        });
        L.add(M.pisoExt, caixa(a.ret[0] + 0.05, a.ret[1] - 0.05, y + 0.15, y + 0.17, a.ret[2] + 0.05, a.ret[3] - 0.05, 1.8));
        L.add(M.led, caixa(a.ret[0] + 0.3, a.ret[1] - 0.3, y + H - 0.27, y + H - 0.25, (a.ret[2] + a.ret[3]) / 2 - 0.03, (a.ret[2] + a.ret[3]) / 2 + 0.03));
      }
    }
    // cobertura do último pavimento: platibanda, casa de máquinas, caixa d'água, aquecedor solar
    if (n === topo) {
      for (const s of segmentosLivres(ocupados, ocupados, 0.5)) L.add(M.escuro, naFace(s.lado, s.fixo, s.a0, s.a1, y + H, y + H + 1.0, -0.06, 0.2, 3));
      const nuc = pav.nucleo?.[0];
      if (nuc) {
        L.add(M.escuro, caixa(nuc[0], nuc[1], y + H, y + H + 3.2, nuc[2], nuc[3], 3));
        L.add(M.claro, caixa(nuc[0] + 0.5, nuc[1] - 0.5, y + H + 3.2, y + H + 4.8, nuc[2] + 0.5, nuc[3] - 0.5, 3));
      }
      // painéis solares voltados para o Norte
      const azN = (0 - emp.geo.azimuteTopoPlanta) * Math.PI / 180;
      const alvo = emp.unidades.find((u) => u.volumesSuperiores?.length)?.volumesSuperiores?.[0] ?? ocupados[0];
      for (let i = 0; i < 6; i++) {
        const g = new THREE.BoxGeometry(1.0, 0.05, 2.0);
        g.rotateX(-0.42);
        g.rotateY(Math.atan2(Math.sin(azN), -Math.cos(azN)) + Math.PI);
        g.translate(alvo[0] + 1.3 + (i % 3) * 2.2, y + H + 0.8, alvo[2] + 1.8 + Math.floor(i / 3) * 2.8);
        L.add(M.solar, g);
      }
    }
    // pilares escuros marcantes na fachada (como no render): nas divisas entre unidades das fachadas principais
    if (n < topo) {
      for (const s of segmentosLivres(ocupados, ocupados, 0.5)) {
        if (s.comprimento > 12) {
          const m = s.a0 + s.comprimento * 0.37;
          L.add(M.escuro, naFace(s.lado, s.fixo, m - 0.35, m + 0.35, y - 0.05, y + H, -0.35, 0.4, 3));
        }
      }
    }
    const gp = L.construir(`pav-${n}`);
    gp.userData.pavimento = n;
    const teto = Lt.construir(`teto-${n}`);
    gp.add(teto);
    gp.userData.teto = teto;
    torre.add(gp);
    pavGrupos.set(n, gp);
  }

  // ---------- Volumes clicáveis por unidade ----------
  const matsStatus = Object.fromEntries(Object.entries(STATUS_INFO).map(([k, v]) => [k, new THREE.MeshBasicMaterial({ color: v.cor, transparent: true, opacity: 0.5, depthWrite: false })])) as Record<StatusUnidade, THREE.MeshBasicMaterial>;
  const matPick = new THREE.MeshBasicMaterial({ visible: false });
  const linhaHover = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 });
  const linhaSel = new THREE.LineBasicMaterial({ color: '#ffd166' });
  for (const u of emp.unidades) {
    const geos: THREE.BufferGeometry[] = [];
    const caixas: [Ret, number][] = u.volumes.map((v) => [v, u.pavimento]);
    if (u.volumesSuperiores && u.pavimentosOcupados) for (const v of u.volumesSuperiores) caixas.push([v, u.pavimentosOcupados[u.pavimentosOcupados.length - 1]]);
    const centro = new THREE.Vector3();
    let area = 0;
    for (const [v, p] of caixas) {
      const y = (p - 1) * H;
      geos.push(caixa(v[0] - 0.08, v[1] + 0.08, y + 0.17, y + H - 0.27, v[2] - 0.08, v[3] + 0.08));
      const a = (v[1] - v[0]) * (v[3] - v[2]);
      centro.add(new THREE.Vector3(((v[0] + v[1]) / 2) * a, (y + H / 2) * a, ((v[2] + v[3]) / 2) * a));
      area += a;
    }
    centro.divideScalar(area);
    const geo = mergeSimples(geos);
    const pick = new THREE.Mesh(geo, matPick);
    pick.userData.unidadeId = u.id;
    const realce = new THREE.Mesh(geo, matsStatus.disponivel);
    realce.visible = false;
    realce.renderOrder = 5;
    realce.userData.unidadeId = u.id;
    const contorno = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), linhaHover);
    contorno.visible = false;
    contorno.renderOrder = 6;
    const g = pavGrupos.get(u.pavimento)!;
    g.add(pick, realce, contorno);
    unidades.set(u.id, { id: u.id, pavimento: u.pavimento, pavimentos: u.pavimentosOcupados ?? [u.pavimento], vidro: vidros.get(u.id)!, pick, realce, contorno, centro, foco: focoDaUnidade(emp, u, H) });
  }

  const T = emp.predio.torre;
  const centro = new THREE.Vector3((T.x0 + T.x1) / 2, (topo * H) / 2, (T.z0 + T.z1) / 2);
  let realceOn = false;
  let isoAtual: number | null = null;
  let ultimoStatus: Record<string, StatusUnidade> = {};
  const destaques: Record<'hover' | 'selecao', string | null> = { hover: null, selecao: null };

  function atualizarContornos() {
    for (const uc of unidades.values()) {
      const sel = destaques.selecao === uc.id, hov = destaques.hover === uc.id;
      uc.contorno.visible = sel || hov;
      uc.contorno.material = sel ? linhaSel : linhaHover;
      uc.realce.visible = realceOn || sel || hov || (isoAtual != null && uc.pavimentos.includes(isoAtual));
      uc.realce.material = matsStatus[ultimoStatus[uc.id] ?? 'disponivel'];
    }
  }

  return {
    grupo, torre, pavimentos: pavGrupos, unidades, centro, altura: topo * H + 4.8,
    aplicarStatus(status, noite) {
      ultimoStatus = status;
      for (const [id, uc] of unidades) {
        const s = status[id] ?? 'disponivel';
        const v = uc.vidro;
        // À noite: disponível = luz acesa; reservado/negociação = meia-luz; vendido/indisponível = apagada.
        const intensidade = s === 'disponivel' ? 1.25 : s === 'negociacao' || s === 'reservado' ? 0.45 : 0;
        v.emissive.set(s === 'disponivel' ? '#ffcf8a' : '#ffb05c');
        v.emissiveIntensity = intensidade * noite;
      }
      M.vidroComum.emissive.set('#ffd9a0');
      M.vidroComum.emissiveIntensity = 1.2 * noite;
      M.led.emissiveIntensity = 0.4 + 3.5 * noite;
      matL.emissiveIntensity = 0.25 + 2.2 * noite;
      atualizarContornos();
    },
    mostrarRealce(on) { realceOn = on; atualizarContornos(); },
    destacar(id, tipo) { destaques[tipo] = id; atualizarContornos(); },
    isolarPavimento(nIso) {
      for (const [n, g] of pavGrupos) {
        g.visible = nIso == null || n <= nIso;
        if (g.userData.teto) g.userData.teto.visible = nIso == null || n !== nIso;
      }
      isoAtual = nIso;
      atualizarContornos();
    },
  };
}

function mergeSimples(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geos.length === 1) return geos[0];
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  let off = 0;
  for (const g of geos) {
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    pos.push(...p); nor.push(...n);
    for (const i of Array.from(g.index!.array as ArrayLike<number>)) idx.push(i + off);
    off += g.attributes.position.count;
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  r.setIndex(idx);
  return r;
}

function focoDaUnidade(emp: Empreendimento, u: UnidadeTecnica, H: number) {
  const faces = facesExternas(emp, u);
  const pont = (lado: Lado) => (lado === 'x0' || lado === 'z1' ? 3 : 0);
  const f = [...faces].sort((a, b) => b.comprimento + pont(b.lado) - (a.comprimento + pont(a.lado)))[0];
  const y = (u.pavimento - 1) * H + (u.volumesSuperiores ? H : H / 2);
  if (!f) {
    const v = u.volumes[0];
    return { ponto: new THREE.Vector3((v[0] + v[1]) / 2, y, (v[2] + v[3]) / 2), normal: new THREE.Vector3(-1, 0, 0), largura: 8 };
  }
  const [nx, nz] = NORMAL[f.lado];
  return { ponto: new THREE.Vector3((f.ret[0] + f.ret[1]) / 2, y, (f.ret[2] + f.ret[3]) / 2), normal: new THREE.Vector3(nx, 0, nz), largura: f.comprimento };
}
