// Small list pictures for exercises without Everkinetic frames: the atlas close-up of the main muscle,
// pre-rendered to PNG so lists do not rasterise the 300–400 KB atlas SVG dozens of times.
// Run after build-art.mjs:  node scripts/build-thumbs.mjs  (needs Google Chrome)
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SIZE = 144;

const ov = readFileSync(join(ROOT, 'src/ui/art/overlays.ts'), 'utf8');
const LAYERS = JSON.parse(ov.slice(ov.indexOf('= {') + 2, ov.lastIndexOf(';')));
const art = readFileSync(join(ROOT, 'src/ui/art/art.ts'), 'utf8');
const CROP = Object.fromEntries([...art.matchAll(/(\w+): \{ view: '(front|back)', box: \[([\d, ]+)\] \}/g)].map((m) => [m[1], { view: m[2], box: m[3].split(',').map(Number) }]));
// tokens.css --c-* by group (muscles.ts)
const COLOR = { chest: '#FF7A45', back: '#3E8BFF', legs: '#9B7BFF', shoulders: '#FFC93D', arms: '#FF5C8A', core: '#2FD4B5' };
const GROUP = {
  chest: 'chest', delt_front: 'shoulders', delt_side: 'shoulders', delt_rear: 'shoulders', lats: 'back', upper_back: 'back',
  biceps: 'arms', triceps: 'arms', forearms: 'arms', abs: 'core', lower_back: 'back', glutes: 'legs', quads: 'legs',
  hamstrings: 'legs', adductors: 'legs', calves: 'legs',
};

const OUT = join(ROOT, 'public/art/thumbs');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const tmp = join(tmpdir(), `balance-thumbs-${process.pid}`);
mkdirSync(tmp, { recursive: true });

for (const [m, { view, box }] of Object.entries(CROP)) {
  const layers = (LAYERS[m]?.[view] ?? []).map((l) => `<g transform="${l.t}" fill="${COLOR[GROUP[m]]}" opacity=".86">${l.d.map((d) => `<path d="${d}"/>`).join('')}</g>`).join('');
  const html = `<html><body style="margin:0;background:transparent"><svg width="${SIZE}" height="${SIZE}" viewBox="${box.join(' ')}" preserveAspectRatio="xMidYMid slice"><image href="file://${join(ROOT, `public/art/atlas-${view}.svg`)}" width="200" height="369"/>${layers}</svg></body></html>`;
  const page = join(tmp, `${m}.html`);
  writeFileSync(page, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--default-background-color=00000000',
    `--window-size=${SIZE},${SIZE}`, `--screenshot=${join(OUT, `${m}.png`)}`, `file://${page}`], { stdio: 'ignore' });
}
rmSync(tmp, { recursive: true, force: true });
console.log(`thumbs: ${Object.keys(CROP).length} → public/art/thumbs`);
