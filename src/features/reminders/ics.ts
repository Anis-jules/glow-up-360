// Export des rappels au format iCalendar (.ics) : l'agenda du téléphone ou de l'ordinateur
// se charge ensuite des alertes, même quand Glow Up 360° est fermé.

import { addDays, weekdayOf } from '@/lib/dates';
import type { DateKey, Reminder } from '@/lib/types';

const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Replie les lignes à 73 octets (la norme impose 75 maximum), sans couper un caractère UTF-8. */
function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > 73) {
      out.push(current);
      current = ' ' + ch;
      bytes = 1 + b;
    } else {
      current += ch;
      bytes += b;
    }
  }
  out.push(current);
  return out.join('\r\n');
}

const compactDate = (key: DateKey) => key.replace(/-/g, '');

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Première date à partir de `from` qui tombe sur l'un des jours du rappel. */
function firstOccurrence(r: Reminder, from: DateKey): DateKey {
  for (let i = 0; i < 7; i++) {
    const k = addDays(from, i);
    if (r.days.includes(weekdayOf(k))) return k;
  }
  return from;
}

export function buildIcs(reminders: Reminder[], from: DateKey): string {
  const stamp = utcStamp(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Glow Up 360//Rappels//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Glow Up 360°',
  ];
  for (const r of reminders) {
    if (!r.enabled || !r.days.length || !/^\d{2}:\d{2}$/.test(r.time)) continue;
    const start = firstOccurrence(r, from);
    const time = r.time.replace(':', '') + '00';
    const days = [...r.days].sort();
    const rrule = days.length === 7 ? 'RRULE:FREQ=DAILY' : `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => BYDAY[d]).join(',')}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:glowup360-${r.id}@glowup360.app`,
      `DTSTAMP:${stamp}`,
      // Heure locale « flottante » : l'agenda l'interprète dans le fuseau de l'appareil.
      `DTSTART:${compactDate(start)}T${time}`,
      'DURATION:PT10M',
      rrule,
      `SUMMARY:${escapeText(r.title)}`,
      ...(r.description ? [`DESCRIPTION:${escapeText(r.description)}`] : []),
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(r.title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Télécharge un fichier texte. */
export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
