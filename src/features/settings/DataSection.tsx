import {
  ArchiveRestore,
  Database,
  Download,
  FileJson,
  HardDrive,
  History,
  RotateCcw,
  ShieldAlert,
  Trash2,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Card, Checkbox, Chip, Field, IconButton, SectionHeader, Sheet, TextInput } from '@/components/ui';
import {
  defaultFace,
  defaultHabits,
  defaultMind,
  defaultNutrition,
  defaultReminders,
  defaultSettings,
  defaultSport,
  createDefaultData,
} from '@/lib/defaults';
import { formatLong, useToday } from '@/lib/dates';
import { confirm, toast } from '@/lib/feedback';
import { isStandalone, requestPersistentStorage } from '@/lib/pwa';
import { looksLikeAppData, normalizeData, STORAGE_KEY, useApp, useData } from '@/lib/store';
import type { AppData, PlannedMeal } from '@/lib/types';
import { cx } from '@/lib/utils';
import { downloadText } from '../reminders/ics';
import { BACKUP_KEY, createBackup, deleteBackup, formatBytes, restoreBackup, useBackups } from './backups';

const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

function volumes(d: AppData): [string, number][] {
  return [
    ['Séances de sport', d.sport.workouts.length],
    ['Séances enregistrées', Object.keys(d.sport.log).length],
    ['Recettes', d.nutrition.recipes.length],
    ['Habitudes', d.habits.items.length],
    ['Rappels', d.reminders.items.length],
    ['Livres', d.mind.books.length],
    ['Notes du journal', d.mind.journal.length],
    ['Jours d’historique', Object.keys(d.history).length],
  ];
}

function SubCard({ icon, title, subtitle, children, delay = 0 }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode; delay?: number }) {
  return (
    <Card className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <SectionHeader icon={icon} title={title} subtitle={subtitle} />
      {children}
    </Card>
  );
}

// ───────────────────────── Export / import

function ExportImport() {
  const data = useData();
  const replaceAll = useApp((s) => s.replaceAll);
  const today = useToday();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ fileName: string; exportedAt?: string; data: AppData } | null>(null);

  const exportData = () => {
    const payload = { app: 'Glow Up 360°', format: 1, exportedAt: new Date().toISOString(), data };
    downloadText(`glowup360-sauvegarde-${today}.json`, JSON.stringify(payload, null, 2), 'application/json');
    toast('Sauvegarde téléchargée', { tone: 'success' });
  };

  const onFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const wrapped = parsed && typeof parsed === 'object' && 'data' in parsed ? (parsed as { data: unknown; exportedAt?: string }) : null;
      const candidate = wrapped && looksLikeAppData(wrapped.data) ? wrapped.data : parsed;
      if (!looksLikeAppData(candidate)) {
        toast('Ce fichier n’est pas une sauvegarde Glow Up 360°.', { tone: 'error' });
        return;
      }
      setPending({ fileName: file.name, exportedAt: wrapped?.exportedAt, data: normalizeData(candidate) });
    } catch {
      toast('Fichier illisible : choisis le fichier .json exporté depuis l’application.', { tone: 'error' });
    }
  };

  const doImport = () => {
    if (!pending) return;
    const point = createBackup('Avant import', false);
    replaceAll(pending.data);
    setPending(null);
    toast(point ? 'Sauvegarde importée. L’état précédent reste dans les points de restauration.' : 'Sauvegarde importée.', {
      tone: 'success',
      duration: 5000,
    });
  };

  return (
    <SubCard icon={<FileJson />} title="Exporter et importer" subtitle="Un fichier pour garder ou transférer tes données">
      <p className="text-sm text-ink-2">
        L’export crée un fichier .json avec toutes tes données. Garde-le en lieu sûr (Fichiers, iCloud Drive, Google Drive, e-mail) ou
        importe-le sur un autre appareil pour y retrouver ton espace.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="tint" onClick={exportData}>
          <Download /> Exporter mes données
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          <Upload /> Importer une sauvegarde
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Importer cette sauvegarde ?"
        subtitle={pending?.fileName}
        icon={<Upload />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Annuler
            </Button>
            <Button variant="tint" onClick={doImport}>
              Importer et remplacer
            </Button>
          </>
        }
      >
        {pending && (
          <div className="space-y-4">
            <div className="text-sm text-ink-2">
              {pending.exportedAt && <>Exportée le {dateTimeFmt.format(new Date(pending.exportedAt))}. </>}
              Espace commencé le {formatLong(pending.data.createdAt, true)}
              {pending.data.settings.name ? <>, au nom de {pending.data.settings.name}</> : null}.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {volumes(pending.data).map(([label, n]) => (
                <div key={label} className="rounded-xl bg-surface-2 px-3 py-2.5">
                  <div className="font-display text-lg font-semibold tabular">{n}</div>
                  <div className="text-xs text-ink-3">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2.5 rounded-2xl bg-tint/10 p-3.5 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-tint" />
              <p>
                Toutes les données actuelles de cet appareil seront remplacées. Un point de restauration de l’état actuel est créé juste
                avant : tu pourras revenir en arrière.
              </p>
            </div>
          </div>
        )}
      </Sheet>
    </SubCard>
  );
}

// ───────────────────────── Points de restauration

function RestorePoints() {
  const backups = useBackups();

  const create = () => {
    const b = createBackup('Point manuel', false);
    toast(b ? 'Point de restauration créé' : 'Plus assez de place sur l’appareil pour créer ce point.', { tone: b ? 'success' : 'error' });
  };

  return (
    <SubCard icon={<History />} title="Points de restauration" subtitle="Une copie automatique par jour, 7 jours" delay={60}>
      <p className="text-sm text-ink-2">
        L’application garde chaque jour une copie de tes données sur cet appareil (les 7 derniers jours), plus jusqu’à 5 points créés
        par toi ou avant un import, une restauration ou une réinitialisation.
      </p>
      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={create}>
          <ArchiveRestore /> Créer un point maintenant
        </Button>
      </div>
      {backups.length === 0 ? (
        <p className="mt-4 text-sm text-ink-3">Aucun point pour l’instant : le premier est créé automatiquement quelques secondes après l’ouverture.</p>
      ) : (
        <ul className="mt-4 -mx-2 divide-y divide-line">
          {backups.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-2 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate text-[15px] font-medium">{b.label}</span>
                  {b.auto && <Chip>Auto</Chip>}
                </div>
                <div className="truncate text-[13px] text-ink-3 first-letter:uppercase">
                  {dateTimeFmt.format(new Date(b.createdAt))} · {formatBytes(b.size)}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-tint hover:text-tint"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Restaurer ce point ?',
                    message: `Tes données actuelles seront remplacées par celles du ${dateTimeFmt.format(new Date(b.createdAt))}. Un point « Avant restauration » est créé juste avant, au cas où.`,
                    confirmLabel: 'Restaurer',
                  });
                  if (!ok) return;
                  toast(restoreBackup(b.id) ? 'Données restaurées' : 'Ce point est introuvable.', { tone: 'success' });
                }}
              >
                <RotateCcw /> <span className="max-sm:sr-only">Restaurer</span>
              </Button>
              <IconButton
                label="Supprimer ce point"
                size="icon-sm"
                onClick={async () => {
                  const ok = await confirm({ title: 'Supprimer ce point de restauration ?', confirmLabel: 'Supprimer', danger: true });
                  if (ok) deleteBackup(b.id);
                }}
              >
                <Trash2 />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </SubCard>
  );
}

// ───────────────────────── Stockage

function StorageInfo() {
  const savedAt = useApp((s) => s.savedAt);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number } | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        if (navigator.storage?.persisted) {
          const p = await navigator.storage.persisted();
          if (alive) setPersisted(p);
        }
        if (navigator.storage?.estimate) {
          const e = await navigator.storage.estimate();
          if (alive) setEstimate({ usage: e.usage, quota: e.quota });
        }
      } catch {
        /* non disponible */
      }
    })();
    return () => {
      alive = false;
    };
  }, [savedAt]);

  const size = (key: string) => {
    try {
      return (localStorage.getItem(key) ?? '').length;
    } catch {
      return 0;
    }
  };

  const protect = async () => {
    const res = await requestPersistentStorage();
    setPersisted(res);
    if (res === true) toast('Le navigateur protège désormais tes données.', { tone: 'success' });
    else if (res === false)
      toast('Le navigateur n’a pas accordé cette protection. Pense à exporter tes données régulièrement.', { duration: 6000 });
    else toast('Cette option n’existe pas sur ce navigateur.');
  };

  return (
    <SubCard icon={<HardDrive />} title="Stockage" subtitle="Où vivent tes données" delay={120}>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <div className="font-display text-lg font-semibold tabular">≈ {formatBytes(size(STORAGE_KEY))}</div>
          <div className="text-xs text-ink-3">Tes données</div>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <div className="font-display text-lg font-semibold tabular">≈ {formatBytes(size(BACKUP_KEY))}</div>
          <div className="text-xs text-ink-3">Points de restauration</div>
        </div>
      </div>
      {estimate?.quota ? (
        <p className="mt-2 text-xs text-ink-3">
          Espace utilisé par le site : {formatBytes(estimate.usage ?? 0)} sur {formatBytes(estimate.quota)} disponibles.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip tone={persisted ? 'success' : 'neutral'}>
          {persisted === null ? 'Protection : inconnue' : persisted ? 'Stockage protégé' : 'Stockage non protégé'}
        </Chip>
        {persisted !== true && (
          <Button size="sm" variant="secondary" onClick={protect}>
            <ShieldAlert /> Protéger mes données
          </Button>
        )}
      </div>

      <ul className="mt-4 space-y-2 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-ink-2">
        <li>
          • Tes données sont enregistrées <strong className="text-ink">sur cet appareil, dans ce navigateur</strong>, après chaque
          modification. Aucune donnée n’est envoyée sur internet.
        </li>
        <li>
          • Pas de synchronisation automatique entre ton téléphone et ton ordinateur : elle demanderait un service en ligne (une base de
          données avec compte). Pour passer d’un appareil à l’autre, exporte puis importe.
        </li>
        <li>
          • Safari peut effacer les données d’un site non ouvert pendant 7 jours,{' '}
          {isStandalone() ? 'mais ton app est installée sur l’écran d’accueil : elle est épargnée.' : 'sauf si l’app est ajoutée à l’écran d’accueil.'}
        </li>
        <li>• Vider l’historique ou les « données de site » du navigateur efface aussi Glow Up 360°. Exporte régulièrement.</li>
      </ul>
    </SubCard>
  );
}

// ───────────────────────── Réinitialisation

type ResetId = 'sport' | 'nutrition' | 'face' | 'mind' | 'habits' | 'reminders' | 'motivations' | 'appearance';

const RESET_OPTIONS: { id: ResetId; label: string; detail: string }[] = [
  { id: 'sport', label: 'Sport', detail: 'Séances d’origine, planning de la semaine, phases du programme 30 jours (qui redémarre aujourd’hui)' },
  { id: 'nutrition', label: 'Nutrition', detail: 'Créneaux et planning des repas, aliments recommandés et recettes d’origine, repères' },
  { id: 'face', label: 'Visage', detail: 'Routines matin et soir, guide de massage, conseils mâchoire et posture' },
  { id: 'mind', label: 'Esprit', detail: 'Objectifs quotidiens (lecture, apprentissage…) et idées de logique et de mémoire' },
  { id: 'habits', label: 'Habitudes', detail: 'Habitudes d’origine' },
  { id: 'reminders', label: 'Rappels', detail: 'Rappels d’origine et leurs horaires' },
  { id: 'motivations', label: 'Messages de motivation', detail: 'Messages d’origine' },
  { id: 'appearance', label: 'Apparence et réglages', detail: 'Thème, couleurs, cartes du tableau de bord, seuil de réussite, jokers, sons' },
];

/** Éléments d'origine remis à neuf, éléments créés par l'utilisateur conservés à la suite. */
function restoreList<T extends { id: string }>(current: T[], defaults: T[]): T[] {
  const ids = new Set(defaults.map((d) => d.id));
  return [...defaults, ...current.filter((c) => !ids.has(c.id))];
}

function applyReset(d: AppData, ids: Set<ResetId>) {
  if (ids.has('sport')) {
    const def = defaultSport();
    d.sport.workouts = restoreList(d.sport.workouts, def.workouts);
    d.sport.week = def.week;
    d.sport.progression = def.progression;
  }
  if (ids.has('nutrition')) {
    const def = defaultNutrition();
    const defSlotIds = new Set(def.slots.map((s) => s.id));
    const customSlots = d.nutrition.slots.filter((s) => !defSlotIds.has(s.id));
    d.nutrition.slots = [...def.slots, ...customSlots];
    d.nutrition.plan = def.plan.map((day, i) => {
      const next: Record<string, PlannedMeal> = { ...day };
      for (const s of customSlots) {
        const kept = d.nutrition.plan[i]?.[s.id];
        if (kept) next[s.id] = kept;
      }
      return next;
    });
    d.nutrition.foods = restoreList(d.nutrition.foods, def.foods);
    d.nutrition.recipes = restoreList(d.nutrition.recipes, def.recipes);
    d.nutrition.principles = def.principles;
  }
  if (ids.has('face')) {
    const def = defaultFace();
    d.face.routines = restoreList(d.face.routines, def.routines);
    d.face.massage = restoreList(d.face.massage, def.massage);
    d.face.wellbeing = restoreList(d.face.wellbeing, def.wellbeing);
  }
  if (ids.has('mind')) {
    const def = defaultMind();
    d.mind.goals = restoreList(d.mind.goals, def.goals);
    d.mind.practices = restoreList(d.mind.practices, def.practices);
  }
  if (ids.has('habits')) d.habits.items = restoreList(d.habits.items, defaultHabits().items);
  if (ids.has('reminders')) d.reminders.items = restoreList(d.reminders.items, defaultReminders().items);
  const defSettings = defaultSettings();
  if (ids.has('motivations')) {
    const defs = defSettings.motivations;
    d.settings.motivations = [...defs, ...d.settings.motivations.filter((m) => m.trim() && !defs.includes(m))];
  }
  if (ids.has('appearance')) {
    const { name, motivations, notificationsEnabled } = d.settings;
    d.settings = { ...defSettings, name, motivations, notificationsEnabled };
  }
}

function ResetProgram() {
  const update = useApp((s) => s.update);
  const [selected, setSelected] = useState<Set<ResetId>>(new Set());
  const toggle = (id: ResetId, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const run = async () => {
    const labels = RESET_OPTIONS.filter((o) => selected.has(o.id)).map((o) => o.label);
    const ok = await confirm({
      title: 'Réinitialiser le programme initial ?',
      message: `Remis à l’état d’origine : ${labels.join(', ')}. Ce que tu as créé toi-même dans ces rubriques est conservé, tout comme ton historique, tes statistiques, tes livres, ton journal, tes produits et ta liste de courses. Un point de restauration est créé juste avant.`,
      confirmLabel: 'Réinitialiser',
    });
    if (!ok) return;
    createBackup('Avant réinitialisation', false);
    update((d) => applyReset(d, selected));
    setSelected(new Set());
    toast('Programme initial restauré', { tone: 'success' });
  };

  return (
    <SubCard icon={<RotateCcw />} title="Réinitialiser le programme initial" subtitle="Sans toucher à tes données personnelles" delay={180}>
      <p className="text-sm text-ink-2">
        Choisis ce qui doit retrouver son contenu d’origine. Les éléments d’origine reviennent dans leur version initiale (même si tu les
        avais supprimés) ; ceux que tu as ajoutés toi-même restent à leur place.
      </p>
      <div className="mt-3 -mx-2">
        {RESET_OPTIONS.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-ink/[0.03]">
            <Checkbox checked={selected.has(o.id)} onChange={(v) => toggle(o.id, v)} label={o.label} size="sm" className="mt-0.5" />
            <span className="min-w-0">
              <span className="block text-[15px] font-medium">{o.label}</span>
              <span className="block text-[13px] text-ink-3">{o.detail}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-surface-2 p-3.5 text-[13px] leading-relaxed text-ink-2">
        <strong className="text-ink">Toujours conservés :</strong> historique et statistiques, exercices validés, repas suivis, eau, minutes
        d’apprentissage, routines cochées, livres, sujets, journal de connaissances, catégories, produits de skincare, liste de courses,
        ton prénom.
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="tint" disabled={selected.size === 0} onClick={run}>
          <RotateCcw /> Réinitialiser la sélection
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setSelected(selected.size === RESET_OPTIONS.length ? new Set() : new Set(RESET_OPTIONS.map((o) => o.id)))}>
          {selected.size === RESET_OPTIONS.length ? 'Tout décocher' : 'Tout cocher'}
        </Button>
      </div>
    </SubCard>
  );
}

// ───────────────────────── Tout effacer

function EraseAll() {
  const replaceAll = useApp((s) => s.replaceAll);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [withBackups, setWithBackups] = useState(false);
  const ready = text.trim().toUpperCase() === 'EFFACER';

  const erase = () => {
    if (!ready) return;
    if (withBackups) {
      try {
        localStorage.removeItem(BACKUP_KEY);
        window.dispatchEvent(new Event('glowup360-backups-changed'));
      } catch {
        /* rien */
      }
    } else {
      createBackup('Avant effacement complet', false);
    }
    replaceAll(createDefaultData());
    setOpen(false);
    setText('');
    toast(withBackups ? 'Toutes les données ont été effacées.' : 'Données effacées. Un point de restauration a été gardé.', { tone: 'success' });
  };

  return (
    <Card className="animate-rise border-danger/30" style={{ animationDelay: '240ms' }}>
      <SectionHeader icon={<Database />} title="Zone sensible" subtitle="Repartir d’une page blanche" />
      <p className="text-sm text-ink-2">
        Efface toutes tes données et remet l’application dans son état de départ, avec le programme initial.
      </p>
      <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
        <Trash2 /> Tout effacer
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="Tout effacer ?"
        icon={<TriangleAlert />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" disabled={!ready} onClick={erase} className={cx(ready && 'bg-danger text-white hover:bg-danger')}>
              Effacer définitivement
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed text-ink-2">
            Historique, séances, repas, routines, livres, journal, réglages : tout sera remis à zéro sur cet appareil.
          </p>
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox checked={withBackups} onChange={setWithBackups} label="Supprimer aussi les points de restauration" size="sm" className="mt-0.5" />
            <span className="text-sm">
              Supprimer aussi les points de restauration
              <span className="block text-xs text-ink-3">
                {withBackups ? 'Aucun retour en arrière ne sera possible.' : 'Sinon, un point est gardé : tu pourras revenir en arrière.'}
              </span>
            </span>
          </label>
          <Field label="Pour confirmer, écris EFFACER">
            <TextInput value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoCapitalize="characters" placeholder="EFFACER" />
          </Field>
        </div>
      </Sheet>
    </Card>
  );
}

export function DataSection() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <ExportImport />
        <RestorePoints />
      </div>
      <div className="space-y-4">
        <StorageInfo />
        <ResetProgram />
        <EraseAll />
      </div>
    </div>
  );
}
