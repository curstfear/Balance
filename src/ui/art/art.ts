// Pictures of the catalog: anatomy atlas crops and Everkinetic frames (public/art, built by scripts/build-art.mjs).
import type { MuscleId } from '../../data/catalog/types';
import type { View } from './overlays';

const BASE = import.meta.env.BASE_URL;
export const atlasUrl = (view: View) => `${BASE}art/atlas-${view}.svg`;
export const frameUrl = (id: string, frame: 'relaxation' | 'tension') => `${BASE}art/ek/${id}-${frame}.svg`;
/** pre-rendered atlas close-up of a main muscle (scripts/build-thumbs.mjs) — for lists */
export const thumbUrl = (m: MuscleId) => `${BASE}art/thumbs/${m}.png`;

/** Atlas units 200×369. Each main muscle has a close-up: which side and which box. */
export const CROP: Record<MuscleId, { view: View; box: [number, number, number, number] }> = {
  chest: { view: 'front', box: [22, 52, 156, 112] },
  delt_front: { view: 'front', box: [18, 48, 164, 116] },
  delt_side: { view: 'front', box: [18, 48, 164, 116] },
  delt_rear: { view: 'back', box: [18, 46, 164, 116] },
  biceps: { view: 'front', box: [16, 60, 168, 118] },
  forearms: { view: 'front', box: [8, 96, 184, 128] },
  abs: { view: 'front', box: [36, 96, 128, 92] },
  quads: { view: 'front', box: [30, 176, 140, 100] },
  adductors: { view: 'front', box: [40, 172, 120, 86] },
  lats: { view: 'back', box: [26, 62, 148, 106] },
  upper_back: { view: 'back', box: [22, 40, 156, 110] },
  lower_back: { view: 'back', box: [34, 98, 132, 94] },
  triceps: { view: 'back', box: [16, 60, 168, 118] },
  glutes: { view: 'back', box: [34, 150, 132, 96] },
  hamstrings: { view: 'back', box: [34, 186, 132, 96] },
  calves: { view: 'back', box: [38, 248, 124, 90] },
};

/** Opacity of a muscle layer by share: main muscle strong, assisting lighter, stabilisers not shown. */
export const layerOpacity = (share: number) => (share >= 1 ? 0.86 : share >= 0.5 ? 0.5 : 0);
