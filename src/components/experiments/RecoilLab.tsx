import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  balloonRecoil,
  balloonParcel,
  waterRotorTrajectory,
  sampleRotor,
  waterParcel,
  ROTOR,
  type RotorTrajectory,
} from '../../models/recoil-lab';
import '../../styles/recoil-lab.css';
function Balloon({
  time,
  area,
  id,
  compare = false,
}: {
  time: number;
  area: number;
  id: string;
  compare?: boolean;
}) {
  const draw = (a: number, cy: number) => {
    const s = balloonRecoil(time, a),
      S = compare ? 420 : 600,
      camera = compare ? 0 : Math.max(0, s.x - 0.25),
      cx = (compare ? 105 : 100) + (s.x - camera) * S,
      r = s.radius * S,
      neck = 0.018 * S,
      nr = Math.sqrt(a / Math.PI) * S;
    return (
      <g>
        <path d={`M25 ${cy + 78}H415`} stroke="#d6ddc5" />
        {Array.from({ length: 9 }, (_, i) => {
          const wx = Math.floor(camera / 0.2) * 0.2 + (i - 2) * 0.2,
            x = (compare ? 105 : 100) + (wx - camera) * S;
          return x >= 25 && x <= 415 ? (
            <path key={i} d={`M${x} ${cy + 75}v7`} stroke="#c1cdb0" />
          ) : null;
        })}
        {Array.from({ length: 16 }, (_, i) => {
          const emitted = s.time - i * 0.0011;
          if (emitted < 0) return null;
          const gas = balloonParcel(emitted, s.time, a),
            x = (compare ? 105 : 100) + (gas.x - camera) * S;
          return (
            <ellipse
              key={i}
              cx={x}
              cy={cy + Math.sin(i * 2.3) * (0.5 + i * 0.5)}
              rx={1.5 + i * 0.3}
              ry={1 + i * 0.22}
              fill="#b5c9ca"
              opacity={0.48 - i * 0.022}
            />
          );
        })}
        <path
          d={`M${cx - r} ${cy}C${cx - r * 0.92} ${cy - r * 0.9} ${cx + r * 0.7} ${cy - r * 1.08} ${cx + r} ${cy}C${cx + r * 0.7} ${cy + r * 1.08} ${cx - r * 0.92} ${cy + r * 0.9} ${cx - r} ${cy}L${cx - r - neck} ${cy + nr}L${cx - r - neck} ${cy - nr}Z`}
          fill={`url(#${id}-balloon)`}
          stroke="#a8b999"
          strokeWidth="1.3"
        />
        <path
          d={`M${cx - r * 0.32} ${cy - r * 0.55}Q${cx + r * 0.16} ${cy - r * 0.66} ${cx + r * 0.45} ${cy - r * 0.36}`}
          fill="none"
          stroke="#f3f3d7"
          strokeWidth="4"
          strokeLinecap="round"
          opacity=".55"
        />
        <path d={`M${cx - r - neck} ${cy - nr}v${nr * 2}`} stroke="#a0af8d" strokeWidth="2" />
        {time > 0 && (
          <path
            d={`M${cx + r + 10} ${cy}h${Math.min(65, s.v * 8)}m-5-4l5 4-5 4`}
            stroke="#9eb287"
            strokeWidth="2"
            fill="none"
          />
        )}
      </g>
    );
  };
  return (
    <svg
      viewBox={compare ? '0 0 440 350' : '0 0 440 300'}
      role="img"
      aria-label={t('气球口向后喷出气体，剩余气球向前加速；形状按剩余气体体积缩小')}
    >
      <defs>
        <radialGradient id={`${id}-balloon`} cx=".65" cy=".25">
          <stop stopColor="#e4e9bf" />
          <stop offset=".65" stopColor="#c6d4a6" />
          <stop offset="1" stopColor="#b1c196" />
        </radialGradient>
      </defs>
      {compare ? (
        <>
          <text x="30" y="30" fontSize="24" fill="#8da27b">
            A
          </text>
          {draw(32e-6, 92)}
          <text x="30" y="205" fontSize="24" fill="#a58d64">
            2A
          </text>
          {draw(64e-6, 267)}
        </>
      ) : (
        draw(area, 135)
      )}
    </svg>
  );
}
function WaterRotor({ path, time }: { path: RotorTrajectory; time: number }) {
  const s = sampleRotor(path, time),
    P = (x: number, y: number, z: number) => ({
      x: 220 + 450 * x + 150 * y,
      y: 220 + 130 * y - 520 * z,
    }),
    line = (q: { x: number; y: number; z: number }[], close = false) =>
      q
        .map((a, i) => {
          const p = P(a.x, a.y, a.z);
          return `${i ? 'L' : 'M'}${p.x} ${p.y}`;
        })
        .join(' ') + (close ? 'Z' : ''),
    ring = (r: number, z: number) =>
      line(
        Array.from({ length: 65 }, (_, i) => ({
          x: r * Math.cos((i / 64) * Math.PI * 2),
          y: r * Math.sin((i / 64) * Math.PI * 2),
          z,
        })),
      ),
    rotate = (x: number, y: number, angle: number) => ({
      x: x * Math.cos(angle) - y * Math.sin(angle),
      y: x * Math.sin(angle) + y * Math.cos(angle),
      z: ROTOR.nozzleHeight,
    }),
    topR = ROTOR.height * ROTOR.coneSlope;
  return (
    <svg
      viewBox="0 0 440 380"
      role="img"
      aria-label={t('悬挂的圆锥盛水容器通过两根弯管向相反切向喷水，容器反向旋转，水位连续下降')}
    >
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2,
          b = ((i + 1) / 48) * Math.PI * 2;
        return (
          <path
            key={i}
            d={line(
              [
                { x: 0.4 * Math.cos(a), y: 0.4 * Math.sin(a), z: -0.12 },
                { x: 0.4 * Math.cos(b), y: 0.4 * Math.sin(b), z: -0.12 },
                { x: 0.4 * Math.cos(b), y: 0.4 * Math.sin(b), z: -0.17 },
                { x: 0.4 * Math.cos(a), y: 0.4 * Math.sin(a), z: -0.17 },
              ],
              true,
            )}
            fill="#d2dcd1"
            stroke="#c5d4c9"
            strokeWidth=".2"
          />
        );
      })}
      <path d={ring(0.4, -0.12)} fill="#e0e8dc" stroke="#bdcec2" />
      <path
        d={line([
          { x: -topR, y: 0, z: ROTOR.height },
          { x: 0, y: 0, z: 0 },
          { x: topR, y: 0, z: ROTOR.height },
        ])}
        fill="#e7e8ca"
        fillOpacity=".3"
        stroke="#c6cdb0"
      />
      {Array.from({ length: 32 }, (_, i) => {
        const a = (i / 32) * Math.PI * 2,
          b = ((i + 1) / 32) * Math.PI * 2;
        return (
          <path
            key={i}
            d={line(
              [
                { x: 0, y: 0, z: 0 },
                { x: s.edgeRadius * Math.cos(a), y: s.edgeRadius * Math.sin(a), z: s.edgeHeight },
                { x: s.edgeRadius * Math.cos(b), y: s.edgeRadius * Math.sin(b), z: s.edgeHeight },
              ],
              true,
            )}
            fill="#c0d4c3"
            fillOpacity=".23"
          />
        );
      })}
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const r = s.edgeRadius * f,
          z = s.centerHeight + (s.omega * s.omega * r * r) / (2 * 9.8);
        return (
          <path
            key={f}
            d={ring(r, z)}
            stroke="#a9c4b1"
            strokeWidth={f === 1 ? 1.8 : 0.7}
            fill={f === 1 ? '#c6dbca' : 'none'}
            fillOpacity=".15"
          />
        );
      })}
      {[0, 1].map((arm) => {
        const angle = s.angle + arm * Math.PI,
          bend = 0.01,
          wall = ROTOR.nozzleHeight * ROTOR.coneSlope,
          start = Math.sqrt(wall * wall - bend * bend),
          points = [
            rotate(start, s.sign * bend, angle),
            rotate(ROTOR.nozzleRadius - bend, s.sign * bend, angle),
            ...Array.from({ length: 13 }, (_, i) =>
              rotate(
                ROTOR.nozzleRadius - bend + bend * Math.sin(((i / 12) * Math.PI) / 2),
                s.sign * bend * Math.cos(((i / 12) * Math.PI) / 2),
                angle,
              ),
            ),
          ];
        return (
          <g key={arm}>
            <path
              d={line(points)}
              stroke="#b8c5a6"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <path d={line(points)} stroke="#d6e1c6" strokeWidth="2.5" fill="none" />
            {Array.from({ length: 21 }, (_, i) => {
              const emitted = s.time - i * 0.008;
              if (emitted < 0) return null;
              const q = waterParcel(path, emitted, s.time, arm),
                p = P(q.x, q.y, q.z);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={2.3 - i * 0.035}
                  fill="#9ebeb8"
                  opacity={0.8 - i * 0.02}
                />
              );
            })}
          </g>
        );
      })}
      {Array.from({ length: 17 }, (_, i) => {
        const a = (i / 16) * Math.PI,
          r = topR,
          tip = P(0, 0, 0),
          p = P(r * Math.cos(a), r * Math.sin(a), ROTOR.height);
        return i === 0 || i === 16 ? (
          <path key={i} d={`M${tip.x} ${tip.y}L${p.x} ${p.y}`} stroke="#c1c7a9" strokeWidth="1.2" />
        ) : null;
      })}
      <path d={ring(topR, ROTOR.height)} stroke="#b7c5a5" strokeWidth="2" fill="none" />
      {[0, 1, 2].map((i) => {
        const a = s.angle + (i * Math.PI * 2) / 3,
          q = P(topR * Math.cos(a), topR * Math.sin(a), ROTOR.height);
        return <path key={i} d={`M220 40L${q.x} ${q.y}`} stroke="#b6aa83" strokeWidth="1.1" />;
      })}
      <path d="M165 27h110M220 27v13" stroke="#aabb9f" strokeWidth="5" strokeLinecap="round" />
      <circle cx="220" cy="40" r="3" fill="#a0ad91" />
      <path
        d={line([
          { x: 0, y: 0, z: 0 },
          { x: topR * Math.cos(s.angle), y: topR * Math.sin(s.angle), z: ROTOR.height },
        ])}
        stroke="#b6a37a"
        strokeWidth="1.5"
        opacity=".65"
      />
    </svg>
  );
}
export default function RecoilLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', ''),
    [mode, setMode] = useState(film.variant === 'e1-water-rotor-recoil' ? 'water' : 'balloon'),
    [area, setArea] = useState(32),
    [radius, setRadius] = useState(1.8),
    [direction, setDirection] = useState('left'),
    [time, setTime] = useState(1),
    c = film.chapter,
    p = Math.min(1, film.chapterProgress / 0.8),
    water = film.watch ? c >= 3 : mode === 'water',
    comparison = film.watch && c === 2,
    sign = film.watch ? (c === 4 ? -1 : 1) : direction === 'left' ? 1 : -1,
    trajectory = useMemo(
      () => waterRotorTrajectory(Math.PI * (film.watch ? 0.0018 : radius / 1000) ** 2, sign),
      [film.watch, radius, sign],
    ),
    a = film.watch ? 32e-6 : area * 1e-6,
    limit = water ? trajectory.duration : balloonRecoil(0, a).duration * 0.9,
    tm = film.watch ? (comparison ? 0.45 * p : limit * p) : Math.min(time, limit),
    s = sampleRotor(trajectory, water ? tm : 0),
    b = balloonRecoil(tm, a);
  return (
    <section className="recoil-lab">
      <header>
        <p>
          {t(
            water
              ? c === 4 && film.watch
                ? '把弯管反过来，容器转向也反过来'
                : '喷水带走角动量，容器朝相反方向转'
              : comparison
                ? '相同时刻，大喷口排出更多气体'
                : '气体向后喷，剩余气球向前走',
          )}
        </p>
        <span>
          {t(water ? '可旋转圆锥水容器 · 准稳态模型' : '理想一维喷气 · 不代表真实气球的完整轨迹')}
        </span>
      </header>
      <div className="recoil-stage">
        {water ? (
          <WaterRotor path={trajectory} time={tm} />
        ) : (
          <Balloon time={tm} area={a} id={id} compare={comparison} />
        )}
      </div>
      <div className="recoil-readings">
        {water ? (
          <>
            <span>
              {t('中心水深')}
              <b>{(s.centerHeight * 100).toFixed(1)} cm</b>
            </span>
            <span>
              {t('角速度')}
              <b>{s.omega.toFixed(2)} rad/s</b>
            </span>
            <span>
              {t('流出质量率')}
              <b>{(s.flow * 1000).toFixed(1)} g/s</b>
            </span>
          </>
        ) : comparison ? (
          <>
            <span>A · x = {balloonRecoil(tm, 32e-6).x.toFixed(3)} m</span>
            <span>2A · x = {balloonRecoil(tm, 64e-6).x.toFixed(3)} m</span>
          </>
        ) : (
          <>
            <span>
              {t('剩余气体')}
              <b>{(b.gas * 1000).toFixed(2)} g</b>
            </span>
            <span>
              {t('气球模型速度')}
              <b>{b.v.toFixed(2)} m/s</b>
            </span>
            <span>
              {t('气球模型位移')}
              <b>{b.x.toFixed(2)} m</b>
            </span>
          </>
        )}
        <span>
          {t('模型时间')}
          <b>{tm.toFixed(2)} s</b>
        </span>
      </div>
      {!comparison && (
        <div className="recoil-ledger">
          <p>{t(water ? '绕竖直轴的角动量' : '沿喷口方向的动量')}</p>
          <span>
            {t(water ? '容器与剩余水' : '气球与剩余气体')}{' '}
            <b>{(water ? s.angularMomentum : b.momentum).toFixed(4)}</b>
          </span>
          <span>
            {t(water ? '已喷出的水' : '已喷出的气体')}{' '}
            <b>{(water ? s.escapedAngularMomentum : b.gasMomentum).toFixed(4)}</b>
          </span>
          <p>{water ? 'kg·m²/s' : 'kg·m/s'} · Σ ≈ 0</p>
        </div>
      )}
      <p className="recoil-cause">
        {t(
          water
            ? '两个喷口的平动效果相互抵消，绕轴的反冲力矩却同向相加。'
            : comparison
              ? '压差相同，喷口面积加倍使初始质量流率和推力加倍。'
              : '喷出的气体也属于系统；气球单独是质量不断变化的开放部分。',
        )}
      </p>
      {!water && !comparison && b.x > 0.25 && (
        <p className="recoil-camera">{t('镜头跟随气球，地面刻度继续后移。')}</p>
      )}
      {!film.watch && (
        <div className="recoil-controls">
          <Segments
            label={t('反冲实验')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'balloon', label: t('喷气气球') },
              { value: 'water', label: t('喷水容器') },
            ]}
          />
          {water ? (
            <>
              <Range
                label={t('每个水喷口半径')}
                value={radius}
                min={1.5}
                max={3}
                step={0.1}
                unit="mm"
                onChange={setRadius}
              />
              <Segments
                label={t('弯管方向')}
                value={direction}
                onChange={setDirection}
                options={[
                  { value: 'left', label: t('方向一') },
                  { value: 'right', label: t('反向弯管') },
                ]}
              />
            </>
          ) : (
            <Range
              label={t('气球喷口面积')}
              value={area}
              min={20}
              max={64}
              step={1}
              unit="mm²"
              onChange={setArea}
            />
          )}
          <Range
            label={t('模型时间')}
            value={Math.min(time, limit)}
            min={0}
            max={limit}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="recoil-note">
        {t(
          water
            ? '水与容器共同转动，水面随旋转略呈抛物面；计入剩余水转动惯量变化与出口绝对速度，忽略轴承力矩。'
            : '固定喷口朝向、恒定小压差与密度近似；忽略空气阻力和竖直运动。真实气球会摆动，压力也会随形变改变。',
        )}
      </p>
    </section>
  );
}
