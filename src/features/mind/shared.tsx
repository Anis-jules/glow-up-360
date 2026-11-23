import { Select } from '@/components/ui';
import { useData } from '@/lib/store';
import type { AppData, Book, BookStatus, Category, DateKey, ID } from '@/lib/types';
import { cx } from '@/lib/utils';

export const STATUS_LABEL: Record<BookStatus, string> = { 'a-lire': 'À lire', 'en-cours': 'En cours', lu: 'Lu' };
export const STATUS_ORDER: BookStatus[] = ['en-cours', 'a-lire', 'lu'];

/** Style d'une pastille dans la couleur d'une catégorie (texte lisible en clair comme en sombre). */
export function categoryStyle(color: string) {
  return {
    background: `color-mix(in oklab, ${color} 14%, transparent)`,
    color: `color-mix(in oklab, ${color} 78%, var(--ink))`,
  };
}

export function CategoryChip({ id, className }: { id: ID | null | undefined; className?: string }) {
  const cats = useData().mind.categories;
  const c = id ? cats.find((x) => x.id === id) : undefined;
  if (!c) {
    return (
      <span className={cx('inline-flex h-6 items-center rounded-full bg-ink/[0.06] px-2.5 text-xs font-medium text-ink-3', className)}>
        Sans catégorie
      </span>
    );
  }
  return (
    <span
      className={cx('inline-flex h-6 max-w-full items-center gap-1 truncate rounded-full px-2.5 text-xs font-medium', className)}
      style={categoryStyle(c.color)}
    >
      <span aria-hidden>{c.emoji}</span>
      <span className="truncate">{c.name}</span>
    </span>
  );
}

export function CategorySelect({
  value,
  onChange,
  categories,
  allLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: Category[];
  /** Si présent, ajoute une option « toutes » (valeur '') et « sans catégorie » (valeur 'none') pour filtrer. */
  allLabel?: string;
  className?: string;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {allLabel ? (
        <>
          <option value="">{allLabel}</option>
          <option value="none">Sans catégorie</option>
        </>
      ) : (
        <option value="">Sans catégorie</option>
      )}
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.emoji} {c.name}
        </option>
      ))}
    </Select>
  );
}

/** Filtre de catégorie : '' = toutes, 'none' = sans catégorie, sinon l'identifiant. */
export function matchCategory(filter: string, id: ID | null): boolean {
  if (!filter) return true;
  if (filter === 'none') return !id;
  return id === filter;
}

/** Change le statut d'un livre et tient les dates à jour (à utiliser dans un update). */
export function setBookStatus(b: Book, status: BookStatus, today: DateKey) {
  b.status = status;
  if (status === 'en-cours') {
    b.startedAt ??= today;
    b.finishedAt = undefined;
  } else if (status === 'lu') {
    b.startedAt ??= today;
    b.finishedAt = today;
    if (b.pagesTotal > 0) b.pagesRead = b.pagesTotal;
  } else {
    b.finishedAt = undefined;
  }
}

/** Ajoute (ou retire) des minutes à un objectif pour une date (à utiliser dans un update). */
export function addGoalMinutes(d: AppData, key: DateKey, goalId: ID, delta: number) {
  const day = (d.mind.log[key] ??= {});
  day[goalId] = Math.max(0, Math.round((day[goalId] ?? 0) + delta));
}
