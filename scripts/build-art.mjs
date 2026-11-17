// Builds exercise pictures from open sources. Run manually after changing `art` in the catalog:
//   node scripts/build-art.mjs <everkinetic dist/svg dir> <wger images/muscles dir>
// Sources (see public/art/LICENSE.md):
//   Everkinetic — github.com/everkinetic/data, CC BY-SA 4.0 (exercise frames)
//   Anatomy atlas — Wikimedia Commons «Muscular system» by Termininja, CC BY-SA 3.0, muscle layers from wger (CC BY-SA)
// Output: public/art/ek/<id>-<frame>.svg, public/art/atlas-<view>.svg, src/ui/art/overlays.ts
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [EK, WG] = process.argv.slice(2);
if (!EK || !WG) { console.error('usage: node scripts/build-art.mjs <everkinetic svg dir> <wger muscles dir>'); process.exit(1); }
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- minify: drop editor metadata and extra whitespace.
// Coordinates are NOT rounded: paths use relative commands, rounding error accumulates and contours break into blobs.
function minify(svg) {
  return svg
    .replace(/<\?xml[^>]*>/g, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/g, '').replace(/<sodipodi:namedview[\s\S]*?(\/>|<\/sodipodi:namedview>)/g, '')
    .replace(/<defs[^>]*\/>/g, '')
    .replace(/\s(?:inkscape|sodipodi):[\w-]+="[^"]*"/g, '').replace(/\sxmlns:(?:dc|cc|rdf|svg|sodipodi|inkscape)="[^"]*"/g, '')
    .replace(/\s(d|points|transform)="([^"]*)"/g, (_, a, v) => ` ${a}="${v.replace(/\s+/g, ' ').trim()}"`)
    .replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
}

// --- which Everkinetic pictures the catalog uses
const SRC = join(ROOT, 'src/data/catalog');
const files = [join(SRC, 'equipment.ts'), ...readdirSync(join(SRC, 'exercises')).map((f) => join(SRC, 'exercises', f))];
const ids = new Set();
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/art: \{ id: '(\d{4})'/g)) ids.add(m[1]);
  for (const m of t.matchAll(/art: '(\d{4})'/g)) ids.add(m[1]);
}
const OUT = join(ROOT, 'public/art/ek');
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
let bytes = 0;
for (const id of [...ids].sort()) {
  for (const frame of ['relaxation', 'tension']) {
    const src = join(EK, `${id}-${frame}.svg`);
    if (!existsSync(src)) { console.error(`missing ${src}`); process.exit(1); }
    // keep only the line layer, drawn in currentColor; the white «paper» layer is dropped so the picture sits on any background
    const out = minify(readFileSync(src, 'utf8'))
      .replace(/<g fill="#fff(?:fff)?">[\s\S]*?<\/g>/i, '')
      .replace(/<g fill="#[0-9a-f]{3,6}">/i, '<g fill="currentColor">');
    if (!out.includes('currentColor')) { console.error(`unexpected layers in ${src}`); process.exit(1); }
    writeFileSync(join(OUT, `${id}-${frame}.svg`), out);
    bytes += out.length;
  }
}
console.log(`everkinetic: ${ids.size} pictures, ${(bytes / 1024).toFixed(0)} KB`);

// --- atlas
for (const view of ['front', 'back']) {
  const out = minify(readFileSync(join(WG, `muscular_system_${view}.svg`), 'utf8'));
  writeFileSync(join(ROOT, `public/art/atlas-${view}.svg`), out);
  console.log(`atlas-${view}: ${(out.length / 1024).toFixed(0)} KB`);
}

// --- muscle layers: wger overlay id → our muscle; paths keep their group transform (atlas units 200×369)
const WGER = {
  chest: [[4, 'front']], delt_front: [[2, 'front']], biceps: [[1, 'front'], [13, 'front']], abs: [[6, 'front'], [14, 'front']],
  quads: [[10, 'front']], triceps: [[5, 'back']], calves: [[7, 'back'], [15, 'back']], glutes: [[8, 'back']],
  upper_back: [[9, 'back']], hamstrings: [[11, 'back']], lats: [[12, 'back']], lower_back: [[16, 'back']],
};
// drawn for Balance over the same atlas (not in wger): side and rear delts, forearms, adductors, inner hamstrings
const OWN = {
  delt_side: { front: ['M53 68 L58 70 L57 86 L52 98 L48 93 L48 80 Z', 'M147 68 L142 70 L143 86 L148 98 L152 93 L152 80 Z'] },
  hamstrings: { back: ['M87 208 L96 206 L97 236 L94 262 L88 258 L86 232 Z', 'M114 208 L105 206 L104 236 L107 262 L113 258 L115 232 Z'] },
  delt_rear: { back: ['M46 74 L54 66 L62 70 L60 86 L52 98 L46 92 Z', 'M154 74 L146 66 L138 70 L140 86 L148 98 L154 92 Z'] },
  forearms: {
    front: ['M47 127 L59 124 L56 140 L49 160 L38 177 L27 176 L33 160 L41 143 Z', 'M141 124 L153 127 L159 143 L167 160 L173 176 L162 177 L151 160 L144 140 Z'],
    back: ['M44 128 L50 136 L44 158 L36 180 L28 186 L25 178 L32 156 L38 138 Z', 'M156 128 L150 136 L156 158 L164 180 L172 186 L175 178 L168 156 L162 138 Z'],
  },
  adductors: { front: ['M97 197 L89 192 L84 205 L86 224 L92 238 L97 226 Z', 'M103 197 L111 192 L116 205 L114 224 L108 238 L103 226 Z'] },
};
const layers = {};
for (const [muscle, list] of Object.entries(WGER)) {
  for (const [n, view] of list) {
    const svg = readFileSync(join(WG, 'main', `muscle-${n}.svg`), 'utf8');
    const tr = /<g[^>]*transform="([^"]+)"/.exec(svg)?.[1] ?? '';
    const ds = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, ' ').trim());
    ((layers[muscle] ??= {})[view] ??= []).push({ t: tr, d: ds });
  }
}
for (const [muscle, views] of Object.entries(OWN)) for (const [view, ds] of Object.entries(views)) ((layers[muscle] ??= {})[view] ??= []).push({ t: '', d: ds });

const ts = `// Generated by scripts/build-art.mjs — do not edit by hand.
// Muscle layers over the anatomy atlas (200×369): wger muscle images (CC BY-SA) and Balance's own shapes for delts, forearms and adductors.
import type { MuscleId } from '../../data/catalog/types';

export type View = 'front' | 'back';
export interface Layer { t: string; d: string[] }
export const LAYERS: Partial<Record<MuscleId, Partial<Record<View, Layer[]>>>> = ${JSON.stringify(layers)};
`;
mkdirSync(join(ROOT, 'src/ui/art'), { recursive: true });
writeFileSync(join(ROOT, 'src/ui/art/overlays.ts'), ts);
console.log(`overlays: ${Object.keys(layers).length} muscles, ${(ts.length / 1024).toFixed(0)} KB`);
