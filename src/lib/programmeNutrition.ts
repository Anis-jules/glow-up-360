// Programme alimentaire type « perdre du gras en gardant le muscle » : déficit calorique modéré,
// protéines élevées réparties sur 4 repas, aliments simples et peu chers.
// Les repères (calories, protéines, lipides, glucides) et le profil se règlent dans l'application ;
// le profil (taille, poids…) n'est jamais écrit ici : il reste sur l'appareil de l'utilisateur.
// Les valeurs par repas sont des estimations à partir des tables de composition courantes (±10 %).

import type { FoodItem, MealSlot, NutritionProgram, PlannedMeal, Recipe, ShoppingItem } from './types';

let seq = 0;
function items(list: [string, string][]): FoodItem[] {
  return list.map(([name, qty]) => ({ id: `fp-${++seq}`, name, qty }));
}

function pm(title: string, kcal: number, protein: number, list: [string, string][], recipeId: string | null = null, notes = ''): PlannedMeal {
  return { title, items: items(list), notes, recipeId, kcal, protein };
}

function rec(
  id: string,
  title: string,
  emoji: string,
  category: string,
  prepMin: number,
  servings: number,
  kcal: number,
  protein: number,
  ingredients: [string, string][],
  steps: string[],
  notes = '',
): Recipe {
  return { id, title, emoji, category, prepMin, servings, kcal, protein, ingredients: items(ingredients), steps, notes, favorite: false };
}

export function defaultProgram(): NutritionProgram {
  return {
    title: 'Perdre du gras, garder le muscle',
    profile: '',
    goal: 'Perdre environ 0,5 à 0,8 kg par semaine, surtout du gras, en gardant ta masse musculaire.',
    kcal: 2250,
    protein: 170,
    fat: 70,
    carbs: 235,
    tips: [
      'Les calories sont un point de départ (déficit modéré) : ajuste-les selon l’évolution de ton poids sur plusieurs semaines.',
      'Des protéines à chaque repas (environ 40 g) : avec tes séances de renforcement, c’est ce qui protège tes muscles pendant la perte de gras.',
      'Garde tes séances : sans renforcement, une partie du poids perdu serait du muscle.',
      'Légumes à volonté au déjeuner et au dîner : ils rassasient pour très peu de calories.',
      'Pèse-toi 1 ou 2 fois par semaine, le matin à jeun, et regarde la tendance sur 2 à 3 semaines plutôt qu’un chiffre isolé.',
      'Si le poids ne bouge pas pendant 3 semaines, retire environ 150 à 200 kcal par jour (par exemple 30 g de riz ou de pâtes crus en moins sur un repas).',
      'Si tu perds plus de 1 kg par semaine sur la durée, ou si tu manques d’énergie à l’entraînement, ajoute un féculent ou une collation.',
      'Dors 7 à 9 heures : le manque de sommeil augmente la faim et freine la récupération.',
      'Un repas plus libre par semaine est possible : garde une bonne portion de protéines et ne saute pas de repas pour compenser.',
      'Ces quantités sont des repères. En cas de problème de santé ou de traitement, fais-les valider par un médecin ou un diététicien.',
    ],
  };
}

export function programSlots(): MealSlot[] {
  return [
    { id: 's-lemon', name: 'Citron-gingembre', time: '07:30', emoji: '🍋' },
    { id: 's-breakfast', name: 'Petit-déjeuner', time: '08:00', emoji: '🥣' },
    { id: 's-lunch', name: 'Déjeuner', time: '12:30', emoji: '🥗' },
    { id: 's-snack', name: 'Collation', time: '16:30', emoji: '🍎' },
    { id: 's-dinner', name: 'Dîner', time: '19:30', emoji: '🍽️' },
  ];
}

/** Planning de la semaine (lundi → dimanche) : environ 2 200 à 2 300 kcal et 165 à 185 g de protéines par jour. */
export function programPlan(): Record<string, PlannedMeal>[] {
  const lemon = () =>
    pm('Citron-gingembre', 10, 0, [['Citron', '½, pressé'], ['Gingembre frais', '2 à 3 cm (5 à 10 g)'], ['Eau chaude', '250 ml']], 'r-gingembre', 'Une tasse par jour, idéalement le matin.');

  const bPorridge = () =>
    pm('Porridge protéiné aux fruits rouges', 600, 42, [['Flocons d’avoine', '70 g'], ['Lait demi-écrémé', '250 ml'], ['Skyr nature', '200 g'], ['Fruits rouges surgelés', '100 g'], ['Amandes', '10 g']], 'r-porridge-proteine');
  const bOmelette = () =>
    pm('Omelette, pain complet et fruit', 640, 41, [['Œufs', '4'], ['Pain complet', '2 tranches (80 g)'], ['Fromage blanc 0 %', '100 g'], ['Pomme', '1']], 'r-omelette-pain');
  const bSkyr = () =>
    pm('Bol skyr, avoine, banane et cacahuète', 575, 44, [['Skyr nature', '300 g'], ['Flocons d’avoine', '50 g'], ['Banane', '1'], ['Beurre de cacahuète', '15 g (1 c. à soupe)']], 'r-bol-skyr');

  const lPoulet = () =>
    pm('Poulet, riz et brocoli', 660, 55, [['Blanc de poulet', '180 g cru'], ['Riz basmati', '80 g cru'], ['Brocoli', '250 g'], ['Huile d’olive', '1 c. à soupe']], 'r-poulet-riz');
  const lBolo = () =>
    pm('Pâtes complètes bolognaise au bœuf 5 %', 650, 51, [['Bœuf haché 5 %', '150 g'], ['Pâtes complètes', '90 g crues'], ['Sauce tomate', '150 g'], ['Oignon et ail', 'au goût'], ['Emmental râpé', '20 g']], 'r-bolognaise');
  const lLentilles = () =>
    pm('Salade lentilles, thon et œuf', 685, 65, [['Lentilles cuites', '200 g'], ['Thon au naturel', '1 boîte (140 g égoutté)'], ['Œuf dur', '1'], ['Crudités', '1 bol'], ['Huile d’olive', '1 c. à soupe'], ['Pain complet', '1 tranche']], 'r-salade-lentilles-thon');
  const lWraps = () =>
    pm('Wraps poulet, crudités et sauce yaourt', 600, 56, [['Galettes de blé complet', '2'], ['Blanc de poulet', '150 g cru'], ['Crudités', '1 poignée'], ['Skyr ou yaourt grec 0 %', '100 g']], 'r-wraps-poulet');
  const lChili = () =>
    pm('Chili con carne', 705, 52, [['Bœuf haché 5 %', '150 g'], ['Haricots rouges', '150 g égouttés'], ['Tomates, oignon, poivron', '200 g'], ['Riz', '80 g cru']], 'r-chili');
  const lColin = () =>
    pm('Colin, pommes de terre et haricots verts', 645, 49, [['Colin (surgelé)', '200 g'], ['Pommes de terre', '400 g'], ['Haricots verts', '250 g'], ['Huile d’olive', '1 c. à soupe']], 'r-colin-four');

  const sSkyr = () => pm('Skyr, fruit et amandes', 320, 31, [['Skyr nature', '250 g'], ['Fruit', '1'], ['Amandes', '15 g']]);
  const sOeufs = () => pm('Œufs durs, fromage blanc et pomme', 305, 25, [['Œufs durs', '2'], ['Fromage blanc 0 %', '150 g'], ['Pomme', '1']]);
  const sThon = () => pm('Tartines de thon et fruit', 360, 25, [['Pain complet', '2 tranches'], ['Thon au naturel', '½ boîte'], ['Tomate', '1'], ['Fruit', '1']], 'r-tartines-thon');

  const dOmelette = () =>
    pm('Omelette épinards et pommes de terre', 680, 42, [['Œufs', '4'], ['Épinards', '200 g'], ['Pommes de terre', '250 g'], ['Emmental râpé', '20 g']], 'r-omelette-pdt');
  const dMaquereau = () =>
    pm('Maquereau, patate douce et légumes verts', 665, 50, [['Maquereau ou saumon', '150 g'], ['Patate douce', '250 g'], ['Légumes verts', '250 g'], ['Fromage blanc 0 % (dessert)', '150 g']], 'r-maquereau-patate');
  const dSardines = () =>
    pm('Salade sardines, œufs et pommes de terre', 630, 42, [['Sardines', '1 boîte'], ['Œufs durs', '2'], ['Pommes de terre', '250 g'], ['Salade et tomate', '1 bol'], ['Huile d’olive', '1 c. à café']], 'r-sardines-salade');
  const dCurry = () =>
    pm('Curry de poulet léger', 615, 52, [['Blanc de poulet', '180 g cru'], ['Légumes (courgette, poivron, oignon)', '200 g'], ['Lait de coco allégé', '100 ml'], ['Riz', '80 g cru']], 'r-curry-poulet');
  const dDhal = () =>
    pm('Dhal de lentilles corail, œufs et skyr', 670, 51, [['Lentilles corail', '80 g sèches'], ['Lait de coco allégé', '100 ml'], ['Tomates concassées', '200 g'], ['Œufs', '2'], ['Skyr nature (dessert)', '150 g']], 'r-dhal');
  const dSoupe = () =>
    pm('Soupe maison et tartines de thon gratinées', 565, 52, [['Soupe de légumes maison', '1 grand bol'], ['Pain complet', '2 tranches'], ['Thon au naturel', '1 boîte'], ['Emmental râpé', '20 g']], 'r-soupe-tartines-thon');
  const dSteak = () =>
    pm('Steak haché, purée maison et haricots verts', 610, 48, [['Steak haché 5 %', '150 g'], ['Pommes de terre', '300 g'], ['Lait demi-écrémé', '50 ml'], ['Haricots verts', '200 g'], ['Yaourt nature (dessert)', '1']], 'r-steak-puree');

  const day = (b: PlannedMeal, l: PlannedMeal, s: PlannedMeal, d: PlannedMeal): Record<string, PlannedMeal> => ({
    's-lemon': lemon(),
    's-breakfast': b,
    's-lunch': l,
    's-snack': s,
    's-dinner': d,
  });

  return [
    day(bPorridge(), lPoulet(), sSkyr(), dOmelette()), // lundi ≈ 2 270 kcal · 170 g
    day(bOmelette(), lBolo(), sSkyr(), dCurry()), // mardi ≈ 2 235 kcal · 175 g
    day(bSkyr(), lLentilles(), sOeufs(), dMaquereau()), // mercredi ≈ 2 240 kcal · 184 g
    day(bPorridge(), lWraps(), sThon(), dDhal()), // jeudi ≈ 2 240 kcal · 174 g
    day(bOmelette(), lPoulet(), sSkyr(), dSardines()), // vendredi ≈ 2 260 kcal · 169 g
    day(bSkyr(), lChili(), sSkyr(), dSteak()), // samedi ≈ 2 220 kcal · 175 g
    day(bOmelette(), lColin(), sThon(), dSoupe()), // dimanche ≈ 2 220 kcal · 167 g
  ];
}

/** Recettes simples, peu chères et variées, avec des repères par portion. */
export function programRecipes(): Recipe[] {
  return [
    rec('r-porridge-proteine', 'Porridge protéiné aux fruits rouges', '🥣', 'Petit-déjeuner', 8, 1, 600, 42,
      [['Flocons d’avoine', '70 g'], ['Lait demi-écrémé', '250 ml'], ['Skyr nature', '200 g'], ['Fruits rouges surgelés', '100 g'], ['Amandes', '10 g'], ['Cannelle', '1 pincée']],
      ['Fais cuire les flocons dans le lait 3 à 4 minutes à feu doux, en remuant.', 'Hors du feu, ajoute le skyr et mélange : il apporte la moitié des protéines.', 'Ajoute les fruits rouges encore surgelés (ils refroidissent le porridge), les amandes concassées et la cannelle.'],
      'Petit budget : flocons d’avoine et fruits rouges surgelés font partie des petits-déjeuners les moins chers à la portion.'),
    rec('r-omelette-pain', 'Omelette, pain complet et fruit', '🍳', 'Petit-déjeuner', 10, 1, 640, 41,
      [['Œufs', '4'], ['Pain complet', '2 tranches (80 g)'], ['Fromage blanc 0 %', '100 g'], ['Pomme', '1'], ['Sel, poivre, herbes', 'au goût']],
      ['Bats les œufs avec le sel, le poivre et les herbes.', 'Cuis 3 minutes dans une poêle antiadhésive chaude, sans matière grasse, puis plie l’omelette.', 'Sers avec le pain grillé ; fromage blanc et pomme en fin de repas.'],
      'Les œufs sont l’une des protéines les moins chères : achète-les par 30.'),
    rec('r-bol-skyr', 'Bol skyr, avoine, banane et cacahuète', '🍌', 'Petit-déjeuner', 3, 1, 575, 44,
      [['Skyr nature', '300 g'], ['Flocons d’avoine', '50 g'], ['Banane', '1'], ['Beurre de cacahuète', '15 g (1 c. à soupe)']],
      ['Verse le skyr dans un bol.', 'Ajoute les flocons, la banane en rondelles et le beurre de cacahuète.'],
      'Se prépare aussi la veille, en boîte, pour un petit-déjeuner à emporter.'),
    rec('r-poulet-riz', 'Poulet, riz et brocoli (3 boîtes)', '🍗', 'Plats', 30, 3, 660, 55,
      [['Blancs de poulet', '540 g'], ['Riz basmati', '240 g cru'], ['Brocoli surgelé', '750 g'], ['Huile d’olive', '3 c. à soupe'], ['Paprika, ail, sel, poivre', 'au goût'], ['Citron', '1']],
      ['Fais cuire le riz selon le paquet.', 'Coupe le poulet en morceaux et saisis-le 8 à 10 minutes dans une cuillère d’huile avec le paprika et l’ail.', 'Fais cuire le brocoli à la vapeur ou au micro-ondes 6 à 8 minutes.', 'Répartis dans 3 boîtes, arrose du reste d’huile et d’un filet de citron.'],
      'Se garde 3 jours au réfrigérateur : un seul passage en cuisine pour 3 repas.'),
    rec('r-bolognaise', 'Pâtes complètes bolognaise au bœuf 5 %', '🍝', 'Plats', 25, 2, 650, 51,
      [['Bœuf haché 5 %', '300 g'], ['Pâtes complètes', '180 g crues'], ['Sauce tomate', '300 g'], ['Oignon', '1'], ['Ail', '1 gousse'], ['Emmental râpé', '40 g'], ['Herbes de Provence', '1 c. à café']],
      ['Fais revenir l’oignon et l’ail émincés 3 minutes dans une poêle antiadhésive.', 'Ajoute le bœuf, émiette-le et laisse dorer 5 minutes.', 'Verse la sauce tomate et les herbes, laisse mijoter 10 minutes.', 'Pendant ce temps, fais cuire les pâtes. Sers avec l’emmental.'],
      'Ajoute des carottes râpées ou des courgettes dans la sauce : plus de volume, presque pas de calories en plus.'),
    rec('r-salade-lentilles-thon', 'Salade lentilles, thon et œuf', '🥗', 'Plats', 10, 1, 685, 65,
      [['Lentilles cuites', '200 g'], ['Thon au naturel', '1 boîte (140 g égoutté)'], ['Œuf dur', '1'], ['Tomate, concombre, carotte', '1 bol'], ['Huile d’olive', '1 c. à soupe'], ['Moutarde et vinaigre', '1 c. à café'], ['Pain complet', '1 tranche']],
      ['Rince les lentilles et égoutte le thon.', 'Coupe les crudités et l’œuf dur.', 'Mélange l’huile, la moutarde et le vinaigre, puis assemble le tout.'],
      'Lentilles en bocal et thon en boîte : un repas complet, très protéiné et bon marché, prêt en 10 minutes.'),
    rec('r-wraps-poulet', 'Wraps poulet, crudités et sauce yaourt', '🌯', 'Plats', 15, 1, 600, 56,
      [['Galettes de blé complet', '2'], ['Blanc de poulet', '150 g'], ['Salade, tomate, carotte râpée', '1 poignée'], ['Skyr ou yaourt grec 0 %', '100 g'], ['Ail, ciboulette, jus de citron', 'pour la sauce']],
      ['Fais cuire le poulet en lamelles 6 à 8 minutes à la poêle avec des épices.', 'Mélange le skyr avec l’ail, la ciboulette et le citron.', 'Garnis les galettes de sauce, de crudités et de poulet, puis roule-les.']),
    rec('r-chili', 'Chili con carne (4 portions)', '🌶️', 'Plats', 35, 4, 705, 52,
      [['Bœuf haché 5 %', '600 g'], ['Haricots rouges', '2 boîtes (600 g égouttés)'], ['Tomates concassées', '800 g'], ['Oignons', '2'], ['Poivrons', '2'], ['Cumin, paprika, piment doux', 'au goût'], ['Riz', '320 g cru']],
      ['Fais revenir les oignons et les poivrons coupés 5 minutes.', 'Ajoute le bœuf et les épices, laisse dorer 5 minutes.', 'Verse les tomates et les haricots rincés, laisse mijoter 20 minutes.', 'Sers avec le riz cuit.'],
      'Se congèle très bien : prépare 4 portions d’un coup.'),
    rec('r-colin-four', 'Colin, pommes de terre et haricots verts au four', '🐟', 'Plats', 35, 1, 645, 49,
      [['Colin surgelé', '200 g'], ['Pommes de terre', '400 g'], ['Haricots verts surgelés', '250 g'], ['Huile d’olive', '1 c. à soupe'], ['Citron, persil', 'au goût']],
      ['Préchauffe le four à 200 °C. Coupe les pommes de terre en quartiers, arrose de la moitié de l’huile et enfourne 20 minutes.', 'Ajoute le colin et les haricots verts, le citron et le reste d’huile.', 'Prolonge la cuisson 15 minutes.'],
      'Le poisson blanc surgelé est très riche en protéines et peu cher.'),
    rec('r-omelette-pdt', 'Omelette épinards et pommes de terre', '🥔', 'Plats', 25, 1, 680, 42,
      [['Œufs', '4'], ['Épinards (frais ou surgelés)', '200 g'], ['Pommes de terre', '250 g'], ['Emmental râpé', '20 g'], ['Huile d’olive', '1 c. à café']],
      ['Fais cuire les pommes de terre en rondelles 12 minutes à la vapeur ou au micro-ondes.', 'Fais-les dorer à la poêle avec l’huile, ajoute les épinards 2 minutes.', 'Verse les œufs battus et l’emmental, couvre et cuis 5 minutes à feu doux.']),
    rec('r-maquereau-patate', 'Maquereau, patate douce et légumes verts', '🍠', 'Plats', 30, 1, 595, 39,
      [['Maquereau ou saumon', '150 g'], ['Patate douce', '250 g'], ['Légumes verts', '250 g'], ['Citron, herbes', 'au goût']],
      ['Coupe la patate douce en cubes et fais-la rôtir 25 minutes au four à 200 °C.', 'Fais cuire le poisson 10 à 12 minutes au four ou à la poêle.', 'Fais cuire les légumes à la vapeur et sers avec un filet de citron.'],
      'Riche en oméga-3. Le maquereau est généralement moins cher que le saumon. Avec 150 g de fromage blanc 0 % en dessert : environ 50 g de protéines.'),
    rec('r-sardines-salade', 'Salade sardines, œufs et pommes de terre', '🥫', 'Plats', 20, 1, 630, 42,
      [['Sardines', '1 boîte'], ['Œufs', '2'], ['Pommes de terre', '250 g'], ['Salade, tomate', '1 bol'], ['Huile d’olive', '1 c. à café'], ['Moutarde, vinaigre', 'au goût']],
      ['Fais cuire les pommes de terre et les œufs (10 minutes pour des œufs durs).', 'Égoutte les sardines et coupe les œufs et les pommes de terre.', 'Assemble avec la salade et la vinaigrette.']),
    rec('r-curry-poulet', 'Curry de poulet léger (2 portions)', '🍛', 'Plats', 25, 2, 615, 52,
      [['Blancs de poulet', '360 g'], ['Courgette, poivron, oignon', '400 g'], ['Lait de coco allégé', '200 ml'], ['Curry', '2 c. à café'], ['Riz', '160 g cru']],
      ['Fais revenir l’oignon et les légumes coupés 5 minutes.', 'Ajoute le poulet en morceaux et le curry, laisse dorer 5 minutes.', 'Verse le lait de coco et laisse mijoter 10 minutes. Sers avec le riz.']),
    rec('r-dhal', 'Dhal de lentilles corail aux œufs (2 portions)', '🍲', 'Plats', 25, 2, 575, 35,
      [['Lentilles corail', '160 g sèches'], ['Lait de coco allégé', '200 ml'], ['Tomates concassées', '400 g'], ['Oignon', '1'], ['Ail et gingembre', 'au goût'], ['Curry ou cumin', '2 c. à café'], ['Œufs', '4']],
      ['Fais revenir l’oignon, l’ail et le gingembre 3 minutes avec les épices.', 'Ajoute les lentilles rincées, les tomates, le lait de coco et 300 ml d’eau. Laisse cuire 15 minutes en remuant.', 'Pendant ce temps, fais cuire les œufs 7 minutes (mollets) et sers-les sur le dhal.'],
      'Avec 150 g de skyr en dessert : environ 50 g de protéines. Les lentilles corail cuisent sans trempage.'),
    rec('r-soupe-tartines-thon', 'Soupe maison et tartines de thon gratinées', '🥣', 'Plats', 30, 1, 565, 52,
      [['Légumes de soupe (poireau, carotte, courgette)', '250 g par bol'], ['Pain complet', '2 tranches'], ['Thon au naturel', '1 boîte'], ['Emmental râpé', '20 g']],
      ['Fais cuire les légumes 20 minutes dans de l’eau salée, puis mixe (prépare 4 bols d’un coup).', 'Étale le thon sur le pain, parsème d’emmental et passe 5 minutes au four.', 'Sers avec un grand bol de soupe.'],
      'La soupe se garde 3 jours au réfrigérateur et se congèle.'),
    rec('r-steak-puree', 'Steak haché, purée maison et haricots verts', '🥩', 'Plats', 30, 1, 550, 43,
      [['Steak haché 5 %', '150 g'], ['Pommes de terre', '300 g'], ['Lait demi-écrémé', '50 ml'], ['Haricots verts', '200 g'], ['Sel, poivre, muscade', 'au goût']],
      ['Fais cuire les pommes de terre 20 minutes, puis écrase-les avec le lait chaud.', 'Fais cuire les haricots verts à la vapeur.', 'Saisis le steak 2 à 3 minutes de chaque côté.'],
      'Avec un yaourt nature en dessert : environ 610 kcal et 48 g de protéines.'),
    rec('r-riz-saute', 'Riz sauté aux œufs et à la dinde', '🍚', 'Plats', 20, 1, 730, 53,
      [['Riz cuit (idéalement de la veille)', '70 g cru'], ['Œufs', '3'], ['Blanc de dinde', '100 g'], ['Petits pois et carottes surgelés', '150 g'], ['Sauce soja', '1 c. à soupe'], ['Huile', '1 c. à café']],
      ['Fais sauter les légumes 4 minutes dans l’huile.', 'Ajoute la dinde en dés, puis pousse sur le côté et brouille les œufs.', 'Ajoute le riz et la sauce soja, mélange 3 minutes à feu vif.'],
      'Parfait pour finir un reste de riz.'),
    rec('r-tartines-thon', 'Tartines de thon', '🥪', 'Collations', 5, 1, 280, 25,
      [['Pain complet', '2 tranches'], ['Thon au naturel', '½ boîte'], ['Tomate', '1'], ['Moutarde ou fromage frais léger', '1 c. à café']],
      ['Écrase le thon avec la moutarde.', 'Étale sur le pain et ajoute la tomate en rondelles.']),
  ];
}

/** Courses de base pour une semaine du programme. */
export function programShopping(): ShoppingItem[] {
  const list: [string, string, string][] = [
    ['Œufs', '30', 'Frais'],
    ['Skyr nature', '2,5 kg', 'Frais'],
    ['Fromage blanc 0 %', '1 kg', 'Frais'],
    ['Lait demi-écrémé', '1 L', 'Frais'],
    ['Emmental râpé', '1 sachet', 'Frais'],
    ['Yaourts nature', '4', 'Frais'],
    ['Blancs de poulet', '1,2 kg', 'Poissons et viandes'],
    ['Bœuf haché 5 % ou steaks hachés', '450 g', 'Poissons et viandes'],
    ['Colin surgelé', '200 g', 'Surgelés'],
    ['Maquereau ou saumon', '150 g', 'Poissons et viandes'],
    ['Thon au naturel', '3 boîtes', 'Épicerie'],
    ['Sardines', '1 boîte', 'Épicerie'],
    ['Flocons d’avoine', '500 g', 'Épicerie'],
    ['Riz basmati', '1 kg', 'Épicerie'],
    ['Pâtes complètes', '500 g', 'Épicerie'],
    ['Pain complet', '1 grand pain', 'Épicerie'],
    ['Galettes de blé complet', '1 paquet', 'Épicerie'],
    ['Lentilles cuites', '1 bocal', 'Épicerie'],
    ['Lentilles corail', '500 g', 'Épicerie'],
    ['Haricots rouges', '1 boîte', 'Épicerie'],
    ['Lait de coco allégé', '1 brique', 'Épicerie'],
    ['Tomates concassées et sauce tomate', '3 boîtes', 'Épicerie'],
    ['Beurre de cacahuète', '1 pot', 'Épicerie'],
    ['Amandes', '1 sachet', 'Épicerie'],
    ['Huile d’olive', '1 bouteille', 'Épicerie'],
    ['Pommes de terre', '2 kg', 'Fruits et légumes'],
    ['Patates douces', '1', 'Fruits et légumes'],
    ['Bananes', '2', 'Fruits et légumes'],
    ['Pommes et fruits de saison', '8', 'Fruits et légumes'],
    ['Crudités (tomates, concombre, carottes)', '', 'Fruits et légumes'],
    ['Oignons, ail, poivrons, courgettes', '', 'Fruits et légumes'],
    ['Citrons', '4', 'Fruits et légumes'],
    ['Gingembre frais', '1 morceau (50 g)', 'Fruits et légumes'],
    ['Brocoli, haricots verts, épinards surgelés', '1,5 kg', 'Surgelés'],
    ['Fruits rouges surgelés', '250 g', 'Surgelés'],
  ];
  return list.map(([name, qty, category], i) => ({ id: `shp-${i + 1}`, name, qty, category, checked: false }));
}

/** Repère de dose pour la boisson citron-gingembre. */
export const LEMON_GINGER_NOTE =
  'Dose conseillée : une tasse par jour, avec ½ citron et 2 à 3 cm de gingembre frais (5 à 10 g), de préférence le matin. Une boisson chaude agréable qui participe à ton hydratation : elle ne « détoxifie » pas l’organisme et ne fait pas maigrir à elle seule. En cas de reflux, de grossesse ou de traitement anticoagulant, demande conseil à un professionnel de santé.';
