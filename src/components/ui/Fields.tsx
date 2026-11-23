import { ChevronDown, Minus, Plus, Star } from 'lucide-react';
import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { WEEKDAYS, WEEKDAYS_LETTER } from '@/lib/dates';
import type { Weekday } from '@/lib/types';
import { cx, PALETTE } from '@/lib/utils';

const inputBase =
  'w-full rounded-xl border border-transparent bg-surface-2 px-3.5 text-[15px] text-ink outline-none transition-[border-color,background-color] placeholder:text-ink-3 focus:border-tint/50 focus:bg-surface disabled:opacity-60';

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx(inputBase, 'h-11', className)} {...props} />;
});

/** Zone de texte qui s'agrandit avec son contenu. */
export function TextArea({ className, value, minRows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      className={cx(inputBase, 'resize-none py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cx('relative', className)}>
      <select className={cx(inputBase, 'h-11 appearance-none pr-9')} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
}

/** Nombre avec boutons − et +. */
export function NumberField({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  suffix,
  className,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Number.isFinite(v) ? v : min)));
  return (
    <div className={cx('flex h-11 items-center rounded-xl bg-surface-2', className)}>
      <button
        type="button"
        aria-label="Diminuer"
        onClick={() => set(value - step)}
        className="grid h-full w-10 shrink-0 place-items-center rounded-l-xl text-ink-2 hover:bg-ink/[0.06] active:scale-95"
      >
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => set(e.target.value === '' ? min : Number(e.target.value))}
        className="h-full w-full min-w-0 bg-transparent text-center text-[15px] font-medium tabular outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="shrink-0 pr-1 text-sm text-ink-3">{suffix}</span>}
      <button
        type="button"
        aria-label="Augmenter"
        onClick={() => set(value + step)}
        className="grid h-full w-10 shrink-0 place-items-center rounded-r-xl text-ink-2 hover:bg-ink/[0.06] active:scale-95"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/** Durée saisie en minutes + secondes, stockée en secondes. */
export function DurationField({ value, onChange, className }: { value: number; onChange: (sec: number) => void; className?: string }) {
  const m = Math.floor(value / 60);
  const s = value % 60;
  return (
    <div className={cx('grid grid-cols-2 gap-2', className)}>
      <NumberField value={m} onChange={(v) => onChange(v * 60 + s)} min={0} max={600} suffix="min" ariaLabel="Minutes" />
      <NumberField value={s} onChange={(v) => onChange(m * 60 + v)} min={0} max={55} step={5} suffix="s" ariaLabel="Secondes" />
    </div>
  );
}

export function TimeField({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(inputBase, 'h-11 tabular', className)}
    />
  );
}

/** Interrupteur. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  const sw = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={typeof label === 'string' ? label : undefined}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-tint' : 'bg-ink/15',
      )}
    >
      <span
        className={cx(
          'inline-block size-5.5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  );
  if (!label) return sw;
  return (
    <div className={cx('flex items-center justify-between gap-4 py-1', className)}>
      <div className="min-w-0">
        <div className="text-[15px] font-medium">{label}</div>
        {description && <div className="text-[13px] text-ink-3">{description}</div>}
      </div>
      {sw}
    </div>
  );
}

/** Choix des jours de la semaine. */
export function DayPicker({ value, onChange, className }: { value: Weekday[]; onChange: (v: Weekday[]) => void; className?: string }) {
  const all = value.length === 7;
  return (
    <div className={cx('flex flex-wrap items-center gap-1.5', className)}>
      {WEEKDAYS_LETTER.map((l, i) => {
        const on = value.includes(i as Weekday);
        return (
          <button
            key={i}
            type="button"
            aria-pressed={on}
            title={WEEKDAYS[i]}
            onClick={() =>
              onChange(on ? value.filter((d) => d !== i) : ([...value, i as Weekday].sort() as Weekday[]))
            }
            className={cx(
              'grid size-9 place-items-center rounded-full text-sm font-semibold transition-colors',
              on ? 'bg-tint text-tint-ink' : 'bg-surface-2 text-ink-2 hover:bg-ink/[0.08]',
            )}
          >
            {l}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange(all ? [] : [0, 1, 2, 3, 4, 5, 6])}
        className="ml-1 h-9 rounded-full px-3 text-xs font-medium text-ink-2 hover:bg-ink/[0.06]"
      >
        {all ? 'Aucun' : 'Tous les jours'}
      </button>
    </div>
  );
}

/** Choix d'une couleur dans la palette ou libre. */
export function ColorField({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-2', className)}>
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Couleur ${c}`}
          onClick={() => onChange(c)}
          className={cx(
            'size-8 rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110',
            value.toLowerCase() === c && 'ring-2 ring-ink/60',
          )}
          style={{ background: c }}
        />
      ))}
      <label
        className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-ink/30 text-ink-3 hover:border-ink/60"
        title="Couleur personnalisée"
      >
        <Plus className="size-4" />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

/** Saisie d'un emoji avec quelques suggestions. */
export function EmojiField({
  value,
  onChange,
  suggestions = [],
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions?: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => onChange(Array.from(e.target.value).slice(-2).join(''))}
        aria-label="Emoji"
        className={cx(inputBase, 'h-11 w-14 px-0 text-center text-xl')}
      />
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cx('grid size-9 place-items-center rounded-lg text-lg hover:bg-ink/[0.06]', value === s && 'bg-tint/12')}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/** Note de 1 à max (ressenti, appréciation). */
export function Rating({
  value,
  onChange,
  max = 5,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  labels?: string[];
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          title={labels?.[n - 1]}
          aria-label={labels?.[n - 1] ?? `${n} sur ${max}`}
          onClick={() => onChange(value === n ? 0 : n)}
          className="grid size-9 place-items-center rounded-lg transition-transform hover:bg-ink/[0.05] active:scale-90"
        >
          <Star className={cx('size-5', n <= value ? 'fill-tint text-tint' : 'text-ink/25')} />
        </button>
      ))}
    </div>
  );
}
