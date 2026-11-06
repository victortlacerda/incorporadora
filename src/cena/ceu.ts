// Céu físico, sol na posição real (data/hora/local), luz da lua, estrelas, neblina e trajetória solar.
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import type { Empreendimento } from '../core/tipos.ts';
import { direcaoSolPlanta, instanteLocal, posicaoSol, type PosSol } from '../core/sol.ts';
import { rng } from '../core/util.ts';
import { texEstrelas, texTexto } from './texturas.ts';

export interface CeuCena {
  definir(dataISO: string, hora: number): { pos: PosSol; noite: number };
  trilha: THREE.Group;
  desenharTrilha(dataISO: string): void;
  sol: THREE.DirectionalLight;
  noite: number;
  atualizarAmbiente(): void;
}

export function criarCeu(scene: THREE.Scene, renderer: THREE.WebGLRenderer, emp: Empreendimento, centro: THREE.Vector3, sombraTam: number): CeuCena {
  const sky = new Sky();
  sky.scale.setScalar(4500);
  const u = sky.material.uniforms;
  u.turbidity.value = 3.2; u.rayleigh.value = 1.4; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.82;
  u.cloudCoverage.value = 0.32; u.cloudDensity.value = 0.35; u.cloudScale.value = 0.00025;
  scene.add(sky);

  const sol = new THREE.DirectionalLight('#fff4e6', 3);
  sol.castShadow = true;
  sol.shadow.mapSize.set(sombraTam, sombraTam);
  const sc = sol.shadow.camera as THREE.OrthographicCamera;
  sc.left = -95; sc.right = 95; sc.top = 95; sc.bottom = -95; sc.near = 10; sc.far = 600;
  sol.shadow.bias = -0.0003; sol.shadow.normalBias = 0.04;
  sol.target.position.copy(centro).setY(0);
  scene.add(sol, sol.target);

  const lua = new THREE.DirectionalLight('#9fb4e0', 0);
  lua.position.set(centro.x - 150, 220, centro.z + 80);
  lua.target.position.copy(centro);
  scene.add(lua, lua.target);
  const hemi = new THREE.HemisphereLight('#c7dcff', '#6b5d4b', 0.5);
  scene.add(hemi);

  // estrelas
  const r = rng(4);
  const n = 1400, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI * 2, ph = Math.acos(r() * 0.95);
    pos.set([Math.sin(ph) * Math.cos(th) * 3000, Math.cos(ph) * 3000 + 100, Math.sin(ph) * Math.sin(th) * 3000], i * 3);
  }
  const gEst = new THREE.BufferGeometry(); gEst.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mEst = new THREE.PointsMaterial({ size: 9, map: texEstrelas(), transparent: true, depthWrite: false, sizeAttenuation: true, opacity: 0, fog: false });
  const estrelas = new THREE.Points(gEst, mEst);
  scene.add(estrelas);

  scene.fog = new THREE.Fog('#b9c6d3', 300, 1900);

  // ambiente (reflexos) gerado a partir do próprio céu
  const pmrem = new THREE.PMREMGenerator(renderer);
  const cenaCeu = new THREE.Scene();
  const skyEnv = new Sky(); skyEnv.scale.setScalar(1000);
  cenaCeu.add(skyEnv);
  const chao = new THREE.Mesh(new THREE.CircleGeometry(900, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#6f6a5f' }));
  chao.position.y = -5; cenaCeu.add(chao);
  let rt: THREE.WebGLRenderTarget | null = null;

  const trilha = new THREE.Group(); trilha.name = 'trilha-solar'; trilha.visible = false;
  scene.add(trilha);

  const estado = { noite: 0, dir: new THREE.Vector3(0, 1, 0), pendenteEnv: true };

  const api: CeuCena = {
    sol, trilha, noite: 0,
    definir(dataISO, hora) {
      const p = posicaoSol(instanteLocal(dataISO, hora, emp.geo.fusoHoras), emp.geo.lat, emp.geo.lon);
      const [dx, dy, dz] = direcaoSolPlanta(p, emp.geo.azimuteTopoPlanta);
      const dir = new THREE.Vector3(dx, dy, dz).normalize();
      if (dir.angleTo(estado.dir) > 0.004) estado.pendenteEnv = true;
      estado.dir.copy(dir);
      u.sunPosition.value.copy(dir);
      skyEnv.material.uniforms.sunPosition.value.copy(dir);
      for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG', 'cloudCoverage', 'cloudDensity', 'cloudScale']) skyEnv.material.uniforms[k].value = u[k].value;
      const e = p.elevacao;
      const dia = THREE.MathUtils.smoothstep(e, -3, 10);
      const noite = 1 - THREE.MathUtils.smoothstep(e, -9, 1);
      estado.noite = noite; api.noite = noite;
      sol.position.copy(centro).setY(0).addScaledVector(dir, 300);
      sol.intensity = 3.0 * dia * (dir.y > 0 ? 1 : 0);
      sol.visible = sol.intensity > 0.01;
      const quente = new THREE.Color('#ff9a4d'), branco = new THREE.Color('#fff3e3');
      sol.color.copy(quente).lerp(branco, THREE.MathUtils.smoothstep(e, 2, 30));
      lua.intensity = 0.35 * noite;
      hemi.intensity = 0.1 + 0.3 * dia;
      hemi.color.set('#c7dcff').lerp(new THREE.Color('#2a3a5c'), noite);
      hemi.groundColor.set('#6b5d4b').lerp(new THREE.Color('#151515'), noite);
      mEst.opacity = noite;
      const neb = new THREE.Color('#b9c6d3').lerp(new THREE.Color('#e9b98f'), (1 - THREE.MathUtils.smoothstep(e, 0, 14)) * dia).lerp(new THREE.Color('#0a1222'), noite);
      (scene.fog as THREE.Fog).color.copy(neb);
      scene.environmentIntensity = (0.08 + 0.42 * dia) * (scene.userData.envMult ?? 1);
      renderer.toneMappingExposure = 0.5 + 0.05 * dia + 0.35 * noite;
      return { pos: p, noite };
    },
    atualizarAmbiente() {
      if (!estado.pendenteEnv) return;
      estado.pendenteEnv = false;
      const novo = pmrem.fromScene(cenaCeu, 0.02, 1, 3000);
      scene.environment = novo.texture;
      rt?.dispose();
      rt = novo;
    },
    desenharTrilha(dataISO) {
      trilha.clear();
      const pts: THREE.Vector3[] = [];
      const raio = 70;
      const c = centro.clone().setY(0);
      for (let h = 4; h <= 20; h += 0.1) {
        const p = posicaoSol(instanteLocal(dataISO, h, emp.geo.fusoHoras), emp.geo.lat, emp.geo.lon);
        if (p.elevacao < -1) continue;
        const [x, y, z] = direcaoSolPlanta(p, emp.geo.azimuteTopoPlanta);
        pts.push(new THREE.Vector3(x, y, z).multiplyScalar(raio).add(c));
      }
      if (pts.length > 1) {
        const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: '#ffcc55', dashSize: 2, gapSize: 1.2, fog: false }));
        l.computeLineDistances();
        trilha.add(l);
      }
      for (let h = 6; h <= 18; h += 2) {
        const p = posicaoSol(instanteLocal(dataISO, h, emp.geo.fusoHoras), emp.geo.lat, emp.geo.lon);
        if (p.elevacao < 0) continue;
        const [x, y, z] = direcaoSolPlanta(p, emp.geo.azimuteTopoPlanta);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texTexto(`${h}h`, '#ffcc55', 'rgba(0,0,0,0.55)', 256), fog: false, depthTest: false }));
        s.scale.set(6, 3, 1);
        s.position.set(x, y, z).multiplyScalar(raio).add(c);
        trilha.add(s);
      }
      // rosa dos ventos no chão
      const az = -emp.geo.azimuteTopoPlanta * Math.PI / 180;
      const norte = new THREE.Vector3(Math.sin(az), 0, -Math.cos(az));
      const seta = new THREE.ArrowHelper(norte, c.clone().setY(0.4).addScaledVector(norte, 30), 16, '#ff5a4f', 4, 2.5);
      trilha.add(seta);
      const lN = new THREE.Sprite(new THREE.SpriteMaterial({ map: texTexto('N', '#ff5a4f', null, 128), depthTest: false }));
      lN.scale.set(4, 4, 1); lN.position.copy(c).setY(2).addScaledVector(norte, 50);
      trilha.add(lN);
    },
  };
  return api;
}
