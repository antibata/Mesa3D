import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const port = 3191;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)], { stdio: ['ignore','pipe','pipe'] });
let output = '';
server.stdout.on('data', chunk => output += chunk.toString());
server.stderr.on('data', chunk => output += chunk.toString());
try {
  const started=Date.now();
  while (!output.includes('Ready')) {
    if (server.exitCode !== null) throw new Error(`Server stopped: ${output}`);
    if (Date.now()-started > 20000) throw new Error(`Server did not start: ${output}`);
    await new Promise(resolve => setTimeout(resolve,200));
  }
  for (const [path,type] of [['/r/brasa','text/html'],['/acceso','text/html'],['/panel','text/html'],['/media/burger.jpg','image/jpeg']]) {
    const response=await fetch(`http://127.0.0.1:${port}${path}`);
    assert.equal(response.status,200,`${path} status`);
    if (type === 'text/html') assert.match(response.headers.get('content-type')??'',/text\/html/);
    const bytes=new Uint8Array(await response.arrayBuffer());
    if (type==='image/jpeg') assert.deepEqual([...bytes.subarray(0,2)],[0xff,0xd8]);
    console.log(`PASS ${path} (${bytes.length} bytes)`);
  }
} finally { server.kill('SIGTERM'); }
