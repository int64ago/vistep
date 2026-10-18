import { useEffect, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  bariumSulfate,
  magnesiumAcid,
  magnesiumAcidPerturbation,
  magnesiumIron,
  silverExchange,
  silverSequenceStages,
  silverTransfer,
  silverTransferGeometry,
  silverIodideSaturationRatio,
  precipitationDirector,
  type PrecipitationMode,
  type SilverRoute,
} from '../../models/chem-precipitation-paths';
import '../../styles/chem-precipitation-paths.css';
type Say = (zh: string, en: string) => string;
const ease = (p: number) => {
  const x = Math.max(0, Math.min(1, p));
  return x * x * (3 - 2 * x);
};
const colours = ['#e4e4cf', '#ddc76a', '#425e50'];
function Ion({
  x,
  y,
  label,
  colour = '#aac2af',
  tracked = false,
  id,
}: {
  x: number;
  y: number;
  label: string;
  colour?: string;
  tracked?: boolean;
  id?: string;
}) {
  const wide = label.length > 3 ? 64 : label.length > 2 ? 48 : 34;
  return (
    <g transform={`translate(${x} ${y})`} data-particle={id}>
      {tracked && (
        <rect
          x={-wide / 2 - 4}
          y={-18}
          width={wide + 8}
          height="36"
          rx="18"
          fill="none"
          stroke="#b58b3d"
          strokeWidth="1.7"
        />
      )}
      <rect x={-wide / 2} y="-14" width={wide} height="28" rx="14" fill={colour} stroke="#f3f1df" />
      <text textAnchor="middle" y="5">
        {label}
      </text>
    </g>
  );
}
function Vessel({
  x,
  y,
  w = 88,
  h = 150,
  solid = 1,
  colour = '#dddccb',
  label,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  solid?: number;
  colour?: string;
  label?: string;
}) {
  const floor = y + h - 10,
    surface = y + 24,
    bed = Math.max(0, Math.min(1, solid)) * 32;
  return (
    <g>
      <path
        d={`M${x - w / 2} ${surface}H${x + w / 2}V${floor - 8}Q${x + w / 2} ${floor} ${x + w / 2 - 10} ${floor}H${x - w / 2 + 10}Q${x - w / 2} ${floor} ${x - w / 2} ${floor - 8}Z`}
        fill="#d3e0ce"
        fillOpacity=".65"
      />
      <path
        d={`M${x - w / 2 + 2} ${floor - bed}Q${x} ${floor - bed - 8} ${x + w / 2 - 2} ${floor - bed}V${floor - 7}Q${x + w / 2 - 2} ${floor - 1} ${x + w / 2 - 10} ${floor - 1}H${x - w / 2 + 10}Q${x - w / 2 + 2} ${floor - 1} ${x - w / 2 + 2} ${floor - 7}Z`}
        fill={colour}
        opacity={Math.min(1, solid * 8)}
      />
      <path
        d={`M${x - w / 2} ${y}V${floor - 9}Q${x - w / 2} ${floor + 2} ${x - w / 2 + 12} ${floor + 2}H${x + w / 2 - 12}Q${x + w / 2} ${floor + 2} ${x + w / 2} ${floor - 9}V${y}`}
        stroke="#8fac9d"
        strokeWidth="2"
        fill="none"
      />
      <path
        d={`M${x - w / 2 + 6} ${y + 6}V${floor - 15}`}
        stroke="#fffdf1"
        strokeWidth="3"
        opacity=".7"
      />
      {label && (
        <text x={x} y={y - 10} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}
function BaOpening({
  width,
  short,
  dose,
  say,
}: {
  width: number;
  short: boolean;
  dose: number;
  say: Say;
}) {
  const h = short ? 184 : 260,
    p = ease(dose),
    floor = h - 20;
  return (
    <>
      <p className="ppx-kicker">
        {say('澄清溶液混合，白色从哪里来？', 'Clear solutions mix. Where does white come from?')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '澄清的硫酸钠与氯化钡溶液混合生成白色沉淀',
          'Clear sodium sulfate and barium chloride solutions mix to form a white precipitate',
        )}
      >
        <Vessel
          x={width * 0.23}
          y={28}
          w={width * 0.24}
          h={short ? 55 : 75}
          solid={0}
          label="Na₂SO₄"
        />
        <Vessel
          x={width * 0.77}
          y={28}
          w={width * 0.24}
          h={short ? 55 : 75}
          solid={0}
          label="BaCl₂"
        />
        <path
          d={`M${width * 0.23} ${short ? 80 : 100}Q${width * 0.28} ${floor - 20} ${width * 0.44} ${floor - 10}M${width * 0.77} ${short ? 80 : 100}Q${width * 0.7} ${floor - 20} ${width * 0.56} ${floor - 10}`}
          stroke="#a5bcb1"
          strokeWidth="3"
          fill="none"
          strokeDasharray="4 5"
          opacity={0.3 + 0.7 * p}
        />
        <path
          d={`M${width * 0.28} ${floor - 50}V${floor}Q${width * 0.28} ${floor + 12} ${width * 0.33} ${floor + 12}H${width * 0.67}Q${width * 0.72} ${floor + 12} ${width * 0.72} ${floor}V${floor - 50}`}
          fill="#c7d9c8"
          fillOpacity=".55"
          stroke="#9db8a4"
        />
        <path
          d={`M${width * 0.29} ${floor - 19 * p}Q${width * 0.5} ${floor - 34 * p} ${width * 0.71} ${floor - 19 * p}V${floor}Q${width * 0.71} ${floor + 10} ${width * 0.65} ${floor + 10}H${width * 0.35}Q${width * 0.29} ${floor + 10} ${width * 0.29} ${floor}Z`}
          fill="#eeead5"
          opacity={p}
        />
      </svg>
      <p className="ppx-equation">{say('观察：固体出现', 'Observation: a solid appears')}</p>
    </>
  );
}
function BaView({
  width,
  short,
  dose,
  micro,
  progress,
  spectators,
  limited = false,
  say,
}: {
  width: number;
  short: boolean;
  dose: number;
  micro: boolean;
  progress: number;
  spectators: boolean;
  limited?: boolean;
  say: Say;
}) {
  const s = bariumSulfate(dose),
    h = short ? 184 : 260,
    base = h - 43,
    t = s.precipitate > 1e-9 ? ease(progress) : 0;
  if (!micro && !spectators) return <BaOpening width={width} short={short} dose={dose} say={say} />;
  return (
    <>
      <p className="ppx-kicker">
        {say(
          spectators
            ? '仍在水中的离子'
            : limited
              ? '钡不足：硫酸根仍留水中'
              : dose === 0
                ? '尚未加入钡盐'
                : '同一组离子，进入固相',
          spectators
            ? 'Ions still in the water'
            : limited
              ? 'Limited Ba: sulfate remains dissolved'
              : dose === 0
                ? 'No barium salt added'
                : 'The same ions enter the solid',
        )}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '钡和硫酸根进入固相；钠和氯留在水中',
          'Barium and sulfate enter the solid; sodium and chloride stay dissolved',
        )}
      >
        <path
          d={`M15 22V${h - 18}Q15 ${h - 3} 31 ${h - 3}H${width - 31}Q${width - 15} ${h - 3} ${width - 15} ${h - 18}V22`}
          fill="#d4e0ce"
          fillOpacity=".45"
          stroke="#9bb49f"
        />
        <path
          d={`M17 ${base + 20}Q${width / 2} ${base - 3} ${width - 17} ${base + 20}V${h - 17}Q${width - 17} ${h - 5} ${width - 31} ${h - 5}H31Q17 ${h - 5} 17 ${h - 17}Z`}
          fill="#e5e3cc"
          opacity={s.precipitate > 1e-9 ? t : 0}
          data-solid="barium-sulfate"
        />
        {!spectators ? (
          <>
            {dose > 0 && (
              <Ion
                id="Ba-tracked"
                tracked
                x={width * 0.25 + (width * 0.38 - width * 0.25) * t}
                y={48 + (base - 48) * t}
                label="Ba²⁺"
              />
            )}
            <Ion
              id="sulfate-tracked"
              x={width * 0.75 + (width * 0.65 - width * 0.75) * t}
              y={48 + (base - 48) * t}
              label="SO₄²⁻"
              colour="#c4d0c1"
            />
            {dose > 0 && (
              <path
                d={`M${width * 0.25} 67Q${width * 0.2} ${h / 2} ${width * 0.38} ${base - 20}M${width * 0.75} 67Q${width * 0.8} ${h / 2} ${width * 0.65} ${base - 20}`}
                stroke="#a7b59b"
                strokeDasharray="3 5"
                fill="none"
                opacity={1 - t}
              />
            )}
            {limited && (
              <Ion
                id="sulfate-leftover"
                x={width * 0.67}
                y={short ? 57 : 65}
                label="SO₄²⁻"
                colour="#c4d0c1"
              />
            )}
            {t > 0.9 && (
              <text x={width / 2} y={28} textAnchor="middle">
                BaSO₄(s)
              </text>
            )}
          </>
        ) : (
          <>
            <Ion id="Na-1" x={width * 0.26} y={42} label="Na⁺" colour="#d0d9ba" />
            {dose > 0 && <Ion id="Cl-1" x={width * 0.72} y={42} label="Cl⁻" colour="#c1d3c5" />}
            <Ion id="Na-2" x={width * 0.37} y={short ? 83 : 105} label="Na⁺" colour="#d0d9ba" />
            {dose > 0 && (
              <Ion id="Cl-2" x={width * 0.8} y={short ? 92 : 125} label="Cl⁻" colour="#c1d3c5" />
            )}
            {dose > 1.1 && (
              <Ion id="Ba-excess" tracked x={width * 0.25} y={short ? 116 : 173} label="Ba²⁺" />
            )}
            {s.precipitate > 1e-9 && (
              <text x={width / 2} y={base + 10} textAnchor="middle">
                BaSO₄(s)
              </text>
            )}
          </>
        )}
      </svg>
      <div className="ppx-evidence">
        {spectators ? (
          <>
            <span>Na⁺ {s.sodium.toFixed(1)} mmol</span>
            <span>Cl⁻ {s.chloride.toFixed(1)} mmol</span>
            <span className="ppx-wide">
              {say('水相 Ba²⁺', 'Dissolved Ba²⁺')} {s.barium.toFixed(3)} mmol
            </span>
          </>
        ) : (
          <>
            <span>Ba²⁺ + SO₄²⁻ → BaSO₄</span>
            {!short && (
              <span className="ppx-wide">
                {say('剩余 SO₄²⁻', 'Remaining SO₄²⁻')} {s.sulfate.toFixed(3)} mmol
              </span>
            )}
          </>
        )}
      </div>
      {!micro && !spectators && (
        <span className="ppx-screen-note">
          {say('固液界面放大', 'Enlarged solid–water interface')}
        </span>
      )}
    </>
  );
}
function Neutralization({
  width,
  short,
  progress,
  say,
}: {
  width: number;
  short: boolean;
  progress: number;
  say: Say;
}) {
  const h = short ? 184 : 235,
    p = ease(progress),
    x1 = width * 0.27,
    x2 = width * 0.72,
    y1 = short ? 61 : 75,
    y2 = short ? 103 : 142;
  const atoms = [
    { id: 'water-O', e: 'O', x: x1, y: y1 },
    { id: 'H-left', e: 'H', x: x1 - 21, y: y1 - 23 },
    { id: 'H-bottom', e: 'H', x: x1 - 1, y: y1 + 30 },
    { id: 'hydroxide-O', e: 'O', x: x2, y: y2 },
    { id: 'H-right', e: 'H', x: x2 + 23, y: y2 - 23 },
    {
      id: 'tracked-H',
      e: 'H',
      x: x1 + 27 + (x2 - 22 - x1 - 27) * p,
      y: y1 - 12 + (y2 - 24 - y1 + 12) * p - 35 * Math.sin(Math.PI * p),
    },
  ];
  return (
    <>
      <p className="ppx-kicker">
        {say('酸先与水中的 OH⁻ 反应', 'Acid first removes dissolved OH⁻')}
      </p>
      <svg viewBox={`0 0 ${width} ${h}`} role="img" aria-label="H₃O⁺ + OH⁻ → 2H₂O">
        {[
          [0, 1],
          [0, 2],
          [3, 4],
        ].map(([a, b]) => (
          <path
            key={a + '-' + b}
            d={`M${atoms[a].x} ${atoms[a].y}L${atoms[b].x} ${atoms[b].y}`}
            stroke="#a5b39a"
            strokeWidth="3"
          />
        ))}
        {(p < 0.15 || p > 0.85) && (
          <path
            d={`M${atoms[p < 0.15 ? 0 : 3].x} ${atoms[p < 0.15 ? 0 : 3].y}L${atoms[5].x} ${atoms[5].y}`}
            stroke="#a5b39a"
            strokeWidth="3"
            opacity={p < 0.15 ? 1 - p / 0.15 : (p - 0.85) / 0.15}
          />
        )}
        {atoms.map((a) => (
          <g key={a.id} data-atom={a.id}>
            {a.id === 'tracked-H' && (
              <circle cx={a.x} cy={a.y} r="17" fill="none" stroke="#b68a35" strokeWidth="2" />
            )}
            <circle cx={a.x} cy={a.y} r="11" fill={a.e === 'O' ? '#c18976' : '#e7ce79'} />
            <text x={a.x} y={a.y + 5} textAnchor="middle">
              {a.e}
            </text>
          </g>
        ))}
        <text x={x1} y={short ? 18 : 24} textAnchor="middle">
          {p > 0.9 ? 'H₂O' : 'H₃O⁺'}
        </text>
        <text x={x2} y={h - 8} textAnchor="middle">
          {p > 0.9 ? 'H₂O' : 'OH⁻'}
        </text>
      </svg>
      <p className="ppx-equation">H₃O⁺ + OH⁻ → 2 H₂O</p>
    </>
  );
}
function MgWater({
  width,
  short,
  exchange,
  say,
}: {
  width: number;
  short: boolean;
  exchange: number;
  say: Say;
}) {
  const h = short ? 184 : 260,
    t = (exchange + 1) / 2,
    y0 = h - 38,
    y1 = short ? 41 : 65;
  return (
    <>
      <p className="ppx-kicker">
        {say('固体还在，界面仍有交换', 'A solid can remain while ions exchange')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '镁离子同时离开和回到固相，净量不变',
          'Magnesium exchanges in both directions with no net change',
        )}
      >
        <path
          d={`M15 20V${h - 12}H${width - 15}V20`}
          fill="#d4dfcd"
          fillOpacity=".4"
          stroke="#a2b39c"
        />
        <rect x="16" y={h - 45} width={width - 32} height="32" rx="12" fill="#e0dec8" />
        <path
          d={`M${width * 0.3} ${y0 - 20}V${y1 + 20}l-4 6m4-6 4 6M${width * 0.72} ${y1 + 20}V${y0 - 20}l-4-6m4 6 4-6`}
          stroke="#99ad94"
          fill="none"
        />
        <Ion tracked id="Mg-out" x={width * 0.3} y={y0 + (y1 - y0) * t} label="Mg²⁺" />
        <Ion id="Mg-return" x={width * 0.72} y={y1 + (y0 - y1) * t} label="Mg²⁺" />
        <text x={width / 2} y={h - 16} textAnchor="middle">
          Mg(OH)₂(s)
        </text>
      </svg>
      <div className="ppx-evidence">
        <span>Mg(OH)₂ ⇌ Mg²⁺ + 2 OH⁻</span>
        {!short && (
          <span className="ppx-wide">
            {say('平衡：两向净变化为 0', 'Equilibrium: zero net change')}
          </span>
        )}
      </div>
    </>
  );
}
function AcidDissolving({
  width,
  short,
  acid,
  progress,
  say,
}: {
  width: number;
  short: boolean;
  acid: number;
  progress: number;
  say: Say;
}) {
  const s = magnesiumAcidPerturbation(0, acid, progress),
    h = short ? 184 : 244,
    p = acid > 0 ? ease(progress) : 0,
    bed = s.solid / 0.01,
    cy = h - 39 - (h - 93) * p;
  return (
    <>
      <p className="ppx-kicker">
        {s.saturation < 0.999
          ? say('OH⁻ 被消耗，Q 降低', 'Removing OH⁻ lowers Q')
          : say('仍有固体，重新达到饱和', 'Solid remains at renewed saturation')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '酸移走氢氧根后，标记镁从固相进入水中',
          'After acid removes hydroxide, marked magnesium moves into water',
        )}
      >
        <path
          d={`M16 15V${h - 14}Q16 ${h - 4} 28 ${h - 4}H${width - 28}Q${width - 16} ${h - 4} ${width - 16} ${h - 14}V15`}
          fill="#d1dfcd"
          fillOpacity=".42"
          stroke="#9bb29b"
        />
        <path
          d={`M18 ${h - 15 - 40 * bed}Q${width / 2} ${h - 25 - 40 * bed} ${width - 18} ${h - 15 - 40 * bed}V${h - 14}H18Z`}
          fill="#dddcc8"
          opacity={bed > 1e-9 ? 1 : 0}
          data-solid="magnesium-hydroxide"
        />
        <path
          d={`M${width * 0.33} ${h - 50}Q${width * 0.24} ${h / 2} ${width * 0.35} 48`}
          fill="none"
          stroke="#a9b49b"
          strokeDasharray="3 5"
        />
        <Ion id="Mg-dissolves" tracked x={width * 0.35} y={cy} label="Mg²⁺" />
        {p > 0.2 && (
          <>
            <Ion x={width * 0.72} y={short ? 66 : 94} label="OH⁻" colour="#b8ccbf" />
            <Ion x={width * 0.72} y={short ? 111 : 153} label="OH⁻" colour="#b8ccbf" />
          </>
        )}
        {bed > 0.04 && (
          <text x={width / 2} y={h - 15} textAnchor="middle">
            Mg(OH)₂
          </text>
        )}
      </svg>
      <div className="ppx-evidence">
        <span className="ppx-wide">
          {s.saturation < 0.999 ? 'Q < Ksp' : 'Q ≈ Ksp'} · {say('镁总量不变', 'Total Mg unchanged')}
        </span>
        {!short && (
          <>
            <span>
              {say('固相', 'Solid')} {(s.solid * 1000).toFixed(2)}
            </span>
            <span>
              {say('水相', 'Water')} {(s.dissolved * 1000).toFixed(2)} mmol/L
            </span>
          </>
        )}
      </div>
    </>
  );
}
function AcidComparison({
  width,
  short,
  acid,
  waterOnly = false,
  showTotal = false,
  say,
}: {
  width: number;
  short: boolean;
  acid: number;
  waterOnly?: boolean;
  showTotal?: boolean;
  say: Say;
}) {
  const water = magnesiumAcid(0),
    s = magnesiumAcid(acid),
    h = short ? 184 : 235;
  return (
    <>
      <p className="ppx-kicker">
        {waterOnly
          ? say('两份样品，加水后仍有固体', 'Both samples retain solid in water')
          : say('保留水对照，再检查镁', 'Keep the water control; account for Mg')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '水对照保留沉淀，酸样品中的镁进入水相',
          'The water control retains solid while acid transfers magnesium to water',
        )}
      >
        <Vessel
          x={width * 0.25}
          y={31}
          w={Math.min(110, width * 0.3)}
          h={h - 53}
          solid={water.solid / 0.01}
          label={say('水对照', 'Water')}
        />
        <Vessel
          x={width * 0.75}
          y={31}
          w={Math.min(110, width * 0.3)}
          h={h - 53}
          solid={s.solid / 0.01}
          label={waterOnly ? say('另一份', 'Second sample') : say('加酸', 'Acid')}
        />
        <text x={width * 0.75} y={h * 0.5} textAnchor="middle">
          Mg²⁺
        </text>
      </svg>
      <p className="ppx-equation">
        {showTotal
          ? say('镁总量 = 10 mmol/L', 'Total Mg = 10 mmol/L')
          : waterOnly
            ? say('保留一份水对照', 'Retain one water control')
            : s.solid > 1e-6
              ? say('酸不足：仍可剩下固体', 'Limited acid: some solid remains')
              : say('固体消失，镁仍在水中', 'The solid is gone; Mg remains')}
      </p>
    </>
  );
}
function SilverSurface({
  width,
  short,
  progress,
  say,
}: {
  width: number;
  short: boolean;
  progress: number;
  say: Say;
}) {
  const h = short ? 184 : 248,
    p = (1 - Math.cos(Math.PI * 2 * progress)) / 2,
    floor = h - 40;
  return (
    <>
      <p className="ppx-kicker">
        {say('外观稳定，界面仍有交换', 'A steady surface still exchanges ions')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '氯化银表面银离子一出一入，表示动态平衡',
          'Silver markers exchange in opposite directions at a silver chloride surface',
        )}
      >
        <rect
          x="6"
          y="5"
          width={width - 12}
          height={h - 10}
          rx="20"
          fill="#d5e1d0"
          fillOpacity=".55"
        />
        <path
          d={`M7 ${floor}Q${width / 2} ${floor - 17} ${width - 7} ${floor}V${h - 18}Q${width - 7} ${h - 5} ${width - 20} ${h - 5}H20Q7 ${h - 5} 7 ${h - 18}Z`}
          fill="#e6e3cc"
        />
        <Ion id="Ag-0" tracked x={width * 0.28} y={floor - 4 - (floor - 48) * p} label="Ag⁺" />
        <Ion id="Ag-1" x={width * 0.69} y={48 + (floor - 52) * p} label="Ag⁺" />
        <text x={width / 2} y={h - 10} textAnchor="middle">
          AgCl(s)
        </text>
        <text x={width * 0.5} y={26} textAnchor="middle">
          Cl⁻(aq)
        </text>
      </svg>
      <p className="ppx-equation">AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq)</p>
      {!short && (
        <span className="ppx-screen-note">
          {say(
            '交换示意，粒子数不代表相含量',
            'Exchange illustration; counts are not phase amounts',
          )}
        </span>
      )}
    </>
  );
}
function Silver({
  width,
  short,
  iodide,
  sulfide,
  route,
  progress,
  surface = false,
  endpoint = false,
  intermediate = false,
  say,
}: {
  width: number;
  short: boolean;
  iodide: number;
  sulfide: number;
  route: SilverRoute;
  progress: number;
  surface?: boolean;
  endpoint?: boolean;
  intermediate?: boolean;
  say: Say;
}) {
  const transfer = silverTransfer(iodide, sulfide, route, progress),
    state = endpoint ? silverExchange(iodide, sulfide) : transfer.state;
  const geo = silverTransferGeometry(width, iodide, sulfide, route, progress, short);
  const head = surface
    ? say('Ag 标记不丢失', 'Keep the silver identities')
    : endpoint
      ? say('近完全计量端点', 'Near-complete inventory limit')
      : intermediate
        ? say('所选中间态，仍可能继续转化', 'Selected intermediate: further change possible')
        : route === 'reform'
          ? say('释放的 I⁻ 再形成 AgI', 'Released I⁻ forms AgI again')
          : route === 'sulfide'
            ? say('两个 Ag，共一份 Ag₂S', 'Two Ag per Ag₂S')
            : iodide < 0.9 && progress > 0.99
              ? say('碘不足，两种固体并存', 'Limited iodide: both solids remain')
              : say('新固相接走水中的 Ag', 'A new solid takes up dissolved Ag');
  const moving = progress > 0 && progress < 1 && !endpoint;
  return (
    <>
      <p className="ppx-kicker">{head}</p>
      <svg viewBox={`0 0 ${width} ${geo.height}`} role="img" aria-label={head}>
        <rect
          x="4"
          y="4"
          width={width - 8}
          height={geo.height - 8}
          rx="20"
          fill="#cfdfcd"
          fillOpacity=".3"
        />
        {geo.centres.map((x, i) => (
          <g key={i}>
            <path
              d={`M${x - width * 0.14} ${geo.height - 20}Q${x} ${geo.height - 34} ${x + width * 0.14} ${geo.height - 20}V${geo.height - 12}H${x - width * 0.14}Z`}
              fill={colours[i]}
              opacity={[state.agCl, state.agI, state.ag2S][i] > 1e-9 ? 0.6 : 0.08}
            />
            <text x={x} y={geo.height - 1} textAnchor="middle">
              {['AgCl', 'AgI', 'Ag₂S'][i]}
            </text>
          </g>
        ))}
        {geo.tokens.map((t) => (
          <g
            key={t.id}
            data-silver={t.id}
            data-phase={t.phase}
            transform={`translate(${t.x} ${t.y})`}
          >
            {t.tracked && <circle r="15" stroke="#b48a33" strokeWidth="1.6" fill="none" />}
            <circle
              r="11"
              fill={typeof t.phase === 'number' ? colours[t.phase] : '#acc8ba'}
              stroke="#f1f0dd"
              strokeWidth="1.5"
            />
            <text textAnchor="middle" y="5" className={t.phase === 2 ? 'ppx-light-letter' : ''}>
              Ag
            </text>
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = geo.tokens[2 * i],
            b = geo.tokens[2 * i + 1];
          if (a.phase !== 2 || b.phase !== 2) return null;
          const x = (a.x + b.x) / 2,
            y = (a.y + b.y) / 2;
          return short && i > 0 ? (
            <path
              key={'pair-' + i}
              d={`M${x - 21} ${y + 13}v4h42v-4`}
              stroke="#607d67"
              fill="none"
            />
          ) : (
            <g key={'pair-' + i} data-sulfide-formula={i}>
              <path d={`M${a.x} ${a.y}L${x} ${y + 18}L${b.x} ${b.y}`} stroke="#a2b188" />
              <circle cx={x} cy={y + 18} r="9" fill="#cabc73" />
              <text x={x} y={y + 23} textAnchor="middle">
                S
              </text>
            </g>
          );
        })}
        {((route === 'sulfide' && iodide > 0) ||
          (route === 'reform' && transfer.stages.intermediate.aqueousI > 0)) &&
          (() => {
            const first = geo.tokens.find((t) => t.moving);
            const t = ease(first?.localProgress ?? 0);
            const endpointGeometry = silverTransferGeometry(
              width,
              iodide,
              sulfide,
              route,
              route === 'reform' ? 1 : 0,
              short,
            );
            const partner = endpointGeometry.tokens.find((token) => token.id === first?.id);
            const bound = partner
              ? { x: partner.x + (partner.x >= geo.centres[1] ? 26 : -26), y: partner.y }
              : { x: width * 0.5, y: short ? 18 : 26 };
            const water = { x: width * 0.76, y: short ? 18 : 26 };
            const isBound =
              !!partner &&
              (route === 'reform' ? first?.localProgress === 1 : first?.localProgress === 0);
            const from = route === 'reform' ? water : bound,
              to = route === 'reform' ? bound : water;
            const x = from.x + (to.x - from.x) * t,
              y = from.y + (to.y - from.y) * t;
            return (
              <g data-iodide-phase={isBound ? 'AgI' : 'water'}>
                {isBound && partner && (
                  <path
                    d={`M${x} ${y}L${partner.x} ${partner.y}`}
                    stroke="#b4a254"
                    strokeWidth="2"
                  />
                )}
                <g data-particle="I-reused" transform={`translate(${x} ${y})`}>
                  <circle r="13" fill="none" stroke="#b58b3d" strokeWidth="1.5" />
                  <circle r="10" fill="#d8ca88" />
                  <text textAnchor="middle" y="5">
                    I⁻
                  </text>
                </g>
              </g>
            );
          })()}
        {route === 'iodide' && state.aqueousCl > 0 && (
          <Ion id="Cl-retained" x={width * 0.76} y={short ? 18 : 26} label="Cl⁻" colour="#c4d3c4" />
        )}
      </svg>
      <div className="ppx-evidence">
        <span className="ppx-wide">
          {short ? (
            <>
              Ag: {(state.agCl + state.agI + 2 * state.ag2S).toFixed(1)}(s) +{' '}
              {state.aqueousAg.toFixed(1)}(aq) = 1
            </>
          ) : (
            <>
              {say('Ag 账本', 'Ag ledger')} · {say('固相', 'solid')}{' '}
              {(state.agCl + state.agI + 2 * state.ag2S).toFixed(2)} + {say('水相', 'water')}{' '}
              {state.aqueousAg.toFixed(2)} = 1
            </>
          )}
        </span>
        {!short && (
          <span className="ppx-wide">
            {moving
              ? say(
                  '在途量是说明账本，不是测得浓度',
                  'Transit is an inventory map, not a measured concentration',
                )
              : route === 'reform'
                ? endpoint
                  ? say('忽略微量溶解的物料端点', 'Inventory endpoint; trace dissolution omitted')
                  : say('中间态不能当作终态', 'An intermediate is not the endpoint')
                : say('标记表示身份，不表示浓度', 'Markers show identity, not concentration')}
          </span>
        )}
      </div>
    </>
  );
}
function IronMechanism({
  width,
  short,
  iron,
  extraOH,
  progress,
  showNet,
  say,
}: {
  width: number;
  short: boolean;
  iron: number;
  extraOH: number;
  progress: number;
  showNet?: boolean;
  say: Say;
}) {
  const p = ease(progress),
    s = magnesiumIron(iron * p, extraOH),
    h = short ? 184 : 256,
    bottom = h - 30;
  return (
    <>
      <p className="ppx-kicker">
        {extraOH >= iron * 3
          ? say('额外 OH⁻ 可直接供给', 'Extra OH⁻ can supply the precipitate')
          : extraOH > 0
            ? say('两种 OH⁻ 来源共同供给', 'Both hydroxide sources contribute')
            : say('OH⁻ 被接走，Mg²⁺ 留水', 'Hydroxide is taken up; Mg²⁺ enters water')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '铁形成新固体；镁没有变成铁，而是进入水',
          'Iron forms a new solid; magnesium enters water rather than becoming iron',
        )}
      >
        <rect
          x="5"
          y="5"
          width={width - 10}
          height={h - 10}
          rx="18"
          fill="#d5e0cf"
          fillOpacity=".45"
        />
        <path
          d={`M16 ${bottom - 30 * s.magnesiumHydroxide}Q${width * 0.25} ${bottom - 40 * s.magnesiumHydroxide} ${width * 0.47} ${bottom - 30 * s.magnesiumHydroxide}V${bottom}H16Z`}
          fill="#dfddc6"
        />
        <path
          d={`M${width * 0.55} ${bottom - (42 * s.ironHydroxide) / 0.4}Q${width * 0.75} ${bottom - (52 * s.ironHydroxide) / 0.4} ${width - 15} ${bottom - (42 * s.ironHydroxide) / 0.4}V${bottom}H${width * 0.55}Z`}
          fill="#b27b55"
        />
        <Ion
          id="Mg-tracked"
          tracked
          x={width * 0.25}
          y={bottom - 18 - (short ? 77 : 143) * Math.min(1, s.dissolvedMagnesium / 0.6)}
          label="Mg²⁺"
        />
        {iron > 0 && (
          <Ion
            id="Fe-tracked"
            x={width * 0.76}
            y={34 + (bottom - 56) * p}
            label="Fe³⁺"
            colour="#c28e6a"
          />
        )}
        {iron > 0 && p > 0.05 && p < 0.95 && (
          <Ion
            id="OH-source"
            x={width * 0.3 + width * 0.39 * p}
            y={
              (extraOH >= iron * 3 ? (short ? 30 : 45) : bottom - 15) +
              (bottom - 36 - (extraOH >= iron * 3 ? (short ? 30 : 45) : bottom - 15)) * p -
              (short ? 25 : 65) * Math.sin(Math.PI * p)
            }
            label="OH⁻"
            colour="#c2d4c3"
          />
        )}
        <text x={width * 0.25} y={h - 7} textAnchor="middle">
          Mg(OH)₂
        </text>
        <text x={width * 0.76} y={h - 7} textAnchor="middle">
          Fe(OH)₃
        </text>
      </svg>
      <div className="ppx-evidence">
        {(showNet ?? p > 0.85) && extraOH === 0 && iron > 0 ? (
          <>
            <span className="ppx-wide">3Mg(OH)₂ + 2Fe³⁺</span>
            <span className="ppx-wide">→ 2Fe(OH)₃ + 3Mg²⁺</span>
          </>
        ) : (
          <>
            <span>Fe(OH)₃ {s.ironHydroxide.toFixed(2)}</span>
            <span>Mg²⁺ {s.dissolvedMagnesium.toFixed(2)} mmol</span>
          </>
        )}
      </div>
    </>
  );
}
function IronCompare({
  width,
  short,
  prepare = false,
  say,
}: {
  width: number;
  short: boolean;
  prepare?: boolean;
  say: Say;
}) {
  const cases = [magnesiumIron(prepare ? 0 : 0.4, 0), magnesiumIron(prepare ? 0 : 0.4, 1.2)],
    h = short ? 184 : 244;
  return (
    <>
      <p className="ppx-kicker">
        {prepare
          ? say('只改变额外 OH⁻', 'Change only the extra OH⁻')
          : say('相同褐色，不同镁去向', 'Same brown solid, different Mg fate')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '无额外碱与额外碱足够的对照',
          'Comparison without and with sufficient extra base',
        )}
      >
        <text x={width / 2} y="17" textAnchor="middle">
          {say('初始额外 OH⁻', 'Initial extra OH⁻')}
        </text>
        {cases.map((s, i) => {
          const x = width * (i ? 0.75 : 0.25),
            w = Math.min(140, width * 0.38),
            floor = h - 35;
          return (
            <g key={i}>
              <text x={x} y="41" textAnchor="middle">
                {i ? '1.2' : '0'} mmol
              </text>
              <path
                d={`M${x - w / 2} 55V${floor}Q${x - w / 2} ${floor + 9} ${x - w / 2 + 10} ${floor + 9}H${x + w / 2 - 10}Q${x + w / 2} ${floor + 9} ${x + w / 2} ${floor}V55`}
                fill="#cfddca"
                fillOpacity=".4"
                stroke="#9eb39c"
              />
              <rect
                x={x - w / 2 + 3}
                y={floor - 35 * s.magnesiumHydroxide}
                width={w - 6}
                height={35 * s.magnesiumHydroxide}
                rx="5"
                fill="#dfddc8"
              />
              {!prepare && (
                <rect
                  x={x - w / 2 + 3}
                  y={floor - 35 * s.magnesiumHydroxide - 18}
                  width={w - 6}
                  height="18"
                  rx="6"
                  fill="#b67c54"
                />
              )}
              {!prepare && (
                <text x={x} y={floor - 35 * s.magnesiumHydroxide - 26} textAnchor="middle">
                  Fe(OH)₃
                </text>
              )}
              <text x={x} y={h - 5} textAnchor="middle">
                Mg²⁺ {s.dissolvedMagnesium.toFixed(1)} mmol
              </text>
            </g>
          );
        })}
      </svg>
      <p className="ppx-equation">
        {prepare
          ? say('两份 Mg(OH)₂ 都为 1 mmol', 'Both begin with 1 mmol Mg(OH)₂')
          : say('都形成 0.4 mmol Fe(OH)₃', 'Both form 0.4 mmol Fe(OH)₃')}
      </p>
    </>
  );
}
export default function ChemPrecipitationPaths() {
  const film = useShowcase(),
    { host, width, compact } = useSignalWidth(),
    say: Say = (zh, en) => (browserLocale() === 'en' ? en : zh);
  const [shortScreen, setShortScreen] = useState(false);
  useEffect(() => {
    const q = window.matchMedia('(max-height: 700px)');
    const update = () => setShortScreen(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  const [mode, setMode] = useState<PrecipitationMode>(() => {
    const v = film.variant ?? '';
    return v.includes('acid')
      ? 'acid'
      : v.includes('silver')
        ? 'silver'
        : v.includes('iron')
          ? 'iron'
          : 'barium';
  });
  const [dose, setDose] = useState(1),
    [acid, setAcid] = useState(0.012),
    [iodide, setIodide] = useState(0.3),
    [sulfide, setSulfide] = useState(0.2),
    [iron, setIron] = useState(0.4),
    [extraOH, setExtraOH] = useState(0),
    [progress, setProgress] = useState(0.5),
    [acidView, setAcidView] = useState('dissolve'),
    [silverView, setSilverView] = useState('endpoint'),
    [baView, setBaView] = useState('transfer'),
    [ironView, setIronView] = useState('paths');
  const d = precipitationDirector(film.chapter, film.chapterTime, browserLocale()),
    active = film.watch ? d.mode : mode,
    short = compact && shortScreen;
  let view;
  if (active === 'barium')
    view = (
      <BaView
        width={width}
        short={short}
        dose={film.watch ? d.dose : dose}
        micro={film.watch ? d.bariumMicro : true}
        spectators={film.watch ? d.spectators : baView === 'spectators'}
        limited={film.watch ? d.bariumLimited : dose < 0.9 && progress > 0.9}
        progress={film.watch ? d.bariumTransfer : progress}
        say={say}
      />
    );
  else if (active === 'acid') {
    const shot = film.watch ? (d.id === 'water-control' ? 'water' : d.acidShot) : acidView;
    view =
      shot === 'water' && film.watch && d.waterSamples ? (
        <AcidComparison width={width} short={short} acid={0} waterOnly say={say} />
      ) : shot === 'water' ? (
        <MgWater
          width={width}
          short={short}
          exchange={film.watch ? d.waterExchange : Math.sin(progress * Math.PI * 2)}
          say={say}
        />
      ) : shot === 'neutralize' ? (
        <Neutralization
          width={width}
          short={short}
          progress={film.watch ? d.neutralProgress : progress}
          say={say}
        />
      ) : shot === 'compare' ? (
        <AcidComparison
          width={width}
          short={short}
          acid={film.watch ? 0.012 + 0.012 * d.acidFinal : acid}
          showTotal={film.watch && d.acidTotal}
          say={say}
        />
      ) : (
        <AcidDissolving
          width={width}
          short={short}
          acid={film.watch ? 0.012 : acid}
          progress={film.watch ? d.acidRelax : progress}
          say={say}
        />
      );
  } else if (active === 'silver') {
    const route: SilverRoute = film.watch
      ? d.silverRoute
      : silverView === 'sulfide'
        ? 'sulfide'
        : silverView === 'iodide'
          ? 'iodide'
          : 'reform';
    const p = film.watch
      ? d.silverSurface
        ? 0
        : d.silverProgress
      : silverView === 'endpoint'
        ? 1
        : silverView === 'intermediate'
          ? 0
          : progress;
    view =
      film.watch && d.silverSurface ? (
        <SilverSurface width={width} short={short} progress={d.surfaceProgress} say={say} />
      ) : (
        <Silver
          width={width}
          short={short}
          iodide={film.watch ? d.silverIodide : iodide}
          sulfide={film.watch ? (d.id === 'silver-sulfide' ? 0.5 : 0) : sulfide}
          route={route}
          progress={p}
          surface={film.watch && d.silverSurface}
          endpoint={!film.watch && silverView === 'endpoint'}
          intermediate={!film.watch && silverView === 'intermediate'}
          say={say}
        />
      );
  } else
    view =
      film.watch && d.id === 'magnesium' ? (
        <IronCompare width={width} short={short} prepare say={say} />
      ) : (film.watch && d.ironCompare) || (!film.watch && ironView === 'compare') ? (
        <IronCompare width={width} short={short} say={say} />
      ) : (
        <IronMechanism
          width={width}
          short={short}
          iron={film.watch ? 0.4 : iron}
          extraOH={film.watch ? 0 : extraOH}
          progress={film.watch ? d.ironProgress : progress}
          showNet={film.watch ? d.ironNet : undefined}
          say={say}
        />
      );
  return (
    <section className="chem-precipitation-paths" data-watch={film.watch} data-short={short}>
      <div className="ppx-canvas" ref={host}>
        {view}
      </div>
      {!film.watch && (
        <div className="ppx-controls">
          <Segments
            label={say('研究过程', 'Process')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'barium', label: say('沉淀', 'Precipitation') },
              { value: 'acid', label: say('加酸', 'Acid') },
              { value: 'silver', label: say('银盐', 'Silver salts') },
              { value: 'iron', label: say('铁与镁', 'Iron & magnesium') },
            ]}
          />
          {mode === 'barium' && (
            <>
              <Segments
                label={say('观察对象', 'Follow')}
                value={baView}
                onChange={setBaView}
                options={[
                  { value: 'transfer', label: say('进入固相', 'Enter solid') },
                  { value: 'spectators', label: say('留在水中', 'Stay dissolved') },
                ]}
              />
              <Range
                label={say('加入 BaCl₂', 'Added BaCl₂')}
                value={dose}
                min={0}
                max={2}
                step={0.1}
                unit="mmol"
                onChange={setDose}
              />
            </>
          )}
          {mode === 'acid' && (
            <>
              <Segments
                label={say('因果镜头', 'Causal view')}
                value={acidView}
                onChange={setAcidView}
                options={[
                  { value: 'water', label: say('水对照', 'Water') },
                  { value: 'neutralize', label: say('中和', 'Neutralize') },
                  { value: 'dissolve', label: say('再溶解', 'Dissolve') },
                  { value: 'compare', label: say('比较', 'Compare') },
                ]}
              />
              {(acidView === 'dissolve' || acidView === 'compare') && (
                <>
                  <Range
                    label={say('另设模型酸分析浓度', 'Model analytical acid concentration')}
                    value={acid}
                    min={0}
                    max={0.04}
                    step={0.001}
                    unit="mol/L"
                    onChange={setAcid}
                  />
                </>
              )}
            </>
          )}
          {mode === 'silver' && (
            <>
              <Segments
                label={say('顺序过程与端点', 'Sequence and endpoint')}
                value={silverView}
                onChange={setSilverView}
                options={[
                  { value: 'iodide', label: say('先加 I⁻', 'Add I⁻') },
                  { value: 'sulfide', label: say('再加硫化物', 'Add sulfide') },
                  { value: 'intermediate', label: say('中间态', 'Intermediate') },
                  { value: 'reform', label: say('AgI 再形成', 'Re-form AgI') },
                  { value: 'endpoint', label: say('近完全端点', 'Inventory limit') },
                ]}
              />
              <Range
                label={say('先加入 I⁻', 'First added I⁻')}
                value={iodide}
                min={0}
                max={1}
                step={0.1}
                unit="mmol"
                onChange={setIodide}
              />
              <Range
                label={say('随后加入总 S(-II)', 'Then added total S(-II)')}
                value={sulfide}
                min={0}
                max={0.5}
                step={0.1}
                unit="mmol"
                onChange={setSulfide}
              />
              {(() => {
                const seq = silverSequenceStages(iodide, sulfide),
                  q = silverIodideSaturationRatio(
                    seq.intermediate.aqueousI,
                    seq.intermediate.aqueousCl,
                  );
                return (
                  <>
                    <p data-silver-check="true">
                      {seq.intermediate.agCl > 1e-9 && seq.intermediate.aqueousI > 1e-9 ? (
                        <>
                          {say(
                            '若残余 AgCl 饱和，中间态的',
                            'If residual AgCl is saturated, the intermediate has',
                          )}{' '}
                          Q(AgI)/Ksp = {q.toExponential(2)}.{' '}
                          {say('大于1：AgI还会形成。', 'Above one: more AgI can form.')}
                        </>
                      ) : (
                        say(
                          '此配方没有残余AgCl与释放I⁻的再形成组合。',
                          'This recipe has no residual AgCl/released-iodide combination for re-formation.',
                        )
                      )}
                    </p>
                    {silverView === 'endpoint' && (
                      <p data-silver-endpoint="true">
                        AgCl {seq.endpoint.agCl.toFixed(2)} · AgI {seq.endpoint.agI.toFixed(2)} ·
                        Ag₂S {seq.endpoint.ag2S.toFixed(2)} mmol
                      </p>
                    )}
                  </>
                );
              })()}
            </>
          )}
          {mode === 'iron' && (
            <>
              <Segments
                label={say('观察方式', 'View')}
                value={ironView}
                onChange={setIronView}
                options={[
                  { value: 'paths', label: say('来源', 'Source') },
                  { value: 'compare', label: say('同色对照', 'Same-colour comparison') },
                ]}
              />
              {ironView === 'paths' && (
                <>
                  <Range
                    label={say('加入 Fe³⁺', 'Added Fe³⁺')}
                    value={iron}
                    min={0}
                    max={0.6}
                    step={0.05}
                    unit="mmol"
                    onChange={setIron}
                  />
                  <Range
                    label={say('原先额外 OH⁻', 'Initial extra OH⁻')}
                    value={extraOH}
                    min={0}
                    max={2}
                    step={0.1}
                    unit="mmol"
                    onChange={setExtraOH}
                  />
                </>
              )}
            </>
          )}
          {!(mode === 'silver' && ['endpoint', 'intermediate'].includes(silverView)) &&
            !(mode === 'iron' && ironView === 'compare') &&
            !(mode === 'acid' && acidView === 'compare') && (
              <Range
                label={say(
                  '说明进度（非真实反应时间）',
                  'Explanation progress (not reaction time)',
                )}
                value={progress}
                min={0}
                max={1}
                step={0.01}
                onChange={setProgress}
              />
            )}
          <details>
            <summary>{say('模型与边界', 'Models and limits')}</summary>
            <p>
              {say(
                '钡、镁使用25°C稀溶液平衡，模型用量不等于教材滴数。酸中间态保留电荷与镁，只在端点恢复平衡。银为近完全计量示意，碱性硫化物条件下忽略微量溶解、质子化和动力学；在途银计入总量，先取银再形成AgI只是说明路径，不是实测反应顺序。铁的两条来源是净计量对照，颜色不能确定镁的去向。',
                'Barium and magnesium use ideal dilute equilibria at 25°C; amounts are not textbook drop conversions. Acid intermediates conserve charge and Mg; only endpoints are equilibrated. Silver is a near-complete inventory illustration under alkaline-sulfide conditions, omitting trace dissolution, protonation and kinetics. Silver in transit is counted; the selected transfer sequence is not a measured mechanism. The iron paths are net-inventory comparisons; colour does not uniquely determine magnesium’s fate.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
