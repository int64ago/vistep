import { useState, useId } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { resultantExperiment } from '../../models/force-resultant-lab';
import { springWire } from '../../models/elasticity-lab';
import '../../styles/force-resultant-lab.css';
export default function ForceResultantLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [view, setView] = useState<'two' | 'one' | 'vectors'>('two'),
    [angleA, setAngleA] = useState(35),
    [angleB, setAngleB] = useState(50),
    [length, setLength] = useState(0.28);
  const c = film.watch ? film.chapter : 2,
    p = film.chapterProgress,
    mode = film.watch
      ? c === 1
        ? 'one'
        : c === 2
          ? 'vectors'
          : c === 3 && p < 0.3
            ? 'one'
            : 'two'
      : view;
  const a = film.watch
      ? c === 3 && p > 0.3
        ? 35 + 20 * Math.min(1, (p - 0.3) / 0.6)
        : 35
      : angleA,
    b = film.watch ? 50 : angleB,
    s = resultantExperiment(a, b, film.watch ? 0.28 : length),
    origin = { x: 180, y: 325 - s.length * 390 };
  const vec = (v: { x: number; y: number }) => ({ x: origin.x + v.x * 30, y: origin.y - v.y * 30 }),
    l = vec(s.left),
    r = vec(s.right),
    sum = vec(s.sum);
  const meters =
    mode === 'one'
      ? [{ degrees: 0, force: s.required, color: '#6f9283' }]
      : [
          { degrees: -a, force: s.leftForce, color: '#ae8a60' },
          { degrees: b, force: s.rightForce, color: '#8a9e75' },
        ];
  return (
    <section className="resultant-lab">
      <header>
        <p>
          {t(
            mode === 'one'
              ? '改用一个力，仍把圆环拉到同一个标记'
              : mode === 'vectors'
                ? '从同一个点画矢量，比较平行四边形对角线'
                : c === 3
                  ? '从一个力出发，找一组等效的两个力'
                  : '两个方向一起拉，把圆环停在O点',
          )}
        </p>
        <span>{t('同一橡皮条 · 同一O点')}</span>
      </header>
      <svg
        className="resultant-board"
        viewBox="0 0 360 350"
        role="img"
        aria-label={t('固定橡皮条连接圆环，双测力计与单测力计把圆环拉到相同位置')}
      >
        <defs>
          <linearGradient id={`${id}paper`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f3efdf" />
            <stop offset="1" stopColor="#eeebdb" />
          </linearGradient>
          {['a', 'b', 'sum'].map((v, i) => (
            <marker
              key={v}
              id={`${id}${v}`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path
                d="M0 0L7 3.5L0 7Z"
                fill={i === 0 ? '#ae8a60' : i === 1 ? '#8a9e75' : '#6f9283'}
              />
            </marker>
          ))}
        </defs>
        <rect x="15" y="15" width="330" height="320" rx="12" fill={`url(#${id}paper)`} />
        <path
          d="M30 31H47M313 31H330M30 319H47M313 319H330"
          stroke="#dad3bd"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d={`M176 324Q171 288 177 ${origin.y + 7}M184 324Q189 288 183 ${origin.y + 7}`}
          stroke="#ba9870"
          strokeWidth="3"
          fill="none"
        />
        <circle cx="180" cy="325" r="5" fill="#8b9b79" />
        <path
          d={`M${origin.x - 13} ${origin.y}H${origin.x + 13}M${origin.x} ${origin.y - 13}V${origin.y + 13}`}
          stroke="#aaa991"
          strokeWidth="1"
        />
        <text x={origin.x + 17} y={origin.y + 23} fill="#7d876d" fontSize="19">
          O
        </text>
        {mode !== 'vectors' &&
          meters.map((m, i) => {
            const rad = (m.degrees * Math.PI) / 180,
              dx = Math.sin(rad),
              dy = -Math.cos(rad),
              hook = { x: origin.x + dx * 75, y: origin.y + dy * 75 },
              wire = 20 + m.force * 2;
            return (
              <g key={i}>
                <path
                  d={`M${origin.x} ${origin.y}L${hook.x} ${hook.y}`}
                  stroke={m.color}
                  strokeWidth="1.5"
                />
                <g transform={`translate(${hook.x} ${hook.y}) rotate(${m.degrees})`}>
                  <path d="M0 0V-18" stroke={m.color} strokeWidth="2" />
                  <rect
                    x="-13"
                    y={-75 - m.force * 2}
                    width="26"
                    height="58"
                    rx="7"
                    fill="#e1e7d5"
                    stroke={m.color}
                  />
                  <path
                    d={springWire(wire, 7, 5)
                      .map((q, j) => `${j ? 'L' : 'M'}${q.x} ${-55 - m.force * 2 + q.y}`)
                      .join(' ')}
                    stroke={m.color}
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path d="M-8 -35H8M0 -35V-18" stroke={m.color} strokeWidth="1.5" />
                  <path d={`M0 ${-75 - m.force * 2}v-13`} stroke={m.color} strokeWidth="2" />
                  <path
                    d={`M-6 ${-88 - m.force * 2}q-8-10 0-14h12q8 4 0 14`}
                    fill="#d7c0a1"
                    stroke="#bba17f"
                    strokeWidth="1.3"
                  />
                </g>
              </g>
            );
          })}
        {(mode === 'vectors' || mode === 'one') && (
          <>
            {mode === 'one' ? (
              [l, r].map((v, i) => (
                <path
                  key={i}
                  d={`M${origin.x} ${origin.y}L${v.x} ${v.y}`}
                  stroke="#c2b89e"
                  strokeDasharray="3 4"
                />
              ))
            ) : (
              <>
                <path
                  d={`M${origin.x} ${origin.y}L${l.x} ${l.y}`}
                  stroke="#ae8a60"
                  strokeWidth="2"
                  markerEnd={`url(#${id}a)`}
                />
                <path
                  d={`M${origin.x} ${origin.y}L${r.x} ${r.y}`}
                  stroke="#8a9e75"
                  strokeWidth="2"
                  markerEnd={`url(#${id}b)`}
                />
                <path
                  d={`M${l.x} ${l.y}L${sum.x} ${sum.y}L${r.x} ${r.y}`}
                  stroke="#a5ac91"
                  strokeDasharray="4 4"
                  fill="none"
                />
                {(!film.watch || p > 0.3) && (
                  <path
                    d={`M${origin.x} ${origin.y}L${sum.x} ${sum.y}`}
                    stroke="#6f9283"
                    strokeWidth="2.8"
                    markerEnd={`url(#${id}sum)`}
                  />
                )}
              </>
            )}
          </>
        )}
        <circle cx={origin.x} cy={origin.y} r="7" fill="#f4f1e4" stroke="#9da88b" strokeWidth="2" />
      </svg>
      <div className="resultant-readings">
        <span>
          {t('左侧力')}
          <strong>{s.leftForce.toFixed(2)} N</strong>
        </span>
        <span>
          {t('右侧力')}
          <strong>{s.rightForce.toFixed(2)} N</strong>
        </span>
        <span>
          {t('等效单力')}
          <strong>{film.watch && c === 0 ? '—' : `${s.required.toFixed(2)} N`}</strong>
        </span>
      </div>
      <p className="resultant-result">
        {t(
          mode === 'one'
            ? '同一个O点意味着橡皮条的伸长和方向相同。'
            : mode === 'vectors'
              ? '等效合力是对角线；不是把两个读数直接相加。'
              : '保留O点与两条方向记录，才能进行等效替换。',
        )}
      </p>
      {!film.watch && (
        <div className="resultant-controls">
          <Segments
            label={t('观察步骤')}
            value={view}
            onChange={setView}
            options={[
              { value: 'two', label: t('两个力') },
              { value: 'one', label: t('一个力') },
              { value: 'vectors', label: t('矢量记录') },
            ]}
          />
          <Range
            label={t('左侧偏离竖直的角度')}
            value={angleA}
            min={20}
            max={65}
            unit="°"
            onChange={setAngleA}
          />
          <Range
            label={t('右侧偏离竖直的角度')}
            value={angleB}
            min={20}
            max={65}
            unit="°"
            onChange={setAngleB}
          />
          <Range
            label={t('橡皮条拉伸后长度')}
            value={length}
            min={0.22}
            max={0.34}
            step={0.01}
            unit="m"
            onChange={setLength}
          />
        </div>
      )}
      <p className="resultant-note">
        {t(
          '合力表示等效替代，不是又增加一个实际拉力。橡皮条取线性弹性近似，所有状态均为静止平衡。',
        )}
      </p>
    </section>
  );
}
