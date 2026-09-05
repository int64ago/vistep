import { useCallback, useRef, useState } from 'react';
import SpatialCanvas, { THREE, type SpatialContext } from '../lab/SpatialCanvas';
import { Metric, Range, Segments } from '../lab/Controls';
import { useShowcase, ramp, ease } from '../lab/Showcase';
import { hypercube, projectVertex, sphereSlice } from '../../models/dimensions';
export default function Dimensions() {
  const demo = useShowcase();
  const [manualMode, setMode] = useState<'projection' | 'slice' | 'features'>('projection'),
    [manualDim, setDim] = useState(4),
    [manualAngle, setAngle] = useState(25),
    [slice, setSlice] = useState(0.3),
    [axis, setAxis] = useState('sugar');
  const mode = demo.watch ? 'projection' : manualMode,
    dim = demo.watch ? 4 : manualDim;
  const angle = demo.watch ? Math.max(0, demo.time - 24) * 8 : manualAngle;
  const unfold = [
    1,
    ease(ramp(demo.time, 1, 6)),
    ease(ramp(demo.time, 7.5, 13)),
    ease(ramp(demo.time, 15, 22)),
  ];
  const line = useRef<THREE.LineSegments | null>(null),
    dots = useRef<THREE.Mesh[]>([]),
    beams = useRef<THREE.Mesh[]>([]),
    plane = useRef<THREE.Mesh | null>(null),
    ring = useRef<THREE.LineLoop | null>(null);
  const graph = hypercube(dim),
    r = sphereSlice(1, slice);
  const build = useCallback(
    ({ group, camera }: SpatialContext) => {
      camera.position.set(3.2, 2.3, 6.2);
      camera.lookAt(0, 0, 0);
      dots.current = [];
      beams.current = [];
      line.current = null;
      plane.current = null;
      ring.current = null;
      if (mode === 'slice') {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(1, 28, 20),
          new THREE.MeshBasicMaterial({
            color: 0x738cc3,
            wireframe: true,
            transparent: true,
            opacity: 0.23,
          }),
        );
        group.add(sphere);
        const p = new THREE.Mesh(
          new THREE.PlaneGeometry(3, 3),
          new THREE.MeshBasicMaterial({
            color: 0x9676d8,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        p.rotation.x = -Math.PI / 2;
        group.add(p);
        plane.current = p;
        const ringGeometry = new THREE.BufferGeometry().setFromPoints(
          Array.from(
            { length: 100 },
            (_, i) =>
              new THREE.Vector3(
                Math.cos((i / 100) * Math.PI * 2),
                0,
                Math.sin((i / 100) * Math.PI * 2),
              ),
          ),
        );
        const edge = new THREE.LineLoop(
          ringGeometry,
          new THREE.LineBasicMaterial({ color: 0xe3c4ff }),
        );
        group.add(edge);
        ring.current = edge;
        return;
      }
      const g = hypercube(dim);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(g.edges.length * 6), 3),
      );
      const mesh = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xac94ec, transparent: true, opacity: 0.9 }),
      );
      group.add(mesh);
      line.current = mesh;
      g.edges.forEach(() => {
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 1, 10),
          new THREE.MeshStandardMaterial({
            color: 0xb6c8f4,
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85,
          }),
        );
        group.add(beam);
        beams.current.push(beam);
      });
      g.vertices.forEach(() => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.037, 20, 16),
          new THREE.MeshStandardMaterial({ color: 0xd5e7fd, roughness: 0.25, metalness: 0.15 }),
        );
        dots.current.push(dot);
        group.add(dot);
      });
    },
    [mode, dim],
  );
  const frame = () => {
    if (mode === 'slice') {
      if (plane.current) plane.current.position.y = slice;
      if (ring.current) {
        ring.current.visible = r !== null;
        ring.current.scale.set(r || 0.0001, 1, r || 0.0001);
        ring.current.position.y = slice;
      }
      return;
    }
    if (!line.current) return;
    const verts = graph.vertices.map((v) =>
      projectVertex(
        demo.watch ? v.map((n, i) => n * unfold[i]) : v,
        dim === 4 ? (angle * Math.PI) / 180 : 0,
      ),
    );
    const positions = line.current.geometry.getAttribute('position');
    graph.edges.forEach(([a, b], i) => {
      positions.setXYZ(i * 2, ...(verts[a] as [number, number, number]));
      positions.setXYZ(i * 2 + 1, ...(verts[b] as [number, number, number]));
      const start = new THREE.Vector3(...(verts[a] as [number, number, number])),
        end = new THREE.Vector3(...(verts[b] as [number, number, number]));
      const beam = beams.current[i];
      if (beam) {
        const direction = end.clone().sub(start);
        beam.position.copy(start).add(end).multiplyScalar(0.5);
        beam.visible = direction.length() > 0.001;
        beam.scale.y = direction.length();
        const axis = Math.round(Math.log2(a ^ b));
        (beam.material as THREE.MeshStandardMaterial).color.set(
          demo.watch && unfold[axis] < 1 ? 0xe4b977 : 0xb6c8f4,
        );
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      }
    });
    positions.needsUpdate = true;
    line.current.geometry.computeBoundingSphere();
    dots.current.forEach((d, i) => d.position.set(...(verts[i] as [number, number, number])));
  };
  const fruits = [
    { name: '苹果', weight: 180, sugar: 13, water: 86, color: '#da8b72' },
    { name: '香蕉', weight: 120, sugar: 17, water: 75, color: '#d1b467' },
    { name: '西瓜', weight: 3000, sugar: 7, water: 92, color: '#78a790' },
    { name: '草莓', weight: 25, sugar: 5, water: 91, color: '#b97d92' },
  ];
  return (
    <div>
      <div className="lab-toolbar">
        <h2>一个维度，就是一条独立的坐标。</h2>
        <button
          className="btn"
          onClick={() => {
            setMode('projection');
            setDim(4);
            setAngle(25);
            setSlice(0.3);
            setAxis('sugar');
          }}
        >
          ↻ 重置
        </button>
      </div>
      <div className="lab-tabs">
        <Segments
          label="维度探索方式"
          value={mode}
          options={[
            { value: 'projection', label: '投影：高维的影子' },
            { value: 'slice', label: '切片：穿过一个球' },
            { value: 'features', label: '特征：另一种维度' },
          ]}
          onChange={setMode}
        />
      </div>
      <div className="lab-grid">
        <div className="lab-scene dark">
          {mode === 'features' ? (
            <svg
              viewBox="0 0 600 390"
              role="img"
              aria-label="水果的质量与甜度或含水量二维特征散点图"
            >
              <path d="M70 55v265h460" stroke="#657999" />
              <text x="418" y="352" fill="#a4b5ce" fontSize="12">
                质量（对数刻度）
              </text>
              <text x="26" y="36" fill="#a4b5ce" fontSize="12">
                {axis === 'sugar' ? '含糖量' : '含水量'} (%)
              </text>
              {fruits.map((f) => {
                const x = 90 + Math.log10(f.weight / 20) * 175,
                  y = axis === 'sugar' ? 300 - f.sugar * 12 : 300 - (f.water - 65) * 8;
                return (
                  <g key={f.name}>
                    <circle cx={x} cy={y} r="12" fill={f.color} />
                    <text x={x + 20} y={y + 5} fill="#b6c3d7" fontSize="13">
                      {f.name}
                    </text>
                    <path
                      d={`M70 ${y}H${x}V320`}
                      stroke={f.color}
                      strokeDasharray="3 4"
                      opacity=".2"
                    />
                  </g>
                );
              })}
              <text x="70" y="377" fill="#7186a4" fontSize="11">
                示例数据：用于理解特征坐标，不是营养实测。
              </text>
            </svg>
          ) : (
            <div className="dimension-stage">
              {demo.watch && (
                <div className="dimension-count">
                  {demo.time < 1 ? '1' : demo.time < 7.5 ? '2' : demo.time < 15 ? '3' : '4'}
                  <small>维</small>
                </div>
              )}
              <SpatialCanvas
                key={mode}
                build={build}
                frame={frame}
                dark
                label={mode === 'slice' ? '球体与切平面的交线' : `${dim} 维超立方体的空间投影`}
                fallback={
                  <svg viewBox="0 0 600 380" role="img" aria-label="投影的二维交互视图">
                    {mode === 'slice' ? (
                      <g>
                        <circle
                          cx="300"
                          cy="185"
                          r="110"
                          fill="none"
                          stroke="#728bc9"
                          strokeDasharray="3 5"
                        />
                        {r !== null && (
                          <ellipse
                            cx="300"
                            cy={185 - slice * 100}
                            rx={r * 110}
                            ry={r * 30}
                            stroke="#d2b4ef"
                            fill="#9371ca22"
                          />
                        )}
                        <path d={`M125 ${185 - slice * 100}h350`} stroke="#b797e6" />
                      </g>
                    ) : (
                      graph.edges.map(([a, b], i) => {
                        const va = projectVertex(
                            demo.watch
                              ? graph.vertices[a].map((n, i) => n * unfold[i])
                              : graph.vertices[a],
                            dim === 4 ? (angle * Math.PI) / 180 : 0,
                          ),
                          vb = projectVertex(
                            demo.watch
                              ? graph.vertices[b].map((n, i) => n * unfold[i])
                              : graph.vertices[b],
                            dim === 4 ? (angle * Math.PI) / 180 : 0,
                          );
                        const p = (v: number[]) => [
                          300 + v[0] * 65 + v[2] * 35,
                          190 - v[1] * 65 + v[2] * 20,
                        ];
                        return (
                          <line
                            key={i}
                            x1={p(va)[0]}
                            y1={p(va)[1]}
                            x2={p(vb)[0]}
                            y2={p(vb)[1]}
                            stroke="#b79ddf"
                            strokeWidth="1.8"
                          />
                        );
                      })
                    )}
                  </svg>
                }
              />
              <span className="dimension-overlay">
                {mode === 'slice'
                  ? '3D OBJECT / 2D SLICE'
                  : `${dim}D OBJECT / PROJECTED TO YOUR SCREEN`}
              </span>
              <div className="projection-stats">
                <span>拖动 / 方向键旋转视角</span>
              </div>
            </div>
          )}
        </div>
        <div className="lab-controls">
          {mode === 'projection' ? (
            <>
              <Range label="几何维度" value={dim} min={1} max={4} unit="D" onChange={setDim} />
              {dim === 4 && (
                <Range
                  label="四维 x–w 平面旋转"
                  value={angle}
                  min={0}
                  max={360}
                  unit="°"
                  onChange={setAngle}
                />
              )}
              <div className="lab-callout">
                {dim === 4
                  ? '内外两个“盒子”是同一个四维超立方体的投影。旋转滑块改变四维对象；拖动场景只改变三维观察视角。'
                  : `${dim === 1 ? '线段' : dim === 2 ? '正方形' : '立方体'}的每个点需要 ${dim} 个独立坐标。增加一维，相当于沿新的方向展开一份副本并连接对应顶点。`}
              </div>
            </>
          ) : mode === 'slice' ? (
            <>
              <Range
                label="切平面高度"
                value={slice}
                min={-1.3}
                max={1.3}
                step={0.05}
                onChange={setSlice}
              />
              <div className="lab-callout">
                把平面从球底移到球顶：交线从一点变成大圆，再缩成一点。平面之外的球体部分，没有出现在切片中。
              </div>
              <div className="formula">
                r² = R² − h²
                <br />R = 1
              </div>
            </>
          ) : (
            <>
              <Segments
                label="纵轴特征"
                value={axis}
                options={[
                  { value: 'sugar', label: '含糖量' },
                  { value: 'water', label: '含水量' },
                ]}
                onChange={setAxis}
              />
              <div className="lab-callout">
                位置坐标描述物体在哪里，特征坐标描述它是什么样。质量、含糖量、含水量是三个维度，即使水果本身没有“第四个空间方向”。
              </div>
            </>
          )}
        </div>
      </div>
      <div className="metrics">
        {mode === 'projection' ? (
          <>
            <Metric label="顶点" value={2 ** dim} />
            <Metric label="边" value={dim * 2 ** (dim - 1)} />
            <Metric label="一个点的坐标数" value={dim} />
          </>
        ) : mode === 'slice' ? (
          <>
            <Metric label="球半径" value="1.00" />
            <Metric label="切片圆半径" value={r === null ? '无交线' : r.toFixed(2)} />
            <Metric label="平面高度" value={slice.toFixed(2)} />
          </>
        ) : (
          <>
            <Metric label="样本数量" value="4" />
            <Metric label="可描述特征" value="3" />
            <Metric label="本图显示的坐标" value="2" />
          </>
        )}
      </div>
      <p className="lab-caption">
        <strong>切片与投影不同：</strong>
        切片只留下相交部分；投影把高维信息映射到较低维，可能出现重叠或变形。四维演示是透视投影，屏幕并未变成四维空间。
      </p>
    </div>
  );
}
