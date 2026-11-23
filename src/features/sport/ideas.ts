// Banque d'idées d'exercices à faire à la maison, sans matériel (une chaise ou une marche au plus).
// Ce ne sont que des idées : on les ajoute à la séance du jour ou à une séance quand on veut.

import type { Exercise } from '@/lib/types';
import { newExercise } from './sportUtils';

function idea(name: string, p: Partial<Exercise>): Exercise {
  return { ...newExercise(), id: `idea-${name}`, name, progressive: false, ...p };
}

export interface IdeaGroup {
  id: string;
  title: string;
  emoji: string;
  ideas: Exercise[];
}

export const IDEA_GROUPS: IdeaGroup[] = [
  {
    id: 'haut',
    title: 'Haut du corps',
    emoji: '💪',
    ideas: [
      idea('Pompes inclinées', { sets: 3, reps: 10, restSec: 60,
        instructions: 'Mains sur un plan surélevé (table, canapé, marche). Plus le support est haut, plus c’est facile. Corps gainé, descends la poitrine vers le support.' }),
      idea('Pompes larges', { sets: 3, reps: 8, restSec: 60,
        instructions: 'Mains nettement plus larges que les épaules : les pectoraux travaillent davantage. Coudes à 45° environ, pas collés au corps.' }),
      idea('Pompes déclinées', { sets: 2, reps: 8, restSec: 60,
        instructions: 'Pieds posés sur une chaise ou une marche, mains au sol. Plus difficile : le haut des pectoraux et les épaules prennent plus de charge.' }),
      idea('Pompes lentes', { sets: 2, reps: 6, restSec: 60,
        instructions: 'Trois secondes pour descendre, une seconde en bas, puis remonte. Moins de répétitions mais beaucoup plus de contrôle.' }),
      idea('Pompes en T', { sets: 2, reps: 6, perSide: true, restSec: 60,
        instructions: 'Après chaque pompe, pivote sur le côté en levant un bras vers le plafond, corps aligné. Reviens et alterne.' }),
      idea('Dips sur chaise', { sets: 2, reps: 8, restSec: 60,
        instructions: 'Mains sur une chaise stable derrière toi, jambes fléchies. Descends jusqu’à 90° aux coudes au maximum, puis remonte. Plus dur : jambes tendues.' }),
      idea('Planche commando', { sets: 2, reps: 8, restSec: 60,
        instructions: 'Passe de la planche sur les mains à la planche sur les avant-bras, un bras après l’autre, puis remonte. Bassin stable, sans balancer.' }),
      idea('Superman', { sets: 2, reps: 12, restSec: 45,
        instructions: 'Allongé sur le ventre, bras tendus devant. Lève bras et jambes de quelques centimètres, tiens une seconde. Regard vers le sol.' }),
      idea('Y-T-W au sol', { sets: 2, reps: 8, restSec: 45,
        instructions: 'Sur le ventre, front au sol. Lève les bras en Y, puis en T, puis plie-les en W en serrant les omoplates. Excellent pour la posture.' }),
    ],
  },
  {
    id: 'bas',
    title: 'Bas du corps',
    emoji: '🦵',
    ideas: [
      idea('Squats', { sets: 3, reps: 15, restSec: 60,
        instructions: 'Pieds largeur d’épaules, descends comme pour t’asseoir, dos droit, talons au sol, genoux dans l’axe des pieds.' }),
      idea('Squats sumo', { sets: 3, reps: 12, restSec: 60,
        instructions: 'Pieds très écartés, pointes vers l’extérieur. Descends en gardant le buste droit : l’intérieur des cuisses et les fessiers travaillent.' }),
      idea('Squats sautés', { sets: 3, reps: 10, restSec: 60,
        instructions: 'Squat puis saut vertical, réception souple en pliant les genoux. Version douce : monte sur la pointe des pieds au lieu de sauter.' }),
      idea('Fentes arrière', { sets: 3, reps: 10, perSide: true, restSec: 60,
        instructions: 'Un grand pas en arrière, genou arrière près du sol, buste droit. Plus douces pour les genoux que les fentes avant.' }),
      idea('Squat bulgare', { sets: 2, reps: 8, perSide: true, restSec: 60,
        instructions: 'Pied arrière posé sur une chaise, descends sur la jambe avant. Très efficace pour les cuisses et les fessiers. Garde l’équilibre en fixant un point.' }),
      idea('Montées sur chaise', { sets: 2, reps: 10, perSide: true, restSec: 60,
        instructions: 'Monte sur une chaise stable (ou une marche) en poussant dans le talon, redescends en contrôlant. Une jambe puis l’autre.' }),
      idea('Pont fessier une jambe', { sets: 2, reps: 10, perSide: true, restSec: 45,
        instructions: 'Sur le dos, un pied au sol, l’autre jambe tendue. Pousse dans le talon pour lever le bassin, serre les fessiers en haut.' }),
      idea('Chaise contre le mur', { kind: 'time', sets: 2, durationSec: 30, restSec: 45,
        instructions: 'Dos au mur, genoux à angle droit au-dessus des chevilles. Tiens sans retenir ta respiration.' }),
      idea('Mollets sur une marche', { sets: 3, reps: 15, restSec: 30,
        instructions: 'Avant des pieds sur une marche, talons dans le vide. Monte le plus haut possible, redescends lentement sous le niveau de la marche.' }),
    ],
  },
  {
    id: 'abdos',
    title: 'Abdos et gainage',
    emoji: '🎯',
    ideas: [
      idea('Gainage latéral', { kind: 'time', sets: 2, durationSec: 20, perSide: true, restSec: 30,
        instructions: 'Sur un avant-bras, coude sous l’épaule, corps aligné. Monte le bassin et tiens sans le laisser tomber.' }),
      idea('Planche touché d’épaule', { sets: 3, reps: 16, restSec: 45,
        instructions: 'En planche sur les mains, touche l’épaule opposée avec une main puis l’autre, sans balancer le bassin. Pieds écartés pour plus de stabilité.' }),
      idea('Crunchs', { sets: 3, reps: 15, restSec: 45,
        instructions: 'Sur le dos, genoux pliés. Enroule le haut du dos en soufflant, sans tirer sur la nuque.' }),
      idea('Pédalo', { sets: 3, reps: 20, restSec: 45,
        instructions: 'Sur le dos, mains derrière la tête. Amène un coude vers le genou opposé en tendant l’autre jambe, alterne lentement.' }),
      idea('Relevés de jambes', { sets: 3, reps: 10, restSec: 45,
        instructions: 'Sur le dos, mains sous les fesses. Lève les jambes tendues jusqu’à la verticale, redescends sans toucher le sol. Bas du dos plaqué.' }),
      idea('Dead bug', { sets: 3, reps: 10, perSide: true, restSec: 45,
        instructions: 'Sur le dos, bras vers le plafond, genoux à 90°. Tends un bras et la jambe opposée vers le sol, reviens, alterne. Bas du dos collé au sol.' }),
      idea('Position banane', { kind: 'time', sets: 3, durationSec: 20, restSec: 40,
        instructions: 'Sur le dos, décolle épaules et jambes tendues du sol, bras tendus derrière la tête, bas du dos plaqué. Plus facile : genoux pliés.' }),
      idea('Russian twist', { sets: 3, reps: 20, restSec: 45,
        instructions: 'Assis, buste incliné en arrière, pieds au sol ou décollés. Tourne les épaules d’un côté puis de l’autre, en gardant le dos droit.' }),
    ],
  },
  {
    id: 'cardio',
    title: 'Cardio sans matériel',
    emoji: '🔥',
    ideas: [
      idea('Jumping jacks', { kind: 'time', sets: 3, durationSec: 30, restSec: 30,
        instructions: 'Saute en écartant bras et jambes, reviens pieds joints. Atterris en douceur sur l’avant du pied.' }),
      idea('Mountain climbers', { kind: 'time', sets: 3, durationSec: 30, restSec: 30,
        instructions: 'En position de pompe, ramène un genou vers la poitrine puis l’autre, en alternance rapide. Dos plat.' }),
      idea('Montées de genoux', { kind: 'time', sets: 3, durationSec: 30, restSec: 30,
        instructions: 'Course sur place en montant les genoux à hauteur de hanches, bras qui accompagnent.' }),
      idea('Talons-fesses', { kind: 'time', sets: 3, durationSec: 30, restSec: 30,
        instructions: 'Course sur place en ramenant les talons vers les fessiers, buste droit.' }),
      idea('Burpees', { sets: 2, reps: 8, restSec: 60,
        instructions: 'Accroupis, mains au sol, jette les pieds en arrière, reviens, puis saute bras en l’air. Version douce : sans saut ni pompe.' }),
      idea('Patineur', { kind: 'time', sets: 3, durationSec: 30, restSec: 30,
        instructions: 'Saute latéralement d’un pied sur l’autre en croisant la jambe arrière, comme un patineur. Réception souple.' }),
      idea('Corde à sauter imaginaire', { kind: 'time', sets: 3, durationSec: 45, restSec: 30,
        instructions: 'Petits sauts sur l’avant des pieds en faisant tourner les poignets. Idéal pour s’échauffer.' }),
    ],
  },
  {
    id: 'mobilite',
    title: 'Mobilité et récupération',
    emoji: '🧘',
    ideas: [
      idea('Chat-vache', { sets: 1, reps: 10, restSec: 0,
        instructions: 'À quatre pattes, arrondis le dos en soufflant, puis creuse-le doucement en inspirant. Mouvement lent, sans forcer.' }),
      idea('Fente basse avec rotation', { sets: 2, reps: 5, perSide: true, restSec: 0,
        instructions: 'En fente basse, main opposée au sol, ouvre l’autre bras vers le plafond en tournant le buste. Ouvre les hanches et le haut du dos.' }),
      idea('Cercles de bras', { kind: 'time', sets: 2, durationSec: 30, restSec: 15,
        instructions: 'Bras tendus sur les côtés, petits cercles puis grands cercles, vers l’avant puis vers l’arrière.' }),
      idea('Posture de l’enfant', { kind: 'time', sets: 1, durationSec: 60, restSec: 0,
        instructions: 'À genoux, fesses vers les talons, bras allongés devant toi, front au sol. Respire profondément dans le dos.' }),
      idea('Étirement des pectoraux au mur', { kind: 'time', sets: 2, durationSec: 30, perSide: true, restSec: 0,
        instructions: 'Avant-bras contre un mur ou un encadrement de porte, coude à hauteur d’épaule, tourne doucement le buste à l’opposé.' }),
    ],
  },
];

export const ALL_IDEAS: Exercise[] = IDEA_GROUPS.flatMap((g) => g.ideas);
