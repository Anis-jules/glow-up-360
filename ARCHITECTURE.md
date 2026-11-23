# Architecture de Glow Up 360°

Application web monopage : **React 19 + TypeScript + Tailwind CSS 4**, construite avec **Vite**.
Aucun serveur : toutes les données vivent dans le navigateur de l'appareil (voir « Données »).

## Arborescence

```
src/
  main.tsx, App.tsx          point d'entrée et routes (HashRouter : marche sur tout hébergement statique)
  index.css                  jetons de couleur (clair / sombre), animations
  lib/
    types.ts                 tout le modèle de données (AppData)
    defaults.ts              programme initial (sport, repas, routines, habitudes, rappels…)
    store.ts                 magasin unique (zustand + immer), sauvegarde automatique localStorage
    progress.ts              séance du jour, progression 30 jours, % quotidien, séries
    dates.ts                 dates locales (AAAA-MM-JJ), formats français, useToday()
    feedback.ts              toast(), removeWithUndo(), confirm()
    nav.ts                   onglets, useTab() (onglet interne dans l'adresse ?tab=)
    sound.ts, pwa.ts, utils.ts
  components/
    ui/                      composants réutilisables (Button, Card, Sheet, Fields, Tabs, Timer, BarChart…)
    layout/                  AppShell (barre latérale / barre du bas), PageHeader, ThemeSync
  features/<rubrique>/       une page par rubrique et ses sous-composants
```

## Conventions

- **Données** : `const data = useData(); const update = useUpdate();` puis `update((d) => { d.sport.workouts.push(...) })`.
  Chaque `update` est sauvegardé immédiatement et met à jour la photo du jour dans `history`.
  Modifier une journée passée : appeler `snapshotDay(d, key)` dans le même `update`.
- **Édition en direct** : les fenêtres d'édition modifient le magasin à chaque frappe, sans bouton « Enregistrer ».
  Créer = ajouter un élément par défaut puis ouvrir son éditeur.
- **Supprimer** : `removeWithUndo('Exercice supprimé', (d) => …)` laisse 6 secondes pour annuler.
  Suppression lourde : `await confirm({ title, message, danger: true })`.
- **Rubriques colorées** : chaque page est enveloppée dans `<ModuleScope module="sport">` ; les classes `bg-tint`,
  `text-tint`, `bg-tint/12`… prennent la couleur de la rubrique (modifiable dans Paramètres).
- **Mise en page** : `PageHeader`, puis `Tabs` (onglet dans l'adresse via `useTab`), puis des `Card` avec `SectionHeader`
  (boutons Modifier / Ajouter). En mode « Modifier », chaque élément montre `ReorderButtons` et un bouton supprimer.
- **Date du jour** : `useToday()` (se met à jour à minuit), jamais `new Date()` dans le rendu.
- **Textes** : français, tutoiement, pas de tiret cadratin. Aucune promesse santé : pas de détox, pas de perte de graisse
  localisée, pas de transformation osseuse.

## Données

- Stockage : `localStorage`, clé `glowup360` (format JSON, versionné). Points de restauration : clé `glowup360-backups`.
- Les données restent sur l'appareil et le navigateur utilisés. Pour passer d'un appareil à l'autre : Paramètres → Exporter,
  puis Importer sur l'autre appareil.
- `normalizeData()` complète une sauvegarde ancienne ou partielle avec les valeurs par défaut (import, mises à jour).
