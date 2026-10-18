import { useEffect, useId, useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  antennaBudget,
  antennaTemperature,
  clampCosmo,
  cooledRadiation,
  cosmologyDirector,
  expandingGalaxies,
  hornGeometry,
  hubbleCandidate,
  LIGHT_SPEED,
  mollweide,
  planckRadiance,
  skyFluctuation,
  spectralPattern,
  wavePacket,
  type CosmoDirection,
  type CosmoPoint,
  type CosmoShot,
} from '../../models/cosmology-observations';
import {
  FIRAS_RECORDS,
  HUBBLE_RECORDS,
  PENZIAS_WILSON_RECORD,
} from '../../models/cosmology-observations-records';
import '../../styles/cosmology-observations.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#35534f',
  green = '#427a70',
  gold = '#926629',
  blue = '#587fa0',
  pale = '#dbe7df',
  gray = '#65776f';
const path = (p: readonly CosmoPoint[]) =>
  p.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
function Arrow({
  x,
  y,
  dx,
  dy = 0,
  color = gold,
  dashed = false,
}: {
  x: number;
  y: number;
  dx: number;
  dy?: number;
  color?: string;
  dashed?: boolean;
}) {
  const a = Math.atan2(dy, dx),
    ex = x + dx,
    ey = y + dy;
  return (
    <g fill={color} stroke={color} strokeWidth="1.7">
      <path d={`M${x} ${y}L${ex} ${ey}`} strokeDasharray={dashed ? '5 4' : undefined} />
      {Math.hypot(dx, dy) > 2 && (
        <path
          d={`M${ex} ${ey}L${ex - 6 * Math.cos(a - 0.45)} ${ey - 6 * Math.sin(a - 0.45)}L${ex - 6 * Math.cos(a + 0.45)} ${ey - 6 * Math.sin(a + 0.45)}Z`}
          stroke="none"
        />
      )}
    </g>
  );
}
function Galaxy({
  x,
  y,
  id,
  active = false,
}: {
  x: number;
  y: number;
  id: string;
  active?: boolean;
}) {
  return (
    <g data-galaxy-id={id} data-galaxy-x={x} data-galaxy-y={y}>
      <ellipse
        cx={x}
        cy={y}
        rx="12"
        ry="6"
        transform={`rotate(-22 ${x} ${y})`}
        fill={active ? '#a8c6b6' : pale}
        stroke={active ? green : gray}
      />
      <circle cx={x} cy={y} r="2.5" fill={active ? gold : green} />
      <text x={x} y={y + 24} textAnchor="middle">
        {id}
      </text>
    </g>
  );
}
function Spectrum({
  w,
  h,
  reveal,
  ratio,
}: {
  w: number;
  h: number;
  reveal: boolean;
  ratio: number;
}) {
  const phone = w < 400,
    left = phone ? 12 : 80,
    right = w - (phone ? 12 : 70),
    X = (nm: number) => left + ((nm - 410) / 320) * (right - left),
    rows = [phone ? 76 : 90, phone ? 150 : 185],
    lines = spectralPattern(ratio);
  return (
    <>
      <text x={w / 2} y="23" textAnchor="middle" fill={gray}>
        {tr('教学生成光谱', 'Illustrative spectrum')}
      </text>
      {rows.map((y, j) => (
        <g key={j}>
          <text x={left} y={y - 12}>
            {j
              ? tr('同一星系谱线', 'Galaxy line pattern')
              : tr('实验室模板', 'Laboratory template')}
          </text>
          <rect x={left} y={y} width={right - left} height="24" rx="6" fill="#edf1ec" />
          {lines.map(
            (l, i) =>
              (j === 0 || i < 2 || reveal) && (
                <g
                  key={l.id}
                  data-spectral-line={`${j ? 'observed' : 'lab'}-${l.id}`}
                  data-wavelength={j ? l.observed : l.rest}
                >
                  <path
                    d={`M${X(j ? l.observed : l.rest)} ${y + 2}v20`}
                    stroke={[blue, green, '#b57566'][i]}
                    strokeWidth="3"
                  />
                </g>
              ),
          )}
        </g>
      ))}
      {[450, 550, 650].map((n) => (
        <g key={n}>
          <path d={`M${X(n)} ${rows[1] + 31}v5`} stroke={gray} />
          <text x={X(n)} y={rows[1] + 56} textAnchor="middle">
            {n}
          </text>
        </g>
      ))}
      <text x={right} y={rows[1] + 56} textAnchor="end">
        nm
      </text>
      <text x={w / 2} y={h - 36} textAnchor="middle">
        λobs / λlab = {ratio.toFixed(3)}
      </text>
      <text
        x={w / 2}
        y={h - 10}
        textAnchor="middle"
        data-line-answer={reveal ? 'revealed' : 'hidden'}
      >
        {reveal
          ? `656.28 → ${lines[2].observed.toFixed(2)} nm`
          : tr('第三条谱线将在哪里？', 'Where will line 3 appear?')}
      </text>
    </>
  );
}
function Wave({ w, h, scale }: { w: number; h: number; scale: number }) {
  const state = wavePacket(Math.log(scale) / 0.3, 0.3),
    phone = w < 400,
    px = (w - 32) / 9,
    cy = phone ? 130 : 155,
    X = (x: number) => w / 2 + x * px,
    curve = Array.from({ length: 161 }, (_, i) => {
      const x = -4.5 + (i * 9) / 160;
      return { x: X(x), y: cy - 18 * Math.cos((2 * Math.PI * x) / state.wavelength) };
    });
  return (
    <>
      <text x={w / 2} y="24" textAnchor="middle">
        {tr('追踪同一组波峰', 'Follow the same crests')}
      </text>
      <path d={`M12 ${cy}H${w - 12}`} stroke={pale} />
      <path d={path(curve)} stroke={green} strokeWidth="2.3" fill="none" />
      {state.crests.map((c) => (
        <g key={c.id} data-crest-id={c.id} data-proper-x={c.x}>
          <circle cx={X(c.relativeX)} cy={cy - 18} r="4" fill={gold} />
          <text x={X(c.relativeX)} y={cy - 35} textAnchor="middle">
            {c.id + 3}
          </text>
        </g>
      ))}
      <Arrow x={X(-state.wavelength)} y={cy + 35} dx={state.wavelength * px} />
      <text x={X(-state.wavelength / 2)} y={cy + 61} textAnchor="middle">
        λ × {state.scale.toFixed(2)}
      </text>
      <text x={w / 2} y={h - 30} textAnchor="middle">
        {`E × ${(1 / state.scale).toFixed(2)} · `}
        {tr('当地 c 不变', 'local c unchanged')}
      </text>
      <text x={w / 2} y={h - 7} textAnchor="middle" fill={gray}>
        {tr('无量纲尺度模型', 'Dimensionless scale model')}
      </text>
    </>
  );
}
function HubbleRecords({
  w,
  h,
  kind,
}: {
  w: number;
  h: number;
  kind: 'constant' | 'proportional';
}) {
  const phone = w < 400,
    left = phone ? 45 : 65,
    right = w - 14,
    top = 46,
    bottom = h - 58,
    X = (d: number) => left + (d / 2.1) * (right - left),
    Y = (v: number) => bottom - ((v + 300) / 1500) * (bottom - top),
    fit = hubbleCandidate(kind);
  return (
    <>
      <text x={left} y="22">
        v / (km/s)
      </text>
      <path d={`M${left} ${top}V${bottom}H${right}`} stroke={gray} fill="none" />
      {[0, 600, 1200].map((v) => (
        <g key={v}>
          <path d={`M${left} ${Y(v)}H${right}`} stroke={pale} />
          <text x={left - 7} y={Y(v) + 5} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {[0, 1, 2].map((v) => (
        <text x={X(v)} y={bottom + 23} textAnchor="middle" key={v}>
          {v}
        </text>
      ))}
      <path
        d={`M${X(0)} ${Y(fit.predict(0))}L${X(2.05)} ${Y(fit.predict(2.05))}`}
        stroke={gold}
        strokeWidth="2"
        strokeDasharray="5 4"
        data-hubble-candidate={kind}
      />
      {HUBBLE_RECORDS.map((r) => (
        <circle
          key={r.id}
          data-hubble-id={r.id}
          cx={X(r.distanceMpcHistorical)}
          cy={Y(r.radialVelocityKmPerSecondMeasured)}
          r={phone ? 3.6 : 4.5}
          fill={green}
          stroke="white"
          strokeWidth=".7"
        />
      ))}
      <text x={w / 2} y={h - 10} textAnchor="middle">
        {tr('1929 原表 · D / Mpc', '1929 raw table · D / Mpc')}
      </text>
    </>
  );
}
function Expansion({
  w,
  h,
  scale,
  origin,
  H,
}: {
  w: number;
  h: number;
  scale: number;
  origin: number;
  H: number;
}) {
  const phone = w < 400,
    px = phone ? (w - 42) / 8 : 62,
    cy = phone ? 95 : 110,
    py = phone ? 22 : 35,
    gs = expandingGalaxies(scale, H, origin),
    X = (x: number) => w / 2 + x * px,
    o = gs[origin],
    near = gs[origin + 1],
    far = gs[origin + 2];
  return (
    <>
      <text x={w / 2} y="23" textAnchor="middle">
        {tr('均匀膨胀模型', 'Uniform expansion model')}
      </text>
      {gs.map((g) => (
        <g key={g.id}>
          {g.id !== o.id && (
            <path d={`M${X(o.x)} ${cy + o.y * py}L${X(g.x)} ${cy + g.y * py}`} stroke={pale} />
          )}
          <Galaxy id={g.id} x={X(g.x)} y={cy + g.y * py} active={g.id === o.id} />
        </g>
      ))}
      {[near, far].filter(Boolean).map((g, i) => (
        <g key={g.id}>
          <Arrow x={X(o.x)} y={h - 76 + i * 32} dx={X(g.x) - X(o.x)} color={i ? gold : blue} />
          <text x={w / 2} y={h - 81 + i * 32} textAnchor="middle">
            {o.id}–{g.id}: {g.distance.toFixed(0)} Mpc
          </text>
        </g>
      ))}
      <text x={w / 2} y={h - 6} textAnchor="middle">
        {tr('同一尺度比：ΔD ∝ D', 'Same scale ratio: ΔD ∝ D')}
      </text>
    </>
  );
}
function DistancePrediction({
  w,
  h,
  reveal,
  H,
}: {
  w: number;
  h: number;
  reveal: boolean;
  H: number;
}) {
  const left = 27,
    unit = (w - 77) / 100;
  return (
    <>
      <text x={w / 2} y="28" textAnchor="middle">
        H = {H} (km/s)/Mpc
      </text>
      {[50, 100].map((d, i) => (
        <g key={d}>
          <path d={`M${left} ${76 + i * 99}H${left + d * unit}`} stroke={pale} strokeWidth="6" />
          <Galaxy x={left} y={76 + i * 99} id="C" active />
          <Galaxy x={left + d * unit} y={76 + i * 99} id={i ? 'E' : 'D'} />
          {(i === 0 || reveal) && (
            <Arrow x={left + d * unit} y={76 + i * 99 - 24} dx={(d * H) / 350} color={gold} />
          )}
          <text x={w / 2} y={126 + i * 99} textAnchor="middle">
            {d} Mpc → {i && !reveal ? '?' : `${d * H} km/s`}
          </text>
        </g>
      ))}
      <text
        x={w / 2}
        y={h - 8}
        textAnchor="middle"
        data-distance-answer={reveal ? 'revealed' : 'hidden'}
      >
        {reveal ? 'D × 2 → v × 2' : tr('同一时刻，距离加倍呢？', 'Same epoch: twice the distance?')}
      </text>
    </>
  );
}
function Horn({
  w,
  h,
  elevation,
  reference,
}: {
  w: number;
  h: number;
  elevation: number;
  reference: boolean;
}) {
  const g = hornGeometry(w, h, elevation),
    active = reference ? g.referenceRoute : g.skyRoute;
  return (
    <>
      <text x="12" y="23">
        {tr('天空与已知冷负载作比较', 'Sky / known cold reference')}
      </text>
      <path
        d={`M${g.pivot.x} ${g.pivot.y + 5}V${h - 33}m-25 0h50`}
        stroke={gray}
        strokeWidth="5"
        fill="none"
      />
      <path
        d={`${path(g.outline)}Z`}
        fill="#cadbd5"
        stroke={green}
        strokeWidth="1.7"
        data-horn-outline="true"
      />
      <path
        d={`M${g.mouth.x - 27 * g.n.x} ${g.mouth.y - 27 * g.n.y}L${g.mouth.x + 27 * g.n.x} ${g.mouth.y + 27 * g.n.y}`}
        stroke={blue}
        strokeWidth="3"
      />
      <path
        d={path([g.incoming, g.mouth, g.throat, g.port])}
        stroke={reference ? pale : gold}
        strokeWidth="2"
        fill="none"
        data-horn-axis="true"
      />
      <circle cx={g.port.x} cy={g.port.y} r="3" fill={green} data-horn-output="true" />
      <path d={path(g.skyRoute)} stroke={gray} fill="none" strokeWidth="4" data-horn-route="sky" />
      <rect
        x={g.reference.x - 22}
        y={g.reference.y - 22}
        width="44"
        height="39"
        rx="9"
        fill="#e1ebf0"
        stroke={blue}
      />
      <text x={g.reference.x} y={g.reference.y + 4} textAnchor="middle">
        ref
      </text>
      <path
        d={path(g.referenceRoute)}
        stroke={gray}
        fill="none"
        strokeWidth="4"
        data-horn-route="reference"
      />
      <path d={path(active)} stroke={gold} fill="none" strokeWidth="2.3" data-horn-route="active" />
      <circle
        cx={g.selector.x}
        cy={g.selector.y}
        r="9"
        fill="#f5f6f0"
        stroke={green}
        data-horn-selector="true"
      />
      <path
        d={`M${g.selector.x} ${g.selector.y + 8}L${g.selector.x + (reference ? 0 : -7)} ${g.selector.y - 6}`}
        stroke={gold}
        strokeWidth="2"
      />
      <rect
        x={g.receiver.x - 43}
        y={g.receiver.y - 17}
        width="86"
        height="34"
        rx="8"
        fill={pale}
        stroke={green}
        data-horn-receiver="true"
      />
      <text x={g.receiver.x} y={g.receiver.y + 6} textAnchor="middle">
        {reference ? 'ref' : 'sky'}
      </text>
      <text x={w / 2} y={h - 6} textAnchor="middle">
        {tr('切换输入，共用接收机', 'Switch inputs, one receiver')}
      </text>
    </>
  );
}
function Airmass({ w, h, elevation }: { w: number; h: number; elevation: number }) {
  const a = antennaTemperature(elevation),
    angle = (a.elevation * Math.PI) / 180,
    depth = 62,
    end = { x: w - 28, y: 128 },
    start = { x: w - 28 - depth / Math.tan(angle), y: 66 };
  return (
    <>
      <rect x="12" y="66" width={w - 24} height={depth} rx="5" fill="#e4edf0" />
      <path d={`M12 66H${w - 12}M12 128H${w - 12}`} stroke={blue} strokeDasharray="4 4" />
      <text x="16" y="39">
        {tr('同一厚度的大气层', 'Same atmospheric depth')}
      </text>
      <Arrow x={start.x} y={start.y} dx={end.x - start.x} dy={depth} />
      <path
        d={`M${end.x - 36} ${end.y}a36 36 0 0 1 ${36 - 36 * Math.cos(angle)} ${-36 * Math.sin(angle)}`}
        stroke={blue}
        fill="none"
      />
      <text x={w - 42} y="155" textAnchor="end">
        {a.elevation.toFixed(0)}°
      </text>
      <text x={w / 2} y="193" textAnchor="middle">
        {tr('大气贡献', 'Atmosphere')}: {a.atmosphere.toFixed(1)} K
      </text>
      <text x={w / 2} y="223" textAnchor="middle">
        {tr('总天线温度', 'Total antenna')}: {a.total.toFixed(1)} K
      </text>
      <text x={w / 2} y={h - 7} textAnchor="middle" fill={gray}>
        {tr('非天顶值为气层模型', 'Non-zenith values: airmass model')}
      </text>
    </>
  );
}
function Budget({
  w,
  h,
  subtract,
  reveal,
}: {
  w: number;
  h: number;
  subtract: number;
  reveal: boolean;
}) {
  const b = antennaBudget(subtract),
    r = PENZIAS_WILSON_RECORD,
    left = 15,
    width = w - 30,
    values = [r.atmosphereK, r.antennaAndBacklobeK, r.excessK],
    colors = [blue, gray, green];
  let x = left;
  return (
    <>
      <text x={w / 2} y="26" textAnchor="middle">
        {tr('1965 天顶记录 · 4.08 GHz', '1965 zenith record · 4.08 GHz')}
      </text>
      <text x={w / 2} y="57" textAnchor="middle">
        {tr('实测总量', 'Measured total')} 6.7 K
      </text>
      {values.map((v, i) => {
        const xx = x;
        x += (v / 6.7) * width;
        return (
          <rect
            x={xx}
            y="76"
            width={(v / 6.7) * width}
            height="28"
            rx="3"
            fill={colors[i]}
            opacity={i < subtract ? 0.2 : 0.85}
            key={i}
          />
        );
      })}
      <text x="15" y="143">
        {tr('大气', 'Atmosphere')}: −{b.removedAtmosphere.toFixed(1)} K
      </text>
      <text x="15" y="174">
        {tr('天线及旁瓣', 'Antenna / sidelobes')}: −{b.removedAntenna.toFixed(1)} K
      </text>
      <text
        x={w / 2}
        y="219"
        textAnchor="middle"
        fill={green}
        data-antenna-remainder={reveal ? 'revealed' : 'hidden'}
      >
        {reveal
          ? `${b.remaining.toFixed(1)}${subtract === 2 ? ' ± 1.0' : ''} K`
          : tr('仍有多少无法解释？', 'How much remains unexplained?')}
      </text>
      <text x={w / 2} y={h - 7} textAnchor="middle" fill={gray}>
        {tr('等效天线噪声温度', 'Antenna noise temperature')}
      </text>
    </>
  );
}
function Firas({ w, h, residual }: { w: number; h: number; residual: boolean }) {
  const left = w < 400 ? 43 : 65,
    right = w - 14,
    top = 43,
    bottom = h - 57,
    X = (f: number) => left + (f / 700) * (right - left),
    Y = (v: number) =>
      residual ? bottom - ((v + 800) / 1200) * (bottom - top) : bottom - (v / 420) * (bottom - top),
    reference = useMemo(
      () =>
        path(
          Array.from({ length: 181 }, (_, i) => ({
            x: left + ((i * 4) / 700) * (right - left),
            y: bottom - (planckRadiance(i * 4e9, 2.725) / 420) * (bottom - top),
          })),
        ),
      [left, right, bottom, top],
    );
  return (
    <>
      <text x={left} y="23">
        {residual ? 'ΔI / (kJy/sr)' : 'Iν / (MJy/sr)'}
      </text>
      {!residual && (
        <text x={right} y="23" textAnchor="end" fill={gold}>
          2.725 K ref
        </text>
      )}
      <path d={`M${left} ${top}V${bottom}H${right}`} stroke={gray} fill="none" />
      {(residual ? [-600, 0, 400] : [0, 200, 400]).map((v) => (
        <g key={v}>
          <path d={`M${left} ${Y(v)}H${right}`} stroke={pale} />
          <text x={left - 7} y={Y(v) + 5} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {[0, 300, 600].map((v) => (
        <text x={X(v)} y={bottom + 23} textAnchor="middle" key={v}>
          {v}
        </text>
      ))}
      {!residual && (
        <path
          d={reference}
          stroke={gold}
          strokeWidth="2"
          fill="none"
          data-firas-reference="2.725K"
        />
      )}
      {FIRAS_RECORDS.map((r, i) => {
        const f = (r.waveNumberPerCm * 100 * LIGHT_SPEED) / 1e9,
          y = residual ? r.publishedResidualKJySr : r.archiveMonopoleMJySr;
        return (
          <g key={i} data-firas-bin={i}>
            {residual && (
              <path d={`M${X(f)} ${Y(y - r.sigmaKJySr)}V${Y(y + r.sigmaKJySr)}`} stroke={gray} />
            )}
            <circle cx={X(f)} cy={Y(y)} r={residual ? 2.7 : 2.8} fill={green} />
          </g>
        );
      })}
      <text x={w / 2} y={h - 8} textAnchor="middle">
        {tr('FIRAS 处理数据 · ν / GHz', 'Processed FIRAS · ν / GHz')}
      </text>
    </>
  );
}
function Cooling({
  w,
  h,
  scale,
  reveal,
}: {
  w: number;
  h: number;
  scale: number;
  reveal: boolean;
}) {
  const a = cooledRadiation(reveal ? scale : 1),
    left = w < 400 ? 42 : 65,
    right = w - 14,
    top = 98,
    bottom = h - 53,
    X = (f: number) => left + (f / 720) * (right - left),
    Y = (v: number) => bottom - (v / 420) * (bottom - top),
    today = useMemo(() => cooledRadiation(1), []),
    base = useMemo(
      () => path(today.spectrum.map((p) => ({ x: X(p.frequencyGHz), y: Y(p.radiance) }))),
      [w, h],
    ),
    current = path(a.spectrum.map((p) => ({ x: X(p.frequencyGHz), y: Y(p.radiance) }))),
    waveWidth = 35 * a.scale,
    waveCenter = w / 2,
    wave = Array.from({ length: 121 }, (_, i) => {
      const x = w / 2 - 90 + i * 1.5;
      return { x, y: 52 - 9 * Math.cos((2 * Math.PI * (x - waveCenter)) / waveWidth) };
    });
  return (
    <>
      <text x={w / 2} y="23" textAnchor="middle">
        λ × {a.wavelengthRatio.toFixed(2)} · E × {a.photonEnergyRatio.toFixed(2)}
      </text>
      <path d={path(wave)} stroke={green} fill="none" strokeWidth="2" />
      {[0, 1].map((i) => (
        <circle
          key={i}
          cx={waveCenter + i * waveWidth}
          cy="43"
          r="3.5"
          fill={gold}
          data-cooling-crest={i}
        />
      ))}
      <text x={left} y="85">
        Iν / (MJy/sr)
      </text>
      <text x={right} y="85" textAnchor="end" fill={gray}>
        2.725 K
      </text>
      <path d={`M${left} ${top}V${bottom}H${right}`} stroke={gray} fill="none" />
      {[0, 400].map((v) => (
        <text key={v} x={left - 7} y={Y(v) + 5} textAnchor="end">
          {v}
        </text>
      ))}
      {(w < 400 ? [0, 300] : [0, 300, 600]).map((v) => (
        <text x={X(v)} y={bottom + 22} textAnchor="middle" key={v}>
          {v}
        </text>
      ))}
      <text x={right} y={bottom + 22} textAnchor="end">
        ν / GHz
      </text>
      <path d={base} stroke={gray} fill="none" strokeWidth="2" strokeDasharray="4 3" />
      {reveal && (
        <path
          d={current}
          stroke={green}
          fill="none"
          strokeWidth="2.5"
          data-cooling-curve="future"
        />
      )}
      <text
        x={w / 2}
        y={h - 6}
        textAnchor="middle"
        data-cooling-answer={reveal ? 'revealed' : 'hidden'}
      >
        {reveal
          ? `${a.temperature.toFixed(4)} K`
          : tr('尺度再加倍，温度会怎样？', 'Scale doubles: what happens to T?')}
      </text>
    </>
  );
}
function SkyMap({ w, h, position }: { w: number; h: number; position: number }) {
  const map = useMemo(
      () =>
        Array.from({ length: 720 }, (_, i) => {
          const a = i % 40,
            b = Math.floor(i / 40),
            lon = -Math.PI + (a / 40) * Math.PI * 2,
            lat = -Math.PI / 2 + (b / 18) * Math.PI,
            pts = [
              [lon, lat],
              [lon + Math.PI / 20, lat],
              [lon + Math.PI / 20, lat + Math.PI / 18],
              [lon, lat + Math.PI / 18],
            ].map(([l, p]) => mollweide(l, p)),
            signal = skyFluctuation(lon + Math.PI / 40, lat + Math.PI / 36);
          return {
            d: path(pts) + 'Z',
            color:
              signal > 0
                ? `hsl(${43 - signal * 0.35} 42% ${65 - Math.abs(signal) * 0.2}%)`
                : `hsl(${194 - signal * 0.12} 33% ${65 - Math.abs(signal) * 0.2}%)`,
          };
        }),
      [],
    ),
    sx = (w - 24) / 300,
    sy = (h - 105) / 150,
    lon = -Math.PI + clampCosmo(position, 0, 1) * 2 * Math.PI,
    chosen = mollweide(lon, 0.2);
  return (
    <>
      <text x={w / 2} y="22" textAnchor="middle">
        {tr('回到今天 · 平均 2.725 K', 'Today again · mean 2.725 K')}
      </text>
      <g transform={`translate(${12 - 20 * sx} ${55 - 103 * sy}) scale(${sx} ${sy})`}>
        {map.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke={p.color} strokeWidth=".7" />
        ))}
        <circle cx={chosen.x} cy={chosen.y} r="5" fill="none" stroke="white" strokeWidth="2" />
      </g>
      <text x={w / 2} y={h - 29} textAnchor="middle">
        ΔT = {skyFluctuation(lon, 0.2).toFixed(1)} μK
      </text>
      <text x={w / 2} y={h - 6} textAnchor="middle" fill={gray}>
        {tr('合成示意图 · 颜色已放大', 'Synthetic map · amplified colors')}
      </text>
    </>
  );
}
const SHOTS: readonly CosmoShot[] = [
  'spectrum',
  'wave',
  'records',
  'field',
  'prediction',
  'horn',
  'airmass',
  'budget',
  'firas',
  'residual',
  'cooling',
  'map',
];
function shotName(shot: CosmoShot) {
  const labels: Record<CosmoShot, [string, string]> = {
    spectrum: ['同一组谱线', 'One line pattern'],
    wave: ['波峰为什么分开？', 'Why do crests separate?'],
    records: ['固定记录，比较解释', 'Fixed records, competing descriptions'],
    field: ['同样增长，远近不同', 'One scale, different increments'],
    prediction: ['距离加倍，速度呢？', 'Twice the distance: what speed?'],
    horn: ['哪个输入进入接收机？', 'Which input reaches the receiver?'],
    airmass: ['仰角改变了什么？', 'What changes with elevation?'],
    budget: ['剩余信号来自哪里？', 'Where does the excess come from?'],
    firas: ['后来测量整个频谱', 'Later: measure the spectrum'],
    residual: ['放大已发表的残差', 'Magnify published residuals'],
    cooling: ['假想的进一步膨胀', 'Hypothetical further expansion'],
    map: ['平均值之外的细微起伏', 'Tiny variations about the mean'],
  };
  return tr(...labels[shot]);
}
/** Compatibility for the existing static-cover API; new films use the explicit direction object. */
export function CosmologyArtwork({
  mode = 0,
  phase = 0,
  value = 0.6,
  H0 = 70,
  direction,
  width = 640,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  H0?: number;
  direction?: CosmoDirection;
  width?: number;
}) {
  const w = clampCosmo(width, 240, 800, 640),
    h = w < 400 ? 270 : 300,
    id = useId().replace(/:/g, ''),
    d =
      direction ??
      ({
        shot:
          mode === 0
            ? phase
              ? 'records'
              : 'spectrum'
            : phase === 2
              ? 'map'
              : phase === 1
                ? 'budget'
                : 'horn',
        progress: value,
        reveal: true,
        scale: 1.05,
        origin: 2,
        candidate: 'proportional',
        reference: false,
        elevation: 30 + value * 60,
        subtract: 2,
      } as CosmoDirection);
  return (
    <svg
      className="cosmoobs-art"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={shotName(d.shot)}
      data-cosmology-shot={d.shot}
      id={id}
    >
      {d.shot === 'spectrum' && (
        <Spectrum w={w} h={h} reveal={d.reveal} ratio={direction ? 1.05 : d.scale} />
      )}
      {d.shot === 'wave' && <Wave w={w} h={h} scale={d.scale} />}
      {d.shot === 'records' && <HubbleRecords w={w} h={h} kind={d.candidate} />}
      {d.shot === 'field' && <Expansion w={w} h={h} scale={d.scale} origin={d.origin} H={H0} />}
      {d.shot === 'prediction' && <DistancePrediction w={w} h={h} reveal={d.reveal} H={H0} />}
      {d.shot === 'horn' && <Horn w={w} h={h} elevation={d.elevation} reference={d.reference} />}
      {d.shot === 'airmass' && <Airmass w={w} h={h} elevation={d.elevation} />}
      {d.shot === 'budget' && <Budget w={w} h={h} subtract={d.subtract} reveal={d.reveal} />}
      {(d.shot === 'firas' || d.shot === 'residual') && (
        <Firas w={w} h={h} residual={d.shot === 'residual'} />
      )}
      {d.shot === 'cooling' && <Cooling w={w} h={h} scale={d.scale} reveal={d.reveal} />}
      {d.shot === 'map' && <SkyMap w={w} h={h} position={d.progress} />}
    </svg>
  );
}
export default function CosmologyObservations() {
  const film = useShowcase(),
    [phone, setPhone] = useState(false),
    [shot, setShot] = useState<CosmoShot>(film.variant === 'required-2-cmb' ? 'horn' : 'spectrum'),
    [value, setValue] = useState(0.5),
    [reveal, setReveal] = useState(false),
    [H, setH] = useState(70),
    [origin, setOrigin] = useState(2),
    [candidate, setCandidate] = useState<'constant' | 'proportional'>('proportional'),
    [reference, setReference] = useState(false),
    [subtract, setSubtract] = useState(2);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(max-width:640px)'),
      change = () => setPhone(m.matches);
    change();
    m.addEventListener('change', change);
    return () => m.removeEventListener('change', change);
  }, []);
  const d: CosmoDirection = film.watch
      ? cosmologyDirector(film.chapter, film.chapterTime, browserLocale() === 'en' ? 'en' : 'zh')
      : {
          shot,
          progress: value,
          reveal,
          scale: 1 + value,
          origin,
          candidate,
          reference,
          elevation: 30 + value * 60,
          subtract,
        },
    select = (s: CosmoShot) => {
      setShot(s);
      setReveal(false);
    };
  return (
    <div className="cosmoobs">
      <div className="cosmoobs-heading">
        {d.shot === 'records'
          ? tr('24个固定记录', '24 fixed records') +
            (d.candidate === 'constant' ? ' · v = const' : ' · v ∝ D')
          : shotName(d.shot)}
      </div>
      <CosmologyArtwork direction={d} width={phone ? 268 : 640} H0={film.watch ? 70 : H} />
      {!film.watch && (
        <div className="cosmoobs-controls">
          <label>
            {tr('选择因果镜头', 'Choose a causal view')}
            <select value={shot} onChange={(e) => select(e.target.value as CosmoShot)}>
              {SHOTS.map((s) => (
                <option key={s} value={s}>
                  {shotName(s)}
                </option>
              ))}
            </select>
          </label>
          {['spectrum', 'prediction', 'budget', 'cooling'].includes(shot) && (
            <button type="button" onClick={() => setReveal(!reveal)} aria-pressed={reveal}>
              {reveal ? tr('重新预测', 'Predict again') : tr('揭晓预测', 'Reveal prediction')}
            </button>
          )}
          {['wave', 'field', 'horn', 'airmass', 'cooling', 'map'].includes(shot) && (
            <Range
              label={
                shot === 'horn' || shot === 'airmass'
                  ? tr('天线仰角', 'Antenna elevation')
                  : shot === 'map'
                    ? tr('天区经度', 'Sky longitude')
                    : tr('尺度比 a', 'Scale factor a')
              }
              value={
                shot === 'horn' || shot === 'airmass'
                  ? 30 + value * 60
                  : shot === 'map'
                    ? -180 + value * 360
                    : 1 + value
              }
              min={shot === 'horn' || shot === 'airmass' ? 30 : shot === 'map' ? -180 : 1}
              max={shot === 'horn' || shot === 'airmass' ? 90 : shot === 'map' ? 180 : 2}
              step={['horn', 'airmass', 'map'].includes(shot) ? 1 : 0.01}
              unit={['horn', 'airmass', 'map'].includes(shot) ? '°' : ''}
              onChange={(n) =>
                setValue(
                  shot === 'horn' || shot === 'airmass'
                    ? (n - 30) / 60
                    : shot === 'map'
                      ? (n + 180) / 360
                      : n - 1,
                )
              }
            />
          )}
          {shot === 'horn' && (
            <div className="cosmoobs-buttons">
              <button type="button" onClick={() => setReference(false)} aria-pressed={!reference}>
                {tr('天空输入', 'Sky input')}
              </button>
              <button type="button" onClick={() => setReference(true)} aria-pressed={reference}>
                {tr('冷负载输入', 'Cold-reference input')}
              </button>
            </div>
          )}
          {shot === 'records' && (
            <div className="cosmoobs-buttons">
              <button
                type="button"
                aria-pressed={candidate === 'constant'}
                onClick={() => setCandidate('constant')}
              >
                {tr('恒定速度候选', 'Constant speed')}
              </button>
              <button
                type="button"
                aria-pressed={candidate === 'proportional'}
                onClick={() => setCandidate('proportional')}
              >
                {tr('正比关系候选', 'Proportional relation')}
              </button>
            </div>
          )}
          {shot === 'field' && (
            <div className="cosmoobs-buttons">
              {[1, 2].map((i) => (
                <button
                  type="button"
                  key={i}
                  aria-pressed={origin === i}
                  onClick={() => setOrigin(i)}
                >
                  {tr('原点', 'Origin')} {i === 1 ? 'B' : 'C'}
                </button>
              ))}
            </div>
          )}
          {shot === 'prediction' && (
            <Range
              label={tr('独立模型 H / (km/s)/Mpc', 'Separate model H / (km/s)/Mpc')}
              value={H}
              min={50}
              max={90}
              step={1}
              onChange={setH}
            />
          )}
          {shot === 'budget' && (
            <div className="cosmoobs-buttons">
              {[0, 1, 2].map((n) => (
                <button
                  type="button"
                  key={n}
                  aria-pressed={subtract === n}
                  onClick={() => setSubtract(n)}
                >
                  {
                    [
                      tr('原始总量', 'Original total'),
                      tr('扣除大气', 'Remove atmosphere'),
                      tr('再扣天线项', 'Remove antenna term'),
                    ][n]
                  }
                </button>
              ))}
            </div>
          )}
          <details>
            <summary>{tr('记录与模型的边界', 'Record and model boundaries')}</summary>
            <p>
              {tr(
                '哈勃点来自1929年原表，距离尺度较旧，速度未经太阳运动修正。候选线不会改写点。FIRAS档案谱是2.725 K参考黑体加已发表残差，不是原始计数，也不是一次新的独立测温。',
                'The Hubble points are the 1929 raw table, on its historical distance scale and without solar-motion correction. Candidates do not move them. The FIRAS archive spectrum is a 2.725 K reference plus published residuals, not raw counts or a new independent temperature measurement.',
              )}
            </p>
            <p>
              {tr(
                '天线余量是等效噪声温度；气层非天顶值、尺度增长、未来冷却和温差图均为明确标注的教学模型。',
                'The antenna excess is an equivalent noise temperature. Non-zenith airmass values, scale growth, future cooling and the angular map are teaching models.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
