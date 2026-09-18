import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
// Local ZIPs include these files. Source-only deployments fetch the same licensed assets.
const assets = [
  ['public/models/avocado.glb','https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb'],
  ['public/media/avocado.jpg','https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=1000&q=85&fit=crop'],
  ['public/media/burger.jpg','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=85&fit=crop'],
  ['public/media/pizza.jpg','https://images.unsplash.com/photo-1579751626657-72bc17010498?w=1200&q=85&fit=crop'],
  ['public/media/dessert.jpg','https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=85&fit=crop']
];
await Promise.all(assets.map(async ([file,url]) => {
  try { await access(file); return; } catch { /* First build only. */ }
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
  if(!response.ok) throw new Error(`Could not fetch ${file}: HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes);
}));
