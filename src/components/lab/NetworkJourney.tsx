const labels = [
  'DNS QUERY / RESPONSE',
  'TCP · SYN → SYN/ACK → ACK',
  'TLS 1.3 · ENCRYPTED CONNECTION',
  'HTTP · GET /',
  'RESPONSE · HTML / CSS / JS',
  'PARSE → LAYOUT → PAINT',
];
export default function NetworkJourney({
  stage,
  progress,
  cached,
  complete,
}: {
  stage: number;
  progress: number;
  cached: boolean;
  complete: boolean;
}) {
  const step = Math.max(0, stage),
    from = step === 0 ? 116 : step === 4 ? 632 : 116,
    to = step === 0 ? 374 : step === 4 ? 116 : 632;
  const t = step < 3 ? (progress * 2) % 1 : progress;
  const reverse = step < 3 && progress > 0.5;
  const x = reverse ? to + (from - to) * t : from + (to - from) * t;
  return (
    <div className="network-journey">
      <div className="network-address">
        <span>↖</span>
        <span>⌁</span>
        <code>https://vistep.ai/</code>
        <span className="network-address-status">
          {complete ? '200 OK' : cached ? 'LOCAL CACHE' : labels[step]}
        </span>
      </div>
      <svg
        viewBox="0 0 760 285"
        role="img"
        aria-label={
          cached ? '直接从本地读取缓存' : `请求经过浏览器、DNS 与源站，当前 ${labels[step]}`
        }
      >
        <defs>
          <linearGradient id="server-metal" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#dce2e1" />
            <stop offset="1" stopColor="#b9c8ca" />
          </linearGradient>
        </defs>
        <path d="M116 146H632" fill="none" stroke="#cad8d9" strokeWidth="1" strokeDasharray="3 5" />
        <g>
          <rect x="51" y="43" width="130" height="90" rx="5" fill="#edf4f2" stroke="#91abae" />
          <rect x="59" y="50" width="114" height="75" rx="2" fill="#dbeae6" />
          <path d="M68 59h37m-37 10h92m-92 8h75" stroke="#b2c8bf" strokeWidth="3" />
          {(step >= 5 || complete) && (
            <>
              <rect x="68" y="59" width="91" height="20" rx="2" fill="#74958a" />
              <rect x="68" y="85" width="43" height="31" fill="#a3b9a9" />
              <path d="M119 88h39m-39 8h39m-39 8h23" stroke="#aac1b3" strokeWidth="3" />
            </>
          )}
          <path d="m48 135-12 12h159l-11-12" fill="#b7c8c6" stroke="#91a6a8" />
          <path d="M102 136h28" stroke="#e9f1ee" strokeWidth="3" />
        </g>
        <g>
          <path d="m333 66 40-19 44 18-41 22-43-21Z" fill="#e5eeea" stroke="#a1b4b0" />
          <path d="M333 66v56l43 22V87l-43-21Z" fill="#c4d7cd" stroke="#a1b4b0" />
          <path d="M376 87v57l41-22V65l-41 22Z" fill="#afc7bc" stroke="#8ea99c" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`m340 ${83 + i * 15} 27 13`} stroke="#93b2a3" strokeWidth="3" />
          ))}
          <path d="m389 96 15-7m-15 22 15-7" stroke="#d1e1d8" strokeWidth="4" />
        </g>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <path
              d={`m584 ${58 + i * 27} 59-16 51 19-58 18-52-21Z`}
              fill="url(#server-metal)"
              stroke="#9bafb2"
            />
            <path d={`M584 ${58 + i * 27}v17l52 20V79l-52-21Z`} fill="#a4b9be" stroke="#90a9ad" />
            <path d={`M636 ${79 + i * 27}v16l58-18V61l-58 18Z`} fill="#bccdd0" stroke="#9caeb3" />
            <path d={`m594 ${71 + i * 27} 19 7`} stroke="#d9e7e6" strokeWidth="2" />
            <circle cx="624" cy={83 + i * 27} r="1.8" fill="#638d79" />
          </g>
        ))}
        {!cached && step < 5 && !complete && (
          <g>
            <path
              d={`M${Math.min(from, x)} 172H${Math.max(from, x)}`}
              stroke="#78a094"
              strokeWidth="1.5"
            />
            <rect x={x - 13} y="164" width="26" height="16" rx="3" fill="#547b6e" />
            <path d={`M${x - 7} 170h14m-14 4h9`} stroke="#c9e0d6" strokeWidth="1" />
          </g>
        )}
        {cached && (
          <>
            <path
              d="M65 166C25 191 184 216 166 164"
              stroke="#6d9c83"
              strokeWidth="1.5"
              fill="none"
            />
            <rect x="94" y="188" width="40" height="17" rx="3" fill="#68957c" />
            <text x="114" y="200" fill="#f3faf6" fontSize="8" textAnchor="middle">
              CACHE
            </text>
          </>
        )}
        <g fontFamily="inherit" fontSize="13" fill="#627d70" textAnchor="middle">
          <text x="116" y="229">
            你的浏览器
          </text>
          <text x="374" y="229">
            DNS
          </text>
          <text x="636" y="229">
            源站服务器
          </text>
        </g>
        <g fontFamily="inherit" fontSize="9" fill="#92a69c" textAnchor="middle">
          <text x="116" y="249">
            读取 · 理解 · 绘制
          </text>
          <text x="374" y="249">
            找到地址
          </text>
          <text x="636" y="249">
            响应请求
          </text>
        </g>
      </svg>
    </div>
  );
}
