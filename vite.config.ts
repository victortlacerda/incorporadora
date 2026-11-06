import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
// @ts-ignore — módulo JS compartilhado com os scripts
import { pastaDoProjeto } from './scripts/projetos.mjs';

// Qual projeto montar: EMP=padrao (genérico, padrão) ou EMP=<id> de projetos-especificos/ (ex.: EMP=missouri)
const pasta: string = pastaDoProjeto(process.env.EMP || 'padrao');

export default defineConfig({
  base: './',
  resolve: { alias: { '@emp': pasta } },
  plugins: [viteSingleFile()],
  build: { outDir: 'dist/tmp', emptyOutDir: true, chunkSizeWarningLimit: 6000, assetsInlineLimit: 100_000_000, target: 'es2022' },
  server: { host: true },
});
