import { Trash2 } from 'lucide-react';
import { Button, Field, Sheet, TextArea, TextInput } from '@/components/ui';
import type { InfoCard } from '@/lib/types';

/**
 * Éditeur en direct d'une fiche (titre + texte). Partagé par Visage (bien-être) et Esprit (idées).
 * `card` est lu depuis le magasin à chaque rendu ; `onChange` y écrit directement.
 */
export function InfoCardEditor({
  card,
  onClose,
  onChange,
  onDelete,
  heading = 'Modifier la fiche',
}: {
  card: InfoCard | null;
  onClose: () => void;
  onChange: (patch: Partial<InfoCard>) => void;
  onDelete: () => void;
  heading?: string;
}) {
  return (
    <Sheet
      open={!!card}
      onClose={onClose}
      title={heading}
      subtitle="Chaque modification est enregistrée automatiquement."
      footer={
        <>
          <Button variant="danger" onClick={onDelete} className="mr-auto">
            <Trash2 /> Supprimer
          </Button>
          <Button variant="tint" onClick={onClose}>
            Terminé
          </Button>
        </>
      }
    >
      {card && (
        <div className="space-y-4">
          <Field label="Titre">
            <TextInput value={card.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Titre de la fiche" />
          </Field>
          <Field label="Texte">
            <TextArea value={card.body} onChange={(e) => onChange({ body: e.target.value })} minRows={5} placeholder="Ce que tu veux retenir…" />
          </Field>
        </div>
      )}
    </Sheet>
  );
}
