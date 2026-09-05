import { useCallback, useState, type PointerEvent } from 'react';
import { Metric, Range, Segments, clamp } from '../lab/Controls';
import SpatialCanvas, { THREE, type SpatialContext } from '../lab/SpatialCanvas';
import { distance, locate } from '../../models/gps';
const colors = ['#5d8ddd', '#db9270', '#66a391', '#ac7bb3'];
const defaults = [
  [120, 100, 250],
  [480, 90, 330],
  [520, 300, 180],
  [100, 310, 300],
];
export default function Gps() {
  const [mode, setMode] = useState<'2d' | '3d'>('2d'),
    [satellites, setSatellites] = useState(defaults.map((s) => [...s])),
    [count, setCount] = useState(4),
    [bias, setBias] = useState(0),
    [correct, setCorrect] = useState(true),
    [selected, setSelected] = useState(0),
    [dragged, setDragged] = useState(-1);
  const dimensions = mode === '2d' ? 2 : 3,
    target = dimensions === 2 ? [300, 210] : [300, 210, 0];
  const active = satellites.slice(0, count).map((s) => s.slice(0, dimensions)),
    ranges = active.map((s) => distance(s, target) + bias);
  const result = locate(
    active,
    ranges,
    dimensions,
    correct,
    target.map((v, i) => v + (i === 0 ? 10 : 5)),
  );
  const error = result ? distance(result.position, target) : null;
  const setCoordinate = (index: number, axis: number, value: number) =>
    setSatellites((old) =>
      old.map((s, i) =>
        i === index
          ? s.map((v, j) =>
              j === axis
                ? axis === 0
                  ? clamp(value, 40, 600)
                  : axis === 1
                    ? clamp(value, 45, 365)
                    : value
                : v,
            )
          : s,
      ),
    );
  const drag = (e: PointerEvent<SVGSVGElement>) => {
    if (dragged < 0) return;
    const m = e.currentTarget.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    setSatellites((old) =>
      old.map((s, i) => (i === dragged ? [clamp(p.x, 40, 600), clamp(p.y, 45, 365), s[2]] : s)),
    );
  };
  const build = useCallback(
    ({ group, camera }: SpatialContext) => {
      camera.position.set(6, 4, 10);
      camera.lookAt(0, 0, 0);
      const project = (p: number[]) =>
        new THREE.Vector3((p[0] - 300) / 130, (p[2] || 0) / 130, (p[1] - 210) / 130);
      const ground = new THREE.GridHelper(6, 12, 0x708baa, 0x344b65);
      group.add(ground);
      satellites.slice(0, count).forEach((s, i) => {
        const pos = project(s),
          radius = (distance(s, [300, 210, 0]) + bias) / 130;
        const sat = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.23, 0.23),
          new THREE.MeshStandardMaterial({ color: 0xd0c3a4, metalness: 0.6, roughness: 0.32 }),
        );
        sat.add(body);
        for (const side of [-1, 1]) {
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.012, 0.31),
            new THREE.MeshStandardMaterial({ color: 0x344b73, metalness: 0.45, roughness: 0.3 }),
          );
          panel.position.x = side * 0.3;
          sat.add(panel);
          for (let cell = 0; cell < 5; cell++) {
            const stripe = new THREE.Mesh(
              new THREE.BoxGeometry(0.003, 0.014, 0.3),
              new THREE.MeshBasicMaterial({ color: 0x7a99ae }),
            );
            stripe.position.x = side * 0.3 - 0.14 + cell * 0.07;
            sat.add(stripe);
          }
        }
        const dish = new THREE.Mesh(
          new THREE.SphereGeometry(0.085, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({
            color: 0xdce4e4,
            side: THREE.DoubleSide,
            metalness: 0.35,
            roughness: 0.3,
          }),
        );
        dish.position.y = 0.2;
        sat.add(dish);
        sat.position.copy(pos);
        sat.rotation.y = i * 0.5;
        group.add(sat);
        const shell = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 24, 16),
          new THREE.MeshBasicMaterial({
            color: colors[i],
            wireframe: true,
            transparent: true,
            opacity: 0.13,
          }),
        );
        shell.position.copy(pos);
        group.add(shell);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([pos, new THREE.Vector3()]),
          new THREE.LineBasicMaterial({ color: colors[i], transparent: true, opacity: 0.6 }),
        );
        group.add(line);
      });
      const t = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0x6cb5ff }),
      );
      group.add(t);
      const sol = locate(
        satellites.slice(0, count),
        satellites.slice(0, count).map((s) => distance(s, [300, 210, 0]) + bias),
        3,
        correct,
        [310, 215, 5],
      );
      if (sol) {
        const point = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 16, 12),
          new THREE.MeshBasicMaterial({ color: 0xf5b878 }),
        );
        point.position.copy(project(sol.position));
        group.add(point);
      }
    },
    [satellites, count, bias, correct],
  );
  return (
    <div>
      <div className="lab-toolbar">
        <h2>距离相遇的地方，藏着你的位置。</h2>
        <div className="lab-actions">
          <Segments
            label="定位维度"
            value={mode}
            options={[
              { value: '2d', label: '二维：圆' },
              { value: '3d', label: '三维：球面' },
            ]}
            onChange={setMode}
          />
          <button
            className="btn"
            onClick={() => {
              setSatellites(defaults.map((s) => [...s]));
              setCount(4);
              setBias(0);
              setCorrect(true);
              setSelected(0);
            }}
          >
            ↻ 重置
          </button>
        </div>
      </div>
      <div className="lab-grid">
        <div className={`lab-scene ${mode === '3d' ? 'dark' : ''}`}>
          {mode === '2d' ? (
            <svg
              className="gps-scene"
              viewBox="0 0 640 410"
              role="img"
              aria-label="拖动卫星，观察距离圆与估计位置"
              onPointerMove={drag}
              onPointerUp={() => setDragged(-1)}
              onPointerCancel={() => setDragged(-1)}
            >
              <defs>
                <pattern id="gps-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M25 0H0V25" stroke="#dce5ef" strokeWidth=".6" />
                </pattern>
                <clipPath id="gps-clip">
                  <rect width="640" height="410" />
                </clipPath>
              </defs>
              <rect width="640" height="410" fill="url(#gps-grid)" />
              <g clipPath="url(#gps-clip)">
                {active.map((s, i) => (
                  <g key={i}>
                    <circle
                      cx={s[0]}
                      cy={s[1]}
                      r={ranges[i]}
                      fill={colors[i] + '08'}
                      stroke={colors[i]}
                      strokeOpacity=".6"
                      strokeWidth="1.5"
                    />
                    <path
                      d={`M${s[0]} ${s[1]}L300 210`}
                      stroke={colors[i]}
                      opacity=".3"
                      strokeDasharray="4 4"
                    />
                  </g>
                ))}
                <circle cx="300" cy="210" r="12" fill="#2b73db22" />
                <circle cx="300" cy="210" r="5" fill="#347cdc" />
                <text x="312" y="231" fill="#5b81b3" fontSize="11">
                  真实位置
                </text>
                {result && Number.isFinite(result.position[0]) && (
                  <g>
                    <circle
                      cx={result.position[0]}
                      cy={result.position[1]}
                      r="9"
                      fill="none"
                      stroke="#d9935d"
                      strokeWidth="2"
                    />
                    <text
                      x={result.position[0] + 13}
                      y={result.position[1] - 15}
                      fill="#bb8157"
                      fontSize="11"
                    >
                      计算位置
                    </text>
                  </g>
                )}
                {active.map((s, i) => (
                  <g
                    key={i}
                    data-satellite
                    tabIndex={0}
                    role="button"
                    aria-label={`卫星 ${i + 1}，使用方向键移动`}
                    onKeyDown={(e) => {
                      if (e.key.startsWith('Arrow')) {
                        e.preventDefault();
                        setCoordinate(
                          i,
                          e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? 0 : 1,
                          (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? s[0] : s[1]) +
                            (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -5 : 5),
                        );
                      }
                    }}
                    onPointerDown={(e) => {
                      setDragged(i);
                      setSelected(i);
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                  >
                    <circle cx={s[0]} cy={s[1]} r="22" fill="transparent" />
                    <rect
                      x={s[0] - 7}
                      y={s[1] - 9}
                      width="14"
                      height="18"
                      rx="3"
                      fill={colors[i]}
                    />
                    <path
                      d={`M${s[0] - 21} ${s[1]}h10m22 0h10`}
                      stroke={colors[i]}
                      strokeWidth="8"
                    />
                    <text x={s[0] - 8} y={s[1] - 22} fill={colors[i]} fontSize="11">
                      S{i + 1}
                    </text>
                  </g>
                ))}
              </g>
              <text x="22" y="389" fill="#8da0b8" fontSize="11">
                拖动信号源 · 位置与距离均使用教学坐标
              </text>
            </svg>
          ) : (
            <div className="dimension-stage">
              <SpatialCanvas
                build={build}
                label="四个卫星的距离球面与定位点"
                dark
                fallback={
                  <svg viewBox="0 0 600 370">
                    <path
                      d="m130 230 300 20-100 90-200-50 0-60m0 0 100-60 200 80"
                      stroke="#587395"
                      fill="none"
                    />
                    {satellites.slice(0, count).map((s, i) => (
                      <g key={i}>
                        <ellipse
                          cx={300 + (s[0] - 300) * 0.55}
                          cy={250 - s[2] * 0.5}
                          rx="105"
                          ry="80"
                          fill="none"
                          stroke={colors[i]}
                          opacity=".5"
                        />
                        <path
                          d={`M${300 + (s[0] - 300) * 0.55} ${250 - s[2] * 0.5}L300 230`}
                          stroke={colors[i]}
                          strokeDasharray="4 4"
                        />
                      </g>
                    ))}
                    <circle cx="300" cy="230" r="6" fill="#78bdfd" />
                  </svg>
                }
              />
              <span className="dimension-overlay">距离球面 / 拖动旋转</span>
            </div>
          )}
        </div>
        <div className="lab-controls">
          <Range
            label="可用信号源"
            value={count}
            min={2}
            max={4}
            unit="个"
            onChange={(value) => {
              setCount(value);
              setSelected((previous) => Math.min(previous, value - 1));
            }}
          />
          <Range
            label="时钟误差的等效距离"
            value={bias}
            min={-35}
            max={35}
            unit="单位"
            onChange={setBias}
          />
          <label className="checkline">
            <input
              type="checkbox"
              checked={correct}
              onChange={(e) => setCorrect(e.target.checked)}
            />
            同时求解接收机时钟误差
          </label>
          {mode === '3d' && (
            <>
              <label className="control">
                <span className="control-top">选择卫星</span>
                <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
                  {satellites.slice(0, count).map((_, i) => (
                    <option value={i} key={i}>
                      卫星 S{i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <Range
                label="卫星高度"
                value={satellites[selected][2]}
                min={100}
                max={450}
                onChange={(v) => setCoordinate(selected, 2, v)}
              />
            </>
          )}
          <div className="lab-callout">
            {!result
              ? `当前约束不足或几何位置退化。${dimensions} 个位置未知量${correct ? ' + 1 个时钟未知量' : ''}，至少需要 ${dimensions + (correct ? 1 : 0)} 个独立距离。`
              : correct
                ? '这里的位置与时钟误差是一起求解的。尝试减少信号源，再移动它们。'
                : '忽略时钟误差时，几个圆可能无法在真实位置相交。计算位置是最小二乘的折中。'}
          </div>
        </div>
      </div>
      <div className="metrics">
        <Metric
          label="位置误差"
          value={error === null ? '未确定' : error.toFixed(2)}
          unit={error === null ? undefined : '单位'}
        />
        <Metric label="求得时钟偏差" value={result ? result.clock.toFixed(2) : '—'} unit="单位" />
        <Metric label="待求未知量" value={dimensions + (correct ? 1 : 0)} />
      </div>
      <p className="lab-caption">
        这是<strong>局部几何与伪距教学模型</strong>
        ：接收机接收广播，并非向卫星报告位置。三维定位通常同时求解 x、y、z
        与时钟偏差；未模拟地球曲率、轨道、大气误差或实时卫星数据。
      </p>
    </div>
  );
}
