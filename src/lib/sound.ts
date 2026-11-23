// Petits signaux sonores (Web Audio), sans fichier externe.
// Les navigateurs n'autorisent le son qu'après une interaction de l'utilisateur : on « déverrouille » au premier clic.

import { useApp } from './store';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

/** Bip doux. `pattern` : suite de fréquences jouées l'une après l'autre. */
export function beep(pattern: number[] = [880], noteMs = 140) {
  if (!useApp.getState().data.settings.sounds) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  let t = c.currentTime;
  for (const freq of pattern) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + noteMs / 1000);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + noteMs / 1000 + 0.02);
    t += noteMs / 1000 + 0.04;
  }
}

export const sounds = {
  phase: () => beep([660, 880]),
  done: () => beep([660, 880, 1100], 160),
  reminder: () => beep([740, 988], 180),
};

export function vibrate(pattern: number | number[]) {
  try {
    // Le navigateur refuse la vibration tant que l'utilisateur n'a pas touché la page.
    const activation = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (activation && !activation.hasBeenActive) return;
    navigator.vibrate?.(pattern);
  } catch {
    /* non disponible */
  }
}
