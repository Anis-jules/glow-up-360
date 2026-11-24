import {
  Bell,
  ChevronRight,
  Droplets,
  Eye,
  EyeOff,
  Info,
  LayoutDashboard,
  MessageCircleHeart,
  Palette,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Target,
  Trash2,
  User,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo, ThemeSwitch } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Button,
  Card,
  ColorField,
  Field,
  IconButton,
  ModuleScope,
  NumberField,
  ReorderButtons,
  SectionHeader,
  Tabs,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui';
import { defaultSettings } from '@/lib/defaults';
import { useToday } from '@/lib/dates';
import { removeWithUndo } from '@/lib/feedback';
import { useTab } from '@/lib/nav';
import { MODULE_KEYS, MODULE_LABELS, motivationFor } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DashboardCardId, ModuleKey } from '@/lib/types';
import { cx, moveItem } from '@/lib/utils';
import { DataSection } from './DataSection';

const TABS = ['general', 'apparence', 'progression', 'donnees', 'apropos'] as const;
type Tab = (typeof TABS)[number];

const CARD_LABELS: Record<DashboardCardId, string> = {
  checklist: 'À faire aujourd’hui',
  english: 'Mots en anglais',
  ginger: 'Shot gingembre-citron',
  agenda: 'Programme du jour (rappels)',
  habits: 'Habitudes',
  sport: 'Sport du jour',
  nutrition: 'Nutrition',
  face: 'Routine visage',
  mind: 'Objectifs intellectuels',
  week: 'Résumé de la semaine',
};

const MODULE_ORDER: ModuleKey[] = ['sport', 'nutrition', 'face', 'mind', 'habits'];

// ───────────────────────── Général

function ProfileCard() {
  const { settings } = useData();
  const update = useUpdate();
  return (
    <Card className="animate-rise">
      <SectionHeader icon={<User />} title="Profil" subtitle="Pour personnaliser l’accueil et les messages" />
      <Field label="Prénom" hint="Utilisé dans les messages de motivation.">
        <TextInput
          value={settings.name}
          onChange={(e) => update((d) => void (d.settings.name = e.target.value))}
          placeholder="Ton prénom"
          autoComplete="given-name"
        />
      </Field>
    </Card>
  );
}

function MotivationsCard() {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const list = data.settings.motivations;
  const preview = motivationFor(data, today);

  return (
    <Card className="animate-rise" style={{ animationDelay: '60ms' }}>
      <SectionHeader
        icon={<MessageCircleHeart />}
        title="Messages de motivation"
        subtitle={`${list.length} messages, un différent chaque jour`}
        editing={editing}
        onToggleEdit={() => setEditing((v) => !v)}
        onAdd={() => {
          update((d) => void d.settings.motivations.push(''));
          setEditing(true);
        }}
      />
      {preview && (
        <div className="mb-3 rounded-2xl bg-tint/10 px-4 py-3 text-[15px]">
          <div className="mb-0.5 text-xs font-medium text-tint">Message du jour</div>
          {preview}
        </div>
      )}
      <p className="mb-2 text-xs text-ink-3">Écris {'{name}'} pour insérer ton prénom.</p>
      <ul className="space-y-1.5">
        {list.map((m, i) =>
          editing ? (
            <li key={i} className="flex items-start gap-1.5">
              <TextArea
                minRows={1}
                value={m}
                autoFocus={m === '' && i === list.length - 1}
                onChange={(e) => update((d) => void (d.settings.motivations[i] = e.target.value))}
                placeholder="Ton message"
                className="min-w-0 flex-1"
              />
              <ReorderButtons index={i} count={list.length} onMove={(to) => update((d) => moveItem(d.settings.motivations, i, to))} />
              <IconButton
                label="Supprimer"
                size="icon-sm"
                onClick={() => removeWithUndo('Message supprimé', (d) => void d.settings.motivations.splice(i, 1))}
              >
                <Trash2 />
              </IconButton>
            </li>
          ) : (
            <li key={i} className={cx('rounded-xl px-3 py-2 text-[15px] text-ink-2', !m.trim() && 'italic text-ink-3')}>
              {m.trim() || 'Message vide'}
            </li>
          ),
        )}
      </ul>
    </Card>
  );
}

function AlertsCard() {
  const { settings, reminders } = useData();
  const update = useUpdate();
  const active = reminders.items.filter((r) => r.enabled).length;
  return (
    <Card className="animate-rise" style={{ animationDelay: '120ms' }}>
      <SectionHeader icon={<Volume2 />} title="Rappels, sons et alertes" />
      <Link
        to="/rappels"
        className="-mx-2 mb-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-ink/[0.04]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint/12 text-tint">
          <Bell className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">Gérer mes rappels et notifications</span>
          <span className="block text-[13px] text-ink-3">
            {active} rappel{active > 1 ? 's' : ''} actif{active > 1 ? 's' : ''} · horaires, jours, agenda
          </span>
        </span>
        <ChevronRight className="size-4 text-ink-3" />
      </Link>
      <div className="divide-y divide-line border-t border-line">
        <Toggle
          className="py-3"
          label="Alertes dans l’application"
          description="Message à l’écran à l’heure d’un rappel"
          checked={settings.inAppAlerts}
          onChange={(v) => update((d) => void (d.settings.inAppAlerts = v))}
        />
        <Toggle
          className="py-3"
          label="Sons"
          description="Rappels et fin des minuteurs"
          checked={settings.sounds}
          onChange={(v) => update((d) => void (d.settings.sounds = v))}
        />
      </div>
    </Card>
  );
}

// ───────────────────────── Apparence

function ThemeCard() {
  const { settings } = useData();
  const update = useUpdate();
  return (
    <Card className="animate-rise">
      <SectionHeader icon={<Palette />} title="Thème et couleur principale" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-medium">Mode d’affichage</div>
          <div className="text-[13px] text-ink-3">Clair, sombre ou selon l’appareil</div>
        </div>
        <ThemeSwitch />
      </div>
      <div className="mt-5">
        <div className="mb-2 text-[15px] font-medium">Couleur principale</div>
        <ColorField value={settings.accent} onChange={(v) => update((d) => void (d.settings.accent = v))} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" tabIndex={-1}>
          Aperçu du bouton
        </Button>
        <span className="h-2 w-24 rounded-full bg-accent" />
      </div>
    </Card>
  );
}

function ModuleColorsCard() {
  const { settings } = useData();
  const update = useUpdate();
  const [open, setOpen] = useState<ModuleKey | null>(null);
  const defaults = defaultSettings();
  return (
    <Card className="animate-rise" style={{ animationDelay: '60ms' }}>
      <SectionHeader
        icon={<Palette />}
        title="Couleurs des rubriques"
        subtitle="Touche une rubrique pour changer sa couleur"
        extra={
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              update((d) => {
                d.settings.moduleColors = { ...defaults.moduleColors };
                d.settings.accent = defaults.accent;
              })
            }
          >
            <RotateCcw /> <span className="max-sm:sr-only">Couleurs d’origine</span>
          </Button>
        }
      />
      <ul className="-mx-2">
        {MODULE_ORDER.map((k) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => setOpen(open === k ? null : k)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-ink/[0.03]"
              aria-expanded={open === k}
            >
              <span className="size-7 shrink-0 rounded-full" style={{ background: settings.moduleColors[k] }} />
              <span className="min-w-0 flex-1 text-[15px] font-medium">{MODULE_LABELS[k]}</span>
              <ChevronRight className={cx('size-4 text-ink-3 transition-transform', open === k && 'rotate-90')} />
            </button>
            {open === k && (
              <div className="animate-fade-in px-2 pt-1 pb-3">
                <ColorField value={settings.moduleColors[k]} onChange={(v) => update((d) => void (d.settings.moduleColors[k] = v))} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DashboardCardsCard() {
  const { settings } = useData();
  const update = useUpdate();
  const cards = settings.dashboardCards;
  return (
    <Card className="animate-rise" style={{ animationDelay: '120ms' }}>
      <SectionHeader icon={<LayoutDashboard />} title="Cartes du tableau de bord" subtitle="Afficher, masquer et réorganiser" />
      <ul className="-mx-2">
        {cards.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
            <button
              type="button"
              onClick={() => update((d) => void (d.settings.dashboardCards[i].visible = !c.visible))}
              className={cx('grid size-9 shrink-0 place-items-center rounded-lg transition-colors', c.visible ? 'text-tint' : 'text-ink-3')}
              aria-label={c.visible ? `Masquer ${CARD_LABELS[c.id]}` : `Afficher ${CARD_LABELS[c.id]}`}
              title={c.visible ? 'Masquer' : 'Afficher'}
            >
              {c.visible ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}
            </button>
            <span className={cx('min-w-0 flex-1 truncate text-[15px]', !c.visible && 'text-ink-3 line-through decoration-ink-3/40')}>
              {CARD_LABELS[c.id] ?? c.id}
            </span>
            <ReorderButtons index={i} count={cards.length} onMove={(to) => update((d) => moveItem(d.settings.dashboardCards, i, to))} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ───────────────────────── Progression

function ProgressionCard() {
  const { settings } = useData();
  const update = useUpdate();
  return (
    <Card className="animate-rise">
      <SectionHeader icon={<Target />} title="Journée réussie" subtitle="Ce qui compte dans ta progression" />
      <Field label="Seuil de réussite" hint="Une journée compte comme réussie à partir de ce pourcentage. Elle compte pour les séries et le calendrier.">
        <NumberField
          value={settings.completionThreshold}
          onChange={(v) => update((d) => void (d.settings.completionThreshold = v))}
          min={50}
          max={100}
          step={5}
          suffix="%"
          ariaLabel="Seuil de réussite"
          className="max-w-48"
        />
      </Field>
      <div className="mt-5">
        <div className="mb-1 text-[13px] font-medium text-ink-2">Rubriques prises en compte</div>
        <p className="mb-2 text-xs text-ink-3">
          Le pourcentage du jour est la moyenne des rubriques cochées. Le changement s’applique à partir d’aujourd’hui.
        </p>
        <div className="divide-y divide-line">
          {MODULE_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-3 py-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--c-${k})` }} />
              <Toggle
                className="min-w-0 flex-1 py-0"
                label={MODULE_LABELS[k]}
                checked={settings.modulesInProgress[k]}
                onChange={(v) => update((d) => void (d.settings.modulesInProgress[k] = v))}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function JokersCard() {
  const { settings } = useData();
  const update = useUpdate();
  return (
    <Card className="animate-rise" style={{ animationDelay: '60ms' }}>
      <SectionHeader icon={<SlidersHorizontal />} title="Séries sans culpabilité" subtitle="Les jokers" />
      <p className="mb-3 text-sm text-ink-2">
        Un joker couvre une journée en dessous du seuil : ta série continue. Ils se rechargent chaque lundi. Et quoi qu’il arrive, ton
        total de journées réussies ne diminue jamais.
      </p>
      <Field label="Jokers par semaine">
        <NumberField
          value={settings.jokersPerWeek}
          onChange={(v) => update((d) => void (d.settings.jokersPerWeek = v))}
          min={0}
          max={3}
          ariaLabel="Jokers par semaine"
          className="max-w-48"
        />
      </Field>
    </Card>
  );
}

function HydrationCard() {
  const { nutrition } = useData();
  const update = useUpdate();
  return (
    <ModuleScope module="nutrition">
      <Card className="animate-rise" style={{ animationDelay: '120ms' }}>
        <SectionHeader icon={<Droplets />} title="Hydratation" subtitle="Objectif quotidien et taille d’un verre" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Objectif par jour" hint="Repère courant : environ 1,5 L d’eau par jour, plus s’il fait chaud ou si tu fais du sport.">
            <NumberField
              value={nutrition.water.goalMl}
              onChange={(v) => update((d) => void (d.nutrition.water.goalMl = v))}
              min={250}
              max={6000}
              step={250}
              suffix="ml"
              ariaLabel="Objectif d’hydratation"
            />
          </Field>
          <Field label="Un verre">
            <NumberField
              value={nutrition.water.glassMl}
              onChange={(v) => update((d) => void (d.nutrition.water.glassMl = v))}
              min={50}
              max={1000}
              step={50}
              suffix="ml"
              ariaLabel="Taille d’un verre"
            />
          </Field>
        </div>
      </Card>
    </ModuleScope>
  );
}

// ───────────────────────── À propos

function AboutSection() {
  const { createdAt } = useData();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
      <Card className="animate-rise">
        <Logo />
        <p className="mt-4 text-sm text-ink-2">
          Ton espace personnel pour le sport, la nutrition, le visage, l’esprit et les habitudes. Version 1.0.0 · espace commencé le{' '}
          {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${createdAt}T12:00:00`))}.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-2">
          <li>
            <strong className="text-ink">Sans compte, sans serveur.</strong> Tout est enregistré sur cet appareil, dans ce navigateur, à
            chaque modification. Rien n’est envoyé sur internet.
          </li>
          <li>
            <strong className="text-ink">Fonctionne hors ligne</strong> une fois installée (ajoutée à l’écran d’accueil ou ouverte
            depuis une adresse https).
          </li>
          <li>
            <strong className="text-ink">Conçue avec</strong> React, TypeScript et Tailwind CSS.
          </li>
        </ul>
      </Card>
      <Card className="animate-rise" style={{ animationDelay: '60ms' }}>
        <SectionHeader icon={<Info />} title="Ce que l’application ne fait pas (encore)" />
        <ul className="space-y-2.5 text-sm leading-relaxed text-ink-2">
          <li>
            • <strong className="text-ink">Synchronisation entre appareils</strong> : il faudrait une base de données en ligne avec un
            compte. En attendant, utilise Exporter puis Importer.
          </li>
          <li>
            • <strong className="text-ink">Notifications application fermée</strong> : il faudrait un serveur d’envoi (Web Push). Les
            rappels fonctionnent quand l’app est ouverte, et l’export vers ton agenda t’alerte même app fermée.
          </li>
          <li>
            • <strong className="text-ink">Conseils médicaux</strong> : les contenus sont des repères généraux. En cas de douleur, de
            traitement ou de besoin particulier, demande l’avis d’un professionnel de santé.
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useTab(TABS, 'general');

  return (
    <ModuleScope>
      <PageHeader icon={<Settings />} eyebrow="Personnalisation" title="Paramètres" subtitle="Tout est modifiable, et enregistré automatiquement." />
      <Tabs<Tab>
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'general', label: 'Général' },
          { id: 'apparence', label: 'Apparence' },
          { id: 'progression', label: 'Progression' },
          { id: 'donnees', label: 'Données' },
          { id: 'apropos', label: 'À propos' },
        ]}
      />

      {tab === 'general' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <ProfileCard />
            <AlertsCard />
          </div>
          <MotivationsCard />
        </div>
      )}

      {tab === 'apparence' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <ThemeCard />
            <ModuleColorsCard />
          </div>
          <DashboardCardsCard />
        </div>
      )}

      {tab === 'progression' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <ProgressionCard />
          <div className="space-y-4">
            <JokersCard />
            <HydrationCard />
          </div>
        </div>
      )}

      {tab === 'donnees' && <DataSection />}
      {tab === 'apropos' && <AboutSection />}
    </ModuleScope>
  );
}
