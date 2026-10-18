import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  enzymeChapters,
  enzymeDirector,
  enzymeDurations,
  unit,
  between,
  barrierHeights,
  energyDensity,
  reactionPath,
  peroxideReaction,
  conditionComparison,
  enzymeAssay,
  foldedFraction,
  proteinTrace,
  thermalConformation,
  chemicalConformation,
  ionization,
  phComparison,
  glucanCatalyticScene,
  sucroseSkeleton,
  cellFreeFermentation,
  cagedMeat,
  ureaseEvidence,
  type Point,
  type SkeletonAtom,
  type SkeletonBond,
  type EnzymeChapter,
  type PeroxideCondition,
} from '../../models/bio-enzyme-investigations';
import '../../styles/bio-enzyme-investigations.css';
const names = [
  '胃液与肉块',
  '加热还是催化',
  '无细胞发酵',
  '结晶的两条证据',
  '淀粉酶怎样识别',
  '温度与两种原因',
  '酸碱怎样改变活性',
  '恢复条件再比较',
];
const path = (points: Point[]) =>
  points.map((v, i) => `${i ? 'L' : 'M'}${v.x.toFixed(3)} ${v.y.toFixed(3)}`).join(' ');
function Arrow({ a, b, color = '#8a9b83' }: { a: Point; b: Point; color?: string }) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x),
    end = (angle2: number) => ({ x: b.x - 7 * Math.cos(angle2), y: b.y - 7 * Math.sin(angle2) });
  const l = end(angle - 0.6),
    r = end(angle + 0.6);
  return (
    <path
      d={`M${a.x} ${a.y}L${b.x} ${b.y}M${l.x} ${l.y}L${b.x} ${b.y}L${r.x} ${r.y}`}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Tube({
  uid,
  flux = 0,
  time = 0,
  color = '#dce3c9',
  level = 1,
  precipitate = 0,
}: {
  uid: string;
  flux?: number;
  time?: number;
  color?: string;
  level?: number;
  precipitate?: number;
}) {
  return (
    <svg viewBox="0 0 66 130" aria-hidden="true">
      <defs>
        <clipPath id={uid}>
          <path d="M13 7H53V102Q53 123 33 123Q13 123 13 102Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <rect x="13" y={112 - 73 * level} width="40" height="100" fill={color} />
        {precipitate > 0 && (
          <>
            <path
              d={`M13 ${120 - 16 * precipitate}Q33 ${115 - 16 * precipitate} 53 ${120 - 16 * precipitate}V124H13Z`}
              fill="#b97751"
            />
            {Array.from({ length: 9 }, (_, i) => (
              <circle
                key={`sediment-${i}`}
                cx={17 + ((i * 13) % 32)}
                cy={107 - (i % 3) * 5}
                r="2"
                fill="#b97751"
                opacity={precipitate}
              />
            ))}
          </>
        )}
        {Array.from({ length: 12 }, (_, i) => {
          const p = (time * 0.17 + i * 0.233) % 1;
          return (
            <circle
              key={i}
              cx={20 + ((i * 19) % 27)}
              cy={112 - p * 73}
              r={2 + (i % 2) * 0.5}
              fill="#fbfcf4"
              stroke="#a0b2a0"
              opacity={unit(flux * 15 - i * 0.075) * Math.sin(p * Math.PI)}
            />
          );
        })}
      </g>
      <path
        d="M10 6H56M13 8V102Q13 123 33 123Q53 123 53 102V8"
        fill="none"
        stroke="#94a99c"
        strokeWidth="2"
      />
      <path d="M18 18V69" fill="none" stroke="#fff" strokeWidth="2.5" opacity=".7" />
    </svg>
  );
}
function FourTubes({
  uid,
  progress,
  amount = 1,
}: {
  uid: string;
  progress: number;
  amount?: number;
}) {
  const modes: PeroxideCondition[] = ['blank', 'heated', 'iron', 'catalase'];
  return (
    <div className="bep-four">
      {modes.map((mode, i) => {
        const s = peroxideReaction(progress * 2, mode, mode === 'catalase' ? amount : 1);
        return (
          <div className={`bep-tube-unit bep-tube-${mode}`} key={mode}>
            <Tube
              uid={`${uid}-${mode}`}
              flux={s.oxygenFlux}
              time={progress * 12}
              color={['#dce3c9', '#dce3c9', '#e1d39f', '#c7bba4'][i]}
            />
            <div>
              <span>{t(['室温空白', '90 ℃水浴', '氯化铁', '肝脏研磨液'][i])}</span>
              <i className="bep-oxygen">
                <i style={{ width: `${s.oxygen * 200}%` }} />
              </i>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function EnergyTail({
  warm = 90,
  cold = 25,
  progress = 1,
}: {
  warm?: number;
  cold?: number;
  progress?: number;
}) {
  const current = cold + (warm - cold) * progress,
    min = 12,
    max = 18,
    scale = energyDensity(12, warm),
    x = (e: number) => 22 + ((e - min) / (max - min)) * 275,
    y = (e: number, T: number) => 149 - (energyDensity(e, T) / scale) * 117;
  const curve = (T: number) =>
    Array.from({ length: 151 }, (_, i) => ({
      x: x(min + ((max - min) * i) / 150),
      y: y(min + ((max - min) * i) / 150, T),
    }));
  const tail = (T: number) => [
    { x: x(14), y: 149 },
    ...Array.from({ length: 61 }, (_, i) => ({ x: x(14 + i / 15), y: y(14 + i / 15, T) })),
    { x: x(18), y: 149 },
  ];
  return (
    <div className="bep-energy">
      <div className="bep-legend">
        <span>
          <i className="bep-cold-dot" />
          {cold} ℃
        </span>
        <span>
          <i className="bep-warm-dot" />
          {Math.round(current)} ℃
        </span>
      </div>
      <svg
        viewBox="0 0 320 196"
        role="img"
        aria-label={t('高能状态尾部放大；升温增加同一门槛以上的权重')}
      >
        <path d={path(tail(current)) + 'Z'} fill="#d9aa70" opacity=".3" />
        <path d={path(tail(cold)) + 'Z'} fill="#7eacaa" opacity=".35" />
        <path d={path(curve(cold))} fill="none" stroke="#6d9e9c" strokeWidth="3" />
        <path d={path(curve(current))} fill="none" stroke="#bf8a53" strokeWidth="3" />
        <path
          d={`M${x(14)} 32V149`}
          fill="none"
          stroke="#74816c"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <path d="M20 150H301" stroke="#9ca991" />
        <Arrow a={{ x: 266, y: 159 }} b={{ x: 301, y: 159 }} />
        <text x={x(14) + 12} y="59">
          {t('同一门槛')}
        </text>
        <text x="300" y="98" textAnchor="end">
          {t('尾部放大')}
        </text>
        <text x="20" y="22">
          {t('相对密度')}
        </text>
        <text x="160" y="188" textAnchor="middle">
          {t('能量')}
        </text>
      </svg>
      <div className="bep-axis-label">
        <span>{t('阴影：可越过门槛的状态')}</span>
      </div>
    </div>
  );
}
function CatalystPath({ progress, damaged = false }: { progress: number; damaged?: boolean }) {
  const e = barrierHeights.blank + (barrierHeights.catalase - barrierHeights.blank) * progress;
  const curve = (E: number) =>
    Array.from({ length: 81 }, (_, i) => ({
      x: 20 + (i / 80) * 280,
      y: 137 - reactionPath(i / 80, E) * 7,
    }));
  return (
    <div className="bep-energy">
      <div className="bep-legend">
        <span>{t('反应温度固定')} 25 ℃</span>
        <span>{t(damaged ? '催化结构受损' : '较低能垒路径')}</span>
      </div>
      <svg
        viewBox="0 0 320 185"
        role="img"
        aria-label={t('两条路径起点终点相同，催化路径能垒较低')}
      >
        <path d={path(curve(14))} stroke="#9da99b" strokeWidth="3" fill="none" />
        <path
          d={path(curve(e))}
          stroke="#a68c63"
          strokeWidth="4"
          strokeDasharray={damaged ? '5 6' : undefined}
          opacity={damaged ? 0.32 : 1}
          fill="none"
        />
        <circle cx="20" cy="137" r="5" fill="#789c91" />
        <circle cx="300" cy="158" r="5" fill="#789c91" />
        <path d="M14 173H305" stroke="#a4ae9c" />
        <Arrow a={{ x: 269, y: 174 }} b={{ x: 304, y: 174 }} />
        <text x="25" y="125">
          {t('底物')}
        </text>
        <text x="293" y="147" textAnchor="end">
          {t('产物')}
        </text>
        <text x="160" y="22" textAnchor="middle">
          {t('初态与末态不变')}
        </text>
      </svg>
      <div className="bep-axis-label">
        <span>{t('反应路径上的能量')}</span>
      </div>
    </div>
  );
}
function Endpoint({ progress, amount = 1 }: { progress: number; amount?: number }) {
  const times = [5, 35, 180, 1500];
  const k = progress * (times.length - 1),
    j = Math.min(2, Math.floor(k)),
    time = times[j] + (times[j + 1] - times[j]) * (k - j);
  return (
    <div className="bep-endpoint">
      <p>{t('相同底物，完全转化的终点相同')}</p>
      {(['blank', 'iron', 'catalase'] as PeroxideCondition[]).map((m, i) => (
        <div className="bep-yield-row" key={m}>
          <span>{t(['空白', '氯化铁', '酶'][i])}</span>
          <div>
            <i
              style={{
                width: `${peroxideReaction(time, m, m === 'catalase' ? amount : 1).oxygen * 200}%`,
              }}
            />
          </div>
          <b>{t('O₂')}</b>
        </div>
      ))}
      <div className="bep-net-equation">2 H₂O₂ → 2 H₂O + O₂</div>
      <span className="bep-small-note">{t('时间压缩；不是测量曲线')}</span>
    </div>
  );
}
function Cage({ p, active }: { p: number; active: boolean }) {
  const s = cagedMeat(p, active);
  return (
    <div className="bep-cage">
      <svg
        viewBox="0 0 320 210"
        role="img"
        aria-label={t('笼子阻挡直接研磨而允许胃液进入，肉块仍逐渐减少')}
      >
        <path
          d="M110 8V54C40 61 27 149 91 185C159 224 267 180 272 105C275 63 239 46 224 46V8"
          fill="#e4c8b2"
          stroke="#b99b83"
          strokeWidth="3"
        />
        <path d="M57 113Q150 93 267 112C261 188 159 216 91 181Q62 160 57 113" fill="#d8c68e" />
        <rect x="111" y="91" width="100" height="87" rx="12" fill="#e6dfbc" opacity=".5" />
        <path
          d="M136 120Q158 103 182 126L177 157Q144 171 130 144Z"
          fill="#af7b6b"
          transform={`translate(157 138) scale(${Math.cbrt(s.fraction)}) translate(-157 -138)`}
        />
        <rect
          x="111"
          y="91"
          width="100"
          height="87"
          rx="12"
          fill="none"
          stroke="#84968b"
          strokeWidth="4"
        />
        {[125, 142, 159, 176, 193].map((x) => (
          <path key={x} d={`M${x} 93V176`} stroke="#89998d" strokeWidth="2" />
        ))}
        <path d="M112 119H210M112 148H210" stroke="#89998d" strokeWidth="2" />
        <Arrow a={{ x: 70, y: 128 }} b={{ x: 102, y: 128 }} color="#bd966e" />
        <Arrow a={{ x: 248, y: 141 }} b={{ x: 218, y: 141 }} color="#bd966e" />
        {active && (
          <>
            <path
              d="M77 101Q105 105 129 115M234 156Q215 153 193 145"
              fill="none"
              stroke="#a2ac8b"
              strokeWidth="3"
              strokeDasharray="4 5"
            />
            <circle cx={85 + p * 42} cy={104 + p * 11} r="3" fill="#8fa18c" />
          </>
        )}
      </svg>
      <div className="bep-two-facts">
        <span>{t('直接研磨被挡住')}</span>
        <span>{t('胃液可以进入')}</span>
      </div>
    </div>
  );
}
function Extract({ p, activity, active }: { p: number; activity: number; active: boolean }) {
  const s = cellFreeFermentation(activity * 12, active);
  return (
    <div className="bep-extract">
      <svg
        viewBox="0 0 320 190"
        role="img"
        aria-label={t(
          active
            ? '完整细胞被分离，含催化成分的汁液仍可形成发酵产物'
            : '有效成分缺失，模型中不形成发酵产物',
        )}
      >
        <path d="M23 28H137L91 83V118H74V83Z" fill="#e4e3c8" stroke="#96a18a" strokeWidth="2" />
        <path d="M37 48H123" stroke="#a4a080" strokeWidth="5" />
        {Array.from({ length: 7 }, (_, i) => (
          <ellipse
            key={i}
            cx={49 + i * 10}
            cy={35 + (i % 2) * 3}
            rx="5"
            ry="8"
            transform={`rotate(${i * 17} ${49 + i * 10} ${35 + (i % 2) * 3})`}
            fill="#aaa687"
            stroke="#808f78"
          />
        ))}
        <path
          d="M42 118V164Q42 176 55 176H118Q131 176 131 164V118"
          fill="#d1dbc1"
          stroke="#8fa08a"
          strokeWidth="2"
        />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${71 + i * 5} ${71 + p * 74}l4-3 4 4-3 4Z`}
            fill="#897997"
            opacity={p}
          />
        ))}
        <Arrow a={{ x: 143, y: 138 }} b={{ x: 192, y: 138 }} />
        <path
          d="M230 18H263V81L293 162Q297 177 280 177H208Q193 177 199 162L230 81Z"
          fill="#e1e6cf"
          stroke="#96a68e"
          strokeWidth="2"
        />
        <path d="M212 128H280L293 163Q296 177 280 177H208Q195 177 199 163Z" fill="#d3ddbb" />
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={i}
            cx={219 + ((i * 19) % 54)}
            cy={166 - ((activity * 1.9 + i * 0.19) % 1) * 54}
            r="3"
            stroke="#9dae92"
            fill="#fcfcf1"
            opacity={s.carbonDioxide / 2}
          />
        ))}
        <text x="246" y="59" textAnchor="middle">
          {t('加糖')}
        </text>
      </svg>
      <div className="bep-two-facts">
        <span>{t('完整细胞被分离')}</span>
        <span>{t(active ? '酒精与 CO₂ 仍形成' : '模型中未形成发酵产物')}</span>
      </div>
      <span className="bep-small-note">{t('汁液是混合物，并非一种纯酶')}</span>
    </div>
  );
}
function Crystals({ p, protein, uid }: { p: number; protein: number; uid: string }) {
  const s = ureaseEvidence(p);
  return (
    <div className="bep-crystal">
      <div className="bep-crystal-origin">
        <svg viewBox="0 0 120 95" aria-hidden="true">
          <ellipse cx="60" cy="57" rx="49" ry="26" fill="#dce1c2" stroke="#a3af94" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${29 + i * 12} ${45 + (i % 2) * 11}l9-6 10 9-9 7Z`}
              fill="#eee8ce"
              stroke="#b9ae85"
            />
          ))}
        </svg>
        <span>{t('同一批结晶')}</span>
      </div>
      <div className="bep-crystal-tests">
        <div className="bep-crystal-test">
          <Tube
            uid={`${uid}-protein`}
            color={`rgb(${Math.round(215 - protein * 48)},${Math.round(222 - protein * 70)},${Math.round(191 - protein * 8)})`}
          />
          <div>
            <strong>{t('蛋白质性质')}</strong>
            <span>{t('成分证据')}</span>
          </div>
        </div>
        <div className="bep-crystal-test">
          <svg viewBox="0 0 76 106" aria-hidden="true">
            <path
              d="M10 12V83Q10 98 38 98Q66 98 66 83V12"
              fill="#dce4c9"
              stroke="#9bac94"
              strokeWidth="2"
            />
            {Array.from({ length: 6 }, (_, i) => (
              <g key={i} opacity={unit(s.urea * 7 - i)}>
                <path
                  d={`M${22 + (i % 2) * 30} ${28 + Math.floor(i / 2) * 22}v8m-8-10 8 3 8-3`}
                  fill="none"
                  stroke="#a38b67"
                  strokeWidth="2.5"
                />
              </g>
            ))}
          </svg>
          <div>
            <strong>{t('尿素逐渐减少')}</strong>
            <span>{t('含氨产物增加')}</span>
            <i className="bep-product-bar">
              <i style={{ width: `${(1 - s.urea) * 100}%` }} />
            </i>
          </div>
        </div>
      </div>
      <span className="bep-crystal-conclusion">{t('成分证据 + 催化证据')}</span>
    </div>
  );
}
function Skeleton({
  atoms,
  bonds,
  dy = 0,
  waterVisible = true,
}: {
  atoms: SkeletonAtom[];
  bonds: SkeletonBond[];
  dy?: number;
  waterVisible?: boolean;
}) {
  const byId = new Map(atoms.map((a) => [a.id, a]));
  return (
    <g transform={`translate(0 ${dy})`}>
      {bonds.map((b, i) => {
        const a = byId.get(b.a)!,
          z = byId.get(b.b)!;
        if (!waterVisible && (b.a.startsWith('water') || b.b.startsWith('water'))) return null;
        return (
          <path
            key={i}
            d={`M${a.x} ${a.y}L${z.x} ${z.y}`}
            stroke={b.role === 'cleavage' ? '#b77a52' : '#758575'}
            strokeWidth={b.role === 'cleavage' ? 3.5 : 2.5}
            fill="none"
            opacity={b.opacity ?? 1}
          />
        );
      })}
      {atoms
        .filter((a) => a.label && (waterVisible || !a.id.startsWith('water')))
        .map((a) => (
          <g key={a.id}>
            <circle cx={a.x} cy={a.y} r={a.element === 'H' ? 8 : 9} fill="#edf0df" />
            <text x={a.x} y={a.y + 7} textAnchor="middle" className="bep-atom">
              {a.label}
            </text>
          </g>
        ))}
    </g>
  );
}
function SpecificityAssay({
  p,
  uid,
  predict = false,
}: {
  p: number;
  uid: string;
  predict?: boolean;
}) {
  return (
    <div className="bep-assay-pair">
      {[0, 1].map((i) => (
        <div key={i}>
          <Tube
            uid={`${uid}-specific-${i}`}
            color="#abc5c2"
            precipitate={i === 0 || predict ? p : 0}
          />
          <span>
            {t(i === 0 ? '淀粉 + 淀粉酶' : predict ? '蔗糖 + 另一种酶' : '蔗糖 + 淀粉酶')}
          </span>
          <strong>{t(i === 0 || predict ? '还原性产物出现' : '未见相同变化')}</strong>
        </div>
      ))}
    </div>
  );
}
function Glucan({
  binding,
  hydrolysis,
  release,
}: {
  binding: number;
  hydrolysis: number;
  release: number;
}) {
  const g = glucanCatalyticScene(binding, hydrolysis, release);
  return (
    <div className="bep-glucan">
      <svg
        viewBox="0 0 320 224"
        role="img"
        aria-label={t('多个接触点定位葡萄糖链，水参与一处α1,4键的净水解')}
      >
        <path
          d="M16 153Q22 124 45 132Q68 151 93 136Q112 117 144 135Q175 153 194 138Q216 119 249 134Q283 117 306 154L302 190Q164 235 18 191Z"
          fill="#b8a9bd"
          stroke="#a091a6"
          strokeWidth="2"
        />
        {g.contacts.map((c, i) => (
          <g key={i}>
            <circle cx={c.site.x} cy={c.site.y} r="5" fill="#907a99" />
            <path
              d={`M${c.substrate.x} ${c.substrate.y}L${c.site.x} ${c.site.y}`}
              stroke="#a98e62"
              strokeWidth="2.5"
              strokeDasharray="3 4"
              opacity={c.opacity}
            />
          </g>
        ))}
        <Skeleton atoms={g.atoms} bonds={g.bonds} waterVisible={hydrolysis > 0} />
      </svg>
      <div className="bep-two-facts">
        <span>α(1→4)</span>
        <span>{t(hydrolysis > 0.72 ? '链变短，酶可再用' : '多个接触点定位')}</span>
      </div>
      <span className="bep-small-note">{t('骨架与净变化示意')}</span>
    </div>
  );
}
function Sucrose({ p }: { p: number }) {
  const g = sucroseSkeleton();
  return (
    <div className="bep-glucan">
      <svg
        viewBox="0 0 320 205"
        role="img"
        aria-label={t('蔗糖具有葡萄糖和果糖的不同连接，不能利用同一催化构型')}
      >
        <path
          d="M16 144Q22 115 45 123Q68 142 93 127Q112 108 144 126Q175 144 194 129Q216 110 249 125Q283 108 306 145L302 181Q164 220 18 182Z"
          fill="#b8a9bd"
          stroke="#a091a6"
          strokeWidth="2"
        />
        <Skeleton {...g} dy={-10 + 10 * p} />
        <path d="M156 143l10 10m0-10-10 10" stroke="#b37b63" strokeWidth="3" />
      </svg>
      <div className="bep-two-facts">
        <span>{t('葡萄糖—果糖')}</span>
        <span>α1↔β2</span>
      </div>
      <span className="bep-small-note">{t('能接近，不等于能催化')}</span>
    </div>
  );
}
function TemperatureAssays({
  p,
  uid,
  recovery = false,
  pretreat = 120,
  hot = 85,
}: {
  p: number;
  uid: string;
  recovery?: boolean;
  pretreat?: number;
  hot?: number;
}) {
  const states = conditionComparison(recovery ? 'recovery' : 'temperature', p * 30, pretreat, hot);
  return (
    <div className="bep-three-assays">
      {states.map((s, i) => (
        <div key={i}>
          <Tube
            uid={`${uid}-temp-${i}`}
            color={`rgb(${Math.round(79 + s.converted * 143)},${Math.round(87 + s.converted * 139)},${Math.round(120 + s.converted * 74)})`}
          />
          <span>{recovery ? `${s.previous} → 25 ℃` : `${s.previous} ℃`}</span>
          <i className="bep-starch-bar">
            <i style={{ width: `${s.remaining * 100}%` }} />
          </i>
        </div>
      ))}
      <span className="bep-assay-line">{t('等时取样；碘液显示长淀粉链')}</span>
    </div>
  );
}
function Fold({
  p,
  temperature = 85,
  acidity,
}: {
  p: number;
  temperature?: number;
  acidity?: number;
}) {
  const state =
      acidity === undefined
        ? thermalConformation(temperature, p * 120)
        : chemicalConformation(acidity, p * 30),
    fraction = state.folded,
    unfold = state.unfolding,
    pts = proteinTrace(unfold);
  return (
    <div className="bep-fold">
      <div className="bep-legend">
        <span>{acidity === undefined ? `${temperature} ℃` : `pH ${acidity}`}</span>
        <span>
          {t(acidity === undefined ? '受热时间' : '极端条件暴露')}{' '}
          {Math.round(p * (acidity === undefined ? 120 : 30))} s
        </span>
      </div>
      <svg
        viewBox="0 0 320 180"
        role="img"
        aria-label={t('同一条肽链逐渐失去催化构型，肽链本身没有被剪断')}
      >
        <path
          d={path(pts)}
          fill="none"
          stroke="#a38fab"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[4, 13, 22].map((i) => (
          <circle key={i} cx={pts[i].x} cy={pts[i].y} r="5" fill="#c09a64" stroke="#806d55" />
        ))}
        <path
          d={`M${pts[4].x} ${pts[4].y}L${pts[13].x} ${pts[13].y}L${pts[22].x} ${pts[22].y}`}
          fill="none"
          stroke="#c09a64"
          strokeDasharray="4 4"
          opacity={1 - unfold}
        />
        {Array.from({ length: 20 }, (_, i) => (
          <path
            key={i}
            d={`M${23 + i * 14} 158l4 -${(i + 0.5) / 20 < fraction ? 7 : 1} 4 ${(i + 0.5) / 20 < fraction ? 7 : 1}`}
            fill="none"
            stroke={(i + 0.5) / 20 < fraction ? '#9c83a5' : '#c9cbbb'}
            strokeWidth="3"
          />
        ))}
      </svg>
      <div className="bep-two-facts">
        <span>{t('肽链仍连续')}</span>
        <span>{t('催化构型逐渐减少')}</span>
      </div>
    </div>
  );
}
function PhAssays({ p, uid, focalPh = 7 }: { p: number; uid: string; focalPh?: number }) {
  return (
    <div className="bep-ph-assays">
      {[3, focalPh, 11].map((ph, i) => {
        const s = phComparison(ph, p * 2);
        return (
          <div key={i}>
            <span>pH {ph}</span>
            <div>
              <Tube uid={`${uid}-ph-${i}-blank`} flux={s.blankFlux} time={p * 10} />
              <Tube uid={`${uid}-ph-${i}-enzyme`} flux={s.enzymeFlux} time={p * 10} />
            </div>
            <span>{t('空白 / 加酶')}</span>
          </div>
        );
      })}
      <span className="bep-assay-line">{t('每种酸碱条件都有自己的空白')}</span>
    </div>
  );
}
function Protonation({ ph }: { ph: number }) {
  const s = ionization(ph),
    hA = { x: 92 + (128 - 92) * s.aDeprotonated, y: 111 - (111 - 32) * s.aDeprotonated },
    hB = { x: 225 + (194 - 225) * (1 - s.bProtonated), y: 111 - (111 - 32) * (1 - s.bProtonated) };
  return (
    <div className="bep-charge">
      <div className="bep-legend">
        <span>{t('通用基团模型')}</span>
        <span>pH {ph.toFixed(1)}</span>
      </div>
      <svg
        viewBox="0 0 320 185"
        role="img"
        aria-label={t('酸碱改变两个基团的带氢状态，催化需要合适组合')}
      >
        <rect x="112" y="12" width="101" height="42" rx="18" fill="#d4e0ce" />
        <path
          d="M33 153Q50 77 115 92L160 126L201 92Q270 79 290 153Q168 200 33 153"
          fill="#b8a9bd"
          stroke="#a08ca8"
          strokeWidth="2"
        />
        <text x="62" y="119" className="bep-group">
          A
        </text>
        <text x="249" y="119" className="bep-group">
          B
        </text>
        <text x="83" y="105" opacity={s.aDeprotonated}>
          −
        </text>
        <text x="269" y="105" opacity={s.bProtonated}>
          +
        </text>
        <path
          d={`M78 112L${hA.x} ${hA.y}`}
          stroke="#b28a67"
          strokeWidth="2"
          opacity={1 - s.aDeprotonated}
        />
        <path
          d={`M244 112L${hB.x} ${hB.y}`}
          stroke="#b28a67"
          strokeWidth="2"
          opacity={s.bProtonated}
        />
        {[hA, hB].map((h, i) => (
          <g key={i}>
            <circle cx={h.x} cy={h.y} r="12" fill="#edf0df" stroke="#a8b79c" />
            <text x={h.x} y={h.y + 7} textAnchor="middle">
              H
            </text>
          </g>
        ))}
        <path
          d="M107 121L158 137L215 121"
          stroke="#b68f55"
          strokeWidth="3"
          fill="none"
          strokeDasharray="5 4"
          opacity={s.competent}
        />
      </svg>
      <div className="bep-two-facts">
        <span>{t('A 去氢，B 带氢')}</span>
        <span>{t('此模型的有效组合')}</span>
      </div>
      <i className="bep-competence">
        <i style={{ width: `${s.competent * 100}%` }} />
      </i>
    </div>
  );
}
function Recovery({
  treatment,
  assay,
  uid,
  pretreatment = 120,
  common,
}: {
  treatment: number;
  assay: number;
  uid: string;
  pretreatment?: number;
  common: boolean;
}) {
  const stage = common;
  return (
    <div className="bep-recovery">
      <div className="bep-treatment-heading">
        {t(stage ? '同为 25 ℃，加入相同新底物' : '先只处理酶，尚未加入底物')}
      </div>
      <div className="bep-recovery-groups">
        {[5, 25, 85].map((temp, i) => {
          const state = enzymeAssay(assay * 30, 25, [
            { temperature: temp, seconds: pretreatment * treatment },
          ]);
          const f = state.foldedAtStart;
          return (
            <div key={temp}>
              <span>{stage ? '25 ℃' : `${temp} ℃`}</span>
              <svg viewBox="0 0 90 100" aria-hidden="true">
                {Array.from({ length: 6 }, (_, j) => {
                  const intact = (j + 0.5) / 6 < f;
                  return (
                    <path
                      key={j}
                      d={
                        intact
                          ? `M${15 + (j % 2) * 43} ${17 + Math.floor(j / 2) * 25}q8 -10 16 0q-8 12 -16 0`
                          : `M${12 + (j % 2) * 43} ${17 + Math.floor(j / 2) * 25}l7 -3 8 6 7 -3`
                      }
                      stroke={intact ? '#9a82a6' : '#c0b9bd'}
                      strokeWidth="4"
                      fill="none"
                    />
                  );
                })}
              </svg>
              {stage && (
                <>
                  <i className="bep-starch-bar">
                    <i style={{ width: `${state.remaining * 100}%` }} />
                  </i>
                </>
              )}
              <strong>{t(['曾低温', '室温对照', '曾强热'][i])}</strong>
            </div>
          );
        })}
      </div>
      {stage && <div className="bep-recovery-chain-label">{t('剩余长链')}</div>}
      <span className="bep-small-note">
        {t(stage ? '当前条件相同，历史状态不同' : '示意预处理；不是通用保存配方')}
      </span>
      <span className="bep-sr-only">{uid}</span>
    </div>
  );
}
export default function BioEnzymeInvestigations() {
  const f = useShowcase(),
    uid = useId().replace(/:/g, ''),
    [chosen, setChosen] = useState<EnzymeChapter | null>(null),
    [progress, setProgress] = useState(0.72),
    [active, setActive] = useState(true),
    [temp, setTemp] = useState(85),
    [ph, setPh] = useState(7),
    [exposure, setExposure] = useState(120),
    [amount, setAmount] = useState(1);
  const filmIndex = Math.min(7, Math.max(0, f.chapter)),
    mode = f.watch
      ? enzymeChapters[filmIndex]
      : (chosen ?? enzymeChapters[filmIndex] ?? 'peroxide'),
    index = enzymeChapters.indexOf(mode),
    time = f.watch ? f.chapterTime : progress * enzymeDurations[index],
    d = enzymeDirector(index, time, browserLocale());
  const watch = f.watch,
    phase = d.shot;
  const pH = watch ? d.modelPh : ph;
  return (
    <section className="bep-root" data-enzyme-chapter={mode} data-enzyme-shot={phase}>
      <div className={`bep-scene bep-shot-${phase}`}>
        {mode === 'stomach' ? (
          <Cage p={d.cage} active={watch || active} />
        ) : mode === 'peroxide' ? (
          phase === 'four-tubes' ? (
            <FourTubes uid={uid} progress={d.observation} amount={watch ? 1 : amount} />
          ) : phase === 'heat-energy' ? (
            <EnergyTail progress={d.heat} />
          ) : phase === 'catalyst-path' ? (
            <CatalystPath progress={d.catalyst} />
          ) : phase === 'same-endpoint' ? (
            <Endpoint progress={d.endpoint} amount={watch ? 1 : amount} />
          ) : (
            <>
              <CatalystPath progress={1} damaged />
              <span className="bep-small-note">{t('损伤后，催化路径还可用吗？')}</span>
            </>
          )
        ) : mode === 'cell-free' ? (
          <Extract p={d.extraction} activity={d.fermentation} active={watch || active} />
        ) : mode === 'urease' ? (
          <Crystals p={d.crystal} protein={d.proteinEvidence} uid={uid} />
        ) : mode === 'specificity' ? (
          phase === 'specificity-assay' ? (
            <SpecificityAssay p={d.observation} uid={uid} />
          ) : phase === 'glucan' ? (
            <Glucan binding={d.binding} hydrolysis={d.hydrolysis} release={d.release} />
          ) : phase === 'sucrose' ? (
            <Sucrose p={d.sucrose} />
          ) : (
            <SpecificityAssay p={d.prediction} uid={uid} predict />
          )
        ) : mode === 'temperature' ? (
          phase === 'temperature-assay' ? (
            <TemperatureAssays
              p={d.observation}
              uid={uid}
              pretreat={watch ? 120 : exposure}
              hot={watch ? 85 : temp}
            />
          ) : phase === 'cold-turnover' ? (
            <>
              <EnergyTail cold={5} warm={40} progress={d.coldTurnover} />
              <span className="bep-small-note">{t('低温：催化结构可以保留')}</span>
            </>
          ) : (
            <Fold p={watch ? d.tempHistory : exposure / 120} temperature={watch ? 85 : temp} />
          )
        ) : mode === 'ph' ? (
          phase === 'ph-assay' ? (
            <PhAssays p={d.observation} uid={uid} focalPh={watch ? 7 : ph} />
          ) : phase === 'protonation' ? (
            <Protonation ph={pH} />
          ) : (
            <>
              <Fold p={d.phDamage} acidity={watch ? 11 : ph} />
              <span className="bep-small-note">{t('极端条件还可能损伤结构')}</span>
            </>
          )
        ) : (
          <Recovery
            treatment={d.treatment}
            assay={d.recoveryAssay}
            common={d.recoveryCommon}
            uid={uid}
            pretreatment={watch ? 120 : exposure}
          />
        )}
      </div>
      {!watch && (
        <div className="bep-controls">
          <Segments
            label={t('选择证据')}
            value={mode}
            onChange={(v) => setChosen(v as EnzymeChapter)}
            options={enzymeChapters.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('解释进程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {mode === 'peroxide' && (
            <>
              <Range
                label={t('催化剂相对量')}
                value={amount}
                min={0}
                max={3}
                step={0.1}
                onChange={setAmount}
              />
              <div className="bep-live-comparison">
                <span>{t('同一反应时刻')}</span>
                <i>
                  <i
                    style={{ width: `${peroxideReaction(8, 'catalase', amount).oxygen * 200}%` }}
                  />
                </i>
                <span>{t('氧气生成量')}</span>
              </div>
            </>
          )}
          {(mode === 'temperature' || mode === 'recovery') && (
            <>
              <Range
                label={t('预处理时间')}
                value={exposure}
                min={0}
                max={240}
                step={10}
                unit="s"
                onChange={setExposure}
              />
              {mode === 'temperature' && (
                <Range
                  label={t('强热组温度')}
                  value={temp}
                  min={45}
                  max={95}
                  unit="℃"
                  onChange={setTemp}
                />
              )}
              <span>{t('时间与温度共同决定模型中的保存状态')}</span>
            </>
          )}
          {mode === 'ph' && (
            <Range label={t('模型 pH')} value={ph} min={2} max={12} step={0.1} onChange={setPh} />
          )}
          {(mode === 'stomach' || mode === 'cell-free') && (
            <button type="button" aria-pressed={active} onClick={() => setActive(!active)}>
              {t(active ? '有效成分：有' : '有效成分：无')}
            </button>
          )}
          <p>{t('速率与分子数量为教学示意，不能当作该酶的实测参数。')}</p>
        </div>
      )}
    </section>
  );
}
