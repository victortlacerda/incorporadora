// Monta o projeto padrão e todos os projetos específicos.
import { execSync } from 'node:child_process';
import { listarProjetos, RAIZ } from './projetos.mjs';
for (const emp of listarProjetos()) {
  console.log(`\n=== ${emp} ===`);
  execSync('npx vite build --logLevel warn && node scripts/pos-build.mjs', { cwd: RAIZ, stdio: 'inherit', env: { ...process.env, EMP: emp } });
}
