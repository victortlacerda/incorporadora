// Entorno urbano gerado: quadras alinhadas às ruas reais (Rua Ceará × Rua Bahia), vizinhos, árvores,
// postes, carros, nomes de ruas e morros no horizonte. É APROXIMADO (não é o levantamento real do bairro).
import * as THREE from 'three';
import type { Empreendimento } from '../core/tipos.ts';
import { rng } from '../core/util.ts';
import { caixa, Lote, plano } from './geo.ts';
import { texAsfalto, texCalcada, texGrama, texRevestimento, texTerreno, texTexto, texVizinho } from './texturas.ts';

export interface Rua { nome: string; eixo: 'x' | 'z'; centro: number }

export interface EntornoCena {
  grupo: THREE.Group;
  aplicarNoite(f: number): void;
  luzesRua: THREE.PointLight[];
}

const PERIODO = 90; // distância entre eixos de ruas (medido na vista de satélite)
const RUA = 14; // largura total (2,5 calçada + 9 pista + 2,5 calçada)
const CALC = 2.5;

export function criarEntorno(emp: Empreendimento, ruasNomeadas: Rua[]): EntornoCena {
  const grupo = new THREE.Group(); grupo.name = 'entorno';
  const r = rng(2026);
  const E = emp.predio.embasamento;
  const cx0 = E.x0 - CALC - 4.5; // eixo da rua à esquerda da planta (Rua Ceará)
  const cz0 = E.z1 + CALC + 4.5; // eixo da rua de baixo da planta (Rua Bahia)
  const N = 3;
  const eixosX = Array.from({ length: 2 * N + 1 }, (_, i) => cx0 + (i - N) * PERIODO);
  const eixosZ = Array.from({ length: 2 * N + 1 }, (_, i) => cz0 + (i - N) * PERIODO);
  const min = cx0 - N * PERIODO - 40, max = cx0 + N * PERIODO + 40;
  const minZ = cz0 - N * PERIODO - 40, maxZ = cz0 + N * PERIODO + 40;

  const asf = texAsfalto();
  const mAsf = new THREE.MeshStandardMaterial({ map: asf, roughness: 0.92 });
  const mCalc = new THREE.MeshStandardMaterial({ map: texCalcada(), roughness: 0.9 });
  const mMeioFio = new THREE.MeshStandardMaterial({ color: '#c9c5bd', roughness: 0.85 });
  const mLote = new THREE.MeshStandardMaterial({ map: texRevestimento('#8e8a7e', false, 91), roughness: 1 });
  const mGrama = new THREE.MeshStandardMaterial({ map: texGrama(), roughness: 1 });
  const mFaixa = new THREE.MeshStandardMaterial({ color: '#eeeeea', roughness: 0.7 });
  const mFaixaAm = new THREE.MeshStandardMaterial({ color: '#e7b416', roughness: 0.7 });

  const L = new Lote();
  // ruas (pistas) e calçadas
  for (const x of eixosX) L.add(mAsf, caixa(x - 4.5, x + 4.5, -0.02, 0.0, minZ, maxZ, 8));
  for (const z of eixosZ) L.add(mAsf, caixa(min, max, -0.019, 0.001, z - 4.5, z + 4.5, 8));
  for (let i = 0; i < eixosX.length - 1; i++) {
    for (let j = 0; j < eixosZ.length - 1; j++) {
      const x0 = eixosX[i] + 4.5, x1 = eixosX[i + 1] - 4.5, z0 = eixosZ[j] + 4.5, z1 = eixosZ[j + 1] - 4.5;
      // calçada em volta da quadra (com meio-fio) e miolo do lote
      L.add(mCalc, caixa(x0, x1, 0, 0.15, z0, z0 + CALC, 2));
      L.add(mCalc, caixa(x0, x1, 0, 0.15, z1 - CALC, z1, 2));
      L.add(mCalc, caixa(x0, x0 + CALC, 0, 0.15, z0 + CALC, z1 - CALC, 2));
      L.add(mCalc, caixa(x1 - CALC, x1, 0, 0.15, z0 + CALC, z1 - CALC, 2));
      L.add(mMeioFio, caixa(x0 - 0.12, x1 + 0.12, 0, 0.16, z0 - 0.12, z0 + 0.02));
      L.add(mMeioFio, caixa(x0 - 0.12, x1 + 0.12, 0, 0.16, z1 - 0.02, z1 + 0.12));
      L.add(mMeioFio, caixa(x0 - 0.12, x0 + 0.02, 0, 0.16, z0, z1));
      L.add(mMeioFio, caixa(x1 - 0.02, x1 + 0.12, 0, 0.16, z0, z1));
      const praca = (i === 1 && j === 4);
      L.add(praca ? mGrama : mLote, caixa(x0 + CALC, x1 - CALC, 0, 0.12, z0 + CALC, z1 - CALC, 6));
    }
  }
  // faixas de pedestre perto do empreendimento e sinalização horizontal
  const zebra = (x0: number, x1: number, z0: number, z1: number, aoLongoDeX: boolean) => {
    const comp = aoLongoDeX ? x1 - x0 : z1 - z0;
    for (let s = 0.3; s < comp - 0.3; s += 1.0) {
      if (aoLongoDeX) L.add(mFaixa, caixa(x0 + s, x0 + s + 0.5, 0.0, 0.012, z0, z1));
      else L.add(mFaixa, caixa(x0, x1, 0.0, 0.012, z0 + s, z0 + s + 0.5));
    }
  };
  zebra(cx0 - 4.5, cx0 + 4.5, cz0 - 9.5 - 3.5, cz0 - 9.5, true);
  zebra(cx0 + 6.5, cx0 + 6.5 + 3.5, cz0 - 4.5, cz0 + 4.5, false);
  zebra(cx0 - 4.5, cx0 + 4.5, cz0 + 9.5, cz0 + 13, true);
  for (const x of eixosX) for (let z = minZ; z < maxZ; z += 6) L.add(mFaixaAm, caixa(x - 0.06, x + 0.06, 0.0, 0.011, z, z + 3));
  for (const z of eixosZ) for (let x = min; x < max; x += 6) L.add(mFaixaAm, caixa(x, x + 3, 0.0, 0.012, z - 0.06, z + 0.06));
  grupo.add(L.construir('ruas', { projeta: false, recebe: true }));

  // ---------- prédios e casas vizinhas ----------
  const variantes = Array.from({ length: 6 }, (_, i) => texVizinho(i));
  const matsViz = variantes.map((v) => new THREE.MeshStandardMaterial({ map: v.cor, emissiveMap: v.luz, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.75 }));
  const mCasa = [0, 1, 2].map((i) => new THREE.MeshStandardMaterial({ map: texRevestimento(['#e6dccb', '#d9c9b2', '#cfd3cf'][i], false, 100 + i), roughness: 0.95 }));
  const mTelha = new THREE.MeshStandardMaterial({ color: '#a4583a', roughness: 0.85, flatShading: true });
  const mLaje = new THREE.MeshStandardMaterial({ color: '#9b978e', roughness: 0.95 });
  const mJanCasa = new THREE.MeshStandardMaterial({ color: '#24282c', roughness: 0.3, metalness: 0.2, emissive: '#ffcf8a', emissiveIntensity: 0 });
  const mJanApagada = new THREE.MeshStandardMaterial({ color: '#24282c', roughness: 0.3, metalness: 0.2 });
  const Lv = new Lote();
  const emLote = (x0: number, x1: number, z0: number, z1: number) => !(x1 < E.x0 - 0.5 || x0 > E.x1 + 0.5 || z1 < E.z0 - 0.5 || z0 > E.z1 + 0.5);
  const dist = (x: number, z: number) => Math.hypot(x - 10, z - 10);

  function predioViz(x0: number, x1: number, z0: number, z1: number, h: number) {
    const m = matsViz[Math.floor(r() * matsViz.length)];
    const g = caixa(x0, x1, 0.12, h, z0, z1, 12);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const du = Math.floor(r() * 4) * 0.25, dv = Math.floor(r() * 4) * 0.25;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + du, uv.getY(i) + dv);
    Lv.add(m, g);
    Lv.add(mLaje, caixa(x0 - 0.1, x1 + 0.1, h, h + 0.35, z0 - 0.1, z1 + 0.1, 4));
    if (h > 18) Lv.add(mLaje, caixa(x0 + (x1 - x0) * 0.3, x1 - (x1 - x0) * 0.3, h + 0.35, h + 3, z0 + (z1 - z0) * 0.3, z1 - (z1 - z0) * 0.3, 4));
  }
  function casa(x0: number, x1: number, z0: number, z1: number, andares: number) {
    const h = andares * 2.9;
    Lv.add(mCasa[Math.floor(r() * 3)], caixa(x0, x1, 0.12, h, z0, z1, 3));
    // janelas (frente e fundos)
    for (let a = 0; a < andares; a++) {
      const yb = 1.0 + a * 2.9;
      for (const [u0, u1] of [[0.2, 0.45], [0.6, 0.82]]) {
        const m = r() < 0.35 ? mJanCasa : mJanApagada;
        Lv.add(m, caixa(x0 + (x1 - x0) * u0, x0 + (x1 - x0) * u1, yb, yb + 1.1, z0 - 0.03, z0 + 0.02));
        Lv.add(r() < 0.35 ? mJanCasa : mJanApagada, caixa(x0 + (x1 - x0) * u0, x0 + (x1 - x0) * u1, yb, yb + 1.1, z1 - 0.02, z1 + 0.03));
      }
    }
    const tel = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
    tel.rotateY(Math.PI / 4);
    tel.scale(x1 - x0 + 0.8, 1.6, z1 - z0 + 0.8);
    tel.translate((x0 + x1) / 2, h + 0.8, (z0 + z1) / 2);
    Lv.add(mTelha, tel);
  }

  for (let i = 0; i < eixosX.length - 1; i++) {
    for (let j = 0; j < eixosZ.length - 1; j++) {
      if (i === 1 && j === 4) continue; // praça
      const bx0 = eixosX[i] + 4.5 + CALC, bx1 = eixosX[i + 1] - 4.5 - CALC;
      const bz0 = eixosZ[j] + 4.5 + CALC, bz1 = eixosZ[j + 1] - 4.5 - CALC;
      const centroQ = dist((bx0 + bx1) / 2, (bz0 + bz1) / 2);
      const fatorCentro = Math.max(0, 1 - centroQ / 320);
      // lotes ao longo das 4 testadas
      const testadas: [number, number, number, number, 'x' | 'z'][] = [
        [bx0, bx1, bz0, bz0, 'x'], [bx0, bx1, bz1, bz1, 'x'], [bx0, bx0, bz0, bz1, 'z'], [bx1, bx1, bz0, bz1, 'z'],
      ];
      testadas.forEach(([a0, a1, c0, c1, eixo], t) => {
        const comp = eixo === 'x' ? a1 - a0 : c1 - c0;
        let s = t >= 2 ? 22 : 0;
        const fim = t >= 2 ? comp - 22 : comp;
        while (s < fim - 6) {
          const larg = Math.min(fim - s, 8 + r() * 12);
          const prof = 14 + r() * 12;
          const sorte = r();
          let x0: number, x1: number, z0: number, z1: number;
          if (eixo === 'x') {
            x0 = a0 + s + 0.4; x1 = a0 + s + larg - 0.4;
            if (t === 0) { z0 = c0 + 0.3; z1 = c0 + prof; } else { z1 = c1 - 0.3; z0 = c1 - prof; }
          } else {
            z0 = c0 + s + 0.4; z1 = c0 + s + larg - 0.4;
            if (t === 2) { x0 = a0 + 0.3; x1 = a0 + prof; } else { x1 = a1 - 0.3; x0 = a1 - prof; }
          }
          s += larg;
          if (emLote(x0, x1, z0, z1)) continue;
          // perto do empreendimento: só casas/sobrados (a câmera precisa ver as fachadas sem obstáculo)
          const perto = dist((x0 + x1) / 2, (z0 + z1) / 2) < 75;
          const pTorre = perto ? 0 : 0.03 + 0.1 * fatorCentro;
          const pMedio = perto ? 0.12 : 0.2 + 0.15 * fatorCentro;
          if (sorte < pTorre) predioViz(x0, x1, z0, z1, 18 + Math.floor(r() * (3 + 4 * fatorCentro)) * 3);
          else if (sorte < pTorre + pMedio) predioViz(x0, x1, z0, z1, (perto ? 6 : 6 + Math.floor(r() * 3) * 3));
          else casa(x0, x1, z0, z1, r() < 0.55 ? 1 : 2);
        }
      });
    }
  }
  // marcos próximos (vistos na foto de satélite): prédio alto do outro lado da esquina
  predioViz(cx0 - 75, cx0 - 50, cz0 + 40, cz0 + 62, 39);
  predioViz(cx0 - 110, cx0 - 92, E.z0 - 30, E.z0 - 8, 30);
  grupo.add(Lv.construir('vizinhos'));

  // ---------- árvores (instanciadas) ----------
  const posArv: [number, number, number][] = [];
  for (const x of eixosX) for (let z = minZ + 5; z < maxZ; z += 11 + r() * 8) { if (r() < 0.55) posArv.push([x + (r() < 0.5 ? -1 : 1) * 5.6, z, 0.7 + r() * 0.6]); }
  for (const z of eixosZ) for (let x = min + 5; x < max; x += 11 + r() * 8) { if (r() < 0.55) posArv.push([x, z + (r() < 0.5 ? -1 : 1) * 5.6, 0.7 + r() * 0.6]); }
  const livre = posArv.filter(([x, z]) => !(x > E.x0 - 3 && x < E.x1 + 1 && z > E.z0 - 1 && z < E.z1 + 3 && (x < E.x0 + 6 || z > E.z1 - 6)) || r() < 0.3);
  const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 3, 6), new THREE.MeshStandardMaterial({ color: '#5a4636', roughness: 1 }), livre.length);
  const copaGeo = new THREE.IcosahedronGeometry(1.9, 1);
  const copa = new THREE.InstancedMesh(copaGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true }), livre.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), cor = new THREE.Color();
  livre.forEach(([x, z, s], i) => {
    m4.compose(new THREE.Vector3(x, 1.5 * s + 0.15, z), q, new THREE.Vector3(s, s, s)); tronco.setMatrixAt(i, m4);
    q.setFromEuler(new THREE.Euler(0, r() * 6, 0));
    m4.compose(new THREE.Vector3(x, 3.6 * s + 0.15, z), q, new THREE.Vector3(s * (1 + r() * 0.3), s * (0.85 + r() * 0.3), s * (1 + r() * 0.3))); copa.setMatrixAt(i, m4);
    cor.setHSL(0.24 + r() * 0.08, 0.35 + r() * 0.2, 0.22 + r() * 0.1); copa.setColorAt(i, cor);
  });
  tronco.castShadow = copa.castShadow = true; copa.receiveShadow = true;
  grupo.add(tronco, copa);

  // ---------- postes, poças de luz e carros ----------
  const postes: [number, number, number][] = []; // x, z, rotação (braço aponta para a pista)
  for (const x of eixosX) for (let z = minZ + 15; z < maxZ; z += 32) { postes.push([x - 5.9, z, 0]); }
  for (const z of eixosZ) for (let x = min + 15; x < max; x += 32) { postes.push([x, z + 5.9, Math.PI / 2]); }
  const mPoste = new THREE.MeshStandardMaterial({ color: '#4b4f53', metalness: 0.5, roughness: 0.5 });
  const mLamp = new THREE.MeshStandardMaterial({ color: '#dddddd', emissive: '#ffd59a', emissiveIntensity: 0 });
  const geoPoste = new THREE.CylinderGeometry(0.07, 0.1, 7.5, 6); geoPoste.translate(0, 3.75, 0);
  const geoBraco = new THREE.BoxGeometry(1.8, 0.08, 0.08); geoBraco.translate(0.9, 7.4, 0);
  const geoLamp = new THREE.BoxGeometry(0.6, 0.12, 0.28); geoLamp.translate(1.7, 7.3, 0);
  const iPoste = new THREE.InstancedMesh(geoPoste, mPoste, postes.length);
  const iBraco = new THREE.InstancedMesh(geoBraco, mPoste, postes.length);
  const iLamp = new THREE.InstancedMesh(geoLamp, mLamp, postes.length);
  // poças de luz no chão (só à noite) — barato e convincente
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const gg = cv.getContext('2d')!; const rad = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
  rad.addColorStop(0, 'rgba(255,214,150,0.9)'); rad.addColorStop(0.4, 'rgba(255,190,120,0.35)'); rad.addColorStop(1, 'rgba(255,170,90,0)');
  gg.fillStyle = rad; gg.fillRect(0, 0, 128, 128);
  const texPoca = new THREE.CanvasTexture(cv); texPoca.colorSpace = THREE.SRGBColorSpace;
  const mPoca = new THREE.MeshBasicMaterial({ map: texPoca, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const geoPoca = new THREE.PlaneGeometry(14, 14); geoPoca.rotateX(-Math.PI / 2);
  const iPoca = new THREE.InstancedMesh(geoPoca, mPoca, postes.length);
  postes.forEach(([x, z, rot], i) => {
    q.setFromEuler(new THREE.Euler(0, rot, 0));
    m4.compose(new THREE.Vector3(x, 0.15, z), q, new THREE.Vector3(1, 1, 1));
    iPoste.setMatrixAt(i, m4); iBraco.setMatrixAt(i, m4); iLamp.setMatrixAt(i, m4);
    const dx = Math.cos(rot) * 1.7, dz = -Math.sin(rot) * 1.7;
    m4.compose(new THREE.Vector3(x + dx, 0.17, z + dz), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
    iPoca.setMatrixAt(i, m4);
  });
  iPoste.castShadow = true;
  iPoca.renderOrder = 2;
  grupo.add(iPoste, iBraco, iLamp, iPoca);

  // carros estacionados (caixas arredondadas simples)
  const carroGeo = (() => {
    const L2 = new Lote(); const tmp = new THREE.MeshBasicMaterial();
    L2.add(tmp, caixa(-2.1, 2.1, 0.3, 0.95, -0.85, 0.85));
    L2.add(tmp, caixa(-1.1, 1.0, 0.95, 1.45, -0.78, 0.78));
    const g = (L2.construir('c').children[0] as THREE.Mesh).geometry; return g;
  })();
  const vidroCarro = (() => { const L3 = new Lote(); const tmp = new THREE.MeshBasicMaterial(); L3.add(tmp, caixa(-1.05, 0.95, 1.0, 1.4, -0.8, 0.8)); return (L3.construir('v').children[0] as THREE.Mesh).geometry; })();
  const rodaGeo = new THREE.CylinderGeometry(0.33, 0.33, 1.75, 10); rodaGeo.rotateX(Math.PI / 2);
  const carros: [number, number, number][] = [];
  for (const x of eixosX) for (let z = minZ + 8; z < maxZ; z += 7 + r() * 14) if (r() < 0.45) carros.push([x - 3.4, z, Math.PI / 2]);
  for (const z of eixosZ) for (let x = min + 8; x < max; x += 7 + r() * 14) if (r() < 0.45) carros.push([x, z + 3.4, 0]);
  const longe = carros.filter(([x, z]) => !(Math.abs(x - (E.x0 - 4)) < 6 && z > E.z0 + 6 && z < E.z0 + 18));
  const iCarro = new THREE.InstancedMesh(carroGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.6, roughness: 0.3 }), longe.length);
  const iVidro = new THREE.InstancedMesh(vidroCarro, new THREE.MeshStandardMaterial({ color: '#15191d', metalness: 0.4, roughness: 0.1 }), longe.length);
  const iRoda1 = new THREE.InstancedMesh(rodaGeo, new THREE.MeshStandardMaterial({ color: '#121212', roughness: 0.8 }), longe.length * 2);
  const coresCarro = ['#f2f2f2', '#c0c4c8', '#1d1f22', '#7b8288', '#8c1c1c', '#20406b', '#efefef', '#3a3d40'];
  longe.forEach(([x, z, rot], i) => {
    q.setFromEuler(new THREE.Euler(0, rot, 0));
    m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, 1, 1));
    iCarro.setMatrixAt(i, m4); iVidro.setMatrixAt(i, m4);
    iCarro.setColorAt(i, cor.set(coresCarro[Math.floor(r() * coresCarro.length)]));
    for (let k = 0; k < 2; k++) {
      const off = new THREE.Vector3(k ? 1.35 : -1.35, 0.33, 0).applyQuaternion(q);
      m4.compose(new THREE.Vector3(x + off.x, 0.33, z + off.z), q, new THREE.Vector3(1, 1, 1));
      iRoda1.setMatrixAt(i * 2 + k, m4);
    }
  });
  iCarro.castShadow = true;
  grupo.add(iCarro, iVidro, iRoda1);

  // ---------- nomes das ruas (no asfalto) e placas ----------
  ruasNomeadas.forEach((rua, idx) => {
    const tex = texTexto(rua.nome.toUpperCase(), 'rgba(255,255,255,0.85)');
    const m = new THREE.Mesh(plano(18, 2.25), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2;
    if (rua.eixo === 'z') { m.rotation.z = Math.PI / 2; m.position.set(rua.centro, 0.03, E.z0 + 10); }
    else m.position.set(E.x0 + 30, 0.03, rua.centro);
    m.renderOrder = 3;
    grupo.add(m);
    // placa azul de esquina
    const placa = new THREE.Mesh(plano(1.6, 0.4), new THREE.MeshBasicMaterial({ map: texTexto(rua.nome, '#ffffff', '#1f4fa3', 512), side: THREE.DoubleSide }));
    placa.position.set(E.x0 - 1.6, 2.7, E.z1 + 1.6);
    placa.rotation.y = rua.eixo === 'z' ? Math.PI / 2 : 0;
    placa.position.y += idx * 0.45;
    if (idx < 2) grupo.add(placa);
  });
  const hasteP = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.9, 6), mPoste);
  hasteP.position.set(E.x0 - 1.6, 1.45, E.z1 + 1.6);
  grupo.add(hasteP);

  // ---------- terreno com morros no horizonte ----------
  const terr = new THREE.PlaneGeometry(3600, 3600, 160, 160);
  terr.rotateX(-Math.PI / 2);
  const pos = terr.attributes.position as THREE.BufferAttribute;
  const rr = rng(9);
  const ondas = Array.from({ length: 6 }, () => [rr() * 0.01 + 0.002, rr() * 6, rr() * 0.01 + 0.002, rr() * 6]);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + 10, z = pos.getZ(i) + 10;
    const d = Math.hypot(x, z);
    const f = THREE.MathUtils.smoothstep(d, 380, 1300);
    let h = 0;
    for (const [a, b, c, e] of ondas) h += Math.sin(x * a + b) * Math.cos(z * c + e);
    pos.setY(i, -0.3 + f * (35 + h * 18));
  }
  terr.computeVertexNormals();
  const tt = texTerreno(); tt.repeat.set(40, 40);
  const terreno = new THREE.Mesh(terr, new THREE.MeshStandardMaterial({ map: tt, roughness: 1 }));
  terreno.receiveShadow = true;
  terreno.name = 'terreno';
  grupo.add(terreno);

  // luzes reais perto do prédio (as demais são "poças" falsas)
  const luzesRua: THREE.PointLight[] = [];
  for (const [x, z] of [[E.x0 - 6, E.z0 + 2], [E.x0 - 6, E.z1 - 4], [E.x0 + 6, E.z1 + 6], [E.x1 - 2, E.z1 + 6]]) {
    const p = new THREE.PointLight('#ffcf94', 0, 26, 1.6);
    p.position.set(x, 7, z);
    luzesRua.push(p);
    grupo.add(p);
  }

  return {
    grupo,
    luzesRua,
    aplicarNoite(f) {
      for (const m of matsViz) m.emissiveIntensity = 1.4 * f;
      mJanCasa.emissiveIntensity = 0.9 * f;
      mLamp.emissiveIntensity = 3 * f;
      mPoca.opacity = 0.75 * f;
      for (const p of luzesRua) p.intensity = 14 * f;
    },
  };
}

export function ruasDoEmpreendimento(emp: Empreendimento): Rua[] {
  const E = emp.predio.embasamento;
  const cx0 = E.x0 - CALC - 4.5, cz0 = E.z1 + CALC + 4.5;
  const nomes: Rua[] = [];
  const esquerda = emp.endereco.logradouro.replace(/,.*$/, '');
  nomes.push({ nome: esquerda, eixo: 'z', centro: cx0 });
  if (emp.endereco.esquina) nomes.push({ nome: emp.endereco.esquina, eixo: 'x', centro: cz0 });
  // Ruas paralelas vistas no satélite (Missouri). Para outro projeto, ajustar ou remover.
  if (emp.id === 'missouri') {
    nomes.push({ nome: 'Rua Alagoas', eixo: 'z', centro: cx0 + PERIODO });
    nomes.push({ nome: 'Rua Mato Grosso', eixo: 'x', centro: cz0 + PERIODO });
  }
  return nomes;
}
