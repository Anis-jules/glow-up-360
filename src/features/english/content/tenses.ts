// Points de conjugaison : règle courte, exemples et questions de quiz (la première option est la bonne).

export interface GrammarQuestion {
  /** Phrase avec ___ à compléter. */
  sentence: string;
  /** Options : la première est la bonne réponse. */
  options: [string, string, string, string];
}

export interface Tense {
  id: string;
  title: string;
  subtitle: string;
  structure: string[];
  usage: string[];
  signals: string;
  examples: { en: string; fr: string }[];
  questions: GrammarQuestion[];
}

export const TENSES: Tense[] = [
  {
    id: 'present-simple',
    title: 'Présent simple',
    subtitle: 'Habitudes, vérités générales, horaires',
    structure: [
      'I / you / we / they + verbe : I work.',
      'He / she / it + verbe + s : She works.',
      'Négation : don’t / doesn’t + verbe : He doesn’t work.',
      'Question : Do / Does + sujet + verbe ? Does she work?',
    ],
    usage: ['Ce que l’on fait régulièrement.', 'Les faits et vérités générales.', 'Les horaires et programmes fixes.'],
    signals: 'every day, usually, often, sometimes, never, on Mondays',
    examples: [
      { en: 'She works in marketing.', fr: 'Elle travaille dans le marketing.' },
      { en: 'We don’t sell online.', fr: 'Nous ne vendons pas en ligne.' },
      { en: 'Does the meeting start at 9?', fr: 'La réunion commence-t-elle à 9 h ?' },
    ],
    questions: [
      { sentence: 'She ___ the train to work every day.', options: ['takes', 'take', 'is taking', 'took'] },
      { sentence: 'They ___ a team meeting every Monday.', options: ['have', 'has', 'having', 'are have'] },
      { sentence: 'He ___ like long meetings.', options: ['doesn’t', 'don’t', 'isn’t', 'not'] },
      { sentence: '___ you work on Fridays?', options: ['Do', 'Does', 'Are', 'Is'] },
      { sentence: 'The office ___ at 9 a.m.', options: ['opens', 'open', 'opening', 'is open to'] },
      { sentence: 'Our company ___ software.', options: ['sells', 'sell', 'selling', 'is sell'] },
    ],
  },
  {
    id: 'present-continuous',
    title: 'Présent continu',
    subtitle: 'Ce qui se passe maintenant, projets proches',
    structure: ['am / is / are + verbe-ing : I am working.', 'Négation : I’m not working.', 'Question : Are you working?'],
    usage: ['Une action en cours au moment où l’on parle.', 'Une situation temporaire.', 'Un rendez-vous ou projet déjà organisé.'],
    signals: 'now, right now, at the moment, today, this week',
    examples: [
      { en: 'I’m working on the report right now.', fr: 'Je travaille sur le rapport en ce moment.' },
      { en: 'We’re meeting the client tomorrow.', fr: 'Nous voyons le client demain.' },
    ],
    questions: [
      { sentence: 'I ___ on the report right now.', options: ['am working', 'work', 'working', 'works'] },
      { sentence: 'She can’t talk, she ___ a call.', options: ['is taking', 'takes', 'taking', 'take'] },
      { sentence: 'We ___ the client tomorrow at 10.', options: ['are meeting', 'meets', 'meeting', 'is meet'] },
      { sentence: 'Look! Prices ___ this month.', options: ['are rising', 'rises', 'rising', 'is rise'] },
      { sentence: 'They ___ from home this week.', options: ['are working', 'works', 'is work', 'working'] },
      { sentence: 'What ___ you doing?', options: ['are', 'do', 'is', 'does'] },
    ],
  },
  {
    id: 'past-simple',
    title: 'Prétérit',
    subtitle: 'Action terminée à un moment précis du passé',
    structure: [
      'Verbes réguliers : verbe + ed : I worked.',
      'Verbes irréguliers : forme à apprendre : I went.',
      'Négation : didn’t + verbe de base : I didn’t go.',
      'Question : Did + sujet + verbe de base ? Did you go?',
    ],
    usage: ['Une action finie, à un moment passé connu.', 'Une suite d’actions passées (un récit).'],
    signals: 'yesterday, last week, in 2020, two days ago, when…',
    examples: [
      { en: 'We signed the contract last week.', fr: 'Nous avons signé le contrat la semaine dernière.' },
      { en: 'Did you call the supplier?', fr: 'As-tu appelé le fournisseur ?' },
    ],
    questions: [
      { sentence: 'We ___ the deal last week.', options: ['signed', 'sign', 'have signed', 'signs'] },
      { sentence: 'She ___ to London yesterday.', options: ['went', 'goes', 'has gone', 'gone'] },
      { sentence: 'I ___ see your email.', options: ['didn’t', 'don’t', 'haven’t', 'wasn’t'] },
      { sentence: '___ you call the client yesterday?', options: ['Did', 'Do', 'Have', 'Were'] },
      { sentence: 'They ___ a new office two years ago.', options: ['opened', 'open', 'have opened', 'opening'] },
      { sentence: 'He ___ the presentation on Monday.', options: ['gave', 'give', 'given', 'gives'] },
    ],
  },
  {
    id: 'present-perfect',
    title: 'Present perfect',
    subtitle: 'Lien entre le passé et le présent',
    structure: ['have / has + participe passé : I have finished.', 'Négation : I haven’t finished.', 'Question : Have you finished?'],
    usage: [
      'Une expérience, sans date précise : I have been to Japan.',
      'Un résultat visible maintenant : I’ve lost my keys.',
      'Une action commencée dans le passé qui continue : I’ve worked here since 2020.',
    ],
    signals: 'already, yet, just, ever, never, since, for',
    examples: [
      { en: 'I have already sent the invoice.', fr: 'J’ai déjà envoyé la facture.' },
      { en: 'She has worked here for five years.', fr: 'Elle travaille ici depuis cinq ans.' },
    ],
    questions: [
      { sentence: 'I have already ___ the invoice.', options: ['sent', 'send', 'sended', 'sending'] },
      { sentence: 'She ___ worked here since 2019.', options: ['has', 'have', 'is', 'was'] },
      { sentence: 'Have you ___ been to New York?', options: ['ever', 'yet', 'already', 'since'] },
      { sentence: 'We haven’t finished ___.', options: ['yet', 'already', 'ago', 'since'] },
      { sentence: 'They have known each other ___ ten years.', options: ['for', 'since', 'ago', 'during'] },
      { sentence: 'He ___ just arrived.', options: ['has', 'have', 'is', 'did'] },
    ],
  },
  {
    id: 'future',
    title: 'Le futur : will et going to',
    subtitle: 'Décisions, promesses, intentions, prévisions',
    structure: ['will + verbe : I will call you.', 'am / is / are going to + verbe : I’m going to call him.', 'Négation : won’t / I’m not going to.'],
    usage: [
      'will : décision prise sur le moment, promesse, prévision.',
      'going to : intention déjà décidée, prévision avec un indice visible.',
    ],
    signals: 'tomorrow, next week, soon, in the future, I think…',
    examples: [
      { en: 'Don’t worry, I’ll send it today.', fr: 'Ne t’inquiète pas, je l’envoie aujourd’hui.' },
      { en: 'We’re going to launch a new product.', fr: 'Nous allons lancer un nouveau produit.' },
    ],
    questions: [
      { sentence: 'Don’t worry, I ___ send it today.', options: ['will', 'am going', 'going', 'would'] },
      { sentence: 'We ___ to launch a new product next year.', options: ['are going', 'will', 'go', 'going'] },
      { sentence: 'Look at those clouds, it ___ rain.', options: ['is going to', 'will to', 'goes to', 'going'] },
      { sentence: 'I think prices ___ increase.', options: ['will', 'are', 'going', 'would to'] },
      { sentence: '___ you help me with this file?', options: ['Will', 'Are', 'Do', 'Going'] },
      { sentence: 'She ___ going to call you back.', options: ['is', 'will', 'does', 'has'] },
    ],
  },
  {
    id: 'conditional',
    title: 'Conditionnel et phrases en « if »',
    subtitle: 'Politesse, hypothèses',
    structure: [
      'would + verbe : I would like a coffee.',
      'If + présent → will : If we lower the price, we will sell more.',
      'If + prétérit → would : If I had time, I would learn Spanish.',
    ],
    usage: ['Formuler poliment une demande.', 'Une condition réaliste (if + présent).', 'Une situation imaginaire (if + prétérit).'],
    signals: 'if, would, could, unless',
    examples: [
      { en: 'Would you like to join the call?', fr: 'Voulez-vous vous joindre à l’appel ?' },
      { en: 'If I were you, I would accept the offer.', fr: 'À ta place, j’accepterais l’offre.' },
    ],
    questions: [
      { sentence: '___ you like a coffee?', options: ['Would', 'Will', 'Do', 'Are'] },
      { sentence: 'If we lower the price, we ___ sell more.', options: ['will', 'would', 'sold', 'sells'] },
      { sentence: 'If I had more time, I ___ learn Spanish.', options: ['would', 'will', 'am', 'had'] },
      { sentence: 'I ___ like to schedule a meeting.', options: ['would', 'will', 'do', 'am'] },
      { sentence: 'If it rains, the event ___ cancelled.', options: ['will be', 'would be', 'is be', 'be'] },
      { sentence: 'If I ___ you, I would accept the offer.', options: ['were', 'am', 'will be', 'being'] },
    ],
  },
  {
    id: 'past-continuous',
    title: 'Past continuous',
    subtitle: 'Action en cours dans le passé',
    structure: ['was / were + verbe-ing : I was working.', 'Souvent avec le prétérit : I was working when you called.'],
    usage: ['Une action en train de se dérouler à un moment du passé.', 'Une action interrompue par une autre.'],
    signals: 'while, when, at 8 p.m. yesterday, all morning',
    examples: [
      { en: 'I was working when you called.', fr: 'Je travaillais quand tu as appelé.' },
      { en: 'They were talking about the budget.', fr: 'Ils parlaient du budget.' },
    ],
    questions: [
      { sentence: 'I ___ working when you called.', options: ['was', 'were', 'am', 'did'] },
      { sentence: 'They ___ talking about the budget.', options: ['were', 'was', 'are', 'did'] },
      { sentence: 'What were you ___ at 9 p.m.?', options: ['doing', 'do', 'did', 'done'] },
      { sentence: 'She was driving when her phone ___.', options: ['rang', 'was ringing', 'rings', 'rung'] },
      { sentence: 'We ___ waiting for the client all morning.', options: ['were', 'was', 'are', 'have'] },
      { sentence: 'While he ___ the report, the power went out.', options: ['was writing', 'wrote', 'writes', 'has written'] },
    ],
  },
  {
    id: 'modals',
    title: 'Les modaux : can, could, must, should, may',
    subtitle: 'Capacité, permission, obligation, conseil',
    structure: ['Modal + verbe de base, sans « to » : You should call him.', 'Pas de « s » à la 3e personne : She can speak English.'],
    usage: [
      'can : pouvoir, savoir faire. could : pourrait, ou demande polie.',
      'must : obligation forte. should : conseil.',
      'may : permission polie ou possibilité.',
    ],
    signals: 'pour demander, conseiller, obliger',
    examples: [
      { en: 'Could you send me the file, please?', fr: 'Pourrais-tu m’envoyer le fichier, s’il te plaît ?' },
      { en: 'You should check the contract.', fr: 'Tu devrais vérifier le contrat.' },
    ],
    questions: [
      { sentence: 'You ___ check the contract before signing.', options: ['should', 'must to', 'can to', 'would to'] },
      { sentence: '___ I ask a question?', options: ['May', 'Must', 'Should', 'Would to'] },
      { sentence: 'Employees ___ wear a badge in the building.', options: ['must', 'can to', 'may to', 'could to'] },
      { sentence: 'She ___ speak three languages.', options: ['can', 'cans', 'can to', 'is can'] },
      { sentence: '___ you send me the file, please?', options: ['Could', 'Must', 'Should', 'May to'] },
      { sentence: 'We ___ to finish by Friday.', options: ['have', 'must', 'should', 'can'] },
    ],
  },
];

export function findTense(id: string): Tense | undefined {
  return TENSES.find((t) => t.id === id);
}
