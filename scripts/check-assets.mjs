import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
for (const name of ['avocado','burger','pizza','dessert']) {
 const bytes = await readFile('public/media/' + name + '.jpg');
 assert.equal(bytes.readUInt16BE(0), 0xffd8, name + ': invalid photograph');
}
console.log('PASS menu photographs');
