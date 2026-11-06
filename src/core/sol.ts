// Posição do sol (algoritmo NOAA simplificado, erro < 0,5°) e análise de insolação das fachadas.
// Funções puras: testáveis em Node.
import type { Empreendimento, Ret, UnidadeTecnica } from './tipos.ts';

const RAD = Math.PI / 180;

export interface PosSol { azimute: number; elevacao: number } // graus; azimute a partir do Norte, horário

export function posicaoSol(instante: Date, lat: number, lon: number): PosSol {
  const jd = instante.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
  const lonVerd = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = lonVerd - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eqTempo = 4 / RAD * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
  const minutosUTC = instante.getUTCHours() * 60 + instante.getUTCMinutes() + instante.getUTCSeconds() / 60;
  const tempoSolar = (((minutosUTC + eqTempo + 4 * lon) % 1440) + 1440) % 1440;
  let anguloHorario = tempoSolar / 4 - 180;
  if (anguloHorario < -180) anguloHorario += 360;
  const latR = lat * RAD;
  const cosZen = Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(anguloHorario * RAD);
  const zen = Math.acos(Math.min(1, Math.max(-1, cosZen)));
  const elevacao = 90 - zen / RAD;
  const az = Math.atan2(Math.sin(anguloHorario * RAD), Math.cos(anguloHorario * RAD) * Math.sin(latR) - Math.tan(decl) * Math.cos(latR)) / RAD + 180;
  return { azimute: ((az % 360) + 360) % 360, elevacao };
}

/** Converte data local (YYYY-MM-DD) + hora decimal no fuso do empreendimento em instante UTC. */
export function instanteLocal(dataISO: string, hora: number, fusoHoras: number): Date {
  const h = Math.floor(hora);
  const min = Math.round((hora - h) * 60);
  const t = Date.parse(dataISO + 'T00:00:00Z') + (h * 60 + min - fusoHoras * 60) * 60000;
  return new Date(t);
}

/** Direção do sol no referencial da planta (x = direita, y = cima, z = baixo da planta). */
export function direcaoSolPlanta(p: PosSol, azimuteTopoPlanta: number): [number, number, number] {
  const a = (p.azimute - azimuteTopoPlanta) * RAD;
  const e = p.elevacao * RAD;
  return [Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)];
}

export type Lado = 'x0' | 'x1' | 'z0' | 'z1';
const NORMAL_LADO: Record<Lado, [number, number]> = { x0: [-1, 0], x1: [1, 0], z0: [0, -1], z1: [0, 1] };

/** Azimute (graus) para onde olha uma fachada, dado o lado na planta. */
export function azimuteDoLado(lado: Lado, azimuteTopoPlanta: number): number {
  const ang = { z0: 0, x1: 90, z1: 180, x0: 270 }[lado];
  return (((azimuteTopoPlanta + ang) % 360) + 360) % 360;
}

export function pontoCardeal(az: number): string {
  const nomes = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'];
  return nomes[Math.round((((az % 360) + 360) % 360) / 45) % 8];
}

/** Explica a insolação típica de uma fachada no hemisfério sul. */
export function comentarioInsolacao(az: number, lat: number): string {
  const sul = lat < 0;
  const a = ((az % 360) + 360) % 360;
  if (a >= 315 || a < 45) return sul ? 'Sol durante boa parte do dia no inverno e pouco sol direto no verão — a orientação mais valorizada.' : 'Pouca incidência de sol direto.';
  if (a < 135) return 'Sol da manhã — mais suave e agradável.';
  if (a < 225) return sul ? 'Pouco sol direto: ambientes mais frescos.' : 'Sol durante boa parte do dia.';
  return 'Sol da tarde — mais quente; venezianas ajudam.';
}

function dentro(px: number, pz: number, r: Ret): boolean {
  return px > r[0] && px < r[1] && pz > r[2] && pz < r[3];
}

export interface FaceExterna { lado: Lado; ret: Ret; comprimento: number; azimute: number; cardeal: string; comentario: string }

export interface Segmento { lado: Lado; ret: Ret; fixo: number; a0: number; a1: number; comprimento: number }

/**
 * Trechos das bordas dos retângulos `volumes` que dão para o "vazio", isto é, cujo lado de fora
 * não está dentro de nenhum retângulo de `ocupados`. Base para fachadas, guarda-corpos e insolação.
 */
export function segmentosLivres(volumes: Ret[], ocupados: Ret[], minimo = 0.6, passo = 0.25): Segmento[] {
  const segs: Segmento[] = [];
  for (const r of volumes) {
    for (const lado of ['x0', 'x1', 'z0', 'z1'] as Lado[]) {
      const [nx, nz] = NORMAL_LADO[lado];
      const horizontal = lado === 'z0' || lado === 'z1';
      const a0 = horizontal ? r[0] : r[2];
      const a1 = horizontal ? r[1] : r[3];
      const fixo = lado === 'x0' ? r[0] : lado === 'x1' ? r[1] : lado === 'z0' ? r[2] : r[3];
      let inicio: number | null = null;
      const fechar = (fim: number) => {
        if (inicio !== null && fim - inicio >= minimo) {
          const ret: Ret = horizontal ? [inicio, fim, fixo, fixo] : [fixo, fixo, inicio, fim];
          segs.push({ lado, ret, fixo, a0: inicio, a1: fim, comprimento: fim - inicio });
        }
        inicio = null;
      };
      const n = Math.max(1, Math.round((a1 - a0) / passo));
      const p = (a1 - a0) / n;
      for (let i = 0; i < n; i++) {
        const s = a0 + p * (i + 0.5);
        const px = horizontal ? s : fixo + nx * 0.05;
        const pz = horizontal ? fixo + nz * 0.05 : s;
        const ocupado = ocupados.some((o) => dentro(px, pz, o));
        if (!ocupado) { if (inicio === null) inicio = a0 + p * i; }
        else fechar(a0 + p * i);
      }
      fechar(a1);
    }
  }
  return segs;
}

/** Ocupação de um pavimento: unidades + núcleo + áreas comuns (+ vazios, se pedido). */
export function ocupacaoPavimento(emp: Empreendimento, numero: number, incluirVazios: boolean): Ret[] {
  const pav = emp.pavimentos.find((p) => p.numero === numero);
  const oc: Ret[] = [];
  for (const o of emp.unidades) {
    if (o.pavimento === numero) oc.push(...o.volumes);
    else if (o.pavimentosOcupados?.includes(numero) && o.volumesSuperiores) oc.push(...o.volumesSuperiores);
  }
  if (pav?.nucleo) oc.push(...pav.nucleo);
  if (pav?.areasComuns) oc.push(...pav.areasComuns.map((a) => a.ret));
  if (incluirVazios && pav?.vazios) oc.push(...pav.vazios);
  return oc;
}

export interface FaceExterna { lado: Lado; ret: Ret; comprimento: number; azimute: number; cardeal: string; comentario: string }

/** Faces de uma unidade que dão para fora do prédio (não encostam em outra unidade, no núcleo nem no poço de ventilação). */
export function facesExternas(emp: Empreendimento, u: UnidadeTecnica): FaceExterna[] {
  const ocupados = ocupacaoPavimento(emp, u.pavimento, true);
  return segmentosLivres(u.volumes, ocupados, 1).map((s) => {
    const az = azimuteDoLado(s.lado, emp.geo.azimuteTopoPlanta);
    return { lado: s.lado, ret: s.ret, comprimento: s.comprimento, azimute: az, cardeal: pontoCardeal(az), comentario: comentarioInsolacao(az, emp.geo.lat) };
  });
}

/** Horas de sol direto (sem considerar sombra de vizinhos) numa fachada, para uma data. */
export function horasDeSol(dataISO: string, azFachada: number, lat: number, lon: number, fuso: number): number {
  let minutos = 0;
  const passo = 10;
  for (let m = 0; m < 1440; m += passo) {
    const p = posicaoSol(instanteLocal(dataISO, m / 60, fuso), lat, lon);
    if (p.elevacao <= 2) continue;
    const dif = ((p.azimute - azFachada + 540) % 360) - 180;
    if (Math.abs(dif) < 85) minutos += passo;
  }
  return Math.round((minutos / 60) * 10) / 10;
}

export interface ResumoSolarUnidade { orientacoes: { cardeal: string; azimute: number; comentario: string; inverno: number; verao: number }[]; texto: string }

export function resumoSolarUnidade(emp: Empreendimento, u: UnidadeTecnica, ano = 2026): ResumoSolarUnidade {
  const faces = facesExternas(emp, u);
  const vistos = new Map<string, FaceExterna>();
  for (const f of faces) {
    const atual = vistos.get(f.cardeal);
    if (!atual || f.comprimento > atual.comprimento) vistos.set(f.cardeal, f);
  }
  const g = emp.geo;
  const orientacoes = [...vistos.values()]
    .sort((a, b) => b.comprimento - a.comprimento)
    .map((f) => ({
      cardeal: f.cardeal,
      azimute: Math.round(f.azimute),
      comentario: f.comentario,
      inverno: horasDeSol(`${ano}-06-21`, f.azimute, g.lat, g.lon, g.fusoHoras),
      verao: horasDeSol(`${ano}-12-21`, f.azimute, g.lat, g.lon, g.fusoHoras),
    }));
  const texto = orientacoes.length ? `Fachadas voltadas para ${orientacoes.map((o) => o.cardeal).join(', ')}.` : 'Sem fachada externa identificada.';
  return { orientacoes, texto };
}
