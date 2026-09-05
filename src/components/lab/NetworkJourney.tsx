const labels = [
  'DNS QUERY / RESPONSE',
  'TCP · SYN → SYN/ACK → ACK',
  'TLS 1.3 · ENCRYPTED CONNECTION',
  'HTTP · GET /',
  'RESPONSE · HTML / CSS / JS',
  'PARSE → LAYOUT → PAINT',
];
function NetworkDiagram({
  mobile = false,
  stage,
  progress,
  cached,
  complete,
}: {
  mobile?: boolean;
  stage: number;
  progress: number;
  cached: boolean;
  complete: boolean;
}) {
  const step = Math.max(0, stage),
    from = step === 0 ? 116 : step === 4 ? 632 : 116,
    to = step === 0 ? 374 : step === 4 ? 116 : 632;
  const p = Math.max(0, Math.min(1, progress));
  const t =
    step === 1
      ? p < 1 / 3
        ? p * 3
        : p < 2 / 3
          ? 2 - p * 3
          : p * 3 - 2
      : step < 3
        ? p <= 0.5
          ? p * 2
          : 2 - p * 2
        : p;
  const x = from + (to - from) * t;
  const painted = complete ? 1 : step === 5 ? p : 0;
  return (
    <svg
      className={mobile ? 'network-diagram-mobile' : 'network-diagram-desktop'}
      viewBox={mobile ? '0 0 380 335' : '0 0 760 285'}
      role="img"
      aria-label={
        cached ? '直接从本地读取缓存' : `请求经过浏览器、DNS 与源站，当前 ${labels[step]}`
      }
    >
      <defs>
        <linearGradient
          id={mobile ? 'server-metal-mobile' : 'server-metal'}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop stopColor="#dce2e1" />
          <stop offset="1" stopColor="#b9c8ca" />
        </linearGradient>
      </defs>
      <path
        d={mobile ? 'M85 157H295M85 157L190 199' : 'M116 146H632'}
        fill="none"
        stroke="#cad8d9"
        strokeWidth="1"
        strokeDasharray="3 5"
      />
      <g transform={mobile ? 'translate(-31,-20)' : undefined}>
        <rect x="51" y="43" width="130" height="90" rx="5" fill="#edf4f2" stroke="#91abae" />
        <rect x="59" y="50" width="114" height="75" rx="2" fill="#dbeae6" />
        <path d="M68 59h37m-37 10h92m-92 8h75" stroke="#b2c8bf" strokeWidth="3" />
        {(step >= 5 || complete) && (
          <>
            <rect
              x="68"
              y="59"
              width={91 * Math.min(1, painted * 3)}
              height="20"
              rx="2"
              fill="#74958a"
            />
            <rect
              x="68"
              y="85"
              width="43"
              height="31"
              fill="#a3b9a9"
              opacity={Math.max(0, Math.min(1, painted * 3 - 1))}
            />
            <path
              d="M119 88h39m-39 8h39m-39 8h23"
              stroke="#aac1b3"
              strokeWidth="3"
              opacity={Math.max(0, painted * 3 - 2)}
            />
          </>
        )}
        <path d="m48 135-12 12h159l-11-12" fill="#b7c8c6" stroke="#91a6a8" />
        <path d="M102 136h28" stroke="#e9f1ee" strokeWidth="3" />
      </g>
      <g transform={mobile ? 'translate(-79,-20)' : undefined}>
        <path d="m333 66 40-19 44 18-41 22-43-21Z" fill="#e5eeea" stroke="#a1b4b0" />
        <path d="M333 66v56l43 22V87l-43-21Z" fill="#c4d7cd" stroke="#a1b4b0" />
        <path d="M376 87v57l41-22V65l-41 22Z" fill="#afc7bc" stroke="#8ea99c" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`m340 ${83 + i * 15} 27 13`} stroke="#93b2a3" strokeWidth="3" />
        ))}
        <path d="m389 96 15-7m-15 22 15-7" stroke="#d1e1d8" strokeWidth="4" />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${mobile ? -442 : 0},${i * 27 + (mobile ? 145 : 0)})`}>
          <path
            d="m584 58 59-16 51 19-58 18-52-21Z"
            fill={`url(#${mobile ? 'server-metal-mobile' : 'server-metal'})`}
            stroke="#9bafb2"
          />
          <path d="M584 58v17l52 20V79l-52-21Z" fill="#a4b9be" stroke="#90a9ad" />
          <path d="M636 79v16l58-18V61l-58 18Z" fill="#bccdd0" stroke="#9caeb3" />
          <path d="m594 71 19 7" stroke="#d9e7e6" strokeWidth="2" />
          <circle cx="624" cy="83" r="1.8" fill="#638d79" />
        </g>
      ))}
      {!cached &&
        step < 5 &&
        !complete &&
        (() => {
          const start = mobile ? (step === 4 ? [190, 199] : [85, 157]) : [from, 172];
          const end = mobile
            ? step === 0
              ? [295, 157]
              : step === 4
                ? [85, 157]
                : [190, 199]
            : [to, 172];
          const packetX = mobile ? start[0] + (end[0] - start[0]) * t : x,
            packetY = start[1] + (end[1] - start[1]) * t;
          return (
            <g>
              <path
                d={`M${start[0]} ${start[1]}L${packetX} ${packetY}`}
                stroke="#78a094"
                strokeWidth="1.5"
              />
              <rect x={packetX - 13} y={packetY - 8} width="26" height="16" rx="3" fill="#547b6e" />
              <path
                d={`M${packetX - 7} ${packetY - 2}h14m-14 4h9`}
                stroke="#c9e0d6"
                strokeWidth="1"
              />
            </g>
          );
        })()}
      {cached && (
        <g transform={mobile ? 'translate(-31,-10)' : undefined}>
          <path d="M65 166C25 191 184 216 166 164" stroke="#6d9c83" strokeWidth="1.5" fill="none" />
          <rect x="94" y="188" width="40" height="17" rx="3" fill="#68957c" />
          <text x="114" y="200" fill="#f3faf6" fontSize="8" textAnchor="middle">
            CACHE
          </text>
        </g>
      )}
      <g fontFamily="inherit" fontSize={mobile ? 14 : 13} fill="#627d70" textAnchor="middle">
        <text x={mobile ? 85 : 116} y={mobile ? 140 : 229}>
          你的浏览器
        </text>
        <text x={mobile ? 295 : 374} y={mobile ? 140 : 229}>
          DNS
        </text>
        <text x={mobile ? 190 : 636} y={mobile ? 318 : 229}>
          源站服务器
        </text>
      </g>
      {!mobile && (
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
      )}
    </svg>
  );
}

export default function NetworkJourney(props: {
  stage: number;
  progress: number;
  cached: boolean;
  complete: boolean;
}) {
  return (
    <div className="network-journey">
      <div className="network-address">
        <span>↖</span>
        <span>⌁</span>
        <code>https://vistep.ai/</code>
        <span className="network-address-status">
          {props.complete
            ? '200 OK'
            : props.cached
              ? 'LOCAL CACHE'
              : labels[Math.max(0, props.stage)]}
        </span>
      </div>
      <NetworkDiagram {...props} />
      <NetworkDiagram {...props} mobile />
    </div>
  );
}
