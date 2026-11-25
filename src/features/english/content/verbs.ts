// Verbes irréguliers, du plus utile au moins fréquent. Formes alternatives acceptées dans `alt`.

export interface IrregularVerb {
  base: string;
  past: string;
  participle: string;
  fr: string;
  /** Autres formes correctes (britannique / américain…). */
  alt?: { past?: string[]; participle?: string[] };
}

function v(base: string, past: string, participle: string, fr: string, alt?: IrregularVerb['alt']): IrregularVerb {
  return { base, past, participle, fr, alt };
}

export const IRREGULAR_VERBS: IrregularVerb[] = [
  v('be', 'was / were', 'been', 'être', { past: ['was', 'were'] }),
  v('have', 'had', 'had', 'avoir'),
  v('do', 'did', 'done', 'faire'),
  v('go', 'went', 'gone', 'aller'),
  v('get', 'got', 'got', 'obtenir, recevoir', { participle: ['gotten'] }),
  v('make', 'made', 'made', 'fabriquer, faire'),
  v('take', 'took', 'taken', 'prendre'),
  v('give', 'gave', 'given', 'donner'),
  v('know', 'knew', 'known', 'savoir, connaître'),
  v('think', 'thought', 'thought', 'penser'),
  v('see', 'saw', 'seen', 'voir'),
  v('come', 'came', 'come', 'venir'),
  v('say', 'said', 'said', 'dire'),
  v('tell', 'told', 'told', 'dire, raconter'),
  v('find', 'found', 'found', 'trouver'),
  v('send', 'sent', 'sent', 'envoyer'),
  v('pay', 'paid', 'paid', 'payer'),
  v('meet', 'met', 'met', 'rencontrer'),
  v('buy', 'bought', 'bought', 'acheter'),
  v('sell', 'sold', 'sold', 'vendre'),
  v('bring', 'brought', 'brought', 'apporter'),
  v('keep', 'kept', 'kept', 'garder'),
  v('leave', 'left', 'left', 'partir, laisser'),
  v('begin', 'began', 'begun', 'commencer'),
  v('write', 'wrote', 'written', 'écrire'),
  v('read', 'read', 'read', 'lire'),
  v('speak', 'spoke', 'spoken', 'parler'),
  v('understand', 'understood', 'understood', 'comprendre'),
  v('spend', 'spent', 'spent', 'dépenser, passer (du temps)'),
  v('lose', 'lost', 'lost', 'perdre'),
  v('win', 'won', 'won', 'gagner'),
  v('choose', 'chose', 'chosen', 'choisir'),
  v('lead', 'led', 'led', 'mener, diriger'),
  v('build', 'built', 'built', 'construire'),
  v('hold', 'held', 'held', 'tenir'),
  v('put', 'put', 'put', 'mettre'),
  v('set', 'set', 'set', 'fixer, régler'),
  v('let', 'let', 'let', 'laisser, permettre'),
  v('cost', 'cost', 'cost', 'coûter'),
  v('cut', 'cut', 'cut', 'couper'),
  v('mean', 'meant', 'meant', 'signifier, vouloir dire'),
  v('learn', 'learned', 'learned', 'apprendre', { past: ['learnt'], participle: ['learnt'] }),
  v('feel', 'felt', 'felt', 'ressentir'),
  v('become', 'became', 'become', 'devenir'),
  v('grow', 'grew', 'grown', 'grandir, faire pousser'),
  v('rise', 'rose', 'risen', 'augmenter, se lever'),
  v('fall', 'fell', 'fallen', 'tomber, baisser'),
  v('run', 'ran', 'run', 'courir, diriger'),
  v('lend', 'lent', 'lent', 'prêter'),
  v('forget', 'forgot', 'forgotten', 'oublier'),
  v('hear', 'heard', 'heard', 'entendre'),
  v('teach', 'taught', 'taught', 'enseigner'),
  v('drive', 'drove', 'driven', 'conduire'),
  v('fly', 'flew', 'flown', 'voler (en avion)'),
  v('break', 'broke', 'broken', 'casser'),
  v('show', 'showed', 'shown', 'montrer'),
  v('stand', 'stood', 'stood', 'être debout'),
  v('sit', 'sat', 'sat', 's’asseoir'),
  v('eat', 'ate', 'eaten', 'manger'),
  v('drink', 'drank', 'drunk', 'boire'),
  v('sleep', 'slept', 'slept', 'dormir'),
  v('wake', 'woke', 'woken', 'se réveiller'),
  v('wear', 'wore', 'worn', 'porter (un vêtement)'),
  v('catch', 'caught', 'caught', 'attraper'),
  v('fight', 'fought', 'fought', 'se battre'),
  v('throw', 'threw', 'thrown', 'lancer'),
  v('hide', 'hid', 'hidden', 'cacher'),
  v('steal', 'stole', 'stolen', 'voler (dérober)'),
  v('forgive', 'forgave', 'forgiven', 'pardonner'),
  v('draw', 'drew', 'drawn', 'dessiner'),
  v('swim', 'swam', 'swum', 'nager'),
  v('sing', 'sang', 'sung', 'chanter'),
  v('ring', 'rang', 'rung', 'sonner'),
  v('ride', 'rode', 'ridden', 'monter (à vélo, à cheval)'),
  v('shut', 'shut', 'shut', 'fermer'),
  v('hurt', 'hurt', 'hurt', 'blesser, faire mal'),
];

export function findVerb(base: string): IrregularVerb | undefined {
  return IRREGULAR_VERBS.find((x) => x.base === base);
}
