import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, TextInput } from '@/components/ui';
import { addWord } from '@/lib/english';
import { useUpdate } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { cx } from '@/lib/utils';

/** Ajout rapide d'un mot et de sa traduction ; Entrée dans le premier champ passe au second. */
export function AddWordForm({ dateKey, compact, className }: { dateKey: DateKey; compact?: boolean; className?: string }) {
  const update = useUpdate();
  const [en, setEn] = useState('');
  const [fr, setFr] = useState('');
  const enRef = useRef<HTMLInputElement>(null);
  const frRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!en.trim()) {
      enRef.current?.focus();
      return;
    }
    update((d) => void addWord(d, dateKey, en, fr));
    setEn('');
    setFr('');
    enRef.current?.focus();
  };

  return (
    <form
      className={cx('grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]', className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <TextInput
        ref={enRef}
        value={en}
        onChange={(e) => setEn(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && en.trim() && !fr.trim()) {
            e.preventDefault();
            frRef.current?.focus();
          }
        }}
        placeholder="Mot en anglais"
        aria-label="Mot en anglais"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        lang="en"
        className={compact ? 'h-10' : undefined}
      />
      <TextInput
        ref={frRef}
        value={fr}
        onChange={(e) => setFr(e.target.value)}
        placeholder="Traduction en français"
        aria-label="Traduction en français"
        className={compact ? 'h-10' : undefined}
      />
      <Button type="submit" variant="tint" className={compact ? 'h-10' : 'h-11'} disabled={!en.trim()}>
        <Plus /> Ajouter
      </Button>
    </form>
  );
}
