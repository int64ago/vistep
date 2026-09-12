import { useEffect, useRef, useState } from 'react';
import { ak47ProjectedArt } from '../../models/ak47-cover';
import type { Ak47Visual } from './Ak47Studio';
import { t } from '../../i18n';
export default function Ak47Flat({ visual }: { visual: Ak47Visual }) {
  const host = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: 320, height: 280 });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth && el.clientHeight)
        setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const art = ak47ProjectedArt(
    size.width,
    size.height,
    visual.state,
    visual.reveal,
    visual.closeup,
    visual.compare,
    visual.input,
  );
  return (
    <div ref={host} style={{ width: '100%', height: '100%' }}>
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={t('AK-47 实物外观与相连的导气活塞、枪机框和回位簧')}
      >
        {art.paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.fill}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth ?? 0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={p.opacity}
          />
        ))}
      </svg>
    </div>
  );
}
