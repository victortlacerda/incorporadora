// Depois do build: gera o arquivo único para abrir por duplo clique e a pasta para publicar (GitHub Pages + PWA).
import { copyFileSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const emp = process.env.EMP || 'missouri';
const raiz = resolve(import.meta.dirname, '..');
const dist = resolve(raiz, 'dist');
const dados = JSON.parse(readFileSync(resolve(raiz, 'empreendimentos', emp, 'empreendimento.json'), 'utf8'));
const unico = resolve(dist, `${emp}-apresentacao-3d.html`);
copyFileSync(resolve(dist, 'index.html'), unico);

const pages = resolve(dist, 'pages');
mkdirSync(pages, { recursive: true });
copyFileSync(resolve(dist, 'index.html'), resolve(pages, 'index.html'));
writeFileSync(resolve(pages, '.nojekyll'), '');
copyFileSync(resolve(raiz, 'empreendimentos', emp, 'imagens', dados.incorporadora.logo), resolve(pages, 'icone.png'));
writeFileSync(resolve(pages, 'manifest.webmanifest'), JSON.stringify({
  name: `${dados.nome} ${dados.subtitulo}`, short_name: dados.nome, start_url: './', display: 'fullscreen', orientation: 'any',
  background_color: '#0f1216', theme_color: dados.identidade.corPrimaria, lang: 'pt-BR',
  icons: [{ src: 'icone.png', sizes: '374x340', type: 'image/png', purpose: 'any' }],
}, null, 2));
const versao = Date.now().toString(36);
writeFileSync(resolve(pages, 'sw.js'), `// cache simples: funciona offline depois da primeira visita
const C = 'inc3d-${emp}-${versao}';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icone.png']))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => { if (e.request.method !== 'GET') return; e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
`);
const mb = (statSync(unico).size / 1048576).toFixed(1);
console.log(`\n✔ Arquivo único: dist/${emp}-apresentacao-3d.html (${mb} MB) — abre com duplo clique no Chrome`);
console.log('✔ Pasta para publicar (GitHub Pages / PWA): dist/pages/');
