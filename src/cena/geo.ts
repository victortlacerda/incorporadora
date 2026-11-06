// Construtor de geometria: junta caixas por material e funde em poucas malhas (menos chamadas de desenho).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Caixa alinhada aos eixos com UV em escala de mundo (1 repetição da textura = `escala` metros). */
export function caixa(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, escala = 1): THREE.BufferGeometry {
  const w = Math.max(0.001, x1 - x0), h = Math.max(0.001, y1 - y0), d = Math.max(0.001, z1 - z0);
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // ordem das faces: +x, -x, +y, -y, +z, -z (4 vértices cada)
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / escala, (uv.getY(i) * dims[f][1]) / escala);
    }
  }
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

/** Plano vertical/horizontal simples com UV em escala de mundo. */
export function plano(w: number, h: number, escala = 1): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / escala, (uv.getY(i) * h) / escala);
  return g;
}

function semIndice(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
  return n;
}

export class Lote {
  private porMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(mat: THREE.Material, g: THREE.BufferGeometry) {
    const l = this.porMat.get(mat) ?? [];
    l.push(g);
    this.porMat.set(mat, l);
  }
  get vazio() { return this.porMat.size === 0; }
  /** Funde e devolve um grupo com uma malha por material. */
  construir(nome: string, sombra = { projeta: true, recebe: true }): THREE.Group {
    const grupo = new THREE.Group();
    grupo.name = nome;
    for (const [mat, geos] of this.porMat) {
      const g = mergeGeometries(geos.map(semIndice), false);
      geos.forEach((x) => x.dispose());
      if (!g) continue;
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat);
      const transparente = (mat as THREE.MeshStandardMaterial).transparent;
      m.castShadow = sombra.projeta && !transparente;
      m.receiveShadow = sombra.recebe;
      grupo.add(m);
    }
    this.porMat.clear();
    return grupo;
  }
}
