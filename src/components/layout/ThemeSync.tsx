import { useEffect } from 'react';
import { useSettings } from '@/lib/store';
import { readableInk } from '@/lib/utils';

/** Applique le thème (clair / sombre / système), l'accent et les couleurs des rubriques. */
export function ThemeSync() {
  const { theme, accent, moduleColors } = useSettings();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#0b0b0f' : '#f6f5f2'));
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent', accent);
    root.setProperty('--accent-ink', readableInk(accent));
    root.setProperty('--tint', accent);
    root.setProperty('--tint-ink', readableInk(accent));
    for (const [k, v] of Object.entries(moduleColors)) root.setProperty(`--c-${k}`, v);
  }, [accent, moduleColors]);

  return null;
}
