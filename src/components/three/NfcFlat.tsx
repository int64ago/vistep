import { nfcArtwork } from '../../models/nfc-cover';
import type { NfcVisual } from '../../models/nfc-geometry';
import { t } from '../../i18n';
import { useEffect, useRef, useState } from 'react';

export function NfcFluxLabel() {
  return (
    <span
      style={{
        position: 'absolute',
        left: 12,
        top: 8,
        fontSize: 16,
        lineHeight: 1.4,
        color: '#236f72',
        pointerEvents: 'none',
      }}
    >
      {t('局部磁链方向')}
    </span>
  );
}

export default function NfcFlat({
  visual,
  narrow,
  label = true,
}: {
  visual: NfcVisual;
  narrow: boolean;
  label?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: narrow ? 300 : 680, height: narrow ? 330 : 420 });
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
  const art = nfcArtwork(size.width, size.height, visual);
  return (
    <div ref={host} className="nfc-flat" style={{ position: 'relative' }}>
      <svg
        style={{ height: '100%', width: '100%' }}
        viewBox={`0 0 ${art.width} ${art.height}`}
        role="img"
        aria-label={t('NFC 读取器与无电池标签：连续线圈、绝缘跨线、调谐电容和芯片')}
      >
        {art.paths.map(({ d, fill, stroke, width, opacity, part }) => (
          <path
            key={part}
            data-part={part}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={width}
            opacity={opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {label && visual.fluxNormalized !== undefined && <NfcFluxLabel />}
    </div>
  );
}
