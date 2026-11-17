// Search and filters of the «Упражнения» screen survive going into a card and back (until the app is closed).
import type { MuscleGroup, MuscleId } from '../data/catalog/types';

export const catalogFilter = $state({ q: '', group: null as MuscleGroup | null, muscle: null as MuscleId | null });
