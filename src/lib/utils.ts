/** Identifiant unique (fonctionne aussi hors contexte sécurisé, où crypto.randomUUID n'existe pas). */
export function uid(prefix = ''): string {
  const rand =
    typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('')
      : Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  return `${prefix}${prefix ? '-' : ''}${rand.slice(0, 12)}`;
}

/** Concatène des classes en ignorant les valeurs fausses. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Déplace un élément d'un tableau (mutation, à utiliser dans un update immer). */
export function moveItem<T>(arr: T[], from: number, to: number): void {
  if (to < 0 || to >= arr.length || from === to) return;
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Copie profonde de données JSON. */
export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Texte de contraste lisible (noir ou blanc) pour une couleur hex. */
export function readableInk(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? '#111114' : '#ffffff';
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${Math.abs(n) >= 2 ? many : one}`;
}

/** Couleurs proposées dans les sélecteurs. */
export const PALETTE = [
  '#6d5dfc',
  '#3b82f6',
  '#0ea5e9',
  '#14b8a6',
  '#1fae7a',
  '#84cc16',
  '#f2a93b',
  '#ff7a45',
  '#ef4444',
  '#ec5f9c',
  '#a855f7',
  '#64748b',
];
