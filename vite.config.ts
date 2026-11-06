import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

// Qual empreendimento montar: EMP=missouri npm run build (padrão: missouri)
const emp = process.env.EMP || 'missouri';
const pasta = resolve(__dirname, 'empreendimentos', emp);
if (!existsSync(resolve(pasta, 'empreendimento.json'))) throw new Error(`Empreendimento "${emp}" não encontrado em empreendimentos/`);

export default defineConfig({
  base: './',
  resolve: { alias: { '@emp': pasta } },
  plugins: [viteSingleFile()],
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 6000, assetsInlineLimit: 100_000_000, target: 'es2022' },
  server: { host: true },
});
