import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const executable = process.platform === 'win32' ? 'python' : 'python3';
const script = fileURLToPath(new URL('./prepare-tools.py', import.meta.url));
const result = spawnSync(executable, [script], { stdio: 'inherit' });
if (result.error) {
  console.error(`Could not start ${executable}: ${result.error.message}`);
}
process.exit(result.status ?? 1);
