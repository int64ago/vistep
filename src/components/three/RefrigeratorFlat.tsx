const sections = [
  [
    [275, 295],
    [275, 70],
    [340, 70],
  ],
  [
    [340, 70],
    [445, 70],
    [445, 220],
  ],
  [
    [445, 220],
    [445, 300],
    [105, 300],
    [105, 130],
  ],
  [
    [105, 130],
    [155, 130],
    [155, 295],
    [275, 295],
  ],
];
const colors = ['#c58b61', '#c49460', '#85a5ba', '#6eaaaa'];
function point(phase: number) {
  const p = sections[Math.floor(phase) % 4],
    lengths = p.slice(1).map((b, i) => Math.hypot(b[0] - p[i][0], b[1] - p[i][1]));
  let distance = (phase % 1) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const t = distance / lengths[i];
      return [p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t];
    }
    distance -= lengths[i];
  }
  return p[p.length - 1];
}
export default function RefrigeratorFlat({ phase }: { phase: number }) {
  return (
    <svg viewBox="0 0 550 390" role="img" aria-label="闭合制冷循环，金色标记沿管路返回压缩机">
      <rect x="30" y="40" width="155" height="300" rx="12" fill="#e0eee5" />
      {sections.map((p, i) => (
        <path
          key={i}
          d={p.map((v, j) => `${j ? 'L' : 'M'}${v[0]} ${v[1]}`).join('')}
          fill="none"
          stroke={colors[i]}
          strokeWidth="5"
          strokeLinejoin="round"
        />
      ))}
      <rect x="244" y="277" width="64" height="39" rx="17" fill="#486663" />
      <rect x="433" y="214" width="24" height="23" rx="5" fill="#97adb1" />
      {Array.from({ length: 12 }, (_, i) => {
        const p = point((phase + i / 3) % 4);
        return (
          <circle key={i} cx={p[0]} cy={p[1]} r={i ? 2.5 : 5} fill={i ? '#f1ead4' : '#e4af61'} />
        );
      })}
      <g fill="#6d8171" fontSize="13">
        <text x="57" y="93">
          箱内 · 吸热
        </text>
        <text x="320" y="48">
          室内 · 放热
        </text>
        <text x="255" y="342">
          压缩机
        </text>
        <text x="464" y="230">
          节流
        </text>
      </g>
    </svg>
  );
}
