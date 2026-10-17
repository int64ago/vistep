import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { leverDefaults, leverShot, leverState } from '../../models/lever';
import '../../styles/lever.css';
export default function Lever() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [manual, setManual] = useState(leverDefaults());
  const p = film.watch ? leverShot(film.chapter, film.chapterProgress) : manual,
    s = leverState(p);
  const detail = film.watch ? film.chapter : 2;
  const draw = (mobile: boolean) => {
    const width = mobile ? 330 : 760,
      height = mobile ? 310 : 350,
      scale = mobile ? 75 : 154,
      ox = mobile ? 198 : 445,
      oy = mobile ? 144 : 160;
    const xy = (v: { x: number; y: number }) => ({ x: ox + v.x * scale, y: oy - v.y * scale });
    const a = xy(s.point),
      b = xy(s.loadPoint),
      f = xy(s.foot),
      forceLength = 30 + p.effort * 0.35;
    const tip = { x: a.x - s.unit.x * forceLength, y: a.y + s.unit.y * forceLength };
    return (
      <svg
        className={mobile ? 'lever-phone' : 'lever-wide'}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('杠杆的力、垂直力臂与两端位移')}
      >
        <defs>
          <linearGradient
            id={`${id}-beam-${mobile}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={oy - 8}
            x2="0"
            y2={oy + 8}
          >
            <stop stopColor="#f1dab2" />
            <stop offset=".45" stopColor="#b98d55" />
            <stop offset="1" stopColor="#785c40" />
          </linearGradient>
          <marker
            id={`${id}-arrow-${mobile}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        <path d={`M${ox - 22} ${oy + 58}L${ox} ${oy + 4}L${ox + 22} ${oy + 58}Z`} fill="#7b8c86" />
        <ellipse cx={ox} cy={oy + 62} rx="44" ry="7" fill="#60746a" opacity=".12" />
        <line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={`url(#${id}-beam-${mobile})`}
          strokeWidth="16"
          strokeLinecap="round"
        />
        <circle cx={ox} cy={oy} r="8" fill="#fffaf0" stroke="#53675e" strokeWidth="3" />
        <path d={`M${b.x} ${b.y + 8}V${b.y + 34}`} stroke="#8d785b" strokeWidth="3" />
        <rect x={b.x - 20} y={b.y + 34} width="40" height="38" rx="9" fill="#455d64" />
        <path d={`M${b.x - 14} ${b.y + 40}H${b.x + 14}`} stroke="#77949c" />
        <line
          x1={b.x}
          y1={b.y + 76}
          x2={b.x}
          y2={b.y + 108}
          stroke="#4b7988"
          strokeWidth="3"
          markerEnd={`url(#${id}-arrow-${mobile})`}
        />
        <line
          x1={tip.x}
          y1={tip.y}
          x2={a.x}
          y2={a.y}
          stroke="#bf774d"
          strokeWidth="4"
          markerEnd={`url(#${id}-arrow-${mobile})`}
        />
        <text x={tip.x} y={tip.y - 12} textAnchor="middle" fill="#a4613e">
          F = {p.effort.toFixed(0)} N
        </text>
        <text x={b.x} y={b.y + 135} textAnchor="middle" fill="#3e6372">
          120 N
        </text>
        {detail >= 2 && detail < 5 && (
          <>
            <line
              x1={a.x - s.unit.x * 150}
              y1={a.y + s.unit.y * 150}
              x2={a.x + s.unit.x * 30}
              y2={a.y - s.unit.y * 30}
              stroke="#bf774d"
              strokeDasharray="4 5"
              opacity=".5"
            />
            <line x1={ox} y1={oy} x2={f.x} y2={f.y} stroke="#8c72a2" strokeWidth="4" />
            <circle cx={f.x} cy={f.y} r="4" fill="#8c72a2" />
            <text
              x={mobile ? 165 : 740}
              y="38"
              textAnchor={mobile ? 'middle' : 'end'}
              fill="#725b89"
            >
              {t('垂直力臂')} {s.arm.toFixed(2)} m
            </text>
          </>
        )}
        {detail < 2 && (
          <>
            <path
              d={`M${a.x} ${oy - 45}V${oy - 55}H${ox}V${oy - 45}M${ox} ${oy - 55}H${b.x}V${oy - 45}`}
              fill="none"
              stroke="#a39780"
            />
            <text x={(a.x + ox) / 2} y={oy - 68} textAnchor="middle">
              {p.effortArm.toFixed(1)} m
            </text>
            <text x={(b.x + ox) / 2} y={oy - 68} textAnchor="middle">
              1 m
            </text>
          </>
        )}
        {detail >= 5 && (
          <>
            <path
              d={`M${ox - p.effortArm * scale} ${oy}V${a.y}M${ox + p.loadArm * scale} ${oy}V${b.y}`}
              stroke="#9876a1"
              strokeWidth="3"
            />
            <line x1="15" y1={oy} x2={width - 15} y2={oy} stroke="#cabfa9" strokeDasharray="3 5" />
            <text x={mobile ? 95 : 225} y="44" textAnchor="middle">
              {t('用力端下降')} {s.inputTravel.toFixed(2)} m
            </text>
            <text x={mobile ? 210 : 565} y="76" textAnchor="middle">
              {t('负载上升')} {s.outputTravel.toFixed(2)} m
            </text>
          </>
        )}
      </svg>
    );
  };
  return (
    <div className="lever-film" data-shot={detail}>
      <div className="lever-apparatus">
        {draw(false)}
        {draw(true)}
      </div>
      <div className="lever-equation" aria-live="off">
        {detail >= 5 ? (
          <>
            <span>
              {t('输入功')} <b>{s.inputWork.toFixed(1)} J</b>
            </span>
            <i>=</i>
            <span>
              {t('提升负载')} <b>{s.outputWork.toFixed(1)} J</b>
            </span>
          </>
        ) : (
          <>
            <span>
              {t('用力的力矩')} <b>{s.effortTorque.toFixed(1)} N·m</b>
            </span>
            <i>{Math.abs(s.netTorque) < 0.1 ? '=' : '≠'}</i>
            <span>
              {t('负载的力矩')} <b>{(-s.loadTorque).toFixed(1)} N·m</b>
            </span>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="lever-controls">
          <Range
            label={t('用力点到支点')}
            value={manual.effortArm}
            min={0.5}
            max={2}
            step={0.1}
            unit="m"
            onChange={(effortArm) => setManual({ ...manual, effortArm })}
          />
          <Range
            label={t('用力大小')}
            value={manual.effort}
            min={0}
            max={240}
            unit="N"
            onChange={(effort) => setManual({ ...manual, effort })}
          />
          <Range
            label={t('偏离竖直的角度')}
            value={manual.direction}
            min={0}
            max={90}
            unit="°"
            onChange={(direction) => setManual({ ...manual, direction })}
          />
          <button className="btn" onClick={() => setManual(leverDefaults())}>
            {t('重置杠杆')}
          </button>
          <p>{t('保持杆水平，读出转动趋势；不是动态平衡仿真。')}</p>
        </div>
      )}
      <p className="lever-limit">{t('理想无质量杆 · 无摩擦支点 · 准静态比较')}</p>
    </div>
  );
}
