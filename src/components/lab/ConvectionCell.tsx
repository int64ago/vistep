import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { convectionPlates, convectionScalar, type ConvectionState } from '../../models/convection';
import { convectionOverlay, convectionArrowPath } from './convectionOverlay';
const rgb = (temperature: number) => {
  const q = Math.max(0, Math.min(1, temperature)),
    cold = [98, 132, 147],
    middle = [227, 219, 189],
    warm = [193, 92, 49];
  const f = q < 0.5 ? q * 2 : (q - 0.5) * 2,
    a = q < 0.5 ? cold : middle,
    b = q < 0.5 ? middle : warm;
  return a.map((v, i) => Math.round(v + (b[i] - v) * f));
};
export default function ConvectionCell({
  state,
  title,
  view,
  probe = 8,
  compact = false,
}: {
  state: ConvectionState;
  title: string;
  view: string;
  probe?: number;
  compact?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    [width, setWidth] = useState(420),
    [noCanvas, setNoCanvas] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(160, el.clientWidth)));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const p = state.p,
    plates = convectionPlates(p, state.step * p.dt),
    selected = state.particles.find((a) => a.id === probe) ?? state.particles[0],
    dye = view === 'dye',
    grid = view === 'grid';
  useEffect(() => {
    const el = canvas.current;
    if (!el || !host.current?.clientWidth) return;
    const ctx = el.getContext('2d');
    if (!ctx) {
      setNoCanvas(true);
      return;
    }
    const W = Math.round(width),
      H = Math.round(W / p.width),
      ratio = Math.min(2, window.devicePixelRatio || 1);
    el.width = W * ratio;
    el.height = H * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cells = document.createElement('canvas');
    cells.width = p.nx;
    cells.height = p.ny;
    const c = cells.getContext('2d');
    if (!c) {
      setNoCanvas(true);
      return;
    }
    const pixels = c.createImageData(p.nx, p.ny);
    for (let j = 0; j < p.ny; j++)
      for (let i = 0; i < p.nx; i++) {
        const k = i + p.nx * j,
          out = 4 * (i + p.nx * (p.ny - 1 - j)),
          T = state.temperature[k],
          ink = state.dye[k],
          base = rgb(T);
        const color = dye
          ? base.map((v, z) =>
              Math.round(
                v * 0.8 +
                  227 * 0.2 +
                  ([72, 61, 97][z] - (v * 0.8 + 227 * 0.2)) * Math.min(1, ink * 8),
              ),
            )
          : base;
        for (let z = 0; z < 3; z++) pixels.data[out + z] = color[z];
        pixels.data[out + 3] = 255;
      }
    c.putImageData(pixels, 0, 0);
    ctx.imageSmoothingEnabled = !grid;
    ctx.drawImage(cells, 0, 0, W, H);
    const overlay = convectionOverlay(state, view, W),
      { scale } = overlay;
    if (overlay.grid.length) {
      ctx.strokeStyle = 'rgba(71,57,42,.18)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      overlay.grid.forEach(({ start, end }) => {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      });
      ctx.stroke();
    }
    if (overlay.section) {
      ctx.strokeStyle = 'rgba(61,52,44,.52)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(overlay.section.start.x, overlay.section.start.y);
      ctx.lineTo(overlay.section.end.x, overlay.section.end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = 'rgba(63,55,42,.55)';
    ctx.lineWidth = 1.2;
    overlay.arrows.forEach(({ start, tip, wings }) => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.lineTo(wings[0].x, wings[0].y);
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(wings[1].x, wings[1].y);
      ctx.stroke();
    });
    state.particles.forEach((a) => {
      const active = a.id === probe;
      ctx.beginPath();
      ctx.arc(a.x * scale, (1 - a.y) * scale, active ? 5 : 2.1, 0, 2 * Math.PI);
      ctx.fillStyle = active ? '#fff7dd' : 'rgba(255,250,225,.72)';
      ctx.fill();
      if (active) {
        ctx.strokeStyle = '#443c31';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    });
    // A softly lit glass surface; all content beneath it is computed temperature/velocity.
    const glaze = ctx.createLinearGradient(0, 0, W, H);
    glaze.addColorStop(0, 'rgba(255,252,226,.12)');
    glaze.addColorStop(0.48, 'rgba(255,255,255,0)');
    glaze.addColorStop(1, 'rgba(94,56,38,.06)');
    ctx.fillStyle = glaze;
    ctx.fillRect(0, 0, W, H);
    cells.width = 0;
    cells.height = 0;
  }, [state, width, view, probe]);
  const fallbackOverlay = noCanvas ? convectionOverlay(state, view, width) : null;
  const fallbackRects = [];
  if (noCanvas)
    for (let j = 0; j < p.ny; j++)
      for (let i = 0; i < p.nx; i++) {
        const k = i + p.nx * j,
          base = rgb(state.temperature[k]),
          color = dye
            ? base.map((v, z) =>
                Math.round(
                  v * 0.8 +
                    227 * 0.2 +
                    ([72, 61, 97][z] - (v * 0.8 + 227 * 0.2)) * Math.min(1, state.dye[k] * 8),
                ),
              )
            : base;
        fallbackRects.push(
          <rect
            key={i + p.nx * j}
            x={(i * width) / p.nx}
            y={((p.ny - 1 - j) * width) / p.width / p.ny}
            width={width / p.nx + 0.1}
            height={width / p.width / p.ny + 0.1}
            fill={`rgb(${color.join(',')})`}
          />,
        );
      }
  return (
    <figure className={`convection-vessel${compact ? ' convection-vessel-compact' : ''}`}>
      <figcaption>
        <span>{title}</span>
        <span>t* {(state.step * p.dt).toFixed(1)}</span>
      </figcaption>
      <div
        className="convection-top-plate"
        style={{
          background: plates.top > 0.5 ? '#965434' : plates.top < 0.5 ? '#526f7c' : '#746c58',
        }}
      >
        <span>
          {t('上板')} · T* {plates.top.toFixed(1)}
        </span>
      </div>
      <div className="convection-glass" ref={host}>
        {noCanvas ? (
          <svg
            viewBox={`0 0 ${width} ${width / p.width}`}
            role="img"
            aria-label={t('温度与无穿透边界的二维备用视图')}
          >
            {fallbackRects}
            {fallbackOverlay!.grid.map(({ start, end }, i) => (
              <path
                key={`grid-${i}`}
                d={`M${start.x},${start.y}L${end.x},${end.y}`}
                stroke="#47392a"
                strokeOpacity=".18"
                strokeWidth=".5"
              />
            ))}
            {fallbackOverlay!.section && (
              <path
                className="convection-section-mark"
                d={`M0,${fallbackOverlay!.section.start.y}H${width}`}
                stroke="#3d342c"
                strokeOpacity=".52"
                strokeWidth="1"
                strokeDasharray="5 5"
              />
            )}
            {fallbackOverlay!.arrows.map((arrow, i) => (
              <path
                key={i}
                className="convection-velocity-mark"
                d={convectionArrowPath(arrow)}
                fill="none"
                stroke="#3f372a"
                strokeOpacity=".55"
                strokeWidth="1.2"
              />
            ))}
            {state.particles.map((a) => (
              <circle
                key={a.id}
                cx={a.x * fallbackOverlay!.scale}
                cy={(1 - a.y) * fallbackOverlay!.scale}
                r={a.id === probe ? 5 : 2.1}
                fill="#fff6d9"
                stroke={a.id === probe ? '#443c31' : 'none'}
                strokeWidth="1.6"
              />
            ))}
          </svg>
        ) : (
          <canvas
            ref={canvas}
            role="img"
            aria-label={t('封闭流体格点计算：颜色为温度，示踪点跟随同一速度场。')}
          />
        )}
      </div>
      <div
        className="convection-bottom-plate"
        style={{
          background: plates.bottom > 0.5 ? '#965434' : plates.bottom < 0.5 ? '#526f7c' : '#746c58',
        }}
      >
        <span>
          {t('下板')} · T* {plates.bottom.toFixed(1)}
        </span>
      </div>
      {!compact && view === 'dye' && (
        <p className="convection-tracer">
          {t('亮点的局部温度')}{' '}
          <b>T* {convectionScalar(p, state.temperature, selected.x, selected.y).toFixed(3)}</b>
        </p>
      )}
    </figure>
  );
}
