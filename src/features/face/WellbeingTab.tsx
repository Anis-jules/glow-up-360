import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, EmptyState, IconButton, ReorderButtons, SectionHeader } from '@/components/ui';
import { removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import { moveItem, uid } from '@/lib/utils';
import { HonestyNotice } from './HonestyNotice';
import { InfoCardEditor } from './InfoCardEditor';

export function WellbeingTab() {
  const data = useData();
  const update = useUpdate();
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const cards = data.face.wellbeing;
  const current = editId ? cards.find((c) => c.id === editId) ?? null : null;

  const add = () => {
    const id = uid('wb');
    update((d) => void d.face.wellbeing.push({ id, title: 'Nouvelle fiche', body: '' }));
    setEditId(id);
  };
  const remove = (id: string) =>
    removeWithUndo('Fiche supprimée', (d) => void (d.face.wellbeing = d.face.wellbeing.filter((c) => c.id !== id)));

  return (
    <div className="space-y-6">
      <HonestyNotice className="animate-rise" />
      <section>
        <SectionHeader
          title="Mâchoire, posture et bien-être facial"
          subtitle="Des repères simples et réalistes."
          editing={editing}
          onToggleEdit={() => setEditing((e) => !e)}
          onAdd={add}
          addLabel="Fiche"
        />
        {cards.length === 0 ? (
          <EmptyState title="Aucune fiche" action={<Button variant="tint" onClick={add}><Plus /> Ajouter une fiche</Button>}>
            Ajoute tes propres repères de posture et de bien-être.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cards.map((c, i) => (
              <Card key={c.id} className="flex animate-rise flex-col" style={{ animationDelay: `${60 + i * 40}ms` }}>
                <div className="flex items-start gap-2">
                  <h3 className="min-w-0 flex-1 text-[16px] font-semibold">{c.title || 'Sans titre'}</h3>
                  {editing ? (
                    <div className="-mt-1 -mr-2 flex items-center">
                      <ReorderButtons index={i} count={cards.length} onMove={(to) => update((d) => moveItem(d.face.wellbeing, i, to))} />
                      <IconButton label="Modifier" size="icon-sm" onClick={() => setEditId(c.id)}>
                        <Pencil />
                      </IconButton>
                      <IconButton label="Supprimer" size="icon-sm" onClick={() => remove(c.id)} className="text-danger hover:text-danger">
                        <Trash2 />
                      </IconButton>
                    </div>
                  ) : (
                    <IconButton label="Modifier" size="icon-sm" onClick={() => setEditId(c.id)} className="-mt-1 -mr-2 opacity-60 hover:opacity-100">
                      <Pencil />
                    </IconButton>
                  )}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">{c.body}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
      <InfoCardEditor
        card={current}
        onClose={() => setEditId(null)}
        onChange={(p) =>
          update((d) => {
            const c = d.face.wellbeing.find((x) => x.id === editId);
            if (c) Object.assign(c, p);
          })
        }
        onDelete={() => {
          if (editId) remove(editId);
          setEditId(null);
        }}
      />
    </div>
  );
}
