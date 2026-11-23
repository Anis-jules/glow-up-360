import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  ProgressBar,
  ReorderButtons,
  SectionHeader,
  Sheet,
  TextArea,
  TextInput,
} from '@/components/ui';
import { removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { Topic } from '@/lib/types';
import { moveItem, uid } from '@/lib/utils';
import { CategoryChip, CategorySelect, matchCategory } from './shared';

function removeTopic(id: string) {
  removeWithUndo('Sujet supprimé', (d) => void (d.mind.topics = d.mind.topics.filter((t) => t.id !== id)));
}

function TopicEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const t = id ? data.mind.topics.find((x) => x.id === id) : undefined;
  const patch = (fn: (t: Topic) => void) =>
    update((d) => {
      const x = d.mind.topics.find((y) => y.id === id);
      if (x) fn(x);
    });

  return (
    <Sheet
      open={!!t}
      onClose={onClose}
      title={t?.title || 'Nouveau sujet'}
      subtitle="Chaque modification est enregistrée automatiquement."
      icon={<GraduationCap />}
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={() => {
              if (id) removeTopic(id);
              onClose();
            }}
          >
            <Trash2 /> Supprimer
          </Button>
          <Button variant="tint" onClick={onClose}>
            Terminé
          </Button>
        </>
      }
    >
      {t && (
        <div className="space-y-4">
          <Field label="Sujet">
            <TextInput value={t.title} placeholder="Ex. Comprendre la géopolitique de l’énergie" onChange={(e) => patch((x) => void (x.title = e.target.value))} />
          </Field>
          <Field label="Catégorie">
            <CategorySelect value={t.categoryId ?? ''} categories={data.mind.categories} onChange={(v) => patch((x) => void (x.categoryId = v || null))} />
          </Field>
          <Field label="Objectif" hint="À quoi verras-tu que tu as compris ?">
            <TextArea minRows={2} value={t.objective} onChange={(e) => patch((x) => void (x.objective = e.target.value))} />
          </Field>
          <Field label={`Progression : ${t.progress} %`}>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={t.progress}
              onChange={(e) => patch((x) => void (x.progress = Number(e.target.value)))}
              className="h-11 w-full cursor-pointer accent-tint"
            />
          </Field>
          <Field label="Ressources" hint="Livres, cours, chaînes, liens…">
            <TextArea minRows={2} value={t.resources} onChange={(e) => patch((x) => void (x.resources = e.target.value))} />
          </Field>
          <Field label="Notes">
            <TextArea minRows={3} value={t.notes} onChange={(e) => patch((x) => void (x.notes = e.target.value))} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

export function TopicsTab() {
  const data = useData();
  const update = useUpdate();
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const topics = data.mind.topics;
  const shown = topics.filter((t) => matchCategory(cat, t.categoryId));
  const avg = topics.length ? Math.round(topics.reduce((a, t) => a + t.progress, 0) / topics.length) : 0;

  const add = () => {
    const id = uid('t');
    update(
      (d) =>
        void d.mind.topics.push({
          id,
          title: '',
          categoryId: cat && cat !== 'none' ? cat : null,
          objective: '',
          resources: '',
          progress: 0,
          notes: '',
        }),
    );
    setEditId(id);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Sujets d’apprentissage"
        subtitle={topics.length ? `${topics.length} sujet${topics.length > 1 ? 's' : ''} · progression moyenne ${avg} %` : undefined}
        editing={editing}
        onToggleEdit={() => setEditing((e) => !e)}
        onAdd={add}
        addLabel="Sujet"
      />
      <CategorySelect value={cat} onChange={setCat} categories={data.mind.categories} allLabel="Toutes les catégories" className="w-full sm:w-56" />
      {shown.length === 0 ? (
        <EmptyState icon={<GraduationCap />} title="Aucun sujet ici" action={<Button variant="tint" onClick={add}><Plus /> Ajouter un sujet</Button>}>
          Ce que tu veux comprendre ou maîtriser : une langue, l’histoire d’un pays, l’investissement…
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shown.map((t, i) => {
            const idx = topics.indexOf(t);
            return (
              <Card key={t.id} interactive={!editing} onClick={() => !editing && setEditId(t.id)} className="min-w-0 animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{t.title || 'Sujet sans titre'}</div>
                    <CategoryChip id={t.categoryId} className="mt-1.5" />
                  </div>
                  {editing && (
                    <div className="-mt-1 -mr-2 flex shrink-0 items-center">
                      <ReorderButtons index={idx} count={topics.length} onMove={(to) => update((d) => moveItem(d.mind.topics, idx, to))} />
                      <IconButton label="Supprimer" size="icon-sm" onClick={() => removeTopic(t.id)} className="text-danger hover:text-danger">
                        <Trash2 />
                      </IconButton>
                    </div>
                  )}
                </div>
                {t.objective && <p className="mt-2 line-clamp-2 text-[13px] text-ink-2">{t.objective}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={t.progress / 100} height={6} />
                  <span className="shrink-0 text-xs font-medium text-ink-2 tabular">{t.progress} %</span>
                </div>
                {editing && (
                  <Button size="xs" variant="secondary" className="mt-3" onClick={() => setEditId(t.id)}>
                    Modifier
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <TopicEditor id={editId} onClose={() => setEditId(null)} />
    </div>
  );
}
