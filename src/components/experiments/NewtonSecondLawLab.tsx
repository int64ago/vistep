import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  newtonCart,
  compensatedAngle,
  type CartConditions,
  cartTapeAcceleration,
} from '../../models/newton-second-law-lab';
import '../../styles/newton-second-law-lab.css';
type Point3 = { x: number; y: number; z: number };
function CartApparatus({
  states,
  conditions,
  clamped,
  id,
}: {
  states: ReturnType<typeof newtonCart>[];
  conditions: CartConditions[];
  clamped: boolean;
  id: string;
}) {
  const lanes = states.length === 2 ? [-0.14, 0.14] : [0],
    angle = conditions[0].incline ?? compensatedAngle(),
    slope = Math.tan(angle),
    P = (x: number, y: number, z: number) => ({
      x: 70 + x * 240 + y * 180,
      y: 90 + x * 20 + y * 90 - z * 150,
    }),
    path = (points: Point3[], close = false) =>
      points
        .map((p, i) => {
          const q = P(p.x, p.y, p.z);
          return `${i ? 'L' : 'M'}${q.x} ${q.y}`;
        })
        .join(' ') + (close ? 'Z' : ''),
    plane = (x: number, y: number, z = 0) => ({ x, y, z: x * slope + z });
  const circle = (cx: number, y: number, z: number, r: number) =>
    path(
      Array.from({ length: 33 }, (_, i) => {
        const a = (i / 32) * Math.PI * 2;
        return { x: cx + r * Math.cos(a), y, z: z + r * Math.sin(a) };
      }),
    );
  return (
    <svg
      className="newton-cart-apparatus"
      viewBox="0 0 400 285"
      role="img"
      aria-label={t(
        states.length === 2
          ? '两辆小车各由槽码牵引，共同夹具同时启停'
          : '小车、纸带、定滑轮与槽码由连续绳线连接',
      )}
    >
      <defs>
        <linearGradient id={`${id}cart`}>
          <stop stopColor="#cfddbc" />
          <stop offset="1" stopColor="#a6bd93" />
        </linearGradient>
      </defs>
      <path
        d={path([plane(0, -0.3), plane(1, -0.3), plane(1, 0.3), plane(0, 0.3)], true)}
        fill="#e0d5bb"
        stroke="#c6b999"
      />
      <path
        d={path([plane(0.05, -0.25), { x: 0.05, y: -0.25, z: -0.3 }])}
        stroke="#b6b299"
        strokeWidth="5"
      />
      <path
        d={path([plane(0.96, 0.25), { x: 0.96, y: 0.25, z: -0.3 }])}
        stroke="#b6b299"
        strokeWidth="5"
      />
      {lanes.map((y, i) => {
        const s = states[i],
          cond = conditions[i],
          cartX = 0.7 - s.position * Math.cos(angle),
          hookX = cartX - 0.065,
          hook = plane(hookX, y, 0.06),
          R = 0.03,
          pulleyX = -R * Math.sin(angle),
          pulleyZ = 0.06 - R / Math.cos(angle),
          out = { x: -R, y, z: pulleyZ },
          end = { x: -R, y, z: pulleyZ - 0.17 - s.position },
          q = P(end.x, end.y, end.z),
          body = [
            plane(cartX - 0.06, y - 0.055, 0.05),
            plane(cartX + 0.06, y - 0.055, 0.05),
            plane(cartX + 0.06, y + 0.055, 0.05),
            plane(cartX - 0.06, y + 0.055, 0.05),
          ];
        return (
          <g key={i}>
            <path
              d={path([
                plane(0.02, y - 0.07),
                plane(0.98, y - 0.07),
                plane(0.98, y + 0.07),
                plane(0.02, y + 0.07),
              ])}
              stroke="#a8b59c"
              fill="none"
            />
            {states.length === 1 && (
              <>
                <path
                  d={path(
                    [
                      plane(cartX + 0.06, y - 0.018, 0.025),
                      plane(0.98, y - 0.018, 0.025),
                      plane(0.98, y + 0.018, 0.025),
                      plane(cartX + 0.06, y + 0.018, 0.025),
                    ],
                    true,
                  )}
                  fill="#f5f1e1"
                  stroke="#d5d6bd"
                  strokeWidth=".5"
                />
                <path
                  d={path(
                    [
                      plane(0.92, y - 0.055, 0.025),
                      plane(0.99, y - 0.055, 0.025),
                      plane(0.99, y + 0.055, 0.025),
                      plane(0.92, y + 0.055, 0.025),
                    ],
                    true,
                  )}
                  fill="#9aaf94"
                />
                <path
                  d={path([plane(0.95, y, 0.025), plane(0.95, y, 0.09)])}
                  stroke="#7d967b"
                  strokeWidth="4"
                />
              </>
            )}
            {[cartX - 0.045, cartX + 0.045].map((x, j) => (
              <path
                key={j}
                d={circle(x, y + 0.06, x * slope + 0.023, 0.023)}
                fill="#91a585"
                stroke="#6f8b6c"
                strokeWidth="1.2"
              />
            ))}
            <path
              d={path(
                body.map((p) => ({ ...p, z: p.z + 0.035 })),
                true,
              )}
              fill={`url(#${id}cart)`}
              stroke="#92a783"
            />
            <path
              d={path(
                [
                  body[2],
                  body[3],
                  { ...body[3], z: body[3].z + 0.035 },
                  { ...body[2], z: body[2].z + 0.035 },
                ],
                true,
              )}
              fill="#a6bc91"
            />
            {cond.cartMass > 0.65 && (
              <path
                d={path(
                  [
                    plane(cartX - 0.035, y - 0.035, 0.09),
                    plane(cartX + 0.035, y - 0.035, 0.09),
                    plane(cartX + 0.035, y + 0.035, 0.09),
                    plane(cartX - 0.035, y + 0.035, 0.09),
                  ],
                  true,
                )}
                fill="#879d7e"
                stroke="#6e8969"
                strokeWidth="3"
              />
            )}
            {cond.hangerMass > 0 && (
              <>
                <path
                  d={path([hook, { x: pulleyX, y, z: 0.06 + pulleyX * slope }])}
                  stroke="#9f9273"
                  strokeWidth="1.3"
                />
                <path d={circle(0, y, pulleyZ, R)} fill="#bdc8a8" stroke="#859b76" />
                <path
                  d={path(
                    Array.from({ length: 21 }, (_, j) => {
                      const a = Math.PI / 2 + angle + ((Math.PI / 2 - angle) * j) / 20;
                      return { x: R * Math.cos(a), y, z: pulleyZ + R * Math.sin(a) };
                    }),
                  )}
                  stroke="#9f9273"
                  strokeWidth="1.4"
                  fill="none"
                />
                <path d={path([out, end])} stroke="#9f9273" strokeWidth="1.3" />
                <path
                  d={`M${q.x - 7} ${q.y}h14v${8 + cond.hangerMass * 120}h-14Z`}
                  fill="#b49a72"
                  stroke="#957e59"
                  strokeWidth="1"
                />
              </>
            )}
            {states.length === 2 && (
              <path
                d={path([plane(cartX + 0.06, y, 0.035), plane(0.89, y, 0.035)])}
                stroke="#a89d82"
                strokeWidth="1"
              />
            )}
          </g>
        );
      })}
      {states.length === 2 && (
        <path
          d={path(
            [
              plane(0.87, -0.22, clamped ? 0.035 : 0.15),
              plane(0.94, -0.22, clamped ? 0.035 : 0.15),
              plane(0.94, 0.22, clamped ? 0.035 : 0.15),
              plane(0.87, 0.22, clamped ? 0.035 : 0.15),
            ],
            true,
          )}
          fill="#8c9983"
          stroke="#6e806a"
          strokeWidth="5"
        />
      )}
    </svg>
  );
}
export default function NewtonSecondLawLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [mode, setMode] = useState<'single' | 'pair' | 'balance'>('single'),
    [mass, setMass] = useState(0.6),
    [hanger, setHanger] = useState(0.02),
    [tilt, setTilt] = useState((compensatedAngle() * 180) / Math.PI),
    [time, setTime] = useState(0.6);
  const c = film.watch ? film.chapter : mode === 'balance' ? 0 : mode === 'pair' ? 4 : 1,
    p = film.chapterProgress,
    pair = film.watch ? c === 4 : mode === 'pair',
    balance = film.watch ? c === 0 : mode === 'balance';
  const trial = film.watch ? Math.min(2, Math.floor(p * 3)) : 0,
    M = film.watch ? (c === 3 ? [0.4, 0.6, 0.8][trial] : 0.6) : mass,
    m = film.watch
      ? balance
        ? 0
        : c === 2
          ? [0.01, 0.02, 0.03][trial]
          : c === 5
            ? 0.02 + 0.18 * Math.min(1, p * 1.4)
            : 0.02
      : balance
        ? 0
        : hanger;
  const incline = film.watch ? compensatedAngle() : (tilt * Math.PI) / 180,
    physical = film.watch
      ? balance
        ? Math.min(1, p * 1.4) * 0.9
        : c === 2 || c === 3
          ? (p * 3 - trial) * 0.9
          : Math.min(0.8, p * 1.2)
      : time;
  const settings: CartConditions[] = [
    { cartMass: M, hangerMass: m, incline, initialVelocity: balance ? 0.2 : 0 },
  ];
  if (pair) settings.push({ cartMass: M, hangerMass: m * 2, incline });
  const sharedTime = pair
      ? Math.min(physical, ...settings.map((q) => newtonCart(0, q).endTime))
      : physical,
    states = settings.map((q) => newtonCart(sharedTime, q)),
    s = states[0],
    clamped = pair && (sharedTime < physical || (film.watch ? p >= 2 / 3 : physical >= 0.8)),
    dotPeriod = 0.1,
    dots = Array.from(
      { length: Math.min(9, Math.floor(s.time / dotPeriod) + 1) },
      (_, i) => newtonCart(i * dotPeriod, settings[0]).position,
    );
  return (
    <section className="newton-cart-lab">
      <header>
        <p>
          {t(
            balance
              ? '先平衡阻力：不挂槽码，小车应近似匀速'
              : pair
                ? '两车同时开始、同时停止，比较位移'
                : c === 3
                  ? '保持槽码，增加小车质量'
                  : c === 5
                    ? '槽码较重时，重力不能直接代替绳中拉力'
                    : '同一小车，改变牵引，记录加速度',
          )}
        </p>
        <span>{t(pair ? '双车位移比法' : '单车纸带法')}</span>
      </header>
      <CartApparatus states={states} conditions={settings} clamped={clamped} id={id} />
      <div className="newton-cart-values">
        <span>
          {t('小车质量')} <strong>{M.toFixed(2)} kg</strong>
        </span>
        <span>
          {t('绳中拉力')} <strong>{s.tension.toFixed(3)} N</strong>
        </span>
        <span>
          {t('运动段加速度')} <strong>{s.acceleration.toFixed(3)} m/s²</strong>
        </span>
      </div>
      {pair ? (
        <div className="newton-cart-pair">
          <p>{t('同一测量时长，从静止开始')}</p>
          <span>x₁ = {(states[0].position * 100).toFixed(1)} cm</span>
          <span>x₂ = {(states[1].position * 100).toFixed(1)} cm</span>
          <strong>
            {t('位移比')}{' '}
            {states[0].position > 0 ? (states[1].position / states[0].position).toFixed(3) : '—'}
          </strong>
        </div>
      ) : (
        <div className="newton-cart-tape">
          <p>{t('纸带记录 · 相邻计数点间隔0.10秒')}</p>
          <svg viewBox="0 0 350 60" role="img" aria-label={t('按实际等时间位置画出的纸带计数点')}>
            <rect x="12" y="18" width="326" height="25" rx="3" fill="#f0ead7" />
            {dots.map((x, i) => (
              <circle key={i} cx={24 + (x / 0.28) * 302} cy="30" r="2.5" fill="#839174" />
            ))}
            <path d="M24 46V52" stroke="#a9b497" />
          </svg>
        </div>
      )}
      {c === 5 && (
        <p className="newton-cart-approx">
          {t('槽码重力')} {s.hangerWeight.toFixed(3)} N <span>·</span> {t('把重力当拉力的相对高估')}{' '}
          {((s.approximationError / (1 - s.approximationError)) * 100).toFixed(1)}%
        </p>
      )}
      {film.watch && (c === 2 || c === 3) && (
        <div className="newton-cart-analysis">
          <p>{t(c === 2 ? '固定小车质量，检查a—F关系' : '固定槽码，检查a—1/M的近似关系')}</p>
          <svg
            viewBox="0 0 350 190"
            role="img"
            aria-label={t('从纸带重建的加速度与对应控制变量的数据点')}
          >
            <path d="M45 18V132H327" stroke="#b2bea1" fill="none" />
            {[0, 0.25, 0.5, 0.75].map((v) => (
              <g key={v}>
                <path d={`M45 ${132 - v * 130}H322`} stroke="#e2e7d7" />
                <text x="36" y={138 - v * 130} textAnchor="end" fontSize="16" fill="#7b8d67">
                  {v}
                </text>
              </g>
            ))}
            {[0, 1, 2]
              .filter((i) => i < trial || (i === trial && physical > 0.55))
              .map((i) => {
                const q = newtonCart(0.3, {
                    cartMass: c === 3 ? [0.4, 0.6, 0.8][i] : 0.6,
                    hangerMass: c === 2 ? [0.01, 0.02, 0.03][i] : 0.02,
                  }),
                  x = c === 2 ? q.tension / 0.3 : 1 / [0.4, 0.6, 0.8][i] / 3,
                  a = cartTapeAcceleration(q.acceleration).reconstructed;
                return (
                  <circle key={i} cx={45 + x * 277} cy={132 - a * 130} r="4.5" fill="#a18b60" />
                );
              })}
            <text x="46" y="15" fontSize="17" fill="#7b8d67">
              a / (m/s²)
            </text>
            {[0, 1, 2, 3].map((i) => (
              <text
                key={i}
                x={45 + (i / 3) * 277}
                y="156"
                textAnchor="middle"
                fontSize="16"
                fill="#7b8d67"
              >
                {c === 2 ? (i / 10).toFixed(1) : i}
              </text>
            ))}
            <text x="322" y="185" textAnchor="end" fontSize="17" fill="#7b8d67">
              {c === 2 ? 'F / N' : '1/M / kg⁻¹'}
            </text>
          </svg>
        </div>
      )}
      <p className="newton-cart-cause">
        {t(
          balance
            ? '把纸带的阻力也计入补偿；匀速检验比只看倾角可靠。'
            : pair
              ? '相同初速度为零、相同时间，位移之比才等于加速度之比。'
              : c === 3
                ? '槽码相同只是近似相同拉力；精确拉力还随整个系统的加速度改变。'
                : '精确模型同时计算小车与槽码；拉力与加速度始终保持同一力学关系。',
        )}
      </p>
      {!film.watch && (
        <div className="newton-cart-controls">
          <Segments
            label={t('实验方法')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'single', label: t('单车纸带') },
              { value: 'pair', label: t('两车同时启停') },
              { value: 'balance', label: t('阻力补偿') },
            ]}
          />
          <Range
            label={t('小车质量')}
            value={mass}
            min={0.4}
            max={1}
            step={0.05}
            unit="kg"
            onChange={setMass}
          />
          {!balance && (
            <Range
              label={t('槽码质量')}
              value={hanger}
              min={0.01}
              max={0.2}
              step={0.01}
              unit="kg"
              onChange={setHanger}
            />
          )}
          <Range
            label={t('木板倾角')}
            value={tilt}
            min={0}
            max={3}
            step={0.01}
            unit="°"
            onChange={setTilt}
          />
          <Range
            label={t('模型时间')}
            value={time}
            min={0}
            max={0.8}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="newton-cart-note">
        {t('绳与滑轮质量忽略，滑轮无摩擦；到测量终点后定格。补偿阻力按恒定系数近似。')}
      </p>
    </section>
  );
}
