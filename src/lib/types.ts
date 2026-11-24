// Modèle de données de Glow Up 360°.
// Tout ce que l'utilisateur voit est une donnée modifiable : aucun texte métier n'est figé dans les composants.

export type ID = string;
/** Date locale au format AAAA-MM-JJ. */
export type DateKey = string;
/** Jour de la semaine, 0 = lundi … 6 = dimanche. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ModuleKey = 'sport' | 'nutrition' | 'face' | 'mind' | 'habits';
export type ThemeMode = 'light' | 'dark' | 'system';
export type DashboardCardId = 'checklist' | 'agenda' | 'habits' | 'sport' | 'nutrition' | 'face' | 'mind' | 'week';

// ───────────────────────── Réglages

export interface Settings {
  name: string;
  theme: ThemeMode;
  /** Couleur principale (hex). */
  accent: string;
  /** Couleur de chaque rubrique (hex). */
  moduleColors: Record<ModuleKey, string>;
  /** Messages de motivation ; « {name} » est remplacé par le prénom. */
  motivations: string[];
  /** Pourcentage à partir duquel une journée compte comme réussie. */
  completionThreshold: number;
  /** Rubriques prises en compte dans la progression quotidienne. */
  modulesInProgress: Record<ModuleKey, boolean>;
  /** Jours « joker » par semaine qui ne cassent pas la série. */
  jokersPerWeek: number;
  /** Ordre et visibilité des cartes du tableau de bord. */
  dashboardCards: { id: DashboardCardId; visible: boolean }[];
  /** L'utilisateur souhaite recevoir des notifications web. */
  notificationsEnabled: boolean;
  /** Afficher aussi une alerte dans l'application à l'heure d'un rappel. */
  inAppAlerts: boolean;
  /** Son discret à l'heure d'un rappel et à la fin d'un minuteur. */
  sounds: boolean;
}

// ───────────────────────── Sport

/**
 * reps : séries × répétitions ; time : séries × durée ;
 * interval : rounds × (effort + récupération) ; free : activité libre (durée indicative).
 */
export type ExerciseKind = 'reps' | 'time' | 'interval' | 'free';

export interface Exercise {
  id: ID;
  name: string;
  kind: ExerciseKind;
  /** reps/time : nombre de séries ; interval : nombre de répétitions du bloc. */
  sets: number;
  reps: number;
  /** Les répétitions s'entendent par côté (fentes…). */
  perSide: boolean;
  /** time : durée d'une série ; free : durée indicative totale (0 = libre). */
  durationSec: number;
  /** interval : durée de l'effort. */
  workSec: number;
  /** interval : durée de la récupération. */
  recoverSec: number;
  workLabel: string;
  recoverLabel: string;
  /** Repos entre les séries. */
  restSec: number;
  /** Consignes d'exécution. */
  instructions: string;
  /** Notes personnelles. */
  notes: string;
  optional: boolean;
  /** Suit la progression sur 30 jours. */
  progressive: boolean;
}

export type WorkoutType = 'force' | 'cardio' | 'mobilite' | 'repos' | 'perso';

export interface Workout {
  id: ID;
  title: string;
  type: WorkoutType;
  /** Courte description (zones travaillées, objectif). */
  focus: string;
  exercises: Exercise[];
  notes: string;
}

export interface ProgressionPhase {
  id: ID;
  name: string;
  fromDay: number;
  toDay: number;
  repsDelta: number;
  setsDelta: number;
  timeDeltaSec: number;
  workDeltaSec: number;
  recoverDeltaSec: number;
  description: string;
}

export interface SportLogEntry {
  workoutId: ID;
  /** Titre au moment de la séance (l'historique reste lisible si la séance est renommée ou supprimée). */
  workoutTitle: string;
  /** Exercices validés. */
  done: ID[];
  /** Nombre d'exercices obligatoires de la séance ce jour-là. */
  total: number;
  note: string;
  /** Ressenti de 1 à 5. */
  feeling?: number;
  finishedAt?: string;
  /** Exercices ajoutés pour cette journée seulement (ne modifient pas la séance). */
  extras?: Exercise[];
}

/** Exercices du visage : rotation de plusieurs exercices, un le matin et un le soir. */
export type FaceSlot = 'matin' | 'soir';

export interface FaceExercise {
  id: ID;
  name: string;
  /** Créateur ou source (compte, vidéo…). */
  author: string;
  instructions: string;
  durationSec: number;
  /** Lien vers la vidéo de référence. */
  link: string;
}

export interface FaceTraining {
  enabled: boolean;
  /** Point de départ de la rotation. */
  startDate: DateKey;
  /** Dans l'ordre de rotation. */
  exercises: FaceExercise[];
  /** Créneaux faits chaque jour. */
  log: Record<DateKey, FaceSlot[]>;
}

export interface SportState {
  /** Exercices du visage du matin et du soir. */
  faceTraining: FaceTraining;
  /** Bibliothèque de séances (programme initial + séances perso). */
  workouts: Workout[];
  /** Séance prévue pour chaque jour (index = Weekday), null = rien de prévu. */
  week: (ID | null)[];
  progression: {
    enabled: boolean;
    startDate: DateKey;
    lengthDays: number;
    phases: ProgressionPhase[];
  };
  log: Record<DateKey, SportLogEntry>;
}

// ───────────────────────── Nutrition

export interface FoodItem {
  id: ID;
  name: string;
  qty: string;
}

export interface MealSlot {
  id: ID;
  name: string;
  time: string;
  emoji: string;
}

export interface PlannedMeal {
  title: string;
  items: FoodItem[];
  notes: string;
  recipeId?: ID | null;
  /** Repères approximatifs pour le repas. */
  kcal?: number;
  protein?: number;
}

export interface Food {
  id: ID;
  name: string;
  emoji: string;
  category: string;
  benefits: string;
  tip: string;
  favorite: boolean;
}

export interface Recipe {
  id: ID;
  title: string;
  emoji: string;
  category: string;
  prepMin: number;
  servings: number;
  ingredients: FoodItem[];
  steps: string[];
  notes: string;
  favorite: boolean;
  /** Repères approximatifs par portion. */
  kcal?: number;
  protein?: number;
}

export interface ShoppingItem {
  id: ID;
  name: string;
  qty: string;
  category: string;
  checked: boolean;
}

export interface MealLog {
  done: boolean;
  /** Ce que j'ai réellement mangé, si différent du plan. */
  actual: string;
  note: string;
  /** Énergie / satiété ressentie, de 1 à 5. */
  feeling?: number;
}

/** Programme alimentaire : repères quotidiens (modifiables). */
export interface NutritionProgram {
  title: string;
  /** Profil de départ : taille, poids… */
  profile: string;
  goal: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  tips: string[];
}

export interface NutritionState {
  program: NutritionProgram;
  slots: MealSlot[];
  /** plan[weekday][slotId] */
  plan: Record<ID, PlannedMeal>[];
  foods: Food[];
  recipes: Recipe[];
  shopping: ShoppingItem[];
  water: {
    goalMl: number;
    glassMl: number;
    log: Record<DateKey, number>;
  };
  mealLog: Record<DateKey, Record<ID, MealLog>>;
  /** Repères bienveillants affichés dans la rubrique. */
  principles: string[];
}

// ───────────────────────── Visage

export interface RoutineStep {
  id: ID;
  title: string;
  description: string;
  durationMin: number;
  optional: boolean;
  productId?: ID | null;
}

export interface Routine {
  id: ID;
  name: string;
  /** 'sun' | 'moon' ou un emoji. */
  icon: string;
  time: string;
  steps: RoutineStep[];
}

export type MassageIllustration = 'prep' | 'neck' | 'jaw' | 'cheeks' | 'eyes' | 'forehead' | 'none';

export interface MassageStep {
  id: ID;
  title: string;
  description: string;
  durationSec: number;
  illustration: MassageIllustration;
}

export type ProductUsage = 'matin' | 'soir' | 'matin et soir' | 'ponctuel';

export interface Product {
  id: ID;
  name: string;
  brand: string;
  type: string;
  usage: ProductUsage;
  notes: string;
  inUse: boolean;
  openedAt: string;
}

export interface InfoCard {
  id: ID;
  title: string;
  body: string;
}

export interface FaceLogEntry {
  /** Étapes de routine validées. */
  done: ID[];
  /** Ressenti de la peau, de 1 à 5. */
  skinFeel?: number;
  note: string;
}

/** Soin à faire une fois par semaine (masque…), sur certains jours. */
export interface WeeklyCare {
  id: ID;
  title: string;
  emoji: string;
  /** Jours où il est proposé (ex. samedi et dimanche). */
  days: Weekday[];
  durationMin: number;
  ingredients: FoodItem[];
  steps: string[];
  application: string[];
  notes: string;
  /** log[lundi de la semaine] = date où il a été fait. */
  log: Record<DateKey, DateKey>;
}

export interface FaceState {
  /** Soins hebdomadaires (masque du week-end…). */
  weekly: WeeklyCare[];
  routines: Routine[];
  massage: MassageStep[];
  products: Product[];
  /** Mâchoire, posture et bien-être facial. */
  wellbeing: InfoCard[];
  log: Record<DateKey, FaceLogEntry>;
}

// ───────────────────────── Développement intellectuel

export interface MindGoal {
  id: ID;
  title: string;
  minutes: number;
  emoji: string;
  description: string;
}

export interface Category {
  id: ID;
  name: string;
  emoji: string;
  color: string;
}

export type BookStatus = 'a-lire' | 'en-cours' | 'lu';

export interface Book {
  id: ID;
  title: string;
  author: string;
  categoryId: ID | null;
  status: BookStatus;
  pagesTotal: number;
  pagesRead: number;
  notes: string;
  /** Note de 0 à 5 (0 = non noté). */
  rating: number;
  startedAt?: DateKey;
  finishedAt?: DateKey;
}

export interface Topic {
  id: ID;
  title: string;
  categoryId: ID | null;
  objective: string;
  resources: string;
  /** 0 à 100. */
  progress: number;
  notes: string;
}

export interface JournalEntry {
  id: ID;
  date: DateKey;
  title: string;
  content: string;
  categoryId: ID | null;
  tags: string[];
  createdAt: string;
}

export interface MindState {
  goals: MindGoal[];
  categories: Category[];
  books: Book[];
  topics: Topic[];
  journal: JournalEntry[];
  /** Idées d'exercices de logique et de mémoire. */
  practices: InfoCard[];
  /** log[date][goalId] = minutes réalisées */
  log: Record<DateKey, Record<ID, number>>;
}

// ───────────────────────── Habitudes

export type HabitMoment = 'matin' | 'journee' | 'soir' | 'libre';

export interface Habit {
  id: ID;
  title: string;
  emoji: string;
  /** Jours où l'habitude est prévue. */
  days: Weekday[];
  moment: HabitMoment;
  note: string;
  archived: boolean;
}

export interface HabitsState {
  items: Habit[];
  /** log[date] = habitudes cochées */
  log: Record<DateKey, ID[]>;
}

// ───────────────────────── Rappels

export interface Reminder {
  id: ID;
  title: string;
  description: string;
  /** HH:MM */
  time: string;
  /** Jours actifs ; les 7 jours = rappel quotidien. */
  days: Weekday[];
  enabled: boolean;
  module: ModuleKey | 'general';
}

export interface RemindersState {
  items: Reminder[];
  /** Dernier déclenchement de chaque rappel : « AAAA-MM-JJ HH:MM ». */
  fired: Record<ID, string>;
}

// ───────────────────────── À faire aujourd'hui (accueil)

/**
 * Une ligne de la liste « À faire aujourd'hui ». Elle ne stocke pas sa propre coche : elle pointe
 * vers ce qu'elle représente, pour que la même action soit cochée partout et compte une seule fois.
 * - habit : une habitude (cochée aussi dans Habitudes) ; `owned` = créée depuis cette liste.
 * - face : une étape de la routine visage (cochée aussi dans Visage).
 * - water : l'objectif d'eau du jour, réparti en plusieurs cases.
 */
export type ChecklistLink =
  | { kind: 'habit'; habitId: ID; owned?: boolean }
  | { kind: 'face'; stepId: ID }
  | { kind: 'water'; parts: string[] }
  | { kind: 'faceTraining'; slot: FaceSlot }
  | { kind: 'weekly'; careId: ID };

export interface ChecklistItem {
  id: ID;
  /** Libellé affiché (pour une habitude, c'est le titre de l'habitude qui fait foi). */
  label: string;
  emoji: string;
  link: ChecklistLink;
}

// ───────────────────────── Historique

export interface DaySummary {
  /** Progression globale 0 à 100. */
  pct: number;
  /** Progression de chaque rubrique, 0 à 1 (absente si rien n'était prévu). */
  modules: Partial<Record<ModuleKey, number>>;
}

export interface AppData {
  version: number;
  createdAt: DateKey;
  settings: Settings;
  sport: SportState;
  nutrition: NutritionState;
  face: FaceState;
  mind: MindState;
  habits: HabitsState;
  reminders: RemindersState;
  /** Liste « À faire aujourd'hui » de l'accueil. */
  checklist: ChecklistItem[];
  /** Photographie de chaque journée (sert aux statistiques). */
  history: Record<DateKey, DaySummary>;
}
