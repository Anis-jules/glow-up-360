import { Check as CloudCheck, Monitor, Moon, MoreHorizontal, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ReminderEngine } from '@/features/reminders/ReminderEngine';
import { AutoBackup } from '@/features/settings/AutoBackup';
import { MOBILE_PRIMARY, NAV, REMINDERS_NAV, type NavItem } from '@/lib/nav';
import { unlockAudio } from '@/lib/sound';
import { useApp, useSettings, useUpdate } from '@/lib/store';
import type { ThemeMode } from '@/lib/types';
import { cx } from '@/lib/utils';
import { ConfirmHost, Sheet, Toaster } from '../ui';
import { ThemeSync } from './ThemeSync';

function navColor(item: NavItem): string {
  return item.module ? `var(--c-${item.module})` : 'var(--accent)';
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid size-9 place-items-center rounded-xl bg-ink text-bg">
        <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
          <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="52 17" strokeLinecap="round" />
          <circle cx="16" cy="16" r="4" fill="var(--accent)" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[15px] font-bold tracking-tight">GLOW UP 360°</div>
          <div className="mt-1 text-[11px] text-ink-3">Mon centre de contrôle</div>
        </div>
      )}
    </div>
  );
}

const THEME_ORDER: ThemeMode[] = ['light', 'dark', 'system'];
const THEME_META: Record<ThemeMode, { label: string; icon: typeof Sun }> = {
  light: { label: 'Mode clair', icon: Sun },
  dark: { label: 'Mode sombre', icon: Moon },
  system: { label: 'Selon l’appareil', icon: Monitor },
};

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme } = useSettings();
  const update = useUpdate();
  return (
    <div className={cx('inline-flex rounded-xl bg-ink/[0.05] p-0.5', className)} role="radiogroup" aria-label="Thème">
      {THEME_ORDER.map((t) => {
        const Icon = THEME_META[t].icon;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={theme === t}
            title={THEME_META[t].label}
            aria-label={THEME_META[t].label}
            onClick={() => update((d) => void (d.settings.theme = t))}
            className={cx(
              'grid h-8 w-9 place-items-center rounded-[10px] transition-colors',
              theme === t ? 'bg-surface text-ink shadow-sm' : 'text-ink-3 hover:text-ink',
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

function SaveIndicator() {
  const savedAt = useApp((s) => s.savedAt);
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const sec = Math.round((Date.now() - savedAt) / 1000);
  const when = sec < 45 ? 'à l’instant' : sec < 3600 ? `il y a ${Math.round(sec / 60)} min` : 'automatiquement';
  return (
    <div className="flex items-center gap-1.5 text-xs text-ink-3" title="Chaque modification est enregistrée sur cet appareil">
      <CloudCheck className="size-3.5" />
      Enregistré {when}
    </div>
  );
}

// Barre latérale : les rubriques, puis Rappels et Paramètres après un séparateur.
const sideMain = NAV.filter((n) => n.to !== '/parametres');
const sideItems = [...sideMain, REMINDERS_NAV, ...NAV.filter((n) => n.to === '/parametres')];

function SideNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/70 px-3 py-5 backdrop-blur-xl lg:flex">
      <div className="px-2.5">
        <Logo />
      </div>
      <nav className="mt-8 flex flex-col gap-0.5" aria-label="Navigation principale">
        {sideItems.map((item, i) => (
          <div key={item.to}>
            {i === sideMain.length && <div className="mx-3 my-3 h-px bg-line" />}
            <NavLink
              to={item.to}
              end={item.to === '/'}
              style={{ '--tint': navColor(item) } as React.CSSProperties}
              className={({ isActive }) =>
                cx(
                  'group flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors',
                  isActive ? 'bg-tint/12 text-ink' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cx('size-[18px] transition-colors', isActive ? 'text-tint' : 'text-ink-3 group-hover:text-ink-2')} />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>
      <div className="mt-auto space-y-3 px-2.5">
        <ThemeSwitch />
        <SaveIndicator />
      </div>
    </aside>
  );
}

function BottomNav() {
  const [more, setMore] = useState(false);
  const location = useLocation();
  useEffect(() => setMore(false), [location.pathname]);
  const primary = NAV.filter((n) => MOBILE_PRIMARY.includes(n.to));
  const secondary = [...NAV.filter((n) => !MOBILE_PRIMARY.includes(n.to)), REMINDERS_NAV];
  const secondaryActive = secondary.some((n) => location.pathname.startsWith(n.to));

  return (
    <>
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/85 backdrop-blur-xl lg:hidden"
        aria-label="Navigation principale"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
          {primary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={{ '--tint': navColor(item) } as React.CSSProperties}
              className={({ isActive }) =>
                cx('flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', isActive ? 'text-ink' : 'text-ink-3')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cx('grid h-7 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-tint/15')}>
                    <item.icon className={cx('size-5', isActive && 'text-tint')} />
                  </span>
                  {item.short}
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMore(true)}
            className={cx('flex flex-col items-center justify-center gap-1 text-[11px] font-medium', secondaryActive ? 'text-ink' : 'text-ink-3')}
          >
            <span className={cx('grid h-7 w-12 place-items-center rounded-full', secondaryActive && 'bg-accent/15 text-accent')}>
              <MoreHorizontal className="size-5" />
            </span>
            Plus
          </button>
        </div>
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="Toutes les rubriques">
        <div className="grid grid-cols-2 gap-2">
          {secondary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={{ '--tint': navColor(item) } as React.CSSProperties}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-2xl border p-3.5 text-sm font-medium transition-colors',
                  isActive ? 'border-tint/40 bg-tint/10' : 'border-line hover:bg-ink/[0.03]',
                )
              }
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint/12 text-tint">
                <item.icon className="size-[18px]" />
              </span>
              <span className="leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <ThemeSwitch />
          <SaveIndicator />
        </div>
      </Sheet>
    </>
  );
}

export function AppShell() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  return (
    <div className="min-h-dvh lg:pl-64">
      <ThemeSync />
      <ReminderEngine />
      <AutoBackup />
      <SideNav />
      <main className="mx-auto w-full max-w-6xl px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster />
      <ConfirmHost />
    </div>
  );
}
