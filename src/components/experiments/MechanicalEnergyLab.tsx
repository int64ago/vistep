import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  fallingEnergy,
  tapeEnergy,
  inclinedEnergy,
  hangerEnergy,
  energyPendulum,
  energyFilmState,
  type EnergySceneState,
  type EnergyMode,
} from '../../models/mechanical-energy-lab';
import '../../styles/mechanical-energy-lab.css';
function AirTrack({
  time,
  hanger,
  width,
  friction,
}: {
  time: number;
  hanger: boolean;
  width: number;
  friction: number;
}) {
  const s = inclinedEnergy(time, friction, width),
    h = hangerEnergy(time, width),
    x = hanger ? h.x : s.x,
    theta = hanger ? 0 : s.angle,
    origin = { x: 45, y: hanger ? 109 : 146 },
    scale = hanger ? 230 : 260,
    P = (u: number, z: number) => ({
      x: origin.x + scale * (u * Math.cos(theta) + z * Math.sin(theta)),
      y: origin.y + scale * (u * Math.sin(theta) - z * Math.cos(theta)),
    }),
    q = P(x, 0),
    gates = hanger ? [h.gate] : s.gates,
    railEnd = P(1.18, 0),
    pulley = { x: railEnd.x + 10, y: railEnd.y - 15 },
    hy = pulley.y + 35 + h.x * scale;
  return (
    <svg
      viewBox="0 0 440 340"
      role="img"
      aria-label={t(
        hanger
          ? '水平气垫导轨、滑块、定滑轮与悬挂砝码组成同一系统'
          : '倾斜气垫导轨上的滑块依次穿过两个光电门',
      )}
    >
      <path
        d={`M${origin.x - 8} ${origin.y + 10}L${railEnd.x + 8} ${railEnd.y + 10}`}
        stroke="#b8cbb4"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d={`M${origin.x - 7} ${origin.y + 1}L${railEnd.x + 7} ${railEnd.y + 1}`}
        stroke="#e2e9d9"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {[0.08, 0.95].map((u) => {
        const a = P(u, 0);
        return (
          <g key={u}>
            <path d={`M${a.x} ${a.y + 15}V282`} stroke="#acbda2" strokeWidth="6" />
            <path
              d={`M${a.x - 18} 284h36`}
              stroke="#a8b59b"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {Array.from({ length: 34 }, (_, i) => {
        const a = P(i * 0.034, 0);
        return (
          <g key={i}>
            <circle cx={a.x} cy={a.y + 3} r="1.5" fill="#8da585" />
            {Math.abs(i * 0.034 - x) < 0.1 && (
              <path d={`M${a.x} ${a.y - 1}v-4`} stroke="#bacbdb" strokeWidth="1" />
            )}
          </g>
        );
      })}
      <path
        d={`M${origin.x} ${origin.y + 12}Q18 254 85 289`}
        stroke="#a1b2a7"
        strokeWidth="5"
        fill="none"
      />
      <rect x="76" y="272" width="58" height="31" rx="11" fill="#c9d6bd" stroke="#b1c4a4" />
      <path d="M91 283h24m-24 5h24m-24 5h24" stroke="#a4b69a" />
      {gates.map((gate, i) => {
        const a = P(gate.location, 0),
          blocked = x >= gate.location - width / 2 && x <= gate.location + width / 2;
        return (
          <g key={i}>
            <path
              d={`M${a.x - 8} ${a.y + 14}v-65q9-11 21 0v59`}
              stroke="#b4c4a7"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M${a.x - 6} ${a.y - 34}h17`}
              stroke={blocked ? '#b9ab86' : '#d4b892'}
              strokeDasharray={blocked ? '2 6' : undefined}
              strokeWidth="1.4"
            />
            <path
              d={`M${a.x + 13} ${a.y + 6}Q${a.x + 25} 296 286 300`}
              stroke="#acbaa8"
              strokeWidth="1.2"
              fill="none"
            />
          </g>
        );
      })}
      <g transform={`translate(${q.x} ${q.y}) rotate(${(theta * 180) / Math.PI})`}>
        <path d="M-23 -4L-20 -19H20L24 -4Z" fill="#b8c69d" stroke="#9fb28a" />
        <path d="M-20 -20H20" stroke="#dfe5cf" strokeWidth="4" />
        <path
          d={`M${(-width * scale) / 2} -20v-26h${width * scale}v26Z`}
          fill="#a58f6b"
          stroke="#927d5e"
          strokeWidth=".7"
        />
      </g>
      {hanger && (
        <>
          <text x={q.x - 38} y={q.y - 49} fontSize="40" fill="#657e59">
            M
          </text>
          <path
            d={`M${q.x + 23} ${pulley.y}H${pulley.x}A10 10 0 0 1 ${pulley.x + 10} ${pulley.y + 10}V${hy}`}
            stroke="#ab9673"
            strokeWidth="1.6"
            fill="none"
          />
          <circle cx={pulley.x} cy={pulley.y + 10} r="10" fill="#d4c5a3" stroke="#b0a07f" />
          <circle cx={pulley.x} cy={pulley.y + 10} r="3" fill="#a49d83" />
          <path
            d={`M${pulley.x} ${pulley.y + 10}v30h-18`}
            stroke="#a6b59a"
            strokeWidth="4"
            fill="none"
          />
          <path d={`M${pulley.x + 10} ${hy}v10m-12 0h24`} stroke="#a99372" strokeWidth="2" />
          <rect x={pulley.x - 2} y={hy + 6} width="24" height="13" rx="3" fill="#b5a585" />
          <text x={pulley.x + 29} y={hy + 5} fontSize="40" fill="#917b53">
            m
          </text>
        </>
      )}
      <rect x="273" y="282" width="96" height="40" rx="9" fill="#d3dec5" stroke="#b3c5a6" />
      <rect x="284" y="290" width="72" height="17" rx="4" fill="#edf0df" />
    </svg>
  );
}
export default function MechanicalEnergyLab() {
  const film = useShowcase(),
    [manual, setManual] = useState<EnergySceneState | null>(null),
    authored = energyFilmState(film.chapter, film.chapterProgress),
    [wasWatching, setWasWatching] = useState(film.watch);
  if (film.watch !== wasWatching) {
    setWasWatching(film.watch);
    if (!film.watch && manual === null) setManual(authored);
  }
  const state = film.watch || !manual ? authored : manual,
    change = (patch: Partial<EnergySceneState>) => setManual({ ...state, ...patch }),
    kind = state.mode,
    r = state.resistance,
    w = state.width,
    limit =
      kind === 'fall'
        ? 0.42
        : kind === 'incline'
          ? inclinedEnergy(100, r / 3, w).endTime
          : kind === 'hanger'
            ? hangerEnergy(100, w).endTime
            : 3,
    tm = Math.min(state.time, limit),
    fall = fallingEnergy(tm, r),
    tape = tapeEnergy(r),
    inc = inclinedEnergy(tm, r / 3, w),
    hang = hangerEnergy(tm, w),
    pend = energyPendulum(tm),
    zoom = kind === 'fall' && state.tape,
    ready =
      kind === 'fall'
        ? tm >= 0.36
        : kind === 'incline'
          ? tm >= inc.gates[1].exit
          : kind === 'hanger'
            ? tm >= hang.gate.exit
            : true,
    potential =
      kind === 'fall'
        ? tape.potentialLoss
        : kind === 'incline'
          ? inc.potentialLoss
          : kind === 'hanger'
            ? hang.potentialLoss
            : pend.total,
    kinetic =
      kind === 'fall'
        ? tape.kineticGain
        : kind === 'incline'
          ? inc.kineticGain
          : kind === 'hanger'
            ? hang.kineticGain
            : pend.kinetic,
    loss = kind === 'pendulum' ? pend.potential : potential - kinetic,
    unit = kind === 'fall' ? 'J/kg' : 'J',
    gate = kind === 'incline' ? inc.gates : [hang.gate];
  return (
    <section
      className="mechanical-energy-lab"
      data-view={kind}
      data-time={tm}
      data-resistance={r}
      data-width={w}
      data-tape={zoom}
    >
      <header>
        <p>
          {t(
            kind === 'fall'
              ? '从纸带位置，独立求出速度和高度'
              : kind === 'incline'
                ? '用两道光电门测量下滑前后'
                : kind === 'hanger'
                  ? '悬挂物失去的势能，去了哪里？'
                  : '把摆动作为另一种实验方案',
          )}
        </p>
        <span>{t('模型生成的示例读数 · 不是实测数据')}</span>
      </header>
      <div className={`mechanical-energy-stage ${zoom ? 'is-tape' : ''}`}>
        {kind === 'fall' ? (
          zoom ? (
            <svg
              viewBox="0 65 440 115"
              role="img"
              aria-label={t('等时纸带点按实际位移分布，分别选取两组相邻三点测速度')}
            >
              <path d="M14 97Q220 91 426 97V134Q220 128 14 134Z" fill="#f0edda" stroke="#dcdac3" />
              {tape.dots.map((dot, i) => {
                const x = 24 + dot.x * 440;
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy="112"
                      r={[5, 6, 7, 16, 17, 18].includes(i) ? 3 : 1.7}
                      fill={
                        [5, 6, 7].includes(i)
                          ? '#96ae83'
                          : [16, 17, 18].includes(i)
                            ? '#b19c73'
                            : '#bdc3aa'
                      }
                    />
                    {[6, 17].includes(i) && (
                      <path
                        d={`M${x} 104V71`}
                        stroke={i === 6 ? '#96ae83' : '#b19c73'}
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                );
              })}
              <path
                d={`M${24 + tape.dots[6].x * 440} 163H${24 + tape.dots[17].x * 440}`}
                stroke="#a7b393"
                strokeWidth="1.5"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 440 360"
              role="img"
              aria-label={t('重物带着纸带穿过固定的打点计时器，下落位置按等时间隔留下墨点')}
            >
              <path
                d="M94 33V329M62 333H168"
                stroke="#acbaa0"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path d="M96 65h83" stroke="#a4b598" strokeWidth="6" />
              <path d={`M165 20H179V${102 + fall.x * 235}H165Z`} fill="#f1eed8" stroke="#d6d9bd" />
              {tape.dots
                .filter((v) => v.time <= tm)
                .map((v, i) => (
                  <circle key={i} cx="172" cy={78 + (fall.x - v.x) * 235} r="1.8" fill="#819577" />
                ))}
              <rect x="146" y="55" width="51" height="37" rx="8" fill="#c1cfb0" stroke="#9fb28b" />
              <path d="M152 77h31" stroke="#a8a47d" strokeWidth="4" />
              <path d={`M163 ${100 + fall.x * 235}h18v12h-18Z`} fill="#9eab8b" />
              <path
                d={`M155 ${112 + fall.x * 235}h34v27q-17 8-34 0Z`}
                fill="#b4a78b"
                stroke="#9f9275"
              />
              <path d="M198 76q71 0 70 213h-17" stroke="#a4b399" strokeWidth="2" fill="none" />
              <rect x="228" y="278" width="79" height="30" rx="7" fill="#c8d4b8" />
              <path d="M257 290h20" stroke="#9bad8b" strokeWidth="3" />
              <path d="M148 329h58" stroke="#c5ceb4" strokeWidth="3" />
            </svg>
          )
        ) : kind === 'pendulum' ? (
          <svg
            viewBox="0 0 440 340"
            role="img"
            aria-label={t('小球绕固定支点摆动，绳长固定，动能与势能从独立运动方程计算')}
          >
            <path d="M95 40H345" stroke="#b9c9ac" strokeWidth="11" strokeLinecap="round" />
            <path
              d={`M220 49L${220 + pend.x * 310} ${49 - pend.y * 310}`}
              stroke="#b3a17c"
              strokeWidth="2"
            />
            <circle cx="220" cy="49" r="5" fill="#a2b28f" />
            <path d="M60 266h320" stroke="#c8d1b9" strokeDasharray="4 6" />
            <circle
              cx={220 + pend.x * 310}
              cy={49 - pend.y * 310}
              r="12"
              fill="#b4a783"
              stroke="#9e9274"
            />
            <path
              d={`M${220 + pend.x * 310} ${49 - pend.y * 310}H365V266`}
              stroke="#bcc7ad"
              strokeDasharray="3 5"
              fill="none"
            />
          </svg>
        ) : (
          <AirTrack time={tm} hanger={kind === 'hanger'} width={w} friction={r / 3} />
        )}
      </div>
      {kind === 'fall' && zoom && (
        <div className="mechanical-energy-record">
          <span>Δh = {tape.height.toFixed(3)} m</span>
          <span>Δt = 0.020 s</span>
          <span>v₁ = {tape.v1.toFixed(3)} m/s</span>
          <span>v₂ = {tape.v2.toFixed(3)} m/s</span>
          <p>v = (x₊ − x₋) / (2Δt)</p>
        </div>
      )}
      {(kind === 'incline' || kind === 'hanger') &&
        !(film.watch && kind === 'incline' && film.chapter === 3) && (
          <div className="mechanical-energy-record">
            {!(film.watch && kind === 'hanger') && <span>d = {(w * 1000).toFixed(0)} mm</span>}
            {!(film.watch && kind === 'hanger') &&
              gate.map((g, i) => (
                <span key={i}>
                  Δt{i + 1} = {tm >= g.exit ? (g.duration * 1000).toFixed(2) + ' ms' : '—'}
                </span>
              ))}
            {gate.map((g, i) => (
              <span key={`v${i}`}>
                v{i + 1} ≈ {tm >= g.exit ? g.meanSpeed.toFixed(3) + ' m/s' : '—'}
              </span>
            ))}
          </div>
        )}
      <div className="mechanical-energy-balance" aria-live="off">
        <div>
          <span>{t(kind === 'pendulum' ? '总机械能' : '势能减少')}</span>
          <b>
            {ready ? potential.toFixed(4) : '—'} {unit}
          </b>
          <i style={{ width: ready ? '100%' : '0%' }} />
        </div>
        <div>
          <span>{t(kind === 'pendulum' ? '动能' : '增加的动能')}</span>
          <b>
            {ready ? kinetic.toFixed(4) : '—'} {unit}
          </b>
          <i
            style={{
              width: ready ? `${Math.max(0, Math.min(1, kinetic / potential)) * 100}%` : '0%',
              ...(kind === 'hanger'
                ? {
                    background: `linear-gradient(to right, #a4bc98 ${(hang.cartOnly / hang.kineticGain) * 100}%, #c3ae83 ${(hang.cartOnly / hang.kineticGain) * 100}%)`,
                  }
                : {}),
            }}
          />
        </div>
        {ready && (
          <p>
            {t(kind === 'pendulum' ? '剩余重力势能' : '两者之差')}{' '}
            <b>
              {loss.toFixed(5)} {unit}
            </b>
          </p>
        )}
      </div>
      <p className="mechanical-energy-cause">
        {t(
          kind === 'fall'
            ? r > 0
              ? '阻力做负功：减少的重力势能，不再全部变为动能。'
              : '纸带同时提供高度差与速度；两种能量从各自测量量计算。'
            : kind === 'incline'
              ? '挡光宽度除以挡光时间，给出过门期间的平均速度。'
              : kind === 'hanger'
                ? '系统包括滑块、遮光条、托盘和砝码；两部分都有动能。'
                : '摆动方案：张力与瞬时位移垂直，不做功；仍需实际测量高度和速度。',
        )}
      </p>
      {kind === 'hanger' && ready && (
        <p className="mechanical-energy-system">
          <span aria-label={t('滑块')}>M {hang.cartOnly.toFixed(3)}</span> +{' '}
          <span aria-label={t('悬挂物')}>m {(hang.kineticGain - hang.cartOnly).toFixed(3)} J</span>
        </p>
      )}
      {!film.watch && (
        <div className="mechanical-energy-controls">
          <Segments
            label={t('实验方案')}
            value={kind}
            onChange={(v) => change({ mode: v as EnergyMode, tape: false, time: 0 })}
            options={[
              { value: 'fall', label: t('自由下落纸带') },
              { value: 'incline', label: t('倾斜气垫导轨') },
              { value: 'hanger', label: t('水平气轨与悬挂物') },
              { value: 'pendulum', label: t('摆动方案') },
            ]}
          />
          {(kind === 'fall' || kind === 'incline') && (
            <Range
              label={t(kind === 'fall' ? '等效向上阻力' : '导轨摩擦系数')}
              value={kind === 'fall' ? r : r / 3}
              min={0}
              max={kind === 'fall' ? 0.3 : 0.1}
              step={kind === 'fall' ? 0.01 : 0.005}
              unit={kind === 'fall' ? 'N' : ''}
              onChange={(v) => change({ resistance: kind === 'fall' ? v : v * 3 })}
            />
          )}{' '}
          {(kind === 'incline' || kind === 'hanger') && (
            <Range
              label={t('遮光条宽度')}
              value={w}
              min={0.005}
              max={0.08}
              step={0.005}
              unit="m"
              onChange={(v) => change({ width: v })}
            />
          )}
          <Range
            label={t('模型时间')}
            value={tm}
            min={0}
            max={limit}
            step={0.01}
            unit="s"
            onChange={(v) => change({ time: v })}
          />
          {kind === 'fall' && (
            <Segments
              label={t('观察视图')}
              value={zoom ? 'tape' : 'apparatus'}
              onChange={(v) => change({ tape: v === 'tape' })}
              options={[
                { value: 'apparatus', label: t('下落装置') },
                { value: 'tape', label: t('纸带读数') },
              ]}
            />
          )}
        </div>
      )}
      <p className="mechanical-energy-note">
        {t(
          '纸带忽略打点扰动；气轨忽略转动惯量。有限遮光宽度带来小的速度近似误差，可在探索中改变宽度查看。',
        )}
      </p>
    </section>
  );
}
