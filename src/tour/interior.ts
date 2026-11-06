// Interiores gerados a partir dos ambientes da tipologia (retângulos da planta) com móveis e materiais
// inspirados nos renders do folder. Cada ambiente é montado no lugar real do apartamento: as janelas
// mostram a vista verdadeira daquele andar.
import * as THREE from 'three';
import type { Ambiente, Ret } from '../core/tipos.ts';
import type { Segmento } from '../core/sol.ts';
import { caixa, Lote } from '../cena/geo.ts';
import { texMadeira, texMarmore, texPorcelanato, texQuadro, texRipado, texTecido } from '../cena/texturas.ts';

export function materiaisInterior() {
  const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
  const lam = texMadeira(false).clone(); lam.repeat.set(1, 1); lam.needsUpdate = true;
  return {
    porcelanato: std({ map: texPorcelanato('#e9e2d6'), roughness: 0.32, metalness: 0.0 }),
    porcExt: std({ map: texPorcelanato('#cfc8bc'), roughness: 0.6 }),
    laminado: std({ map: lam, color: '#d79a6a', roughness: 0.55 }),
    deck: std({ map: texMadeira(true), color: '#b89c7c', roughness: 0.8 }),
    parede: std({ color: '#ece6dc', roughness: 0.92 }),
    paredeBanho: std({ map: texMarmore('#e8e3da', '150,140,128'), roughness: 0.35 }),
    teto: std({ color: '#f6f4ef', roughness: 0.95 }),
    madeiraClara: std({ map: texMadeira(true), roughness: 0.5 }),
    madeiraEscura: std({ map: texMadeira(false), color: '#9a6a4a', roughness: 0.5 }),
    ripado: std({ map: texRipado(), roughness: 0.6 }),
    tecido: std({ map: texTecido('#d9ccb9'), roughness: 0.95 }),
    tecidoCinza: std({ map: texTecido('#bdb6ab'), roughness: 0.95 }),
    tecidoCama: std({ map: texTecido('#efe9df'), roughness: 0.95 }),
    manta: std({ map: texTecido('#cbb79c'), roughness: 1 }),
    tapete: std({ map: texTecido('#cfc2ab'), roughness: 1 }),
    marmore: std({ map: texMarmore(), roughness: 0.18 }),
    pedraEscura: std({ map: texMarmore('#2a2a2b', '90,90,90'), roughness: 0.2 }),
    laca: std({ color: '#f1ede6', roughness: 0.35 }),
    lacaEscura: std({ color: '#3b3632', roughness: 0.4 }),
    dourado: std({ color: '#b48c4e', metalness: 1, roughness: 0.28 }),
    preto: std({ color: '#141414', roughness: 0.45, metalness: 0.2 }),
    inox: std({ color: '#9aa0a4', metalness: 1, roughness: 0.25 }),
    tela: std({ color: '#050608', roughness: 0.1, metalness: 0.5, emissive: '#0d1a2a', emissiveIntensity: 0.4 }),
    espelho: std({ color: '#d6dde0', metalness: 1, roughness: 0.03 }),
    bronze: std({ color: '#3b2a22', metalness: 0.4, roughness: 0.08, transparent: true, opacity: 0.85 }),
    louca: std({ color: '#f7f7f5', roughness: 0.15 }),
    vidro: std({ color: '#cfe0e6', transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    caixilho: std({ color: '#151618', metalness: 0.55, roughness: 0.35 }),
    cortina: std({ map: texTecido('#f3efe8'), transparent: true, opacity: 0.72, roughness: 1, side: THREE.DoubleSide }),
    planta: std({ color: '#4d7036', roughness: 0.9, flatShading: true }),
    vaso: std({ color: '#2a2a2a', roughness: 0.6 }),
    led: std({ color: '#ffffff', emissive: '#fff1d6', emissiveIntensity: 2.2 }),
    lampada: std({ color: '#fff7e8', emissive: '#ffe1b0', emissiveIntensity: 1.6 }),
    quadro: std({ map: texQuadro(3), roughness: 0.6 }),
    quadro2: std({ map: texQuadro(8), roughness: 0.6 }),
    churrasqueira: std({ color: '#2b2b2c', roughness: 0.6, metalness: 0.3 }),
  };
}
export type MatsInt = ReturnType<typeof materiaisInterior>;

export interface AmbienteMontado { grupo: THREE.Group; vista: { pos: THREE.Vector3; olhar: THREE.Vector3 }; luzes: THREE.PointLight[] }

type Lado = 'x0' | 'x1' | 'z0' | 'z1';

const PE = 2.7; // pé-direito interno (forro)

/** Monta um ambiente. `externos`: trechos das bordas que são fachada (recebem janela/guarda-corpo). */
export function montarAmbiente(a: Ambiente, y: number, externos: Segmento[], M: MatsInt): AmbienteMontado {
  const L = new Lote();
  const [x0, x1, z0, z1] = a.ret;
  const w = x1 - x0, d = z1 - z0;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const descoberto = a.tipo === 'terraco';
  const aberto = a.tipo === 'varanda' || descoberto;
  const molhado = a.tipo === 'banho' || a.tipo === 'lavabo';
  const piso = aberto ? (descoberto ? M.deck : M.porcExt) : a.tipo === 'quarto' || a.tipo === 'suite' ? M.laminado : M.porcelanato;
  const yp = y + 0.15;
  L.add(piso, caixa(x0, x1, yp - 0.05, yp, z0, z1, a.tipo === 'quarto' || a.tipo === 'suite' ? 1.4 : 1.8));
  if (!descoberto) {
    L.add(M.teto, caixa(x0, x1, yp + PE, yp + PE + 0.05, z0, z1, 2));
    // rasgos de LED no forro (como nos renders)
    if (!molhado) {
      const longo = w >= d;
      for (const k of w * d > 14 ? [0.3, 0.7] : [0.5]) {
        if (longo) L.add(M.led, caixa(x0 + 0.4, x1 - 0.4, yp + PE - 0.01, yp + PE, z0 + d * k - 0.02, z0 + d * k + 0.02));
        else L.add(M.led, caixa(x0 + w * k - 0.02, x0 + w * k + 0.02, yp + PE - 0.01, yp + PE, z0 + 0.4, z1 - 0.4));
      }
    } else L.add(M.led, caixa(cx - 0.15, cx + 0.15, yp + PE - 0.01, yp + PE, cz - 0.15, cz + 0.15));
  }
  // paredes
  const ladoExt = new Map<Lado, Segmento[]>();
  for (const s of externos) ladoExt.set(s.lado, [...(ladoExt.get(s.lado) ?? []), s]);
  const esp = 0.08;
  const parede = molhado ? M.paredeBanho : M.parede;
  const paredeLado = (lado: Lado, s0: number, s1: number, ya: number, yb: number, mat: THREE.Material = parede) => {
    if (s1 - s0 < 0.01 || yb - ya < 0.01) return;
    if (lado === 'x0') L.add(mat, caixa(x0, x0 + esp, ya, yb, s0, s1, 2));
    if (lado === 'x1') L.add(mat, caixa(x1 - esp, x1, ya, yb, s0, s1, 2));
    if (lado === 'z0') L.add(mat, caixa(s0, s1, ya, yb, z0, z0 + esp, 2));
    if (lado === 'z1') L.add(mat, caixa(s0, s1, ya, yb, z1 - esp, z1, 2));
  };
  const naParede = (lado: Lado, s0: number, s1: number, ya: number, yb: number, recuo: number, prof: number, mat: THREE.Material, escala = 1) => {
    if (lado === 'x0') L.add(mat, caixa(x0 + recuo, x0 + recuo + prof, ya, yb, s0, s1, escala));
    if (lado === 'x1') L.add(mat, caixa(x1 - recuo - prof, x1 - recuo, ya, yb, s0, s1, escala));
    if (lado === 'z0') L.add(mat, caixa(s0, s1, ya, yb, z0 + recuo, z0 + recuo + prof, escala));
    if (lado === 'z1') L.add(mat, caixa(s0, s1, ya, yb, z1 - recuo - prof, z1 - recuo, escala));
  };
  const lados: Lado[] = ['x0', 'x1', 'z0', 'z1'];
  const extens = (l: Lado): [number, number] => (l === 'z0' || l === 'z1' ? [x0, x1] : [z0, z1]);
  let portaFeita = false;
  const internos: Lado[] = [];
  for (const lado of lados) {
    const [e0, e1] = extens(lado);
    const segs = (ladoExt.get(lado) ?? []).map((s) => [Math.max(e0, s.a0), Math.min(e1, s.a1)] as [number, number]).filter(([p, q]) => q - p > 0.4).sort((p, q) => p[0] - q[0]);
    if (!segs.length) internos.push(lado);
    let cur = e0;
    for (const [s0, s1] of segs) {
      if (descoberto && s0 > cur) paredeLado(lado, cur, s0, yp, yp + 1.1);
      else paredeLado(lado, cur, s0, yp, yp + PE);
      const L2 = s1 - s0;
      if (aberto) {
        naParede(lado, s0, s1, yp, yp + 1.1, 0.02, 0.02, M.vidro);
        naParede(lado, s0, s1, yp + 1.08, yp + 1.13, 0.0, 0.06, M.caixilho);
        if (!descoberto) paredeLado(lado, s0, s1, yp + PE - 0.15, yp + PE);
      } else {
        const tipoJ = a.tipo === 'sala' || a.tipo === 'gourmet' || a.tipo === 'salaTv' ? 'grande' : molhado ? 'pequena' : 'media';
        const largJ = tipoJ === 'grande' ? Math.min(L2 - 0.4, 4.2) : tipoJ === 'media' ? Math.min(L2 - 0.6, 2.0) : Math.min(L2 - 0.3, 0.8);
        const yA = tipoJ === 'grande' ? 0.05 : tipoJ === 'media' ? (a.tipo === 'cozinha' ? 1.15 : 0.95) : 1.6;
        const yB = tipoJ === 'pequena' ? 2.2 : 2.45;
        const m = (s0 + s1) / 2, j0 = m - largJ / 2, j1 = m + largJ / 2;
        paredeLado(lado, s0, j0, yp, yp + PE); paredeLado(lado, j1, s1, yp, yp + PE);
        paredeLado(lado, j0, j1, yp, yp + yA); paredeLado(lado, j0, j1, yp + yB, yp + PE);
        naParede(lado, j0, j1, yp + yA, yp + yB, 0.03, 0.02, M.vidro);
        for (const [p0, p1, q0, q1] of [[j0, j1, yA, yA + 0.05], [j0, j1, yB - 0.05, yB], [j0, j0 + 0.05, yA, yB], [j1 - 0.05, j1, yA, yB], [m - 0.025, m + 0.025, yA, yB]] as [number, number, number, number][]) naParede(lado, p0, p1, yp + q0, yp + q1, 0.0, 0.07, M.caixilho);
        if (!molhado && a.tipo !== 'cozinha') {
          // cortina de voil recolhida num dos lados + trilho
          naParede(lado, j0 - 0.3, j0 + Math.min(0.9, largJ * 0.3), yp + 0.02, yp + PE - 0.05, 0.12, 0.05, M.cortina);
          naParede(lado, j0 - 0.3, j1 + 0.3, yp + PE - 0.06, yp + PE - 0.01, 0.1, 0.12, M.teto);
        }
      }
      cur = s1;
    }
    if (cur < e1) {
      if (descoberto && segs.length) paredeLado(lado, cur, e1, yp, yp + 1.1);
      else if (!descoberto || !segs.length) paredeLado(lado, cur, e1, yp, descoberto ? yp + 1.1 : yp + PE);
    }
  }
  // porta (folha de madeira) numa parede interna
  if (!descoberto) {
    const ladoP = internos.sort((p, q) => { const [a0, a1] = extens(p), [b0, b1] = extens(q); return (b1 - b0) - (a1 - a0); })[0];
    if (ladoP) {
      const [e0, e1] = extens(ladoP);
      if (a.tipo === 'varanda') {
        naParede(ladoP, e0 + 0.2, e1 - 0.2, yp, yp + 2.45, 0.04, 0.03, M.vidro);
        for (const s of [e0 + 0.2, (e0 + e1) / 2, e1 - 0.25]) naParede(ladoP, s, s + 0.05, yp, yp + 2.45, 0.02, 0.07, M.caixilho);
      } else if (e1 - e0 > 1.2) {
        const p0 = e1 - 0.25 - 0.82;
        naParede(ladoP, p0, p0 + 0.82, yp, yp + 2.1, esp, 0.04, M.madeiraEscura, 2);
        naParede(ladoP, p0 + 0.65, p0 + 0.7, yp + 1.0, yp + 1.04, esp + 0.04, 0.05, M.inox);
        portaFeita = true;
      }
    }
  }
  void portaFeita;

  const luzes: THREE.PointLight[] = [];
  const luz = (x: number, yy: number, z: number, i: number, dist = 0) => { const p = new THREE.PointLight('#ffe2b8', i, dist, 2); p.position.set(x, yy, z); luzes.push(p); };

  // ---------- mobiliário ----------
  const longoX = w >= d;
  const ladoExtPrincipal = ([...ladoExt.entries()].sort((p, q) => q[1].reduce((s, x) => s + x.comprimento, 0) - p[1].reduce((s, x) => s + x.comprimento, 0))[0]?.[0]) as Lado | undefined;
  const opostoDe: Record<Lado, Lado> = { x0: 'x1', x1: 'x0', z0: 'z1', z1: 'z0' };
  // utilitário: caixa em coordenadas locais (u ao longo do eixo longo, v ao longo do curto)
  const loc = (u0: number, u1: number, ya: number, yb: number, v0: number, v1: number, mat: THREE.Material, esc = 1) => {
    if (longoX) L.add(mat, caixa(x0 + u0, x0 + u1, yp + ya, yp + yb, z0 + v0, z0 + v1, esc));
    else L.add(mat, caixa(x0 + v0, x0 + v1, yp + ya, yp + yb, z0 + u0, z0 + u1, esc));
  };
  const U = longoX ? w : d, V = longoX ? d : w;
  const cil = (u: number, v: number, r: number, h: number, ya: number, mat: THREE.Material, seg = 20) => {
    const g = new THREE.CylinderGeometry(r, r, h, seg);
    const [px, pz] = longoX ? [x0 + u, z0 + v] : [x0 + v, z0 + u];
    g.translate(px, yp + ya + h / 2, pz);
    L.add(mat, g);
  };
  const toro = (u: number, v: number, R: number, r: number, ya: number, mat: THREE.Material, inclina = 0) => {
    const g = new THREE.TorusGeometry(R, r, 8, 40);
    g.rotateX(Math.PI / 2 + inclina);
    const [px, pz] = longoX ? [x0 + u, z0 + v] : [x0 + v, z0 + u];
    g.translate(px, yp + ya, pz);
    L.add(mat, g);
  };
  const plantaEm = (u: number, v: number, s = 1) => {
    cil(u, v, 0.22 * s, 0.55 * s, 0, M.vaso, 12);
    const g = new THREE.IcosahedronGeometry(0.42 * s, 1); g.scale(1, 1.4, 1);
    const [px, pz] = longoX ? [x0 + u, z0 + v] : [x0 + v, z0 + u];
    g.translate(px, yp + 1.05 * s, pz); L.add(M.planta, g);
  };
  const cadeira = (u: number, v: number, mat: THREE.Material) => {
    loc(u - 0.24, u + 0.24, 0.42, 0.5, v - 0.24, v + 0.24, mat);
    loc(u - 0.22, u + 0.22, 0, 0.42, v - 0.22, v - 0.19, M.dourado);
    loc(u - 0.22, u + 0.22, 0, 0.42, v + 0.19, v + 0.22, M.dourado);
  };
  // v=0 fica do lado "z0" (se longoX) ou "x0". Lado da janela principal em coordenadas locais:
  const vJanelaAlto = ladoExtPrincipal ? (longoX ? ladoExtPrincipal === 'z1' : ladoExtPrincipal === 'x1') : true;
  const vParedeTV = vJanelaAlto ? 0.0 : V; // parede oposta à janela no eixo curto
  const dirV = vJanelaAlto ? 1 : -1;

  switch (a.tipo) {
    case 'sala': case 'salaTv': {
      const uEstar = a.tipo === 'salaTv' ? U : Math.min(U * 0.5, 4.6);
      // painel de TV com ripado + TV
      const vT = vParedeTV === 0 ? 0.08 : V - 0.12;
      loc(0.4, uEstar - 0.3, 0.0, PE - 0.01, Math.min(vT, vT + 0.04 * dirV), Math.max(vT, vT + 0.04 * dirV), M.ripado, 1);
      loc(0.6, uEstar - 0.5, 0.0, 0.45, vT + (dirV > 0 ? 0.04 : -0.5), vT + (dirV > 0 ? 0.5 : -0.04), M.laca);
      const mt = (0.6 + uEstar - 0.5) / 2;
      loc(mt - 0.75, mt + 0.75, 1.0, 1.85, vT + (dirV > 0 ? 0.05 : -0.09), vT + (dirV > 0 ? 0.09 : -0.05), M.tela);
      // sofá voltado para a TV
      const vS = vParedeTV === 0 ? Math.min(V - 0.5, 3.2) : Math.max(0.5, V - 3.2);
      const s0 = mt - 1.3, s1 = mt + 1.3;
      loc(s0, s1, 0.08, 0.45, vS - 0.45, vS + 0.45, M.tecido);
      loc(s0, s1, 0.45, 0.85, vS + 0.3 * dirV - 0.12, vS + 0.3 * dirV + 0.12, M.tecido);
      loc(s0 - 0.05, s0 + 0.2, 0.08, 0.62, vS - 0.45, vS + 0.45, M.tecido);
      loc(s1 - 0.2, s1 + 0.05, 0.08, 0.62, vS - 0.45, vS + 0.45, M.tecido);
      loc(s0 + 0.1, s0 + 0.9, 0.45, 0.55, vS - 0.4, vS + 0.35, M.tecidoCinza);
      loc(s0 - 0.6, s0 + 0.3, 0.08, 0.45, vS - 1.3 * dirV - 0.45, vS + 0.0, M.tecido);
      // tapete e mesa de centro
      const vm = (vS + vT) / 2;
      loc(mt - 1.4, mt + 1.4, 0.0, 0.01, vm - 0.9, vm + 0.9, M.tapete, 2);
      loc(mt - 0.5, mt + 0.5, 0.3, 0.36, vm - 0.3, vm + 0.3, M.madeiraClara);
      loc(mt - 0.45, mt - 0.39, 0, 0.3, vm - 0.25, vm - 0.19, M.preto);
      loc(mt + 0.39, mt + 0.45, 0, 0.3, vm + 0.19, vm + 0.25, M.preto);
      plantaEm(Math.max(0.4, s0 - 0.3), vS + 0.3 * dirV, 1.1);
      luz(x0 + (longoX ? mt : vm), yp + PE - 0.3, z0 + (longoX ? vm : mt), 14);
      if (a.tipo === 'sala' && U - uEstar > 2) {
        // jantar: mesa branca, cadeiras, pendente em anéis dourados, aparador e quadro
        const uj = uEstar + (U - uEstar) / 2, vj = V / 2;
        const lm = Math.min(2.1, U - uEstar - 1.2);
        loc(uj - lm / 2, uj + lm / 2, 0.73, 0.77, vj - 0.48, vj + 0.48, M.marmore);
        loc(uj - 0.08, uj + 0.08, 0, 0.73, vj - 0.3, vj + 0.3, M.preto);
        for (let k = 0; k < 3; k++) { const uu = uj - lm / 2 + 0.35 + k * ((lm - 0.7) / 2); cadeira(uu, vj - 0.75, M.tecido); cadeira(uu, vj + 0.75, M.tecido); }
        toro(uj, vj, 0.55, 0.025, PE - 0.75, M.dourado, 0.15);
        toro(uj, vj, 0.38, 0.025, PE - 0.9, M.dourado, -0.2);
        loc(uj - 0.005, uj + 0.005, PE - 0.75, PE, vj - 0.005, vj + 0.005, M.preto);
        const vA = vParedeTV === 0 ? 0.1 : V - 0.55;
        loc(uj - 0.9, uj + 0.9, 0.0, 0.8, vA, vA + 0.45, M.laca);
        loc(uj - 0.6, uj + 0.6, 1.2, 2.1, vA + (vParedeTV === 0 ? -0.05 : 0.45), vA + (vParedeTV === 0 ? -0.02 : 0.48), M.quadro);
        luz(x0 + (longoX ? uj : vj), yp + PE - 0.9, z0 + (longoX ? vj : uj), 10);
      }
      break;
    }
    case 'cozinha': {
      const vB = vParedeTV === 0 ? 0 : V - 0.62;
      loc(0.1, U - 0.1, 0, 0.86, vB + 0.02, vB + 0.6, M.lacaEscura);
      loc(0.1, U - 0.1, 0.86, 0.9, vB, vB + 0.62, M.pedraEscura);
      loc(0.1, U - 0.1, 1.55, 2.25, vB + (vParedeTV === 0 ? 0 : 0.27), vB + (vParedeTV === 0 ? 0.35 : 0.62), M.madeiraEscura, 1.5);
      loc(U * 0.35, U * 0.35 + 0.6, 0.9, 0.91, vB + 0.05, vB + 0.55, M.preto);
      loc(U * 0.65, U * 0.65 + 0.5, 0.87, 0.91, vB + 0.12, vB + 0.5, M.inox);
      loc(U - 0.85, U - 0.12, 0, 1.85, vB + 0.0, vB + 0.68, M.inox);
      if (V > 2.0) {
        const vI = vParedeTV === 0 ? V - 0.75 : 0.25;
        loc(0.4, Math.min(U - 1.0, 2.2), 0, 1.05, vI, vI + 0.5, M.madeiraClara);
        for (let k = 0; k < 2; k++) cil(0.8 + k * 0.6, vI + (vParedeTV === 0 ? 0.75 : -0.3), 0.18, 0.75, 0, M.madeiraEscura, 12);
      }
      luz(cx, yp + PE - 0.3, cz, 8);
      break;
    }
    case 'quarto': case 'suite': {
      const casal = a.tipo === 'suite' || V > 3.0;
      const lb = casal ? (a.tipo === 'suite' ? 1.6 : 1.4) : 0.9, cb = 2.0;
      // cabeceira na parede curta oposta à janela (eixo u): cama ao longo de u
      const uC = 0.08;
      const vc = V / 2;
      loc(uC, uC + 0.06, 0, 1.25, vc - lb / 2 - 0.6, vc + lb / 2 + 0.6, M.ripado);
      loc(uC + 0.06, uC + 0.06 + cb, 0.0, 0.35, vc - lb / 2, vc + lb / 2, M.madeiraEscura);
      loc(uC + 0.08, uC + 0.04 + cb, 0.35, 0.55, vc - lb / 2 + 0.02, vc + lb / 2 - 0.02, M.tecidoCama, 1);
      loc(uC + 0.9, uC + 0.04 + cb, 0.55, 0.6, vc - lb / 2 + 0.02, vc + lb / 2 - 0.02, M.manta, 1);
      for (const s of casal ? [-0.35, 0.35] : [0]) loc(uC + 0.12, uC + 0.42, 0.55, 0.72, vc + s - 0.3, vc + s + 0.3, M.tecidoCama);
      // criados-mudos + pendentes
      for (const sg of [-1, 1]) {
        const vv = vc + sg * (lb / 2 + 0.32);
        loc(uC + 0.1, uC + 0.5, 0.0, 0.5, vv - 0.22, vv + 0.22, M.madeiraClara);
        loc(uC + 0.27, uC + 0.29, 0.5, PE, vv - 0.01, vv + 0.01, M.dourado);
        const g = new THREE.SphereGeometry(0.09, 16, 12);
        const [px, pz] = longoX ? [x0 + uC + 0.28, z0 + vv] : [x0 + vv, z0 + uC + 0.28];
        g.translate(px, yp + 0.95, pz); L.add(M.lampada, g);
      }
      loc(uC + 0.7, uC + 2.4, 0.0, 0.01, vc - lb / 2 - 0.5, vc + lb / 2 + 0.5, M.tapete);
      // armário (bronze na suíte, como no render) na parede lateral livre
      const vArm = vParedeTV === 0 ? V - 0.62 : 0.02;
      if (U > 3.1 || V > 3.3) {
        const uA0 = Math.max(uC + cb + 0.6, U - 2.6), uA1 = U - 0.1;
        if (uA1 - uA0 > 0.9 && (V - lb) / 2 > 0.9) {
          loc(uA0, uA1, 0, PE - 0.05, vArm, vArm + 0.6, a.tipo === 'suite' ? M.bronze : M.laca);
        }
      }
      if (a.tipo === 'suite') loc(uC + 0.3, uC + 1.4, 1.35, 2.0, vc - 0.5, vc + 0.5, M.quadro2);
      luz(cx, yp + PE - 0.3, cz, 7);
      break;
    }
    case 'banho': case 'lavabo': {
      const vB = vParedeTV === 0 ? 0 : V - 0.5;
      loc(0.15, Math.min(1.3, U * 0.5), 0.8, 0.9, vB, vB + 0.5, a.tipo === 'lavabo' ? M.marmore : M.marmore);
      loc(0.15, Math.min(1.3, U * 0.5), 0.3, 0.8, vB + 0.02, vB + 0.45, a.tipo === 'lavabo' ? M.preto : M.madeiraClara);
      // espelho orgânico
      const um = (0.15 + Math.min(1.3, U * 0.5)) / 2;
      const g = new THREE.CylinderGeometry(0.45, 0.45, 0.02, 40); g.rotateX(Math.PI / 2); g.scale(1.1, 1.3, 1);
      if (!longoX) g.rotateY(Math.PI / 2);
      const [px, pz] = longoX ? [x0 + um, z0 + (vParedeTV === 0 ? 0.1 : V - 0.1)] : [x0 + (vParedeTV === 0 ? 0.1 : V - 0.1), z0 + um];
      g.translate(px, yp + 1.6, pz); L.add(M.espelho, g);
      // vaso sanitário
      const uv = Math.min(U - 0.4, um + 0.85);
      loc(uv - 0.19, uv + 0.19, 0, 0.4, vB + 0.05, vB + 0.65, M.louca);
      loc(uv - 0.19, uv + 0.19, 0.4, 0.8, vB + 0.02, vB + 0.2, M.louca);
      if (a.tipo === 'banho' && U > 1.8) {
        // box de vidro no fundo
        const u0 = U - 0.95;
        loc(u0, u0 + 0.02, 0, 2.0, 0.05, V - 0.05, M.vidro);
        loc(u0 + 0.5, u0 + 0.7, PE - 0.3, PE - 0.28, V / 2 - 0.1, V / 2 + 0.1, M.inox);
      }
      luz(cx, yp + PE - 0.3, cz, 4);
      break;
    }
    case 'varanda': {
      const um = U / 2, vm = V / 2;
      cil(um, vm, 0.5, 0.04, 0.72, M.madeiraClara, 32);
      cil(um, vm, 0.06, 0.72, 0, M.preto, 10);
      for (let k = 0; k < 4; k++) { const ang = k * Math.PI / 2 + 0.4; cadeira(um + Math.cos(ang) * 0.8, vm + Math.sin(ang) * 0.8, M.tecidoCinza); }
      plantaEm(0.4, 0.4, 1.2); plantaEm(U - 0.4, 0.4, 0.9);
      if (U > 3.5) {
        const vB = vParedeTV === 0 ? 0 : V - 0.6;
        loc(U - 1.9, U - 0.1, 0, 0.9, vB, vB + 0.6, M.lacaEscura);
        loc(U - 1.9, U - 0.1, 0.9, 0.94, vB, vB + 0.6, M.pedraEscura);
        loc(U - 1.2, U - 0.4, 0.94, 1.6, vB + 0.05, vB + 0.55, M.churrasqueira);
      }
      luz(cx, yp + PE - 0.3, cz, 5);
      break;
    }
    case 'gourmet': {
      const vm = V / 2;
      const lm = Math.min(3.0, U - 2.6);
      const um = U * 0.42;
      loc(um - lm / 2, um + lm / 2, 0.73, 0.78, vm - 0.5, vm + 0.5, M.madeiraClara);
      loc(um - lm / 2 + 0.1, um - lm / 2 + 0.16, 0, 0.73, vm - 0.45, vm + 0.45, M.preto);
      loc(um + lm / 2 - 0.16, um + lm / 2 - 0.1, 0, 0.73, vm - 0.45, vm + 0.45, M.preto);
      for (let k = 0; k < 4; k++) { const uu = um - lm / 2 + 0.4 + k * ((lm - 0.8) / 3); cadeira(uu, vm - 0.78, M.madeiraEscura); cadeira(uu, vm + 0.78, M.madeiraEscura); }
      const vB = vParedeTV === 0 ? 0 : V - 0.62;
      loc(U - 2.8, U - 0.1, 0, 0.9, vB, vB + 0.62, M.lacaEscura);
      loc(U - 2.8, U - 0.1, 0.9, 0.94, vB, vB + 0.62, M.pedraEscura);
      loc(U - 1.4, U - 0.5, 0.94, 1.9, vB + 0.05, vB + 0.6, M.churrasqueira);
      loc(U - 1.5, U - 0.4, 1.9, PE, vB + 0.02, vB + 0.5, M.churrasqueira);
      loc(0.1, 0.5, 0, 2.2, vB + 0.05, vB + 0.45, M.preto);
      for (let k = 0; k < 6; k++) loc(0.12, 0.48, 0.3 + k * 0.3, 0.33 + k * 0.3, vB + 0.07, vB + 0.43, M.madeiraEscura);
      luz(cx, yp + PE - 0.3, cz, 14);
      break;
    }
    case 'terraco': {
      for (let k = 0; k < 2; k++) {
        const uu = U * 0.3 + k * 1.1;
        loc(uu - 0.35, uu + 0.35, 0.05, 0.35, V * 0.35 - 0.95, V * 0.35 + 0.95, M.madeiraClara);
        loc(uu - 0.33, uu + 0.33, 0.35, 0.45, V * 0.35 - 0.6, V * 0.35 + 0.92, M.tecidoCama);
      }
      plantaEm(0.5, 0.5, 1.4); plantaEm(U - 0.5, 0.5, 1.2); plantaEm(U - 0.5, V - 0.5, 1.3);
      cil(U * 0.7, V * 0.55, 0.45, 0.04, 0.4, M.madeiraClara);
      break;
    }
  }

  const grupo = L.construir(`amb-${a.id}`);
  grupo.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  for (const p of luzes) grupo.add(p);

  // ponto de vista: canto oposto à janela principal, olhando para ela
  const olho = 1.6;
  let pos: THREE.Vector3, olhar: THREE.Vector3;
  if (ladoExtPrincipal) {
    const op = opostoDe[ladoExtPrincipal];
    const recuo = 0.55;
    const px = op === 'x0' ? x0 + recuo : op === 'x1' ? x1 - recuo : x0 + w * 0.25;
    const pz = op === 'z0' ? z0 + recuo : op === 'z1' ? z1 - recuo : z0 + d * 0.25;
    pos = new THREE.Vector3(px, yp + olho, pz);
    const ox = ladoExtPrincipal === 'x0' ? x0 : ladoExtPrincipal === 'x1' ? x1 : x0 + w * 0.7;
    const oz = ladoExtPrincipal === 'z0' ? z0 : ladoExtPrincipal === 'z1' ? z1 : z0 + d * 0.7;
    olhar = new THREE.Vector3(ox, yp + 1.2, oz);
  } else {
    pos = new THREE.Vector3(x0 + Math.min(0.5, w * 0.3), yp + olho, z0 + Math.min(0.5, d * 0.3));
    olhar = new THREE.Vector3(x1 - 0.2, yp + 1.2, z1 - 0.2);
  }
  if (descoberto) pos.y = yp + 1.75;
  return { grupo, vista: { pos, olhar }, luzes };
}

export function areaRet(r: Ret): number { return (r[1] - r[0]) * (r[3] - r[2]); }
