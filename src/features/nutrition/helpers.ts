// Outils propres à la rubrique Nutrition.

import type { AppData, DateKey, FoodItem, ID, MealLog, PlannedMeal, ShoppingItem, Weekday } from '@/lib/types';
import { uid } from '@/lib/utils';

export const MEAL_FEELINGS = ['Encore faim', 'Un peu léger', 'Juste bien', 'Bien rassasié', 'Trop plein'];

/** Repas prévu d'un créneau, créé vide s'il n'existe pas encore (à utiliser dans un update). */
export function ensurePlannedMeal(d: AppData, wd: Weekday, slotId: ID): PlannedMeal {
  const day = (d.nutrition.plan[wd] ??= {});
  return (day[slotId] ??= { title: '', items: [], notes: '', recipeId: null });
}

/** Suivi d'un repas pour une date, créé s'il n'existe pas encore (à utiliser dans un update). */
export function ensureMealLog(d: AppData, key: DateKey, slotId: ID): MealLog {
  const day = (d.nutrition.mealLog[key] ??= {});
  return (day[slotId] ??= { done: false, actual: '', note: '' });
}

export function isMealEmpty(m: PlannedMeal | undefined): boolean {
  return !m || (!m.title.trim() && m.items.length === 0 && !m.notes.trim() && !m.recipeId);
}

export function copyItems(items: FoodItem[]): FoodItem[] {
  return items.map((i) => ({ ...i, id: uid('fi') }));
}

const CATEGORY_RULES: [string, string[]][] = [
  ['Poissons et viandes', ['saumon', 'maquereau', 'sardine', 'thon', 'truite', 'poisson', 'poulet', 'dinde', 'boeuf', 'bœuf', 'viande', 'cabillaud']],
  ['Frais', ['yaourt', 'œuf', 'oeuf', 'lait', 'fromage', 'feta', 'skyr', 'beurre', 'crème', 'tofu']],
  ['Surgelés', ['surgel']],
  [
    'Fruits et légumes',
    ['citron', 'avocat', 'fruit', 'légume', 'legume', 'épinard', 'epinard', 'brocoli', 'salade', 'gingembre', 'pomme', 'courgette', 'haricots verts', 'concombre', 'oignon', 'patate', 'tomate', 'poireau', 'banane', 'menthe', 'persil', 'coriandre', 'ail', 'crudité', 'carotte', 'orange', 'kiwi', 'herbe', 'pousses'],
  ],
  [
    'Épicerie',
    ['flocon', 'avoine', 'riz', 'quinoa', 'pâte', 'pate', 'huile', 'amande', 'noix', 'lentille', 'pois chiche', 'miel', 'pain', 'cannelle', 'galette', 'sauce', 'conserve', 'graine', 'farine', 'épice', 'sel', 'poivre', 'café', 'thé', 'légumineuse'],
  ],
];

/** Devine le rayon d'un article à partir de son nom. */
export function guessCategory(name: string): string {
  const n = name.toLowerCase();
  for (const [cat, words] of CATEGORY_RULES) if (words.some((w) => n.includes(w))) return cat;
  return 'Divers';
}

/**
 * Ajoute des articles à la liste de courses sans créer de doublon :
 * un article déjà présent et coché redevient « à acheter ». Renvoie le nombre d'articles ajoutés ou réactivés.
 */
export function addToShopping(d: AppData, items: { name: string; qty?: string; category?: string }[]): number {
  let n = 0;
  for (const it of items) {
    const name = it.name.trim();
    if (!name) continue;
    const existing = d.nutrition.shopping.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      if (existing.checked) {
        existing.checked = false;
        if (it.qty) existing.qty = it.qty;
        n += 1;
      }
      continue;
    }
    const item: ShoppingItem = {
      id: uid('sh'),
      name,
      qty: it.qty?.trim() ?? '',
      category: it.category?.trim() || guessCategory(name),
      checked: false,
    };
    d.nutrition.shopping.push(item);
    n += 1;
  }
  return n;
}

export function shoppingMessage(n: number): string {
  if (n === 0) return 'Tout est déjà dans ta liste de courses';
  return n === 1 ? '1 article ajouté aux courses' : `${n} articles ajoutés aux courses`;
}

/** Copie un texte, avec repli pour les navigateurs sans presse-papiers asynchrone. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* repli ci-dessous */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Format « 750 ml » / « 1,5 L ». */
export function formatMl(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L`;
  return `${Math.round(ml)} ml`;
}
