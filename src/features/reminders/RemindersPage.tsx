import {
  Bell,
  BellOff,
  BellRing,
  CalendarPlus,
  ChevronRight,
  Info,
  Plus,
  Send,
  Smartphone,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Button,
  Card,
  Chip,
  DayPicker,
  EmptyState,
  Field,
  ModuleScope,
  SectionHeader,
  Select,
  Sheet,
  TextArea,
  TextInput,
  TimeField,
  Toggle,
} from '@/components/ui';
import { ALL_DAYS, nowMinutes, timeToMinutes, useToday, weekdayOf } from '@/lib/dates';
import { removeWithUndo, toast } from '@/lib/feedback';
import { isStandalone } from '@/lib/pwa';
import { useData, useUpdate } from '@/lib/store';
import type { Reminder, Weekday } from '@/lib/types';
import { cx, uid } from '@/lib/utils';
import { buildIcs, downloadText } from './ics';
import { notificationState, requestNotificationPermission, showSystemNotification, type NotifState } from './notify';
import {
  daysSummary,
  isQuotidien,
  moduleColor,
  moduleLabel,
  nextOccurrence,
  REMINDER_MODULES,
  sortByTime,
  type ReminderModule,
} from './reminderUtils';

/** Minutes actuelles, rafraîchies chaque minute. */
function useNowMinutes(): number {
  const [now, setNow] = useState(nowMinutes);
  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMinutes()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

const STATE_META: Record<NotifState, { label: string; tone: 'neutral' | 'success' | 'danger' | 'tint' }> = {
  unsupported: { label: 'Non prises en charge', tone: 'neutral' },
  insecure: { label: 'Adresse non sécurisée', tone: 'danger' },
  default: { label: 'Pas encore autorisées', tone: 'neutral' },
  granted: { label: 'Autorisées', tone: 'success' },
  denied: { label: 'Refusées', tone: 'danger' },
};

function NotificationsCard() {
  const { settings } = useData();
  const update = useUpdate();
  const [state, setState] = useState<NotifState>(notificationState);
  const [showLimits, setShowLimits] = useState(false);
  const standalone = isStandalone();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const refresh = () => setState(notificationState());
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

  const enable = async () => {
    const next = await requestNotificationPermission();
    setState(next);
    if (next === 'granted') {
      update((d) => void (d.settings.notificationsEnabled = true));
      toast('Notifications activées', { tone: 'success' });
    } else if (next === 'denied') {
      toast('Notifications refusées par le navigateur', { tone: 'error' });
    }
  };

  const test = async () => {
    const ok = await showSystemNotification('Glow Up 360°', 'Les notifications fonctionnent sur cet appareil.', '#/rappels', 'glowup-test');
    if (!ok) toast('La notification n’a pas pu être affichée sur cet appareil.', { tone: 'error' });
  };

  const meta = STATE_META[state];
  const active = settings.notificationsEnabled && state === 'granted';

  return (
    <Card className="animate-rise">
      <div className="flex items-start gap-3">
        <div className={cx('grid size-11 shrink-0 place-items-center rounded-2xl', active ? 'bg-tint text-tint-ink' : 'bg-tint/12 text-tint')}>
          {active ? <BellRing className="size-5" /> : state === 'denied' ? <BellOff className="size-5" /> : <Bell className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-semibold">Notifications</h2>
            <Chip tone={meta.tone}>{meta.label}</Chip>
          </div>
          <p className="mt-1 text-sm text-ink-2">
            {state === 'granted'
              ? 'Glow Up 360° peut t’envoyer une notification à l’heure de chaque rappel, tant que l’application est ouverte.'
              : state === 'denied'
                ? 'Tu as refusé les notifications. Pour changer d’avis, autorise-les dans les réglages du site de ton navigateur (icône à gauche de l’adresse), puis reviens ici.'
                : state === 'insecure'
                  ? 'Les notifications exigent une adresse sécurisée (https, ou localhost sur ton ordinateur). Les alertes dans l’application, elles, fonctionnent.'
                  : state === 'unsupported'
                    ? isIOS && !standalone
                      ? 'Sur iPhone et iPad, les notifications web n’existent que pour une app ajoutée à l’écran d’accueil (iOS 16.4 ou plus récent).'
                      : 'Ce navigateur ne propose pas les notifications web. Les alertes dans l’application fonctionnent.'
                    : 'Autorise les notifications pour être prévenu à l’heure de tes rappels.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {state === 'default' && (
          <Button variant="tint" onClick={enable}>
            <Bell /> Activer les notifications
          </Button>
        )}
        {state === 'granted' && (
          <Button variant="secondary" onClick={test}>
            <Send /> Tester une notification
          </Button>
        )}
      </div>

      <div className="mt-4 divide-y divide-line border-t border-line">
        <Toggle
          className="py-3"
          label="Notifications système"
          description={state === 'granted' ? 'Bannière de l’appareil à l’heure du rappel' : 'Nécessite l’autorisation du navigateur'}
          checked={settings.notificationsEnabled}
          onChange={(v) => {
            if (v && state === 'default') {
              void enable();
              return;
            }
            update((d) => void (d.settings.notificationsEnabled = v));
          }}
        />
        <Toggle
          className="py-3"
          label="Alertes dans l’application"
          description="Message et son discret quand l’app est à l’écran"
          checked={settings.inAppAlerts}
          onChange={(v) => update((d) => void (d.settings.inAppAlerts = v))}
        />
        <Toggle
          className="py-3"
          label="Sons"
          description="Pour les rappels et la fin des minuteurs"
          checked={settings.sounds}
          onChange={(v) => update((d) => void (d.settings.sounds = v))}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowLimits((v) => !v)}
        className="mt-2 flex w-full items-center gap-2 rounded-xl py-2 text-left text-sm font-medium text-ink-2 hover:text-ink"
        aria-expanded={showLimits}
      >
        <Info className="size-4 text-tint" />
        Ce qu’il faut savoir sur les notifications
        <ChevronRight className={cx('ml-auto size-4 transition-transform', showLimits && 'rotate-90')} />
      </button>
      {showLimits && (
        <ul className="mt-1 animate-fade-in space-y-2.5 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-ink-2">
          <li>
            <strong className="text-ink">L’application doit être ouverte.</strong> Sur ordinateur, un onglet ouvert suffit, même en
            arrière-plan. Sur téléphone, l’app doit être ouverte (ou tout juste mise en arrière-plan).
          </li>
          <li>
            <strong className="text-ink">Sur iPhone et iPad</strong> : ouvre Glow Up 360° dans Safari, touche Partager puis « Sur
            l’écran d’accueil ». Lance l’app depuis cette icône (iOS 16.4 ou plus récent) et active les notifications ici.
          </li>
          <li>
            <strong className="text-ink">Application fermée</strong> : aucune notification ne peut partir. Il faudrait un serveur
            d’envoi (Web Push), qui n’est pas inclus dans cette version.
          </li>
          <li>
            <strong className="text-ink">La solution fiable app fermée</strong> : ajoute tes rappels à l’agenda de ton téléphone
            (carte ci-dessous). C’est l’agenda qui t’alertera.
          </li>
        </ul>
      )}
    </Card>
  );
}

function CalendarExportCard({ reminders }: { reminders: Reminder[] }) {
  const today = useToday();
  const active = reminders.filter((r) => r.enabled && r.days.length);
  const exportIcs = () => {
    if (!active.length) {
      toast('Aucun rappel actif à exporter.');
      return;
    }
    downloadText('glowup360-rappels.ics', buildIcs(active, today), 'text/calendar;charset=utf-8');
    toast(`${active.length} rappel${active.length > 1 ? 's' : ''} exporté${active.length > 1 ? 's' : ''} vers ton agenda`, { tone: 'success' });
  };
  return (
    <Card className="animate-rise" style={{ animationDelay: '60ms' }}>
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-tint/12 text-tint">
          <CalendarPlus className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold">Ajouter à mon agenda</h2>
          <p className="mt-1 text-sm text-ink-2">
            Télécharge tes {active.length} rappels actifs dans un fichier agenda (.ics) à ouvrir avec Calendrier, Google Agenda ou
            Outlook. Ton téléphone t’alertera alors même quand Glow Up 360° est fermé.
          </p>
          <p className="mt-2 text-xs text-ink-3">
            Conseil : importe-les dans un calendrier dédié « Glow Up 360° ». Si tu modifies tes rappels ensuite, supprime ce calendrier
            et importe le nouveau fichier : l’agenda ne se met pas à jour tout seul.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <Button variant="tint" onClick={exportIcs}>
          <CalendarPlus /> Télécharger le fichier agenda
        </Button>
      </div>
    </Card>
  );
}

function TodayTimeline({ reminders, onOpen }: { reminders: Reminder[]; onOpen: (id: string) => void }) {
  const today = useToday();
  const now = useNowMinutes();
  const wd = weekdayOf(today);
  const items = sortByTime(reminders.filter((r) => r.enabled && r.days.includes(wd)));
  const nextIndex = items.findIndex((r) => timeToMinutes(r.time) > now);

  return (
    <Card className="animate-rise" style={{ animationDelay: '120ms' }}>
      <SectionHeader title="Aujourd’hui" subtitle={items.length ? `${items.length} rappels prévus` : 'Aucun rappel prévu'} />
      {items.length === 0 ? (
        <p className="text-sm text-ink-3">Rien de prévu aujourd’hui. Profite.</p>
      ) : (
        <ol className="relative ml-1.5 border-l border-line">
          {items.map((r, i) => {
            const past = timeToMinutes(r.time) <= now;
            const next = i === nextIndex;
            return (
              <li key={r.id} className="relative pb-3 pl-5 last:pb-0">
                <span
                  className={cx(
                    'absolute top-1.5 -left-[5px] size-2.5 rounded-full ring-4 ring-surface',
                    past ? 'bg-ink/20' : next ? 'bg-tint' : 'bg-ink/35',
                  )}
                />
                <button
                  type="button"
                  onClick={() => onOpen(r.id)}
                  className={cx('flex w-full items-baseline gap-3 rounded-lg text-left', past && 'opacity-50')}
                >
                  <span className="w-12 shrink-0 font-display text-[15px] font-semibold tabular">{r.time}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px]">{r.title}</span>
                  {next && <Chip tone="tint">Prochain</Chip>}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function ReminderRow({ r, onOpen }: { r: Reminder; onOpen: () => void }) {
  const update = useUpdate();
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-ink/[0.03]">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={cx('w-14 shrink-0 font-display text-lg font-semibold tabular', !r.enabled && 'text-ink-3')}>{r.time}</span>
        <span className="min-w-0 flex-1">
          <span className={cx('block truncate text-[15px] font-medium', !r.enabled && 'text-ink-3')}>{r.title}</span>
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-ink-3">
            <span className="size-2 shrink-0 rounded-full" style={{ background: moduleColor(r.module) }} />
            <span className="min-w-0 truncate">
              {moduleLabel(r.module)} · {daysSummary(r.days)}
            </span>
          </span>
        </span>
      </button>
      <Toggle
        checked={r.enabled}
        onChange={(v) =>
          update((d) => {
            const x = d.reminders.items.find((i) => i.id === r.id);
            if (x) x.enabled = v;
          })
        }
      />
    </div>
  );
}

function ReminderSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const now = useNowMinutes();
  const r = data.reminders.items.find((x) => x.id === id) ?? null;

  const patch = (fn: (x: Reminder) => void) =>
    update((d) => {
      const x = d.reminders.items.find((i) => i.id === id);
      if (x) fn(x);
    });

  const next = r ? nextOccurrence(r, today, now) : null;

  return (
    <Sheet
      open={!!r}
      onClose={onClose}
      title={r?.title || 'Rappel'}
      subtitle={r ? `${r.time} · ${daysSummary(r.days)}` : undefined}
      icon={<Bell />}
      footer={
        r && (
          <>
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                const rid = r.id;
                onClose();
                removeWithUndo('Rappel supprimé', (d) => {
                  d.reminders.items = d.reminders.items.filter((x) => x.id !== rid);
                  delete d.reminders.fired[rid];
                });
              }}
            >
              <Trash2 /> Supprimer
            </Button>
            <Button variant="tint" onClick={onClose}>
              Fermer
            </Button>
          </>
        )
      }
    >
      {r && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-2 p-4 text-sm">
            {r.enabled ? (
              next ? (
                <>
                  Prochain rappel : <strong>{next}</strong>
                </>
              ) : (
                'Aucun jour sélectionné : ce rappel ne se déclenchera pas.'
              )
            ) : (
              'Ce rappel est désactivé.'
            )}
            <div className="mt-1 text-xs text-ink-3">
              {isQuotidien(r.days) ? 'Rappel quotidien' : r.days.length ? 'Rappel hebdomadaire' : 'Aucune répétition'} · Toute
              modification est enregistrée immédiatement.
            </div>
          </div>
          <Toggle label="Rappel actif" checked={r.enabled} onChange={(v) => patch((x) => void (x.enabled = v))} />
          <Field label="Titre">
            <TextInput value={r.title} onChange={(e) => patch((x) => void (x.title = e.target.value))} placeholder="Ex. : Séance de sport" />
          </Field>
          <Field label="Détails" hint="Affichés dans la notification">
            <TextArea
              value={r.description}
              minRows={2}
              onChange={(e) => patch((x) => void (x.description = e.target.value))}
              placeholder="Ce qu’il faut faire à ce moment-là"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Heure">
              <TimeField value={r.time} onChange={(v) => v && patch((x) => void (x.time = v))} />
            </Field>
            <Field label="Rubrique">
              <Select value={r.module} onChange={(e) => patch((x) => void (x.module = e.target.value as ReminderModule))}>
                {REMINDER_MODULES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Jours" hint="Tous les jours = rappel quotidien ; quelques jours = rappel hebdomadaire.">
            <DayPicker value={r.days} onChange={(v: Weekday[]) => patch((x) => void (x.days = v))} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

export default function RemindersPage() {
  const data = useData();
  const update = useUpdate();
  const [openId, setOpenId] = useState<string | null>(null);
  const reminders = useMemo(() => sortByTime(data.reminders.items), [data.reminders.items]);

  const add = () => {
    const h = (new Date().getHours() + 1) % 24;
    const id = uid('rm');
    update((d) => {
      d.reminders.items.push({
        id,
        title: 'Nouveau rappel',
        description: '',
        time: `${String(h).padStart(2, '0')}:00`,
        days: [...ALL_DAYS],
        enabled: true,
        module: 'general',
      });
    });
    setOpenId(id);
  };

  const activeCount = reminders.filter((r) => r.enabled).length;

  return (
    <ModuleScope>
      <PageHeader
        icon={<Bell />}
        eyebrow="Rappels et notifications"
        title="Rappels"
        subtitle={`${activeCount} actif${activeCount > 1 ? 's' : ''} sur ${reminders.length}`}
        actions={
          <Button variant="tint" onClick={add}>
            <Plus /> Nouveau rappel
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <Card className="animate-rise">
            <SectionHeader title="Tous mes rappels" subtitle="Touche un rappel pour le modifier" onAdd={add} />
            {reminders.length === 0 ? (
              <EmptyState icon={<Bell />} title="Aucun rappel" action={<Button variant="tint" onClick={add}>Créer un rappel</Button>}>
                Crée des rappels quotidiens ou hebdomadaires : réveil, repas, séance, routine, lecture…
              </EmptyState>
            ) : (
              <div className="-mx-2 divide-y divide-line">
                {reminders.map((r) => (
                  <ReminderRow key={r.id} r={r} onOpen={() => setOpenId(r.id)} />
                ))}
              </div>
            )}
          </Card>
          <TodayTimeline reminders={reminders} onOpen={setOpenId} />
        </div>
        <div className="space-y-4">
          <NotificationsCard />
          <CalendarExportCard reminders={reminders} />
          {!isStandalone() && (
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-line p-4 text-sm text-ink-2">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-tint" />
              <p>
                Sur téléphone, ajoute Glow Up 360° à l’écran d’accueil depuis le menu du navigateur : l’app s’ouvre alors en plein écran,
                comme une application installée.
              </p>
            </div>
          )}
          {typeof window !== 'undefined' && !window.isSecureContext && (
            <div className="flex items-start gap-3 rounded-2xl bg-danger/10 p-4 text-sm text-danger">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p>Adresse non sécurisée (http) : les notifications système sont bloquées par le navigateur. Utilise https ou localhost.</p>
            </div>
          )}
        </div>
      </div>

      <ReminderSheet id={openId} onClose={() => setOpenId(null)} />
    </ModuleScope>
  );
}
