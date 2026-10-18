import { useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import { slabPins, chopstickImage, apparentPlate } from '../../models/geometric-optics-lab';
import '../../styles/modern-labs.css';
import '../../styles/geometric-optics-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function GeometricArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  angle = 45,
  index = 1.5,
  offset = 0.2,
  pinOffset = 0,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  angle?: number;
  index?: number;
  offset?: number;
  pinOffset?: number;
}) {
  const p = slabPins(angle, index, pinOffset),
    cup = chopstickImage(offset),
    plate = apparentPlate(80, index, angle),
    point = (p: { x: number; y: number }) => ({ x: 110 + p.x * 58, y: 90 + p.y * 58 });
  return (
    <svg
      className="geometric-art"
      viewBox="0 0 340 340"
      role="img"
      aria-label={tr(
        '插针光路、圆柱杯成像与厚玻璃视深',
        'Pin alignment, cylindrical-cup imaging and glass apparent depth',
      )}
    >
      {mode === 0 && (
        <>
          <rect
            x="25"
            y="130"
            width="288"
            height="75"
            rx="4"
            fill="#cdded6"
            opacity=".8"
            stroke="#8ea99e"
          />
          <path d={`M135 108V225M${p.exit.x} 186v40`} stroke="#9bada0" strokeDasharray="4 4" />
          <path
            d={`M${p.A.x - 10 * Math.sin(p.i)} ${p.A.y - 10 * Math.cos(p.i)}L135 130L${p.exit.x} 205L${p.eye.x} ${p.eye.y}`}
            fill="none"
            stroke="#b68b53"
            strokeWidth="2"
          />
          {[p.A, p.B, p.C, p.D].map((a, j) => (
            <g key={j}>
              <path d={`M${a.x} ${a.y}v-13`} stroke="#52675e" strokeWidth="2" />
              <circle cx={a.x} cy={a.y - 15} r="4" fill={j === 2 ? '#b58163' : '#6f8e7b'} />
              <text x={a.x - 15} y={a.y + 9} fill="#64786b" fontSize="20">
                {'ABCD'[j]}
              </text>
            </g>
          ))}
          <path
            d={`M${p.eye.x - 12} ${p.eye.y + 12}q12 -12 24 0q-12 12 -24 0`}
            fill="none"
            stroke="#698473"
          />
          <circle cx={p.eye.x} cy={p.eye.y + 12} r="3" fill="#698473" />
          <rect x="233" y="27" width="84" height="58" rx="12" fill="#edf1e8" stroke="#ccd8c9" />
          {[0, 1, 2, 3].map((j) => (
            <path
              key={j}
              d={`M${275 + (j === 2 ? p.viewOffset : 0)} 42v29`}
              stroke={j === 2 ? '#ad8065' : '#718d7b'}
              strokeWidth={j === 2 ? 3 : 5 - j}
            />
          ))}
          <text x="275" y="108" textAnchor="middle" fontSize="18" fill="#6b8072">
            {tr('眼端视图', 'Eye view')}
          </text>
          <path
            d={`M135 109A21 21 0 0 0 ${135 - 21 * Math.sin(p.i)} ${130 - 21 * Math.cos(p.i)}`}
            fill="none"
            stroke="#9a7e57"
          />
          <path
            d={`M135 157A27 27 0 0 0 ${135 + 27 * Math.sin(p.r)} ${130 + 27 * Math.cos(p.r)}`}
            fill="none"
            stroke="#8caa8a"
          />
          <text x="170" y="321" textAnchor="middle" fontSize="22" fill="#5f7865">
            sin i / sin r = {p.inferred.toFixed(3)}
          </text>
          {phase === 0 && (
            <text x="23" y="28" fontSize="18" fill="#6b8072">
              {tr('先描边界', 'Trace both faces')}
            </text>
          )}
        </>
      )}
      {mode === 1 && cup && (
        <>
          <circle cx="110" cy="90" r={58 * 1.06} fill="#dce8de" stroke="#94ac9e" />
          <circle cx="110" cy="90" r="58" fill="#d6e4dd" stroke="#a1b7a9" />
          {cup.rays.map((ray, j) => {
            const points = [ray.source, ray.water, ray.glass, ray.eye].map(point),
              image = point(cup.image),
              exit = point(ray.glass);
            return (
              <g key={j}>
                <path
                  d={points.map((a, i) => `${i ? 'L' : 'M'}${a.x} ${a.y}`).join(' ')}
                  fill="none"
                  stroke={j ? '#b38a59' : '#a99b77'}
                  strokeWidth="1.5"
                />
                <path
                  d={`M${exit.x} ${exit.y}L${image.x} ${image.y}`}
                  stroke="#ad9981"
                  strokeDasharray="3 4"
                />
              </g>
            );
          })}
          <circle cx={point(cup.source).x} cy={point(cup.source).y} r="4" fill="#8b6b4d" />
          <circle
            cx={point(cup.image).x}
            cy={point(cup.image).y}
            r="5"
            fill="none"
            stroke="#8b6b4d"
          />
          <path d="M274 90q12 -12 24 0q-12 12 -24 0" fill="none" stroke="#698473" />
          <text x="217" y="37" fontSize="18" fill="#6b8072">
            {tr('俯视截面', 'Top view')}
          </text>
          <path
            d="M69 182V313Q69 328 85 328H250Q266 328 266 313V182"
            fill="#edf3ed"
            stroke="#8fa79a"
            strokeWidth="2"
          />
          <path d="M71 214H264V312Q264 326 249 326H85Q71 326 71 312Z" fill="#d7e6dd" />
          <path d={`M${160 + offset * 110} 171V214`} stroke="#987151" strokeWidth="7" />
          <path
            d={`M${160 + offset * 110} 214V310`}
            stroke="#987151"
            strokeWidth="7"
            opacity=".16"
            strokeDasharray="4 5"
          />
          <path
            d={`M${160 + cup.projectedY * 110} 214V310`}
            stroke="#987151"
            strokeWidth={7 * cup.magnification}
          />
          <text x="170" y="167" textAnchor="middle" fontSize="18" fill="#6b8072">
            {tr('下方：侧面所见', 'Below: side appearance')}
          </text>
        </>
      )}
      {mode === 2 && (
        <>
          <rect x="37" y="131" width="269" height="103" rx="6" fill="#d5e4dc" stroke="#91aa9a" />
          <path d="M32 240H312M32 247H312" stroke="#9fa88e" />
          <text x="170" y="230" textAnchor="middle" fill="#6b795d" fontSize="24">
            {tr('字', 'A')}
          </text>
          <text
            x="170"
            y={131 + (plate.apparent / 80) * 100}
            textAnchor="middle"
            fill="#9e7c53"
            fontSize="24"
            opacity=".8"
          >
            {tr('像', 'A')}
          </text>
          {[-1, 1].map((s) => {
            const x = 170 + s * 100 * Math.tan(plate.inside),
              topx = x + s * 80 * Math.tan(plate.angle);
            return (
              <g key={s}>
                <path
                  d={`M170 231L${x} 131L${topx} 51`}
                  fill="none"
                  stroke="#b68b53"
                  strokeWidth="1.5"
                />
                <path
                  d={`M${x} 131L170 ${131 + (plate.apparent / 80) * 100}`}
                  fill="none"
                  stroke="#9fa994"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}
          <path d="M27 131V231M22 131H32M22 231H32" stroke="#829b88" />
          <text x="170" y="282" fontSize="21" textAnchor="middle" fill="#647b66">
            {tr('实际深度', 'True depth')} 80 mm
          </text>
          <text x="170" y="316" fontSize="21" textAnchor="middle" fill="#8d795a">
            {tr('这对光线的虚像深度', 'Image depth')} {plate.apparent.toFixed(1)} mm
          </text>
        </>
      )}
    </svg>
  );
}
const ids = ['e1-refractive-index-pins', 'e1-water-chopstick-image', 'e1-glass-apparent-depth'];
export default function GeometricOpticsLab() {
  const film = useShowcase(),
    [selected, setSelected] = useState(Math.max(0, ids.indexOf(film.variant ?? ''))),
    [pinAngle, setPinAngle] = useState(40),
    [plateAngle, setPlateAngle] = useState(25),
    [index, setIndex] = useState(1.5),
    [offset, setOffset] = useState(0.2),
    [pinOffset, setPinOffset] = useState(12);
  const mode = film.watch ? (film.chapter < 3 ? 0 : film.chapter < 5 ? 1 : 2) : selected,
    phase = film.watch
      ? mode === 0
        ? film.chapter
        : mode === 1
          ? film.chapter - 3
          : film.chapter - 5
      : 1,
    value = film.chapterProgress,
    i = film.watch
      ? mode === 2
        ? 15 + 30 * value
        : phase === 2
          ? 30 + 25 * value
          : 45
      : mode === 0
        ? pinAngle
        : plateAngle,
    off = film.watch ? (mode === 1 ? 0.05 + 0.25 * value : 0.2) : offset,
    mis = film.watch ? (mode === 0 && phase === 1 ? 18 * (1 - value) : 0) : pinOffset,
    activeIndex = film.watch ? 1.5 : index,
    p = slabPins(i, activeIndex, mis),
    cup = chopstickImage(off),
    plate = apparentPlate(80, activeIndex, i),
    names = [
      ['插针测折射率', 'Pin alignment'],
      ['水中筷子', 'Chopstick in water'],
      ['玻璃板视深', 'Glass apparent depth'],
    ];
  return (
    <div className="modern-lab geometric-lab">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, j) => (
            <button key={j} type="button" aria-pressed={mode === j} onClick={() => setSelected(j)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `i = ${((p.i * 180) / Math.PI).toFixed(1)}° · r = ${((p.r * 180) / Math.PI).toFixed(1)}°`
          : mode === 1
            ? `${tr('局部横向放大', 'Local lateral magnification')} ×${cup?.magnification.toFixed(2) ?? '—'}`
            : `d′ = ${plate.apparent.toFixed(1)} mm · d/n = ${(80 / activeIndex).toFixed(1)} mm`}
      </div>
      <GeometricArtwork
        mode={mode}
        phase={phase}
        value={value}
        angle={i}
        index={activeIndex}
        offset={off}
        pinOffset={mis}
      />
      <p className="modern-key">
        {
          [
            tr(
              '先让针与针像重合，再用入射点和出射点重建砖内光线。',
              'Align pins with their images, then reconstruct the internal ray from both face intersections.',
            ),
            tr(
              '圆柱杯的水—玻璃—空气界面，让筷子的像侧移并改变宽度。',
              'Water–glass–air interfaces shift the chopstick image and change its apparent width.',
            ),
            tr(
              '出射光的反向延长线交于较浅的位置；大角度下像深也会改变。',
              'Backward extensions meet at a shallower position; image depth also changes at larger angles.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          {mode !== 1 && (
            <Range
              label={
                mode === 0
                  ? tr('入射角 / °', 'Incidence angle / °')
                  : tr('空气中观察角 / °', 'Viewing angle in air / °')
              }
              value={mode === 0 ? pinAngle : plateAngle}
              min={20}
              max={mode === 0 ? 60 : 45}
              step={1}
              onChange={mode === 0 ? setPinAngle : setPlateAngle}
            />
          )}{' '}
          {mode === 0 && (
            <Range
              label={tr('C针横向偏离 / 图示单位', 'Pin C lateral offset / drawing units')}
              value={pinOffset}
              min={-20}
              max={20}
              step={0.5}
              onChange={setPinOffset}
            />
          )}{' '}
          {mode === 1 ? (
            <Range
              label={tr('筷子偏离杯中心 / 杯半径', 'Chopstick offset / cup radius')}
              value={offset}
              min={-0.3}
              max={0.3}
              step={0.01}
              onChange={setOffset}
            />
          ) : (
            <Range
              label={tr('玻璃折射率', 'Glass index')}
              value={index}
              min={1.3}
              max={1.8}
              step={0.01}
              onChange={setIndex}
            />
          )}
        </div>
      )}
    </div>
  );
}
