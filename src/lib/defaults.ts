// Programme initial de Glow Up 360°.
// Les identifiants sont fixes : réinitialiser une rubrique retrouve les mêmes repères dans l'historique.

import { todayKey } from './dates';
import { defaultProgram, LEMON_GINGER_NOTE, programPlan, programRecipes, programShopping, programSlots } from './programmeNutrition';
import type {
  AppData,
  ChecklistItem,
  EnglishState,
  Exercise,
  FaceTraining,
  WeeklyCare,
  FaceState,
  FoodItem,
  HabitsState,
  MindState,
  NutritionState,
  RemindersState,
  Settings,
  SportState,
  Weekday,
} from './types';

const ALL: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

// ───────────────────────── Réglages

export function defaultSettings(): Settings {
  return {
    name: '',
    theme: 'system',
    accent: '#6d5dfc',
    moduleColors: {
      sport: '#ff7a45',
      nutrition: '#1fae7a',
      face: '#ec5f9c',
      mind: '#3b82f6',
      habits: '#f2a93b',
    },
    motivations: [
      'Chaque petit geste compte, {name}. Aujourd’hui, on avance d’un pas.',
      'Pas besoin d’être parfait, juste régulier.',
      'Ton futur toi te remerciera pour ce que tu fais aujourd’hui.',
      'Une séance, un verre d’eau, une page lue : c’est comme ça qu’on construit.',
      'La constance bat l’intensité.',
      'Prends soin de toi comme de quelqu’un que tu aimes, {name}.',
      'Une journée à moitié réussie reste une journée qui compte.',
      'Le progrès, c’est mieux qu’hier. Pas parfait.',
      'Respire. Concentre-toi seulement sur la prochaine action.',
      'Tu n’as pas à tout faire, seulement à commencer.',
    ],
    completionThreshold: 80,
    modulesInProgress: { sport: true, nutrition: true, face: true, mind: true, habits: true },
    jokersPerWeek: 1,
    dashboardCards: [
      { id: 'checklist', visible: true },
      { id: 'english', visible: true },
      { id: 'sport', visible: true },
      { id: 'ginger', visible: true },
      { id: 'week', visible: true },
      // Masquées, réactivables dans Personnaliser.
      { id: 'face', visible: false },
      { id: 'habits', visible: false },
      { id: 'nutrition', visible: false },
      { id: 'mind', visible: false },
      // Ancien « Programme du jour » (rappels par heure) : masqué, réactivable dans Personnaliser.
      { id: 'agenda', visible: false },
    ],
    notificationsEnabled: false,
    inAppAlerts: true,
    sounds: true,
  };
}

// ───────────────────────── Sport

function ex(id: string, name: string, p: Partial<Exercise>): Exercise {
  return {
    id,
    name,
    kind: 'reps',
    sets: 1,
    reps: 0,
    perSide: false,
    durationSec: 0,
    workSec: 0,
    recoverSec: 0,
    workLabel: 'Effort',
    recoverLabel: 'Récupération',
    restSec: 0,
    instructions: '',
    notes: '',
    optional: false,
    progressive: false,
    ...p,
  };
}

const TXT = {
  pompes:
    'Mains un peu plus larges que les épaules, corps aligné de la tête aux talons. Descends la poitrine près du sol en contrôlant, puis pousse. Version plus facile : genoux au sol, ou mains sur un banc.',
  gainage:
    'Sur les avant-bras, coudes sous les épaules. Serre les abdos et les fessiers sans creuser le bas du dos. Respire normalement, regard vers le sol.',
  squats:
    'Pieds largeur d’épaules, pointes légèrement ouvertes. Descends comme pour t’asseoir, dos droit, genoux dans l’axe des pieds, talons au sol. Remonte en poussant dans le sol.',
  fentes:
    'Un grand pas en avant, descends jusqu’à ce que les deux genoux forment un angle droit, le genou arrière près du sol. Buste droit. Remonte et alterne.',
  echauffement: 'Marche rapide, puis quelques montées de genoux, talons-fesses et rotations de chevilles.',
  fractionne:
    'Cours à une allure où tu peux encore parler par phrases courtes. Pendant la marche, récupère sans t’arrêter complètement.',
  calme: 'Marche lente et respiration ample, puis étirements légers des mollets et des cuisses.',
};

/** Séance « Haut du corps » (lundi), version du 23/11/2026. */
export function upperBodyExercises(): Exercise[] {
  return [
    ex('w-upper-pompes', 'Pompes basiques', { sets: 3, reps: 10, restSec: 60, instructions: TXT.pompes, progressive: true }),
    ex('w-upper-gainage', 'Gainage', { kind: 'time', sets: 2, durationSec: 60, restSec: 45, instructions: TXT.gainage, progressive: true }),
    ex('w-upper-diamant', 'Pompes diamant', {
      sets: 1,
      reps: 10,
      restSec: 60,
      progressive: true,
      instructions:
        'Mains rapprochées sous la poitrine, pouces et index qui se touchent pour dessiner un losange. Coudes le long du corps, descends lentement puis pousse. Travaille surtout les triceps. Plus facile : genoux au sol.',
    }),
    ex('w-upper-epaules', 'Pompes épaules', {
      sets: 1,
      reps: 10,
      restSec: 60,
      progressive: true,
      instructions:
        'Bassin haut, corps en V inversé, mains un peu plus larges que les épaules. Plie les coudes pour amener le haut de la tête vers le sol, entre les mains, puis pousse. Travaille surtout les épaules. Plus facile : genoux légèrement fléchis.',
    }),
  ];
}

function runWorkout(id: string): SportState['workouts'][number] {
  return {
    id,
    title: 'Course fractionnée',
    type: 'cardio',
    focus: 'Endurance douce, alternance course et marche',
    notes: 'Une chaussure de course confortable suffit. Si tu es essoufflé au point de ne plus pouvoir parler, ralentis.',
    exercises: [
      ex(`${id}-warm`, 'Échauffement', { kind: 'time', durationSec: 300, instructions: TXT.echauffement }),
      ex(`${id}-int`, 'Course et marche', {
        kind: 'interval',
        sets: 8,
        workSec: 60,
        recoverSec: 120,
        workLabel: 'Course',
        recoverLabel: 'Marche',
        instructions: TXT.fractionne,
        progressive: true,
      }),
      ex(`${id}-cool`, 'Retour au calme', { kind: 'time', durationSec: 180, instructions: TXT.calme }),
    ],
  };
}

/** Les trois exercices du visage, dans l'ordre de rotation (descriptions à compléter par l'utilisateur). */
export function defaultFaceTraining(): FaceTraining {
  const blank = 'Description à compléter : colle ici les étapes de sa vidéo, ou son lien dans le champ « Lien ».';
  return {
    enabled: true,
    startDate: todayKey(),
    exercises: [
      { id: 'fx-aguusalina', name: 'Exercice d’aguusalina', author: 'aguusalina', instructions: blank, durationSec: 120, link: '' },
      { id: 'fx-drmadi', name: 'Exercice de drmadi', author: 'drmadi', instructions: blank, durationSec: 120, link: '' },
      { id: 'fx-trelcat', name: 'Exercice d’Alexandre Trelcat', author: 'Alexandre Trelcat', instructions: blank, durationSec: 120, link: '' },
    ],
    log: {},
  };
}

export function defaultSport(): SportState {
  return {
    faceTraining: defaultFaceTraining(),
    workouts: [
      {
        id: 'w-upper',
        title: 'Haut du corps',
        type: 'force',
        focus: 'Pectoraux, épaules, bras et gainage',
        notes: '',
        exercises: upperBodyExercises(),
      },
      runWorkout('w-run'),
      {
        id: 'w-lower',
        title: 'Bas du corps',
        type: 'force',
        focus: 'Cuisses, fessiers et mollets',
        notes: '',
        exercises: [
          ex('w-lower-squats', 'Squats', { sets: 3, reps: 12, restSec: 60, instructions: TXT.squats, progressive: true }),
          ex('w-lower-fentes', 'Fentes', { sets: 2, reps: 10, perSide: true, restSec: 60, instructions: TXT.fentes, progressive: true }),
          ex('w-lower-pont', 'Pont fessier', {
            sets: 3,
            reps: 12,
            restSec: 45,
            progressive: true,
            instructions:
              'Sur le dos, genoux pliés, pieds à plat. Pousse dans les talons pour lever le bassin jusqu’à aligner genoux, hanches et épaules. Serre les fessiers en haut une seconde.',
          }),
          ex('w-lower-mollets', 'Mollets', {
            sets: 3,
            reps: 15,
            restSec: 30,
            progressive: true,
            instructions:
              'Debout, en appui léger contre un mur. Monte sur la pointe des pieds le plus haut possible, redescends lentement. Plus difficile : sur une marche, talons dans le vide.',
          }),
        ],
      },
      {
        id: 'w-active',
        title: 'Récupération active',
        type: 'mobilite',
        focus: 'Marche, mobilité et étirements doux',
        notes: 'Aucune intensité aujourd’hui : on bouge pour récupérer.',
        exercises: [
          ex('w-active-marche', 'Marche', { kind: 'time', durationSec: 1200, instructions: 'Vingt minutes à allure confortable, idéalement dehors.' }),
          ex('w-active-hanches', 'Mobilité des hanches', {
            kind: 'free',
            durationSec: 300,
            instructions: 'Cercles de hanches, fente basse tenue 30 secondes de chaque côté, papillon assis. Amplitude sans douleur.',
          }),
          ex('w-active-epaules', 'Mobilité des épaules', {
            kind: 'free',
            durationSec: 300,
            instructions: 'Cercles de bras vers l’avant et l’arrière, ouverture de la poitrine contre un mur, passages de serviette derrière le dos.',
          }),
          ex('w-active-etirements', 'Étirements doux', {
            kind: 'free',
            durationSec: 300,
            instructions: 'Ischio-jambiers, quadriceps, mollets, dos. Tiens chaque position 20 à 30 secondes en respirant, sans à-coups.',
          }),
        ],
      },
      {
        id: 'w-full',
        title: 'Corps entier',
        type: 'force',
        focus: 'Une séance complète, du haut et du bas',
        notes: '',
        exercises: [
          ex('w-full-squats', 'Squats', { sets: 3, reps: 12, restSec: 60, instructions: TXT.squats, progressive: true }),
          ex('w-full-pompes', 'Pompes', { sets: 3, reps: 8, restSec: 60, instructions: TXT.pompes, progressive: true }),
          ex('w-full-fentes', 'Fentes', { sets: 2, reps: 10, perSide: true, restSec: 60, instructions: TXT.fentes, progressive: true }),
          ex('w-full-gainage', 'Gainage', { kind: 'time', sets: 3, durationSec: 20, restSec: 45, instructions: TXT.gainage, progressive: true }),
        ],
      },
      {
        id: 'w-rest',
        title: 'Récupération',
        type: 'repos',
        focus: 'Repos, mobilité douce et préparation de la semaine',
        notes: '',
        exercises: [
          ex('w-rest-marche', 'Marche', { kind: 'free', durationSec: 1200, optional: true, instructions: 'Facultative : une balade tranquille si tu en as envie.' }),
          ex('w-rest-mobilite', 'Mobilité douce', { kind: 'free', durationSec: 600, instructions: 'Quelques minutes de mouvements lents : nuque, épaules, hanches, chevilles.' }),
          ex('w-rest-prepa', 'Préparation de la semaine', {
            kind: 'free',
            instructions: 'Regarde ton planning, cale tes séances, prépare ta liste de courses et tes tenues.',
          }),
        ],
      },
    ],
    // Ma séance chaque jour du lundi au samedi, dimanche repos (les autres séances restent dans la bibliothèque).
    week: ['w-upper', 'w-upper', 'w-upper', 'w-upper', 'w-upper', 'w-upper', null],
    progression: {
      enabled: true,
      startDate: todayKey(),
      lengthDays: 30,
      phases: [
        {
          id: 'p1',
          name: 'Fondations',
          fromDay: 1,
          toDay: 7,
          repsDelta: 0,
          setsDelta: 0,
          timeDeltaSec: 0,
          workDeltaSec: 0,
          recoverDeltaSec: 0,
          description: 'On apprend les bons mouvements et on installe le rythme.',
        },
        {
          id: 'p2',
          name: 'Construction',
          fromDay: 8,
          toDay: 14,
          repsDelta: 2,
          setsDelta: 0,
          timeDeltaSec: 10,
          workDeltaSec: 30,
          recoverDeltaSec: -30,
          description: 'Un peu plus de volume. Course 1 min 30, marche 1 min 30.',
        },
        {
          id: 'p3',
          name: 'Progression',
          fromDay: 15,
          toDay: 21,
          repsDelta: 4,
          setsDelta: 0,
          timeDeltaSec: 20,
          workDeltaSec: 60,
          recoverDeltaSec: -30,
          description: 'Tu tiens plus longtemps. Course 2 min, marche 1 min 30.',
        },
        {
          id: 'p4',
          name: 'Intensification',
          fromDay: 22,
          toDay: 26,
          repsDelta: 5,
          setsDelta: 0,
          timeDeltaSec: 30,
          workDeltaSec: 90,
          recoverDeltaSec: -30,
          description: 'Le palier le plus exigeant. Course 2 min 30, marche 1 min 30.',
        },
        {
          id: 'p5',
          name: 'Allègement et bilan',
          fromDay: 27,
          toDay: 30,
          repsDelta: 2,
          setsDelta: 0,
          timeDeltaSec: 10,
          workDeltaSec: 30,
          recoverDeltaSec: -30,
          description: 'Volume réduit pour récupérer et consolider. Le jour 30, compare tes sensations avec le jour 1.',
        },
      ],
    },
    log: {},
  };
}

// ───────────────────────── Nutrition

let itemSeq = 0;
function items(list: [string, string][]): FoodItem[] {
  return list.map(([name, qty]) => ({ id: `fi-${++itemSeq}`, name, qty }));
}

export function defaultNutrition(): NutritionState {
  itemSeq = 0;
  return {
    program: defaultProgram(),
    slots: programSlots(),
    plan: programPlan(),
    foods: [
      { id: 'f-gingembre', name: 'Gingembre', emoji: '🫚', category: 'Épices et aromates', favorite: false,
        benefits: 'Apporte beaucoup de goût sans sucre ni sel ajoutés. Agréable en infusion ; certaines personnes le trouvent utile pour la digestion.',
        tip: 'Garde-le au congélateur : il se râpe très facilement sans être épluché.' },
      { id: 'f-citron', name: 'Citron', emoji: '🍋', category: 'Fruits', favorite: false,
        benefits: 'Source de vitamine C, qui contribue au fonctionnement normal du système immunitaire. Relève plats, poissons et boissons.',
        tip: 'Le zeste parfume autant que le jus : pense à le râper sur les légumes.' },
      { id: 'f-fruits-rouges', name: 'Fruits rouges', emoji: '🫐', category: 'Fruits', favorite: false,
        benefits: 'Riches en fibres et en vitamine C, naturellement peu sucrés. Parfaits au petit-déjeuner ou en collation.',
        tip: 'Les fruits rouges surgelés sont aussi intéressants et bien moins chers hors saison.' },
      { id: 'f-oeufs', name: 'Œufs', emoji: '🥚', category: 'Protéines', favorite: false,
        benefits: 'Protéines de qualité, vitamines B12 et D. Rassasiants, économiques et prêts en cinq minutes.',
        tip: 'Des œufs durs d’avance au frigo font une collation express (3 à 4 jours).' },
      { id: 'f-avocat', name: 'Avocat', emoji: '🥑', category: 'Fruits', favorite: false,
        benefits: 'Bonnes graisses mono-insaturées et fibres. Très rassasiant : un demi-avocat suffit souvent.',
        tip: 'Un filet de citron évite qu’il noircisse.' },
      { id: 'f-poissons-gras', name: 'Poissons gras', emoji: '🐟', category: 'Protéines', favorite: false,
        benefits: 'Saumon, sardine, maquereau, hareng : sources d’oméga-3. Repère courant : du poisson deux fois par semaine, dont un poisson gras.',
        tip: 'Les sardines et maquereaux en conserve sont tout aussi intéressants et très pratiques.' },
      { id: 'f-noix', name: 'Amandes et noix', emoji: '🌰', category: 'Fruits à coque', favorite: false,
        benefits: 'Bonnes graisses, fibres et magnésium. Repère courant : une petite poignée par jour, sans sel ajouté.',
        tip: 'Prépare de petites portions dans des boîtes pour la semaine.' },
      { id: 'f-legumes-verts', name: 'Légumes verts', emoji: '🥦', category: 'Légumes', favorite: false,
        benefits: 'Fibres, vitamines (K, B9) et minéraux. Repère : au moins cinq portions de fruits et légumes par jour.',
        tip: 'Les légumes surgelés nature gardent leurs qualités et font gagner du temps.' },
      { id: 'f-yaourt', name: 'Yaourts nature', emoji: '🥛', category: 'Produits laitiers', favorite: false,
        benefits: 'Protéines et calcium, sans sucre ajouté. Tu choisis toi-même ce que tu y ajoutes.',
        tip: 'Ajoute fruits, flocons ou un peu de miel plutôt que d’acheter des yaourts déjà sucrés.' },
      { id: 'f-avoine', name: 'Flocons d’avoine', emoji: '🌾', category: 'Céréales complètes', favorite: false,
        benefits: 'Céréale complète riche en fibres, dont des bêta-glucanes. Une énergie qui tient au corps toute la matinée.',
        tip: 'Le porridge se prépare en trois minutes, et les overnight oats la veille.' },
      { id: 'f-huile-olive', name: 'Huile d’olive', emoji: '🫒', category: 'Matières grasses', favorite: false,
        benefits: 'Riche en acides gras mono-insaturés. Idéale pour l’assaisonnement et la cuisson douce.',
        tip: 'Une cuillère à soupe par repas suffit pour assaisonner une assiette.' },
      { id: 'f-legumineuses', name: 'Légumineuses', emoji: '🫘', category: 'Protéines', favorite: false,
        benefits: 'Lentilles, pois chiches, haricots : protéines végétales et fibres. Repère courant : au moins deux fois par semaine.',
        tip: 'En bocal ou en conserve, il suffit de les rincer.' },
    ],
    recipes: [
      {
        id: 'r-gingembre',
        title: 'Boisson gingembre-citron',
        emoji: '🫚',
        category: 'Boissons',
        prepMin: 10,
        servings: 1,
        favorite: true,
        ingredients: items([
          ['Gingembre frais', '2 à 3 cm'],
          ['Citron', '½'],
          ['Eau', '300 ml'],
          ['Miel', '1 c. à café (facultatif)'],
          ['Menthe fraîche', 'quelques feuilles (facultatif)'],
        ]),
        steps: [
          'Épluche le gingembre (le bord d’une cuillère gratte très bien la peau) puis coupe-le en fines rondelles ou râpe-le.',
          'Porte l’eau à frémissement et verse-la sur le gingembre.',
          'Laisse infuser 8 à 10 minutes, à couvert. Plus longtemps, ce sera plus piquant.',
          'Filtre, puis ajoute le jus du demi-citron, et le miel si tu le souhaites, quand la boisson a un peu tiédi.',
          'Version fraîche : laisse refroidir et garde au réfrigérateur jusqu’à 24 heures.',
        ],
        notes: LEMON_GINGER_NOTE,
      },
      ...programRecipes(),
      {
        id: 'r-overnight',
        title: 'Overnight oats aux fruits rouges',
        emoji: '🫙',
        category: 'Petit-déjeuner',
        prepMin: 5,
        servings: 1,
        favorite: false,
        ingredients: items([
          ['Flocons d’avoine', '50 g'],
          ['Yaourt nature', '1'],
          ['Lait ou boisson végétale', '80 ml'],
          ['Fruits rouges', '1 poignée'],
          ['Amandes effilées', '1 c. à soupe'],
        ]),
        steps: [
          'Dans un bocal, mélange les flocons, le yaourt et le lait.',
          'Ajoute les fruits rouges par-dessus, ferme et laisse une nuit au réfrigérateur.',
          'Le matin, parsème d’amandes. Se mange froid.',
        ],
        notes: 'Se garde deux jours au frais : tu peux en préparer deux d’un coup.',
      },
      {
        id: 'r-porridge',
        title: 'Porridge express',
        emoji: '🥣',
        category: 'Petit-déjeuner',
        prepMin: 5,
        servings: 1,
        favorite: false,
        ingredients: items([
          ['Flocons d’avoine', '50 g'],
          ['Lait ou boisson végétale', '200 ml'],
          ['Fruits rouges', '1 poignée'],
          ['Amandes', '10'],
          ['Cannelle', '1 pincée'],
        ]),
        steps: [
          'Fais chauffer les flocons et le lait à feu doux 3 à 4 minutes en remuant.',
          'Verse dans un bol, ajoute les fruits rouges, les amandes concassées et la cannelle.',
        ],
        notes: '',
      },
      {
        id: 'r-omelette',
        title: 'Omelette épinards et avocat',
        emoji: '🍳',
        category: 'Plats',
        prepMin: 10,
        servings: 1,
        favorite: false,
        ingredients: items([
          ['Œufs', '2 ou 3'],
          ['Pousses d’épinards', '1 grosse poignée'],
          ['Avocat', '½'],
          ['Huile d’olive', '1 c. à café'],
          ['Sel, poivre, herbes', 'à ton goût'],
        ]),
        steps: [
          'Fais tomber les épinards 1 minute dans la poêle avec l’huile.',
          'Bats les œufs avec le sel, le poivre et les herbes, verse sur les épinards.',
          'Cuis à feu moyen 3 à 4 minutes, plie l’omelette et sers avec l’avocat en tranches.',
        ],
        notes: '',
      },
      {
        id: 'r-saumon',
        title: 'Saumon au four, légumes verts et huile d’olive',
        emoji: '🐟',
        category: 'Plats',
        prepMin: 25,
        servings: 2,
        favorite: false,
        ingredients: items([
          ['Pavés de saumon', '2'],
          ['Brocoli ou haricots verts', '400 g'],
          ['Huile d’olive', '2 c. à soupe'],
          ['Citron', '1'],
          ['Ail, aneth ou persil', 'à ton goût'],
        ]),
        steps: [
          'Préchauffe le four à 200 °C.',
          'Dispose les légumes sur une plaque, arrose d’une cuillère d’huile, sale légèrement et enfourne 10 minutes.',
          'Ajoute le saumon, quelques rondelles de citron et les herbes, arrose du reste d’huile.',
          'Prolonge la cuisson 12 à 15 minutes selon l’épaisseur du poisson.',
        ],
        notes: 'Avec une patate douce ou du riz complet pour un repas complet.',
      },
      {
        id: 'r-bowl',
        title: 'Bowl yaourt, amandes, noix et fruits rouges',
        emoji: '🍓',
        category: 'Collations',
        prepMin: 3,
        servings: 1,
        favorite: false,
        ingredients: items([
          ['Yaourt nature', '1 ou 2'],
          ['Fruits rouges', '1 poignée'],
          ['Amandes et noix', '1 petite poignée'],
          ['Flocons d’avoine', '2 c. à soupe'],
        ]),
        steps: ['Verse le yaourt dans un bol.', 'Ajoute les fruits, les flocons et les fruits à coque concassés.'],
        notes: '',
      },
      {
        id: 'r-lentilles',
        title: 'Salade de lentilles, avocat et citron',
        emoji: '🥗',
        category: 'Plats',
        prepMin: 15,
        servings: 2,
        favorite: false,
        ingredients: items([
          ['Lentilles cuites', '300 g'],
          ['Avocat', '1'],
          ['Concombre', '½'],
          ['Oignon rouge', '¼'],
          ['Huile d’olive', '2 c. à soupe'],
          ['Citron', '1'],
          ['Persil ou coriandre', '1 petit bouquet'],
        ]),
        steps: [
          'Rince les lentilles et égoutte-les.',
          'Coupe l’avocat, le concombre et l’oignon en petits dés.',
          'Mélange avec l’huile, le jus du citron, les herbes, le sel et le poivre.',
        ],
        notes: 'Se garde un jour au frais (ajoute l’avocat au dernier moment).',
      },
    ],
    shopping: programShopping(),
    water: { goalMl: 3000, glassMl: 250, log: {} },
    mealLog: {},
    principles: [
      'Manger varié, sans aliment interdit.',
      'Écouter sa faim et sa satiété, manger sans écran quand c’est possible.',
      'Pas de régime restrictif : on ajoute du bon plutôt que de supprimer.',
      'Aucun aliment ne « détoxifie » le corps ni ne fait fondre une zone précise.',
      'Pour un besoin particulier, un ou une diététicienne peut t’accompagner.',
    ],
  };
}

// ───────────────────────── Visage

/** Soin du week-end : masque maison au riz, une fois par semaine. */
export function defaultWeeklyCare(): WeeklyCare[] {
  return [
    {
      id: 'wc-masque-riz',
      title: 'Masque maison au riz (mascarilla casera)',
      emoji: '🍚',
      days: [5, 6],
      durationMin: 15,
      ingredients: [
        { id: 'wc-1', name: 'Riz cuit très tendre (ou farine de riz)', qty: '2 c. à soupe' },
        { id: 'wc-2', name: 'Lait ou yaourt nature', qty: '1 c. à soupe' },
        { id: 'wc-3', name: 'Miel', qty: '1 c. à café' },
      ],
      steps: [
        'Fais cuire le riz dans un peu plus d’eau que d’habitude, jusqu’à ce qu’il soit très tendre (un reste de riz nature convient).',
        'Écrase-le à la fourchette ou mixe-le pour obtenir une pâte lisse (avec de la farine de riz, mélange simplement).',
        'Ajoute le lait (ou le yaourt) et le miel : la texture doit s’étaler sans couler.',
        'Laisse revenir à température ambiante avant de l’appliquer.',
      ],
      application: [
        'La première fois, teste un peu de masque sur la mâchoire et attends 24 h : sans rougeur ni démangeaison, tu peux l’utiliser.',
        'Nettoie ton visage et sèche-le en tamponnant.',
        'Étale une couche fine avec les doigts propres, en évitant le contour des yeux et les lèvres.',
        'Laisse poser 15 minutes, visage détendu.',
        'Rince à l’eau tiède en massant doucement par petits cercles, puis sèche en tamponnant.',
        'Termine par ta crème hydratante.',
      ],
      notes:
        'Sensation de peau plus douce et plus nette, effet temporaire : pas d’effet « anti-rides » ni « éclaircissant » démontré. N’ajoute jamais de citron sur la peau (irritant, et il rend la peau sensible au soleil). Rougeur, brûlure ou démangeaison : rince tout de suite et arrête. Prépare-le au moment de l’utiliser, ne le conserve pas.',
      log: {},
    },
  ];
}

export function defaultFace(): FaceState {
  return {
    weekly: defaultWeeklyCare(),
    routines: [
      {
        id: 'r-morning',
        name: 'Matin',
        icon: 'sun',
        time: '07:30',
        steps: [
          { id: 'fs-m-clean', title: 'Nettoyage doux', durationMin: 1, optional: false, productId: 'p-cleanser',
            description: 'Eau tiède ou nettoyant doux sans savon. Sèche en tamponnant avec une serviette propre, sans frotter.' },
          { id: 'fs-m-hydra', title: 'Hydratation', durationMin: 1, optional: false, productId: 'p-cream',
            description: 'Une crème adaptée à ton type de peau, sur le visage et le cou.' },
          { id: 'fs-m-spf', title: 'Protection solaire SPF 30 à 50', durationMin: 1, optional: false, productId: 'p-spf',
            description: 'Dernière étape du matin, même quand le ciel est gris. Environ deux longueurs de doigt pour le visage et le cou ; renouvelle si tu restes longtemps dehors.' },
        ],
      },
      {
        id: 'r-evening',
        name: 'Soir',
        icon: 'moon',
        time: '21:30',
        steps: [
          { id: 'fs-e-clean', title: 'Nettoyage', durationMin: 1, optional: false, productId: 'p-cleanser',
            description: 'Retire la crème solaire, le sébum et la pollution de la journée. Avec un écran solaire très résistant, un double nettoyage peut aider.' },
          { id: 'fs-e-hydra', title: 'Hydratation', durationMin: 1, optional: false, productId: 'p-cream',
            description: 'Ta crème hydratante, appliquée sur une peau propre.' },
          { id: 'fs-e-massage', title: 'Massage facial doux (2 min)', durationMin: 2, optional: true, productId: 'p-oil',
            description: 'Facultatif. Avec ta crème ou quelques gouttes d’huile, suis le guide de massage pas à pas.' },
        ],
      },
    ],
    massage: [
      { id: 'm-prep', title: 'Préparer', durationSec: 10, illustration: 'prep',
        description: 'Mains propres, une noisette de crème ou deux à trois gouttes d’huile pour que les doigts glissent. Pression légère : la peau ne doit jamais tirer.' },
      { id: 'm-neck', title: 'Cou', durationSec: 20, illustration: 'neck',
        description: 'Du dessous des oreilles vers les clavicules, fais glisser les doigts à plat, cinq ou six fois. Mouvement lent, toujours vers le bas.' },
      { id: 'm-jaw', title: 'Ligne de la mâchoire', durationSec: 25, illustration: 'jaw',
        description: 'Du menton vers les oreilles, glisse avec les phalanges repliées le long de l’os. Aucune pression forte sur l’articulation, juste devant l’oreille.' },
      { id: 'm-cheeks', title: 'Pommettes', durationSec: 25, illustration: 'cheeks',
        description: 'Des ailes du nez vers les tempes, en remontant sous l’os de la pommette. Cinq passages lents.' },
      { id: 'm-eyes', title: 'Contour des yeux', durationSec: 15, illustration: 'eyes',
        description: 'Avec l’annulaire, tapote très doucement sous l’œil, de l’intérieur vers l’extérieur. Jamais de frottement.' },
      { id: 'm-forehead', title: 'Front et tempes', durationSec: 25, illustration: 'forehead',
        description: 'Mains à plat, lisse le front du centre vers les tempes, puis finis par de petits cercles sur les tempes.' },
    ],
    products: [
      { id: 'p-cleanser', name: 'Nettoyant doux', brand: '', type: 'Nettoyant', usage: 'matin et soir', notes: 'À compléter avec ton produit.', inUse: true, openedAt: '' },
      { id: 'p-cream', name: 'Crème hydratante', brand: '', type: 'Hydratant', usage: 'matin et soir', notes: 'À compléter avec ton produit.', inUse: true, openedAt: '' },
      { id: 'p-spf', name: 'Écran solaire SPF 30 à 50', brand: '', type: 'Protection solaire', usage: 'matin', notes: 'À compléter avec ton produit.', inUse: true, openedAt: '' },
      { id: 'p-oil', name: 'Huile ou baume de massage', brand: '', type: 'Massage', usage: 'soir', notes: 'Facultatif : ta crème hydratante convient aussi.', inUse: false, openedAt: '' },
    ],
    wellbeing: [
      { id: 'wb-truth', title: 'Ce que le massage fait, et ne fait pas',
        body: 'Un massage doux peut diminuer temporairement les gonflements, surtout le matin, et procure une vraie détente. Il ne modifie pas la structure osseuse et ne fait pas fondre la graisse localement.' },
      { id: 'wb-posture', title: 'Posture de la tête et du cou',
        body: 'Écran à hauteur des yeux, épaules relâchées, menton légèrement rentré comme si tu allongeais la nuque. Une tête projetée vers l’avant pendant des heures tasse visuellement le cou et la mâchoire, et fatigue la nuque.' },
      { id: 'wb-tongue', title: 'Position de repos de la langue',
        body: 'Au repos : langue posée contre le palais, lèvres fermées, dents légèrement écartées, respiration par le nez. C’est une position confortable ; elle ne remodèle pas la mâchoire d’un adulte.' },
      { id: 'wb-real', title: 'Ce qui joue vraiment sur l’apparence du visage',
        body: 'Sommeil régulier, hydratation, alimentation variée et un peu moins salée le soir, activité physique, gestion du stress, protection solaire. La masse grasse évolue à l’échelle du corps entier, jamais sur une zone choisie.' },
      { id: 'wb-excess', title: 'Pas d’excès sur la mâchoire',
        body: 'Évite les exercices intensifs de mâchoire, les gommes très dures mâchées pendant des heures et les accessoires censés « muscler » la mâchoire : ils peuvent fatiguer ou irriter l’articulation. Douleur, claquement ou blocage : parles-en à un dentiste ou à un médecin.' },
      { id: 'wb-clench', title: 'Relâcher les dents serrées',
        body: 'Si tu te surprends à serrer les dents (stress, concentration), relâche : lèvres jointes, dents écartées, épaules basses. Un dentiste peut repérer un serrage nocturne.' },
    ],
    log: {},
  };
}

// ───────────────────────── Développement intellectuel

export function defaultMind(): MindState {
  return {
    goals: [
      { id: 'g-read', title: 'Lecture', minutes: 15, emoji: '📖', description: 'Un livre de ta liste, téléphone loin de toi.' },
      { id: 'g-learn', title: 'Apprentissage', minutes: 10, emoji: '🎓', description: 'Une leçon, un cours en vidéo ou un chapitre sur un sujet de ta liste.' },
      { id: 'g-logic', title: 'Logique ou mémoire', minutes: 10, emoji: '🧩', description: 'Énigmes, échecs, calcul mental, mémorisation : pioche dans les idées.' },
      { id: 'g-notes', title: 'Prise de notes', minutes: 5, emoji: '✍️', description: 'Résume en quelques lignes ce que tu as retenu, dans ton journal.' },
    ],
    categories: [
      { id: 'c-psy', name: 'Psychologie', emoji: '🧠', color: '#a855f7' },
      { id: 'c-philo', name: 'Philosophie', emoji: '🏛️', color: '#6366f1' },
      { id: 'c-histoire', name: 'Histoire', emoji: '📜', color: '#b45309' },
      { id: 'c-geo', name: 'Géopolitique', emoji: '🌍', color: '#0ea5e9' },
      { id: 'c-sciences', name: 'Sciences', emoji: '🔬', color: '#10b981' },
      { id: 'c-tech', name: 'Technologie', emoji: '💻', color: '#64748b' },
      { id: 'c-finance', name: 'Finance', emoji: '💶', color: '#16a34a' },
      { id: 'c-eco', name: 'Économie', emoji: '📈', color: '#f59e0b' },
      { id: 'c-langues', name: 'Langues étrangères', emoji: '🗣️', color: '#ef4444' },
    ],
    books: [
      { id: 'b-kahneman', title: 'Système 1 / Système 2', author: 'Daniel Kahneman', categoryId: 'c-psy', status: 'a-lire', pagesTotal: 0, pagesRead: 0, notes: 'Suggestion : à garder ou à supprimer.', rating: 0 },
      { id: 'b-sapiens', title: 'Sapiens', author: 'Yuval Noah Harari', categoryId: 'c-histoire', status: 'a-lire', pagesTotal: 0, pagesRead: 0, notes: 'Suggestion : à garder ou à supprimer.', rating: 0 },
      { id: 'b-aurele', title: 'Pensées pour moi-même', author: 'Marc Aurèle', categoryId: 'c-philo', status: 'a-lire', pagesTotal: 0, pagesRead: 0, notes: 'Suggestion : à garder ou à supprimer.', rating: 0 },
    ],
    topics: [
      { id: 't-invest', title: 'Comprendre les bases de l’investissement', categoryId: 'c-finance', objective: 'Savoir expliquer intérêts composés, diversification et frais.', resources: '', progress: 0, notes: '' },
      { id: 't-anglais', title: 'Anglais : 10 nouveaux mots par semaine', categoryId: 'c-langues', objective: 'Les réutiliser dans une phrase à l’écrit.', resources: '', progress: 0, notes: '' },
    ],
    journal: [],
    practices: [
      { id: 'pr-calcul', title: 'Calcul mental', body: 'Additions et multiplications de tête pendant 5 minutes, de plus en plus vite.' },
      { id: 'pr-sudoku', title: 'Sudoku ou kakuro', body: 'Une grille par jour, en augmentant le niveau quand elle devient facile.' },
      { id: 'pr-echecs', title: 'Échecs', body: 'Une partie rapide ou trois problèmes tactiques.' },
      { id: 'pr-loci', title: 'Palais de mémoire', body: 'Associe une liste de 10 éléments aux pièces de ton logement, puis récite-la le lendemain.' },
      { id: 'pr-mots', title: 'Cinq mots nouveaux', body: 'Apprends cinq mots d’une langue étrangère et réutilise-les dans une phrase.' },
      { id: 'pr-rappel', title: 'Rappel actif', body: 'Sans regarder tes notes, écris ce dont tu te souviens de ta lecture de la veille.' },
    ],
    log: {},
  };
}

// ───────────────────────── Habitudes

export function defaultHabits(): HabitsState {
  return {
    items: [
      { id: 'h-water', title: 'Grand verre d’eau au réveil', emoji: '💧', days: ALL, moment: 'matin', note: '', archived: false },
      { id: 'h-minoxidil', title: 'Minoxidil à mettre le matin', emoji: '💊', days: ALL, moment: 'matin', note: '', archived: false },
      { id: 'h-walk', title: 'Marcher 30 minutes', emoji: '🚶', days: ALL, moment: 'journee', note: 'Les trajets à pied comptent.', archived: false },
      { id: 'h-posture', title: 'Pause posture et étirements', emoji: '🧘', days: ALL, moment: 'journee', note: '', archived: false },
      { id: 'h-sport', title: 'Séance de sport', emoji: '🏋️', days: [0, 1, 2, 3, 4, 5], moment: 'soir', note: 'Ta séance du jour est dans l’onglet Sport.', archived: false },
      { id: 'h-screens', title: 'Pas d’écran 30 min avant de dormir', emoji: '📵', days: ALL, moment: 'soir', note: '', archived: false },
      { id: 'h-english', title: 'Ajouter 5 mots en anglais avec traduction', emoji: '🇬🇧', days: ALL, moment: 'libre', note: 'Note-les dans l’onglet Anglais : l’habitude se coche toute seule au 5e mot.', archived: false },
      { id: 'h-plan', title: 'Préparer la semaine', emoji: '🗓️', days: [6], moment: 'libre', note: '', archived: false },
    ],
    log: {},
  };
}

// ───────────────────────── Rappels

export function defaultReminders(): RemindersState {
  return {
    items: [
      { id: 'rm-wake', title: 'Réveil et hydratation', time: '07:00', days: ALL, enabled: true, module: 'habits',
        description: 'Un grand verre d’eau, puis quelques minutes de lumière naturelle.' },
      { id: 'rm-face-am', title: 'Routine visage du matin', time: '07:30', days: ALL, enabled: true, module: 'face',
        description: 'Nettoyage doux, hydratation, protection solaire.' },
      { id: 'rm-breakfast', title: 'Petit-déjeuner', time: '08:00', days: ALL, enabled: true, module: 'nutrition',
        description: 'Ton petit-déjeuner du jour est dans Nutrition.' },
      { id: 'rm-sport', title: 'Séance de sport', time: '18:00', days: [0, 1, 2, 3, 4, 5], enabled: true, module: 'sport',
        description: 'Ta séance du jour t’attend dans l’onglet Sport.' },
      { id: 'rm-face-pm', title: 'Routine visage du soir', time: '21:30', days: ALL, enabled: true, module: 'face',
        description: 'Nettoyage, hydratation et, si tu veux, deux minutes de massage.' },
      { id: 'rm-reading', title: 'Lecture', time: '22:00', days: ALL, enabled: true, module: 'mind',
        description: 'Quinze minutes de lecture, téléphone en mode avion.' },
      { id: 'rm-bed', title: 'Coucher', time: '22:45', days: ALL, enabled: true, module: 'habits',
        description: 'Écrans éteints, chambre fraîche et sombre.' },
      { id: 'rm-week', title: 'Bilan de la semaine', time: '18:30', days: [6], enabled: true, module: 'general',
        description: 'Regarde tes statistiques et prépare la semaine qui vient.' },
    ],
    fired: {},
  };
}

// ───────────────────────── À faire aujourd'hui

export function defaultChecklist(): ChecklistItem[] {
  return [
    { id: 'cl-minoxidil', label: 'Minoxidil à mettre le matin', emoji: '💊', link: { kind: 'habit', habitId: 'h-minoxidil', owned: true } },
    { id: 'cl-creme-matin', label: 'Crème du matin', emoji: '🧴', link: { kind: 'face', stepId: 'fs-m-hydra' } },
    { id: 'cl-visage-matin', label: 'Exercice visage du matin', emoji: '🙂', link: { kind: 'faceTraining', slot: 'matin' } },
    { id: 'cl-eau', label: '3 L d’eau à répartir dans la journée', emoji: '💧', link: { kind: 'water', parts: ['Matin', 'Après-midi', 'Soir'] } },
    { id: 'cl-visage-soir', label: 'Exercice visage du soir', emoji: '🙂', link: { kind: 'faceTraining', slot: 'soir' } },
    { id: 'cl-creme-soir', label: 'Crème du soir visage et dos', emoji: '🧴', link: { kind: 'face', stepId: 'fs-e-hydra' } },
    { id: 'cl-masque', label: 'Masque au riz (une fois ce week-end)', emoji: '🍚', link: { kind: 'weekly', careId: 'wc-masque-riz' } },
  ];
}

// ───────────────────────── Anglais

export function defaultEnglish(): EnglishState {
  return { dailyGoal: 5, words: [], verbs: [], tenses: [], quizzes: {} };
}

// ───────────────────────── Ensemble

/**
 * Version 2 (23/11/2026) : habitudes « Séance de sport » et « 5 mots en anglais » ajoutées, deux retirées.
 * Version 3 (23/11/2026) : séance « Haut du corps » = pompes basiques, gainage 1 min, pompes diamant, pompes épaules.
 * Version 4 (23/11/2026) : liste « À faire aujourd'hui » sur l'accueil (remplace le programme du jour), eau 3 L, minoxidil,
 * séance « Haut du corps » du lundi au samedi et dimanche repos.
 * Version 5 (23/11/2026) : exercices du visage matin et soir, masque au riz du week-end, programme alimentaire
 * (≈ 2 250 kcal, 170 g de protéines), citron-gingembre chaque jour, recettes simples.
 * Version 6 (24/11/2026) : onglet Anglais (mots du jour et traductions) ; accueil = mots d'anglais à la place
 * des habitudes, cartes nutrition et objectifs intellectuels masquées.
 * Version 7 (24/11/2026) : accueil = shot gingembre-citron à cocher à la place de la routine visage.
 */
export const DATA_VERSION = 7;

export function createDefaultData(): AppData {
  return {
    version: DATA_VERSION,
    createdAt: todayKey(),
    settings: defaultSettings(),
    sport: defaultSport(),
    nutrition: defaultNutrition(),
    face: defaultFace(),
    mind: defaultMind(),
    habits: defaultHabits(),
    reminders: defaultReminders(),
    checklist: defaultChecklist(),
    english: defaultEnglish(),
    history: {},
  };
}
