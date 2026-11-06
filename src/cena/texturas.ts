// Texturas procedurais (canvas) — nenhum arquivo externo, funciona offline e por file://.
import * as THREE from 'three';
import { rng } from '../core/util.ts';

const cache = new Map<string, THREE.Texture>();
let anisotropia = 4;
export function definirAnisotropia(a: number) { anisotropia = a; }

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, g: c.getContext('2d')! };
}

function finalizar(chave: string, c: HTMLCanvasElement, srgb = true, repetir = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = anisotropia;
  cache.set(chave, t);
  return t;
}

function ruido(g: CanvasRenderingContext2D, w: number, h: number, intensidade: number, semente: number, n = 4000) {
  const r = rng(semente);
  for (let i = 0; i < n; i++) {
    const a = (r() - 0.5) * intensidade;
    g.fillStyle = a > 0 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${-a})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

/** Ripado de madeira vertical (fachada e painéis). 1 repetição ≈ 1 m. */
export function texRipado(): THREE.Texture {
  const k = 'ripado';
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(256, 256);
  g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 256, 256);
  const r = rng(7);
  const ripa = 256 / 12;
  for (let i = 0; i < 12; i++) {
    const tom = 0.85 + r() * 0.3;
    g.fillStyle = `rgb(${Math.round(138 * tom)},${Math.round(90 * tom)},${Math.round(58 * tom)})`;
    g.fillRect(i * ripa + 2, 0, ripa - 5, 256);
    for (let v = 0; v < 18; v++) {
      g.strokeStyle = `rgba(60,35,20,${0.1 + r() * 0.15})`;
      g.beginPath();
      const x = i * ripa + 3 + r() * (ripa - 8);
      g.moveTo(x, 0); g.bezierCurveTo(x + r() * 3, 80, x - r() * 3, 170, x + r() * 2, 256); g.stroke();
    }
  }
  return finalizar(k, c);
}

/** Madeira lisa (marcenaria, pisos laminados). */
export function texMadeira(clara = false): THREE.Texture {
  const k = 'madeira' + clara;
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(512, 512);
  const base = clara ? [196, 160, 118] : [150, 92, 56];
  g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, 512, 512);
  const r = rng(clara ? 11 : 13);
  const tabua = 512 / 6;
  for (let i = 0; i < 6; i++) {
    const tom = 0.88 + r() * 0.24;
    g.fillStyle = `rgb(${base.map((b) => Math.round(b * tom))})`;
    const off = r() * 512;
    g.fillRect(0, i * tabua, 512, tabua - 2);
    g.fillStyle = 'rgba(40,20,10,0.35)';
    g.fillRect(off, i * tabua, 2, tabua);
    for (let v = 0; v < 30; v++) {
      g.strokeStyle = `rgba(${clara ? '120,80,50' : '70,40,20'},${0.08 + r() * 0.18})`;
      g.lineWidth = 1 + r();
      g.beginPath();
      const y = i * tabua + r() * tabua;
      g.moveTo(0, y); g.bezierCurveTo(170, y + (r() - 0.5) * 8, 340, y + (r() - 0.5) * 8, 512, y + (r() - 0.5) * 4); g.stroke();
    }
  }
  return finalizar(k, c);
}

/** Porcelanato claro com rejunte (1 repetição = 2 placas de 90 cm). */
export function texPorcelanato(cor = '#e8e1d6'): THREE.Texture {
  const k = 'porc' + cor;
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(512, 512);
  g.fillStyle = cor; g.fillRect(0, 0, 512, 512);
  ruido(g, 512, 512, 0.06, 3, 6000);
  const r = rng(5);
  for (let v = 0; v < 10; v++) {
    g.strokeStyle = `rgba(150,140,130,${0.05 + r() * 0.07})`;
    g.lineWidth = 1 + r() * 2;
    g.beginPath(); const x = r() * 512; g.moveTo(x, 0); g.bezierCurveTo(x + 80, 170, x - 60, 340, x + 40, 512); g.stroke();
  }
  g.fillStyle = 'rgba(120,110,100,0.45)';
  g.fillRect(0, 0, 512, 2); g.fillRect(0, 256, 512, 2); g.fillRect(0, 0, 2, 512); g.fillRect(256, 0, 2, 512);
  return finalizar(k, c);
}

/** Mármore/pedra (bancadas, parede do hall). */
export function texMarmore(cor = '#ece8e1', veio = '120,110,100'): THREE.Texture {
  const k = 'marm' + cor;
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(512, 512);
  g.fillStyle = cor; g.fillRect(0, 0, 512, 512);
  const r = rng(17);
  for (let v = 0; v < 22; v++) {
    g.strokeStyle = `rgba(${veio},${0.06 + r() * 0.16})`;
    g.lineWidth = 0.5 + r() * 2.5;
    g.beginPath(); let x = r() * 512, y = 0; g.moveTo(x, y);
    while (y < 512) { x += (r() - 0.45) * 40; y += 20 + r() * 40; g.lineTo(x, y); }
    g.stroke();
  }
  ruido(g, 512, 512, 0.05, 19, 3000);
  return finalizar(k, c);
}

/** Revestimento de fachada (placas cimentícias/porcelanato) — 1 repetição ≈ 3 m. */
export function texRevestimento(cor: string, juntas = true, semente = 21): THREE.Texture {
  const k = 'rev' + cor + juntas + semente;
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(512, 512);
  g.fillStyle = cor; g.fillRect(0, 0, 512, 512);
  ruido(g, 512, 512, 0.08, semente, 9000);
  if (juntas) {
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i <= 4; i++) g.fillRect(0, i * 128, 512, 2);
    for (let i = 0; i <= 2; i++) g.fillRect(i * 256, 0, 2, 512);
  }
  return finalizar(k, c);
}

export function texAsfalto(): THREE.Texture {
  const k = 'asfalto';
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(512, 512);
  g.fillStyle = '#3b3d40'; g.fillRect(0, 0, 512, 512);
  ruido(g, 512, 512, 0.18, 31, 26000);
  const r = rng(33);
  for (let i = 0; i < 6; i++) {
    g.strokeStyle = 'rgba(20,20,22,0.35)'; g.lineWidth = 1 + r() * 2;
    g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); }
    g.stroke();
  }
  return finalizar(k, c);
}

/** Calçada de bloquetes/ladrilho (1 repetição ≈ 2 m). */
export function texCalcada(): THREE.Texture {
  const k = 'calcada';
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(256, 256);
  g.fillStyle = '#a9a49b'; g.fillRect(0, 0, 256, 256);
  const r = rng(41);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
    const t = 0.9 + r() * 0.18;
    g.fillStyle = `rgb(${Math.round(176 * t)},${Math.round(170 * t)},${Math.round(160 * t)})`;
    g.fillRect(x * 64 + (y % 2) * 32 + 1, y * 32 + 1, 62, 30);
  }
  ruido(g, 256, 256, 0.1, 43, 3000);
  return finalizar(k, c);
}

export function texGrama(): THREE.Texture {
  const k = 'grama';
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(256, 256);
  g.fillStyle = '#5f7a3c'; g.fillRect(0, 0, 256, 256);
  ruido(g, 256, 256, 0.3, 47, 12000);
  return finalizar(k, c);
}

export function texTerreno(): THREE.Texture {
  const k = 'terreno';
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(512, 512);
  g.fillStyle = '#5f6b3e'; g.fillRect(0, 0, 512, 512);
  const r = rng(53);
  for (let i = 0; i < 260; i++) {
    const t = r();
    g.fillStyle = t < 0.4 ? 'rgba(70,90,40,0.45)' : t < 0.7 ? 'rgba(140,115,80,0.35)' : 'rgba(45,65,35,0.5)';
    g.beginPath(); g.arc(r() * 512, r() * 512, 8 + r() * 40, 0, Math.PI * 2); g.fill();
  }
  ruido(g, 512, 512, 0.15, 55, 12000);
  return finalizar(k, c);
}

/**
 * Fachada de prédio vizinho: grade de janelas. Devolve mapa de cor e mapa de luz (janelas acesas à noite).
 * Uma repetição = 4 colunas × 4 andares (≈ 12 m × 12 m).
 */
export function texVizinho(variante: number): { cor: THREE.Texture; luz: THREE.Texture } {
  const k = 'viz' + variante;
  if (cache.has(k)) return { cor: cache.get(k)!, luz: cache.get(k + 'l')! };
  const paletas = [
    ['#d8d2c4', '#2c3640'], ['#bfc4c8', '#26323c'], ['#e3d7bf', '#3a3a3a'], ['#9aa3a8', '#1f2a33'], ['#cdb9a0', '#2e2a27'], ['#e9e6df', '#33414d'],
  ];
  const [parede, vidro] = paletas[variante % paletas.length];
  const A = canvas(256, 256), B = canvas(256, 256);
  A.g.fillStyle = parede; A.g.fillRect(0, 0, 256, 256);
  ruido(A.g, 256, 256, 0.08, 60 + variante, 3000);
  B.g.fillStyle = '#000'; B.g.fillRect(0, 0, 256, 256);
  const r = rng(70 + variante);
  const larga = variante % 3 === 1;
  for (let andar = 0; andar < 4; andar++) for (let col = 0; col < 4; col++) {
    const x = col * 64 + (larga ? 4 : 14), y = andar * 64 + 16, w = larga ? 56 : 36, h = larga ? 40 : 30;
    A.g.fillStyle = vidro; A.g.fillRect(x, y, w, h);
    A.g.fillStyle = 'rgba(255,255,255,0.12)'; A.g.fillRect(x, y, w, 4);
    A.g.fillStyle = 'rgba(0,0,0,0.25)'; A.g.fillRect(x - 2, y + h, w + 4, 3);
    if (r() < 0.38) {
      const quente = r() < 0.75;
      B.g.fillStyle = quente ? `rgba(255,${190 + Math.round(r() * 40)},${120 + Math.round(r() * 50)},${0.55 + r() * 0.45})` : 'rgba(200,225,255,0.7)';
      B.g.fillRect(x, y, w, h);
    }
  }
  const cor = finalizar(k, A.c);
  const luz = finalizar(k + 'l', B.c);
  return { cor, luz };
}

/** Veneziana/persiana (janelas dos quartos). */
export function texVeneziana(): THREE.Texture {
  const k = 'venez';
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(64, 128);
  g.fillStyle = '#2e2f31'; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 16; i++) { g.fillStyle = '#4a4b4e'; g.fillRect(0, i * 8, 64, 5); g.fillStyle = '#1d1e20'; g.fillRect(0, i * 8 + 5, 64, 1); }
  return finalizar(k, c);
}

/** Tecido (sofás, cortinas, roupa de cama). */
export function texTecido(cor: string): THREE.Texture {
  const k = 'tec' + cor;
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(128, 128);
  g.fillStyle = cor; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 2) { g.fillStyle = 'rgba(0,0,0,0.04)'; g.fillRect(0, i, 128, 1); g.fillRect(i, 0, 1, 128); }
  ruido(g, 128, 128, 0.06, 77, 1200);
  return finalizar(k, c);
}

/** Letreiro da fachada (nome + subtítulo do empreendimento). Fundo transparente; usado com emissiveMap para acender à noite. */
export function texLetreiro(titulo: string, subtitulo: string, fonteAss: string): THREE.Texture {
  const k = 'letr' + titulo;
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(1024, 256);
  g.clearRect(0, 0, 1024, 256);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.font = '300 120px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  g.fillText(titulo.toUpperCase(), 512, 130);
  g.font = `italic 700 78px ${fonteAss}`;
  g.fillText(subtitulo, 512, 225);
  const t = finalizar(k, c, true, false);
  return t;
}

/** Texto em placa/chão (nomes de ruas). */
export function texTexto(texto: string, cor = '#ffffff', fundo: string | null = null, largura = 1024): THREE.Texture {
  const k = 'txt' + texto + cor + fundo;
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(largura, 128);
  if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, largura, 128); }
  g.fillStyle = cor;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 72px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  g.fillText(texto, largura / 2, 66);
  return finalizar(k, c, true, false);
}

export function texEstrelas(): THREE.Texture {
  const k = 'estrela';
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(32, 32);
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.3, 'rgba(255,255,255,0.5)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 32, 32);
  return finalizar(k, c, true, false);
}

/** Quadro decorativo abstrato (como nos renders do folder). */
export function texQuadro(semente: number): THREE.Texture {
  const k = 'quadro' + semente;
  if (cache.has(k)) return cache.get(k)!;
  const { c, g } = canvas(256, 256);
  const r = rng(semente);
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#b98a73'); grad.addColorStop(0.5, '#6d4a45'); grad.addColorStop(1, '#d9b48c');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 12; i++) {
    g.strokeStyle = r() < 0.3 ? 'rgba(220,180,90,0.9)' : `rgba(${Math.round(80 + r() * 120)},${Math.round(60 + r() * 80)},${Math.round(60 + r() * 60)},0.5)`;
    g.lineWidth = 1 + r() * 6;
    g.beginPath(); g.moveTo(r() * 256, r() * 256); g.bezierCurveTo(r() * 256, r() * 256, r() * 256, r() * 256, r() * 256, r() * 256); g.stroke();
  }
  return finalizar(k, c, true, false);
}
