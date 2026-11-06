// Depois do build: gera o arquivo único (duplo clique) e a pasta para publicar (GitHub Pages + PWA).
import { copyFileSync, mkdirSync, writeFileSync, readFileSync, statSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pastaDoProjeto, RAIZ } from './projetos.mjs';

const emp = process.env.EMP || 'padrao';
const pasta = pastaDoProjeto(emp);
const dist = resolve(RAIZ, 'dist');
const tmp = resolve(dist, 'tmp');
const dados = JSON.parse(readFileSync(resolve(pasta, 'empreendimento.json'), 'utf8'));
const unico = resolve(dist, `${emp}-apresentacao-3d.html`);
copyFileSync(resolve(tmp, 'index.html'), unico);

const pages = resolve(dist, 'pages', emp);
mkdirSync(pages, { recursive: true });
copyFileSync(resolve(tmp, 'index.html'), resolve(pages, 'index.html'));
writeFileSync(resolve(dist, 'pages', '.nojekyll'), '');
// página inicial do site publicado: abre o projeto padrão; cada projeto específico fica em /<id>/
writeFileSync(resolve(dist, 'pages', 'index.html'), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=padrao/"><title>Apresentação 3D</title><a href="padrao/">Abrir apresentação</a>');
let icone = { src: 'icone.svg', sizes: 'any', type: 'image/svg+xml' };
const logo = dados.incorporadora?.logo && resolve(pasta, 'imagens', dados.incorporadora.logo);
if (logo && existsSync(logo)) { copyFileSync(logo, resolve(pages, 'icone.png')); icone = { src: 'icone.png', sizes: '512x512', type: 'image/png' }; }
else writeFileSync(resolve(pages, 'icone.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="${dados.identidade.corPrimaria}"/><path d="M176 400V170l80-50 80 50v230" fill="none" stroke="#fff" stroke-width="28" stroke-linejoin="round"/><path d="M216 220h80M216 280h80M216 340h80" stroke="#fff" stroke-width="22"/></svg>`);
writeFileSync(resolve(pages, 'manifest.webmanifest'), JSON.stringify({
  name: `${dados.nome} ${dados.subtitulo}`, short_name: dados.nome, start_url: './', display: 'fullscreen', orientation: 'any',
  background_color: '#0f1216', theme_color: dados.identidade.corPrimaria, lang: 'pt-BR', icons: [{ ...icone, purpose: 'any' }],
}, null, 2));
const versao = Date.now().toString(36);
writeFileSync(resolve(pages, 'sw.js'), `// cache simples: funciona offline depois da primeira visita
const C = 'inc3d-${emp}-${versao}';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './${icone.src}']))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => { if (e.request.method !== 'GET') return; e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
`);
rmSync(tmp, { recursive: true, force: true });
const mb = (statSync(unico).size / 1048576).toFixed(1);
console.log(`\n✔ Arquivo único: dist/${emp}-apresentacao-3d.html (${mb} MB) — abre com duplo clique no Chrome`);
console.log(`✔ Pasta para publicar (GitHub Pages / PWA): dist/pages/${emp}/`);
