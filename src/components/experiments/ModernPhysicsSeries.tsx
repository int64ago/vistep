import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import ModernLab, { type ModernKind } from './ModernLab';

export interface ModernSegment {
  kind: ModernKind;
  firstChapter: number;
  name: [string, string];
  variants: string[];
}
/** Apparatus changes follow the original film chapter, including selected textbook clips. */
export default function ModernPhysicsSeries({ segments }: { segments: ModernSegment[] }) {
  const film = useShowcase();
  const [selected, setSelected] = useState(() =>
    Math.max(
      0,
      segments.findIndex((segment) => segment.variants.includes(film.variant ?? '')),
    ),
  );
  const active = film.watch
    ? Math.max(
        0,
        segments.findLastIndex((segment) => film.chapter >= segment.firstChapter),
      )
    : selected;
  const segment = segments[active];
  return (
    <div className="modern-series">
      {!film.watch && segments.length > 1 && (
        <div
          className="modern-paths"
          role="group"
          aria-label={browserLocale() === 'en' ? 'Experiment' : '实验路径'}
        >
          {segments.map((item, i) => (
            <button
              key={item.kind}
              type="button"
              aria-pressed={active === i}
              onClick={() => setSelected(i)}
            >
              {item.name[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <ModernLab
        key={segment.kind}
        kind={segment.kind}
        scenePhase={film.chapter - segment.firstChapter}
      />
    </div>
  );
}
