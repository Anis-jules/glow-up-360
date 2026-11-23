import { useId, useMemo } from 'react';
import type { MassageIllustration as Kind } from '@/lib/types';
import { cx } from '@/lib/utils';

/** Trajets (flèches) de chaque geste, dans un repère 200 × 240. */
const ARROWS: Record<Kind, string[]> = {
  prep: [],
  none: [],
  neck: ['M54 146 C 62 172 68 198 72 220', 'M146 146 C 138 172 132 198 128 220'],
  jaw: ['M95 191 C 76 186 57 167 45 134', 'M105 191 C 124 186 143 167 155 134'],
  cheeks: ['M89 125 C 76 120 61 110 49 94', 'M111 125 C 124 120 139 110 151 94'],
  eyes: ['M87 113 C 81 117 71 117 63 111', 'M113 113 C 119 117 129 117 137 111'],
  forehead: ['M95 64 C 82 60 65 63 50 78', 'M105 64 C 118 60 135 63 150 78'],
};

const LABELS: Record<Kind, string> = {
  prep: 'Préparation : une noisette de crème ou quelques gouttes d’huile',
  none: 'Visage',
  neck: 'Cou : des oreilles vers les clavicules',
  jaw: 'Mâchoire : du menton vers les oreilles',
  cheeks: 'Pommettes : du nez vers les tempes',
  eyes: 'Contour des yeux : de l’intérieur vers l’extérieur',
  forehead: 'Front : du centre vers les tempes',
};

function Zone({ kind }: { kind: Kind }) {
  const fill = { fill: 'var(--tint)', fillOpacity: 0.14 };
  switch (kind) {
    case 'prep':
      return <ellipse cx="100" cy="108" rx="62" ry="86" style={{ fill: 'var(--tint)', fillOpacity: 0.07 }} />;
    case 'neck':
      return <path d="M77 184 L123 184 L127 228 L73 228 Z" style={fill} />;
    case 'jaw':
      return (
        <path
          d="M46 134 C 58 168 78 188 100 193 C 122 188 142 168 154 134"
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          style={{ stroke: 'var(--tint)', strokeOpacity: 0.14 }}
        />
      );
    case 'cheeks':
      return (
        <>
          <ellipse cx="66" cy="118" rx="21" ry="14" style={fill} />
          <ellipse cx="134" cy="118" rx="21" ry="14" style={fill} />
        </>
      );
    case 'eyes':
      return (
        <>
          <ellipse cx="76" cy="113" rx="15" ry="6" style={fill} />
          <ellipse cx="124" cy="113" rx="15" ry="6" style={fill} />
        </>
      );
    case 'forehead':
      return (
        <>
          <ellipse cx="100" cy="64" rx="44" ry="15" style={fill} />
          <circle cx="47" cy="88" r="8" style={fill} />
          <circle cx="153" cy="88" r="8" style={fill} />
        </>
      );
    default:
      return null;
  }
}

/**
 * Visage stylisé au trait avec la zone travaillée et le sens des gestes.
 * `animated` fait glisser un point le long de chaque trajet (massage guidé).
 */
export function MassageIllustration({
  kind,
  animated,
  className,
}: {
  kind: Kind;
  animated?: boolean;
  className?: string;
}) {
  const rawId = useId();
  const markerId = `ah-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const reduce = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const arrows = ARROWS[kind] ?? [];
  const dotted = kind === 'eyes';

  return (
    <svg viewBox="0 0 200 240" role="img" aria-label={LABELS[kind]} className={cx('text-ink-2', className)}>
      <defs>
        <marker id={markerId} viewBox="0 0 8 8" refX="5" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 Z" style={{ fill: 'var(--tint)' }} />
        </marker>
      </defs>

      <Zone kind={kind} />

      {/* Visage */}
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M100 24 C 140 24 161 54 161 99 C 161 139 145 168 123 184 C 113 191 106 194 100 194 C 94 194 87 191 77 184 C 55 168 39 139 39 99 C 39 54 60 24 100 24 Z" />
        <path d="M39 95 C 29 94 27 120 41 125" />
        <path d="M161 95 C 171 94 173 120 159 125" />
        <path d="M77 186 L 75 226 M123 186 L 125 226" />
        <path d="M75 226 C 58 230 40 233 20 237 M125 226 C 142 230 160 233 180 237" />
        <path d="M52 66 C 64 40 136 40 148 66" strokeOpacity="0.35" />
        <path d="M66 91 C 74 87 83 87 90 90 M110 90 C 117 87 126 87 134 91" strokeOpacity="0.7" />
        <path d="M67 102 C 73 107 83 107 89 102 M111 102 C 117 107 127 107 133 102" />
        <path d="M100 106 C 98 119 96 126 92 131 C 96 134 104 134 108 131" strokeOpacity="0.8" />
        <path d="M86 153 C 94 158 106 158 114 153" />
      </g>

      {/* Préparation : gouttes */}
      {kind === 'prep' && (
        <g style={{ fill: 'var(--tint)' }}>
          {[
            [152, 38, 1],
            [170, 58, 0.8],
            [146, 62, 0.65],
          ].map(([x, y, s], i) => (
            <path
              key={i}
              transform={`translate(${x} ${y}) scale(${s})`}
              d="M0 -12 C 6 -4 9 1 9 5 C 9 10 5 13 0 13 C -5 13 -9 10 -9 5 C -9 1 -6 -4 0 -12 Z"
              opacity={0.85}
            >
              {animated && !reduce && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  additive="sum"
                  values="0 0; 0 3; 0 0"
                  dur={`${1.6 + i * 0.3}s`}
                  repeatCount="indefinite"
                />
              )}
            </path>
          ))}
        </g>
      )}

      {/* Sens des gestes */}
      {arrows.map((d, i) => (
        <g key={i}>
          <path
            d={d}
            fill="none"
            strokeWidth={dotted ? 3.5 : 2.6}
            strokeLinecap="round"
            strokeDasharray={dotted ? '0.1 7' : undefined}
            markerEnd={`url(#${markerId})`}
            style={{ stroke: 'var(--tint)' }}
          />
          {animated && !reduce && (
            <circle r="4" style={{ fill: 'var(--tint)' }} opacity="0.9">
              <animateMotion dur="2.2s" repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
              <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.15;0.8;1" dur="2.2s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      ))}
    </svg>
  );
}

export const ILLUSTRATION_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'prep', label: 'Préparation' },
  { value: 'neck', label: 'Cou' },
  { value: 'jaw', label: 'Mâchoire' },
  { value: 'cheeks', label: 'Pommettes' },
  { value: 'eyes', label: 'Contour des yeux' },
  { value: 'forehead', label: 'Front et tempes' },
  { value: 'none', label: 'Visage seul' },
];
