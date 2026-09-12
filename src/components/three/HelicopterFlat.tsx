import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { helicopterArtwork } from '../../models/helicopter-cover';
import { HeliArrow } from '../lab/HelicopterInstruments';
import type { HelicopterVisual } from '../../models/helicopter-geometry';
export default function HelicopterFlat({ visual }: { visual: HelicopterVisual }) {
  const host = useRef<HTMLDivElement>(null),
    [size, setSize] = useState({ width: 400, height: 310 });
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
  const art = helicopterArtwork(size.width, size.height, visual),
    offset = visual.view === 'section' && size.width / size.height < 1.25 ? 40 : 0;
  return (
    <div className="helicopter-flat" ref={host}>
      <svg
        viewBox={`0 0 ${art.width} ${art.height}`}
        role="img"
        aria-label={t('民用直升机：主旋翼、旋翼毂、尾桨与相连的起落架')}
      >
        <g transform={`translate(0 ${offset})`}>
          {art.paths.map(({ d, fill, part }) => (
            <path
              key={part}
              d={d}
              fill={fill}
              stroke={fill}
              strokeWidth=".3"
              strokeLinejoin="round"
            />
          ))}
          {['aircraft', 'vector', 'balance'].includes(visual.view ?? 'aircraft') && (
            <>
              <HeliArrow {...art.thrust} />
              <HeliArrow {...art.weight} color="#677075" />
            </>
          )}
          {art.sectionLift && <HeliArrow {...art.sectionLift} />}
          {art.sectionFlow && <HeliArrow {...art.sectionFlow} color="#77989d" />}
          {visual.torque && <HeliArrow a={art.tail.a} b={art.tail.b} />}
        </g>
      </svg>
    </div>
  );
}
