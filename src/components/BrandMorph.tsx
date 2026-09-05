import { useEffect, useRef, useState } from 'react';
import { type Locale } from '../i18n';
import '../styles/brand-opening.css';

const pieces = ['Vi', 's', 'ualize', 'Every', 'S', 'tep', 'with', 'AI', '.'];
const lower = ['vi', 's', 'ualize', 'Every', 's', 'tep', 'with', 'ai', '.'];
const discarded = new Set([2, 3, 6]);
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** One continuous typographic gesture, in the same space as the homepage title. */
export default function BrandMorph({ locale = 'zh' }: { locale?: Locale }) {
  const host = useRef<HTMLDivElement>(null);
  const stop = useRef<() => void>(() => {});
  const [run, replay] = useState(0);

  useEffect(() => {
    const root = host.current!;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const glyphs = [...root.querySelectorAll<HTMLElement>('.brand-piece')];
    const source = root.querySelector<HTMLElement>('.brand-source')!;
    const domain = root.querySelector<HTMLElement>('.brand-domain')!;
    const destination = document.querySelector<HTMLElement>('.site-header .wordmark-name');
    let frame = 0,
      disposed = false,
      finished = false,
      elapsed = 0,
      previous = 0;
    let fontTimeout: ReturnType<typeof setTimeout> | undefined;
    const initialWidth = window.innerWidth;
    const finish = () => {
      finished = true;
      cancelAnimationFrame(frame);
      root.dataset.state = 'settled';
      root.style.setProperty('--title-reveal', '1');
    };
    stop.current = finish;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) finish();
    });
    const preference = () => {
      if (media.matches) finish();
    };
    const resize = () => {
      if (Math.abs(window.innerWidth - initialWidth) > 1) finish();
    };
    const visibility = () => {
      previous = 0;
    };
    const about = (event: Event) => {
      if (media.matches) return;
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      replay((n) => n + 1);
    };
    const link = document.querySelector('.site-header .name-link');
    link?.addEventListener('click', about);
    media.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('keydown', escape);
    const start = async () => {
      root.dataset.state = 'pending';
      root.style.setProperty('--title-reveal', '0');
      if (media.matches || !destination) return finish();
      // The source phrase is server rendered. A slow font must not block the page.
      await Promise.race([
        document.fonts.load('500 64px "Manrope Variable"'),
        new Promise((resolve) => {
          fontTimeout = setTimeout(resolve, 800);
        }),
      ]);
      clearTimeout(fontTimeout);
      if (disposed || finished) return;
      const rect = root.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= innerHeight) return finish();
      const size = parseFloat(getComputedStyle(source).fontSize);
      const line = size * 1.12;
      const width = (i: number, variant = '.brand-upper') =>
        glyphs[i].querySelector<HTMLElement>(variant)!.getBoundingClientRect().width;
      const gap = size * 0.24;
      const startX = [
        0,
        width(0),
        width(0) + width(1),
        0,
        width(3) + gap,
        width(3) + gap + width(4),
        0,
        width(6) + gap,
        0,
      ];
      const startY = [0, 0, 0, line, line, line, line * 2, line * 2, line];
      const vi = width(0, '.brand-lower'),
        s = width(1, '.brand-lower');
      const stepS = width(4, '.brand-lower'),
        tep = width(5, '.brand-lower');
      const dot = width(8, '.brand-lower');
      const extracted = [
        0,
        vi,
        startX[2],
        startX[3],
        vi + s + gap,
        vi + s + gap + stepS,
        startX[6],
        vi + s + gap + stepS + tep + gap,
        0,
      ];
      // Both s glyphs meet at exactly the same position before the duplicate fades.
      const merged = [
        0,
        vi,
        startX[2],
        startX[3],
        vi,
        vi + s,
        startX[6],
        vi + s + tep + gap,
        vi + s + tep,
      ];
      const destinationRect = destination.getBoundingClientRect();
      const destinationStyle = getComputedStyle(destination);
      const targetX = destinationRect.left - rect.left;
      const targetY = destinationRect.top - rect.top;
      const targetSize = parseFloat(destinationStyle.fontSize);
      const targetSpacing = parseFloat(destinationStyle.letterSpacing) || 0;
      window.addEventListener('resize', resize, { passive: true });
      observer.observe(root);
      const draw = (now: number) => {
        if (disposed || finished) return;
        if (document.hidden) {
          previous = 0;
          frame = requestAnimationFrame(draw);
          return;
        }
        if (previous) elapsed += now - previous;
        previous = now;
        const dim = ease((elapsed - 1350) / 650);
        const extract = ease((elapsed - 2150) / 1000);
        const lowercase = ease((elapsed - 2400) / 400);
        const merge = ease((elapsed - 3650) / 900);
        const punctuate = ease((elapsed - 4900) / 650);
        const dock = ease((elapsed - 6000) / 1400);
        const handoff = ease((elapsed - 5700) / 180);
        root.style.setProperty('--title-reveal', String(ease((elapsed - 6350) / 1050)));
        glyphs.forEach((glyph, i) => {
          const x = mix(mix(startX[i], extracted[i], extract), merged[i], merge);
          const finalX = i === 7 ? mix(x, vi + s + tep + dot, punctuate) : x;
          const y = mix(startY[i], line, extract);
          const opacity = discarded.has(i)
            ? 1 - dim
            : i === 4
              ? 1 - ease((elapsed - 4280) / 300)
              : i === 8
                ? punctuate
                : 1;
          glyph.style.transform = `translate3d(${finalX}px, ${y}px, 0)`;
          glyph.style.opacity = String(opacity * (1 - handoff));
          glyph.style.setProperty('--lowercase', String(lowercase));
          const highlight = !discarded.has(i) && i !== 8 ? dim * (1 - dock) : 0;
          glyph.style.color =
            i === 1 || i === 4
              ? `color-mix(in srgb, #344e42 ${100 - merge * 35}%, #a7764c)`
              : `color-mix(in srgb, #72796e ${100 - highlight * 100}%, #344e42)`;
        });
        domain.style.opacity = String(handoff);
        domain.style.fontSize = `${mix(size, targetSize, dock)}px`;
        domain.style.fontWeight = String(mix(500, 680, dock));
        domain.style.letterSpacing = `${mix(-size * 0.055, targetSpacing, dock)}px`;
        domain.style.transform = `translate3d(${targetX * dock}px, ${mix(line + size * 0.06, targetY, dock)}px, 0)`;
        root.dataset.state = 'playing';
        if (elapsed >= 7400) return finish();
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };
    void start().catch((error) => {
      console.error('[brand-opening]', error);
      finish();
    });
    return () => {
      disposed = true;
      clearTimeout(fontTimeout);
      cancelAnimationFrame(frame);
      link?.removeEventListener('click', about);
      media.removeEventListener('change', preference);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, [run]);
  return (
    <div className="brand-opening" id="name" ref={host} data-state="pending">
      <button className="brand-skip" onClick={() => stop.current()}>
        {locale === 'zh' ? '跳过开场' : 'Skip introduction'}
      </button>
      <span className="sr-only">
        {locale === 'zh'
          ? 'vistep.ai，Visualize Every Step with AI。提取 vis、step、ai，合并相邻的两个 s，形成 vistep.ai。'
          : 'vistep.ai: Visualize Every Step with AI. Take vis, step and ai; merge the adjacent s letters to form vistep.ai.'}
      </span>
      <div className="brand-motion" aria-hidden="true">
        <div className="brand-source">
          <span>Visualize</span>
          <span>Every Step</span>
          <span>with AI</span>
        </div>
        <div className="brand-pieces">
          {pieces.map((piece, i) => (
            <span className="brand-piece" key={i}>
              <span className="brand-upper">{piece}</span>
              <span className="brand-lower">{lower[i]}</span>
            </span>
          ))}
        </div>
        <span className="brand-domain">vistep.ai</span>
      </div>
      <div className="opening-title">
        <h1>
          {locale === 'zh' ? (
            <>
              <span>看见每一步，</span>
              <span>理解为什么。</span>
            </>
          ) : (
            <>
              <span>See every step.</span>
              <span>Understand why.</span>
            </>
          )}
        </h1>
        <button
          className="brand-meaning"
          onClick={() => replay((n) => n + 1)}
          aria-label={
            locale === 'zh'
              ? 'Visualize Every Step with AI · 重看名字的由来'
              : 'Visualize Every Step with AI · Replay the name animation'
          }
        >
          Visualize Every Step with AI
        </button>
      </div>
    </div>
  );
}
