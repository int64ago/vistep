import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  convectionPlates,
  convectionScalar,
  convectionVelocity,
  type ConvectionState,
} from '../../models/convection';
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
    const scale = W / p.width;
    if (grid) {
      ctx.strokeStyle = 'rgba(71,57,42,.18)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 1; i < p.nx; i++) {
        ctx.moveTo((i * W) / p.nx, 0);
        ctx.lineTo((i * W) / p.nx, H);
      }
      for (let j = 1; j < p.ny; j++) {
        ctx.moveTo(0, (j * H) / p.ny);
        ctx.lineTo(W, (j * H) / p.ny);
      }
      ctx.stroke();
    }
    if (view === 'transport' || view === 'grid') {
      ctx.strokeStyle = 'rgba(61,52,44,.52)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (view === 'seed' || view === 'plume') {
      ctx.strokeStyle = 'rgba(63,55,42,.55)';
      ctx.lineWidth = 1.2;
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 6; i++) {
          const x = ((i + 0.5) * p.width) / 6,
            y = (j + 0.5) / 4,
            vel = convectionVelocity(p, state.psi, x, y),
            dx = vel.u * scale * 0.2,
            dy = -vel.v * scale * 0.2,
            len = Math.hypot(dx, dy);
          if (len < 0.6) continue;
          const px = x * scale,
            py = (1 - y) * scale,
            ux = dx / len,
            uy = dy / len,
            h = Math.min(4, len * 0.4);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + dx, py + dy);
          ctx.lineTo(px + dx - h * ux + h * 0.55 * uy, py + dy - h * uy - h * 0.55 * ux);
          ctx.moveTo(px + dx, py + dy);
          ctx.lineTo(px + dx - h * ux - h * 0.55 * uy, py + dy - h * uy + h * 0.55 * ux);
          ctx.stroke();
        }
    }
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
            x={(i * 300) / p.nx}
            y={((p.ny - 1 - j) * 200) / p.ny}
            width={300 / p.nx + 0.1}
            height={200 / p.ny + 0.1}
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
          <svg viewBox="0 0 300 200" role="img" aria-label={t('温度与无穿透边界的二维备用视图')}>
            {fallbackRects}
            {state.particles.map((a) => (
              <circle
                key={a.id}
                cx={a.x * 200}
                cy={(1 - a.y) * 200}
                r={a.id === probe ? 4 : 1.8}
                fill="#fff6d9"
                stroke={a.id === probe ? '#534535' : 'none'}
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
