import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

for (const name of ['avocado', 'burger', 'pizza', 'cake']) {
  const file = `public/models/${name}.glb`;
  const bytes = await readFile(file);
  assert.equal(bytes.toString('utf8', 0, 4), 'glTF', `${file}: invalid GLB`);
  assert.equal(bytes.readUInt32LE(4), 2, `${file}: expected glTF 2`);
  assert.equal(bytes.readUInt32LE(8), bytes.length, `${file}: truncated GLB`);
  const model = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  for (const resource of [...(model.images ?? []), ...(model.buffers ?? [])]) {
    if (!resource.uri || resource.uri.startsWith('data:')) continue;
    assert.ok(!/^[a-z]+:/i.test(resource.uri), `${file}: demo depends on a remote resource`);
    const local = path.resolve(path.dirname(file), decodeURIComponent(resource.uri));
    assert.ok(local.startsWith(path.resolve('public') + path.sep), `${file}: invalid resource path`);
    await access(local);
  }
  console.log(`PASS ${name}.glb and all referenced textures/buffers`);
}
const palette = await readFile('public/models/Textures/colormap.png');
assert.equal(palette.toString('hex', 0, 8), '89504e470d0a1a0a', 'Invalid palette PNG');
for (const name of ['avocado', 'burger', 'pizza', 'dessert']) {
  const bytes = await readFile(`public/media/${name}.jpg`);
  assert.equal(bytes.readUInt16BE(0), 0xffd8, `${name}: invalid photograph`);
}
console.log('PASS original model palette and menu photographs');
