import type { DateKey, FaceState, RoutineStep } from '@/lib/types';

/** Étapes obligatoires de toutes les routines. */
export function requiredSteps(face: FaceState): RoutineStep[] {
  return face.routines.flatMap((r) => r.steps).filter((s) => !s.optional);
}

/** Étapes qui correspondent au massage (titre ou description contenant « massage »), à défaut les étapes facultatives. */
export function massageStepIds(face: FaceState): string[] {
  const all = face.routines.flatMap((r) => r.steps);
  const byName = all.filter((s) => /massage/i.test(s.title));
  return (byName.length ? byName : all.filter((s) => s.optional)).map((s) => s.id);
}

/** Part des étapes obligatoires faites ce jour-là (0 à 1). */
export function faceFraction(face: FaceState, key: DateKey): number {
  const req = requiredSteps(face);
  if (!req.length) return 0;
  const done = new Set(face.log[key]?.done ?? []);
  return req.filter((s) => done.has(s.id)).length / req.length;
}

export function massageDoneOn(face: FaceState, key: DateKey): boolean {
  const done = new Set(face.log[key]?.done ?? []);
  return massageStepIds(face).some((id) => done.has(id));
}

export const SKIN_LABELS = ['Très inconfortable', 'Inconfortable', 'Correcte', 'Confortable', 'Rayonnante'];
