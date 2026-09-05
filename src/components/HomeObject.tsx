import { t } from '../i18n';
import { useState, useEffect } from 'react';
import PrinterStudio from './three/PrinterStudio';
import { useSimulation } from './lab/useSimulation';
import { FilmContext } from './lab/Showcase';
const heart = [
  '01100110',
  '11111111',
  '11111111',
  '01111110',
  '00111100',
  '00011000',
  '00000000',
  '00000000',
];
export default function HomeObject() {
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false);
  const host = useSimulation((dt) => setTime((t) => (t + dt) % 37), playing);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    setPlaying(!media.matches);
    const change = () => {
      if (media.matches) setPlaying(false);
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const open = time > 1.8 && time < 33;
  return (
    <FilmContext.Provider value={{ watch: true, playing, time, chapter: 0, run: 0, duration: 37 }}>
      <div className="home-object" ref={host}>
        <div className="object-overline">
          <span>
            <i /> INSIDE THE EVERYDAY
          </span>
          <span>LASER PRINTER</span>
        </div>
        <PrinterStudio
          progress={Math.max(0, Math.min(5.99, (time - 4) / 5))}
          exploded={open}
          pattern={heart}
          selected={11}
          charges={false}
          view="perspective"
        />
        <div className="object-caption">
          <span>
            {t('熟悉的外表，')}
            <br />
            <b>{t('意想不到的内部。')}</b>
          </span>
          <button
            className="object-toggle"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? t('暂停首页演示') : t('播放首页演示')}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d={playing ? 'M8 6v12M16 6v12' : 'm9 6 9 6-9 6Z'}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            {playing ? t('暂停') : t('播放')}
          </button>
        </div>
        <span className="object-hint">{t('一束光，一张纸，一步一步看见。')}</span>
      </div>
    </FilmContext.Provider>
  );
}
