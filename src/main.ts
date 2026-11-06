import { EMP } from './recursos.ts';
import { iniciarUI } from './ui/app.ts';

iniciarUI(EMP);

// PWA (instalar no celular / funcionar offline) — só quando publicado em http(s). Por arquivo local não se aplica.
if (location.protocol.startsWith('http') && 'serviceWorker' in navigator && !location.hostname.match(/^(localhost|127\.)/)) {
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = 'manifest.webmanifest';
  document.head.appendChild(link);
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
