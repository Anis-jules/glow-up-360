import { Pause, Play, RotateCcw, SkipForward, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatClock } from '@/lib/dates';
import { sounds, unlockAudio, vibrate } from '@/lib/sound';
import { cx } from '@/lib/utils';
import { Button, IconButton } from './Button';
import { ProgressRing } from './Progress';

export interface TimerPhase {
  label: string;
  seconds: number;
  tone?: 'work' | 'rest' | 'neutral';
}

/**
 * Minuteur à étapes (séries, fractionné, méditation…).
 * Le temps est calculé à partir de l'horloge : il reste juste même si l'onglet passe en arrière-plan.
 */
export function SequenceTimer({
  phases,
  onFinish,
  onStop,
  onPhaseChange,
  finishLabel = 'Terminé',
  className,
}: {
  phases: TimerPhase[];
  /** Appelé quand toutes les étapes sont terminées. */
  onFinish?: () => void;
  /** Appelé quand on arrête avant la fin, avec le temps écoulé (secondes). */
  onStop?: (elapsedSec: number) => void;
  /** Appelé à chaque changement d'étape (index dans `phases`). */
  onPhaseChange?: (index: number) => void;
  finishLabel?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState((phases[0]?.seconds ?? 0) * 1000);
  const [finished, setFinished] = useState(false);
  const endAt = useRef(0);
  const elapsedBefore = useRef(0); // secondes des étapes déjà terminées
  const key = phases.map((p) => `${p.label}:${p.seconds}`).join('|');

  // Réinitialise si le plan change.
  useEffect(() => {
    setIndex(0);
    setRunning(false);
    setFinished(false);
    setRemainingMs((phases[0]?.seconds ?? 0) * 1000);
    elapsedBefore.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const phaseCb = useRef(onPhaseChange);
  phaseCb.current = onPhaseChange;
  useEffect(() => {
    phaseCb.current?.(index);
  }, [index]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = endAt.current - Date.now();
      if (left > 0) {
        setRemainingMs(left);
        return;
      }
      // Étape terminée
      elapsedBefore.current += phases[index]?.seconds ?? 0;
      const next = index + 1;
      if (next >= phases.length) {
        setRunning(false);
        setRemainingMs(0);
        setFinished(true);
        sounds.done();
        vibrate([120, 80, 120]);
        onFinish?.();
        return;
      }
      sounds.phase();
      vibrate(80);
      setIndex(next);
      endAt.current = Date.now() + phases[next].seconds * 1000;
      setRemainingMs(phases[next].seconds * 1000);
    };
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [running, index, phases, onFinish]);

  if (!phases.length) return null;
  const phase = phases[Math.min(index, phases.length - 1)];
  const total = phase.seconds * 1000;
  const nextPhase = phases[index + 1];
  const elapsedSec = elapsedBefore.current + Math.round((total - remainingMs) / 1000);

  const start = () => {
    unlockAudio();
    if (finished) {
      reset();
      return;
    }
    endAt.current = Date.now() + remainingMs;
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setFinished(false);
    setIndex(0);
    elapsedBefore.current = 0;
    setRemainingMs(phases[0].seconds * 1000);
  };
  const skip = () => {
    elapsedBefore.current += phase.seconds;
    const next = index + 1;
    if (next >= phases.length) {
      setRunning(false);
      setRemainingMs(0);
      setFinished(true);
      onFinish?.();
      return;
    }
    setIndex(next);
    setRemainingMs(phases[next].seconds * 1000);
    endAt.current = Date.now() + phases[next].seconds * 1000;
  };

  const tone = phase.tone ?? 'neutral';
  return (
    <div className={cx('flex flex-col items-center gap-4 rounded-3xl bg-surface-2 px-4 py-6', className)}>
      <div className="flex items-center gap-2 text-sm">
        <span
          className={cx(
            'rounded-full px-3 py-1 font-semibold',
            tone === 'work' && 'bg-tint text-tint-ink',
            tone === 'rest' && 'bg-ink/10 text-ink',
            tone === 'neutral' && 'bg-tint/12 text-tint',
          )}
        >
          {finished ? finishLabel : phase.label}
        </span>
        {phases.length > 1 && !finished && (
          <span className="text-ink-3 tabular">
            {index + 1}/{phases.length}
          </span>
        )}
      </div>
      <ProgressRing value={finished ? 1 : total ? 1 - remainingMs / total : 0} size={176} stroke={12}>
        <div>
          <div className="font-display text-5xl font-semibold tracking-tight tabular">
            {formatClock(Math.ceil(remainingMs / 1000))}
          </div>
          {nextPhase && !finished && (
            <div className="mt-1 text-xs text-ink-3">
              Ensuite : {nextPhase.label} · {formatClock(nextPhase.seconds)}
            </div>
          )}
        </div>
      </ProgressRing>
      <div className="flex items-center gap-2">
        <IconButton label="Recommencer" variant="secondary" onClick={reset}>
          <RotateCcw />
        </IconButton>
        {running ? (
          <Button variant="tint" size="lg" onClick={pause} className="min-w-36">
            <Pause /> Pause
          </Button>
        ) : (
          <Button variant="tint" size="lg" onClick={start} className="min-w-36">
            {finished ? <RotateCcw /> : <Play />} {finished ? 'Relancer' : elapsedSec > 0 ? 'Reprendre' : 'Démarrer'}
          </Button>
        )}
        {onStop && !finished && elapsedSec > 0 ? (
          <IconButton
            label="Arrêter et enregistrer"
            variant="secondary"
            onClick={() => {
              setRunning(false);
              onStop(elapsedSec);
              reset();
            }}
          >
            <Square />
          </IconButton>
        ) : (
          <IconButton label="Étape suivante" variant="secondary" onClick={skip} disabled={finished}>
            <SkipForward />
          </IconButton>
        )}
      </div>
    </div>
  );
}
