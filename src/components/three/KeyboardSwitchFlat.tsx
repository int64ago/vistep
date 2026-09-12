import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { keyboardSwitchArtwork } from '../../models/keyboard-switch-cover';
import type { KeyboardSwitchVisual } from '../../models/keyboard-switch-geometry';
export default function KeyboardSwitchFlat(visual: KeyboardSwitchVisual) {
  const host = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: 400, height: 300 });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth && el.clientHeight)
        setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);
  const art = keyboardSwitchArtwork(size.width, size.height, visual);
  return (
    <div ref={host} className="keyboard-switch-flat" style={{ width: '100%', height: '100%' }}>
      <svg
        viewBox={`0 0 ${art.width} ${art.height}`}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={t('机械键盘轴体剖面：键帽、十字轴心、弹簧与触点')}
      >
        {art.paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.fill}
            stroke={p.fill}
            strokeWidth={0.35}
            strokeLinejoin="round"
            opacity={p.opacity}
          />
        ))}
      </svg>
    </div>
  );
}
