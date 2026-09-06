import { t } from '../../i18n';
export default function ExcavatorCircuit({
  piston,
  valve,
  flow,
}: {
  piston: number;
  valve: string;
  flow: number;
}) {
  const x = 80 + Math.max(0, Math.min(1, piston)) * 70,
    hold = valve === 'hold',
    relief = valve === 'relief',
    retract = valve === 'retract';
  const high = '#ce8850',
    low = '#6b9caa';
  return (
    <div className="excavator-circuit">
      <svg
        viewBox="0 0 320 330"
        role="img"
        aria-label={t('油箱、泵、换向阀和双作用油缸的闭合油路')}
      >
        <defs>
          <marker
            id="excavator-flow-high"
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <path d="M0 0L5 2.5L0 5Z" fill="#ce8850" />
          </marker>
          <marker
            id="excavator-flow-low"
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <path d="M0 0L5 2.5L0 5Z" fill="#6b9caa" />
          </marker>
          <linearGradient id="cylinder-steel">
            <stop stopColor="#8ea0a1" />
            <stop offset=".5" stopColor="#e8ece5" />
            <stop offset="1" stopColor="#899a9e" />
          </linearGradient>
        </defs>
        <path
          d="M80 298V306H240V283M175 224V246H240V270"
          stroke={low}
          strokeWidth="6"
          fill="none"
        />
        <path
          d="M80 252V233H145V224"
          stroke={hold ? '#879694' : high}
          strokeWidth="6"
          fill="none"
        />
        <rect x="40" y="45" width="190" height="65" rx="10" fill="url(#cylinder-steel)" />
        <rect
          x="48"
          y="53"
          width={x - 48}
          height="49"
          rx="3"
          fill={hold ? '#9ba6a0' : retract ? low : high}
          opacity=".5"
        />
        <rect
          x={x + 12}
          y="53"
          width={222 - x - 12}
          height="49"
          fill={hold ? '#9ba6a0' : retract ? high : low}
          opacity=".35"
        />
        <rect x={x} y="49" width="12" height="57" rx="3" fill="#546e72" />
        <rect x={x + 12} y="72" width="145" height="13" rx="3" fill="url(#cylinder-steel)" />
        <path
          d="M55 110V134H145V172"
          stroke={hold ? '#879694' : retract ? low : high}
          strokeWidth="5"
          fill="none"
        />
        <path
          d="M210 110V134H175V172"
          stroke={hold ? '#879694' : retract ? high : low}
          strokeWidth="5"
          fill="none"
        />
        <rect x="120" y="172" width="80" height="52" rx="8" fill="#e9e9df" stroke="#98a7a5" />
        <path
          d={
            hold
              ? 'M135 183H155M145 172V183M165 183H185M175 172V183M135 212H155M145 212V224M165 212H185M175 212V224'
              : retract
                ? 'M145 224L175 172M175 224L145 172'
                : 'M145 224V172M175 224V172'
          }
          stroke="#4a686b"
          strokeWidth="3"
        />
        <circle cx="80" cy="275" r="23" fill="#f7f5e9" stroke="#6f8585" strokeWidth="3" />
        <path d="M70 280L80 262L90 280Z" fill={high} />
        <path d="M208 264V300H274V264" fill="#dce8e8" stroke={low} strokeWidth="3" />
        <path
          d="M105 233V239H218V246H240"
          stroke={relief ? high : '#b5beb9'}
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M178 239L183 233L188 245L193 233L198 245L203 239"
          stroke="#6f8585"
          strokeWidth="2"
          fill="none"
        />
        {!hold && !relief && flow > 0 && (
          <>
            <path
              d={retract ? 'M147 220L173 177' : 'M145 218V180'}
              stroke={high}
              strokeWidth="2.5"
              markerEnd="url(#excavator-flow-high)"
              fill="none"
            />
            <path
              d={retract ? 'M148 178L173 219' : 'M175 179V219'}
              stroke={low}
              strokeWidth="2.5"
              markerEnd="url(#excavator-flow-low)"
              fill="none"
            />
          </>
        )}
        {relief && flow > 0 && (
          <path
            d="M114 239H155"
            stroke={high}
            strokeWidth="2.5"
            markerEnd="url(#excavator-flow-high)"
          />
        )}
        <text x="160" y="28" textAnchor="middle">
          {t('双作用油缸')}
        </text>
        <text x="160" y="164" textAnchor="middle">
          {t('换向阀')}
        </text>
        <text x="80" y="321" textAnchor="middle">
          {t('液压泵')}
        </text>
        <text x="241" y="321" textAnchor="middle">
          {t('油箱')}
        </text>
      </svg>
      <div className="excavator-circuit-note">
        <p className="excavator-circuit-share">{t('两支动臂缸中的一支 · 每支流量 Q/2')}</p>
        <p>
          {t(
            hold
              ? '阀口关闭，油液被封在缸内。'
              : flow <= 0
                ? '供油流量为零，图中没有油流。'
                : relief
                  ? '尝试举升但推力不足；供油经溢流返回。'
                  : retract
                    ? '油液进入有杆腔，活塞向回收。'
                    : '油液进入无杆腔，活塞向外推。',
          )}
        </p>
      </div>
    </div>
  );
}
