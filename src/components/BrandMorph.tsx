import { translate, type Locale } from '../i18n';
import { useEffect, useRef, useState } from 'react';
const timings = [650, 2100, 3200, 4100, 5050, 6400, 7900];
export default function BrandMorph({ locale = 'zh' }: { locale?: Locale }) {
  const tr = (s: string) => translate(s, locale);
  const [phase, setPhase] = useState(7),
    [reduced, setReduced] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const run = () => {
    clear();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(7);
      return;
    }
    setPhase(0);
    timings.forEach((time, i) => timers.current.push(setTimeout(() => setPhase(i + 1), time)));
    try {
      sessionStorage.setItem('vistep:brand-seen-v2', '1');
    } catch {}
  };
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    let seen = false;
    try {
      seen = !!sessionStorage.getItem('vistep:brand-seen-v2');
    } catch {}
    if (!seen && !media.matches) run();
    const change = () => {
      setReduced(media.matches);
      if (media.matches) {
        clear();
        setPhase(7);
      }
    };
    media.addEventListener('change', change);
    return () => {
      clear();
      media.removeEventListener('change', change);
    };
  }, []);
  return (
    <div className={`brand-signature signature-${phase}`} id="name">
      <h1 className="sr-only">vistep.ai</h1>
      <span className="sr-only">
        {tr(
          'vistep.ai，Visualize Every Step with AI。提取 vis、step、ai，共用两个相邻的 s，形成 vistep.ai。',
        )}
      </span>
      <div className="signature-line" aria-hidden="true">
        <span className="signature-word">
          Vi<span className="kept-s">s</span>
          <span className="lost-word">ualize</span>
        </span>
        <span className="lost-word whole-word">Every</span>
        <span className="signature-word">
          <span className="shared-letter">S</span>tep
        </span>
        <span className="lost-word whole-word">with</span>
        <span className="signature-word">
          <span className="domain-dot">.</span>AI
        </span>
      </div>
      <div className="signature-baseline">
        <span>
          <b>Vis</b>ualize Every <b>Step</b> with <b>AI</b>
        </span>
        <button
          onClick={run}
          className="signature-replay"
          aria-label={tr('重播域名解释动画')}
          disabled={reduced}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 9a8 8 0 1 1-.2 5M4 4v5h5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="signature-origin" aria-hidden="true">
        <span>
          vi<b>s</b>
        </span>
        <i>+</i>
        <span>
          <b>s</b>tep
        </span>
        <i>+</i>
        <span>ai</span>
        <i>→</i>
        <span>vistep.ai</span>
      </div>
    </div>
  );
}
