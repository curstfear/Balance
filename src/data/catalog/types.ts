// Built-in catalog: muscles, movement patterns, equipment, exercises.
// Spec: docs/engine/catalog.md and docs/engine/exercise-selection.md §1. Data only — no UI, no IndexedDB.

/** 16 muscle groups the engine counts volume for. */
export type MuscleId =
  | 'chest' | 'delt_front' | 'delt_side' | 'delt_rear' | 'lats' | 'upper_back' | 'biceps' | 'triceps'
  | 'forearms' | 'abs' | 'lower_back' | 'glutes' | 'quads' | 'hamstrings' | 'adductors' | 'calves';

/** Colour family on screens (6 families, same as tokens --c-*). Same values as `Muscle` in schema.ts. */
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core';

export type Pattern =
  | 'h_push' | 'incline_push' | 'v_push' | 'chest_fly' | 'h_pull' | 'v_pull' | 'shoulder_ext' | 'lateral_raise'
  | 'rear_delt' | 'shrug' | 'squat' | 'hinge' | 'hip_thrust' | 'single_leg' | 'knee_ext' | 'knee_flex' | 'hip_add'
  | 'hip_abd' | 'calf' | 'elbow_flex' | 'elbow_ext' | 'core_flex' | 'core_anti_ext' | 'core_anti_rot' | 'carry';

export type PatternFamily = 'push' | 'pull' | 'quad' | 'posterior' | 'core' | 'other';

export type EquipClass =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine_stack' | 'machine_plate' | 'smith' | 'bodyweight' | 'band' | 'kettlebell';

/** Joint zones for limitations (safety.md §3). */
export type Zone = 'shoulder' | 'elbow' | 'wrist' | 'lower_back' | 'knee' | 'hip' | 'neck';

/** Contribution of a muscle: 1 main, .75 large, .5 assisting, .25 stabiliser. */
export type Share = 1 | 0.75 | 0.5 | 0.25;

export interface MuscleInfo {
  id: MuscleId;
  name: string;
  group: MuscleGroup;
  size: 'large' | 'medium' | 'small';
  /** recovery time constant, hours (load-and-progression §7) */
  tauH: number;
}

export interface PatternInfo {
  id: Pattern;
  name: string;
  family: PatternFamily;
}

export interface Equipment {
  id: string;
  name: string;
  class: EquipClass | 'bench' | 'rack' | 'accessory';
  /** Everkinetic picture of a typical exercise on it (equipment cards, «Мой зал») */
  art?: string;
}

export interface Exercise {
  /** stable kebab-case id; never removed or reused (renames go to RENAMED in index.ts) */
  id: string;
  name: { ru: string; en: string };
  aliases: string[];
  /** AND of OR-groups: [["bench_flat","bench_adj"],["dumbbells"]] */
  equipment: string[][];
  equipClass: EquipClass;
  /** where it is done — for «тренажёр занят» and supersets */
  station: string;
  pattern: Pattern;
  /** redundancy key: two exercises with the same key never go into one session */
  vectorKey: string;
  mechanics: 'compound' | 'isolation';
  laterality: 'bilateral' | 'unilateral' | 'alternating';
  muscles: Partial<Record<MuscleId, Share>>;
  lengthBias: 'long' | 'mid' | 'short';
  lengthenedPartialsOk: boolean;
  /** 1 machine / supported, 2 cable or dumbbells with support, 3 free standing */
  stability: 1 | 2 | 3;
  skill: 1 | 2 | 3;
  fatigue: 1 | 2 | 3;
  axial: 'none' | 'low' | 'moderate' | 'high';
  needsSafety: boolean;
  gripLimited: boolean;
  load: 'external' | 'bodyweight' | 'bodyweight_plus' | 'assisted';
  /** seconds to set up; default by equipClass (selection §6) */
  setupSec?: number;
  supersetOk: boolean;
  repRange?: { strength: [number, number]; hyper: [number, number] };
  minExperience: 'novice' | 'intermediate' | 'advanced';
  contraindications: { zone: Zone; level: 'avoid' | 'modify' }[];
  /** weight carries over between exercises of one group (load-and-progression §5) */
  transferGroup: string;
  /** kg; overrides the default by equipClass. null — progression by reps only */
  weightStep?: number | null;
  technique: {
    /** Everkinetic picture: id and which of its two frames is the starting position.
     *  Absent — the exercise has no frames (listed in catalog.md). */
    art?: { id: string; first: 'relaxation' | 'tension' };
    cues: string[];
  };
  custom: false;
  dataSource: 'curated';
}
