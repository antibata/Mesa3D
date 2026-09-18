import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Also accept the host flags sent by the supervised development environment.
const args = process.argv.slice(2).filter(v => v !== '--strictPort').map(v => v === '--host' ? '--hostname' : v);
if (!args.includes('--hostname')) args.push('--hostname', '0.0.0.0');
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--webpack', ...args], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 0));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => child.kill(signal));
