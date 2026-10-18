import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { evidenceCharge } from '../../models/franklin-electricity-evidence';
import '../../styles/franklin-electricity-evidence.css';
function EvidenceJar({
  x,
  charge,
  angle,
  release,
}: {
  x: number;
  charge: number;
  angle: number;
  release: boolean;
}) {
  const a = 30 * Math.sin(angle),
    b = 30 * Math.cos(angle),
    sign = charge >= 0 ? '+' : '−',
    other = charge >= 0 ? '−' : '+',
    n = Math.round(Math.min(1, Math.abs(charge) / 8e-7) * 6);
  return (
    <g transform={`translate(${x} 0)`}>
      <rect
        x="-47"
        y="142"
        width="94"
        height="132"
        rx="25"
        fill="#e4ebdb"
        fillOpacity=".7"
        stroke="#b4c6ad"
      />
      <path d="M-36 171v75q0 16 16 16h40q16 0 16-16v-75" fill="#c6c9aa" stroke="#a6af8c" />
      <path d="M-28 174v68q0 12 12 12h32q12 0 12-12v-68" fill="#e7e7ce" stroke="#b4b893" />
      <rect x="-28" y="133" width="56" height="18" rx="7" fill="#cec6a4" />
      <path d="M0 116v138" stroke="#a89c76" strokeWidth="3" />
      <circle cy="114" r="7" fill="#b8ac83" />
      <path d="M-36 242h-24v45h30m-23 6h16m-12 6h8" stroke="#a1b491" strokeWidth="2" fill="none" />
      <path
        d="M0 117H-70V165M-70 185v15m0 24v18h34"
        stroke="#9cac8c"
        strokeWidth="1.6"
        fill="none"
      />
      <rect x="-76" y="200" width="12" height="24" rx="4" fill="#c8b88f" />
      <path d={release ? 'M-70 165v20' : 'M-70 165l12 16'} stroke="#ac986e" strokeWidth="2" />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <text x={i % 2 ? -17 : 17} y={179 + Math.floor(i / 2) * 25} textAnchor="middle">
            {sign}
          </text>
          <text
            x={i % 2 ? -40 : 40}
            y={179 + Math.floor(i / 2) * 25}
            textAnchor="middle"
            className="fee-outer-sign"
          >
            {other}
          </text>
        </g>
      ))}
      <path d="M0 117h62v189" stroke="#a9b58f" strokeWidth="1.8" fill="none" />
      <rect
        x="28"
        y="286"
        width="69"
        height="74"
        rx="17"
        fill="#e9eddb"
        fillOpacity=".7"
        stroke="#bac7a9"
      />
      <path
        d={`M62 306l${-a} ${b}M62 306l${a} ${b}`}
        stroke="#b69f73"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="62" cy="306" r="3" fill="#a89b72" />
    </g>
  );
}
export default function FranklinElectricityEvidence() {
  const film = useShowcase(),
    [phase, setPhase] = useState<'charge' | 'hold' | 'discharge'>('charge'),
    [amount, setAmount] = useState(800),
    [cloudSign, setCloudSign] = useState<'positive' | 'negative'>('negative'),
    [time, setTime] = useState(2);
  const c = film.chapter,
    p = film.chapterProgress,
    release = film.watch ? c === 3 : phase === 'discharge',
    u = film.watch ? 800 : amount,
    signed = film.watch ? -u : cloudSign === 'negative' ? -u : u,
    clock = film.watch ? Math.min(5, p * 6) : phase === 'hold' ? 5 : time,
    left = evidenceCharge(
      u * (release ? 1 - Math.exp(-5) : 1),
      film.watch && c > 0 && !release ? 5 : clock,
      release,
    ),
    right = evidenceCharge(
      signed * (release ? 1 - Math.exp(-5) : 1),
      film.watch ? (c === 0 ? 0 : c === 1 ? clock : c === 2 ? 5 : clock) : clock,
      release,
    ),
    label = film.watch
      ? c === 0
        ? '摩擦来源：先建立可重复的实验参照'
        : c === 1
          ? '历史报告：云中来源也能使电荷储存和响应'
          : c === 2
            ? '共同现象支持电学联系，不要求同电量、同符号'
            : '隔离来源，接入支路释放储存的电荷'
      : release
        ? '隔离来源，接入支路比较释放过程'
        : '使用相同探测装置，比较不同来源';
  return (
    <section className="fee-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="fee-kicker">{t(label)}</p>
      <div className="fee-labels">
        <span>{t('摩擦来源')}</span>
        <span>{t('云中来源 · 历史报告')}</span>
      </div>
      <svg
        className="fee-apparatus"
        viewBox="0 0 460 380"
        role="img"
        aria-label={t('两路来源进入相同电容瓶与带电指示器的证据结构示意')}
      >
        <g transform="translate(100 44)">
          <path d="M-40-9h78" stroke="#cfbb91" strokeWidth="12" strokeLinecap="round" />
          <path
            d={`M${-14 + Math.sin(clock * 2) * 15} -25l27 7-5 30-30-10z`}
            fill="#c4cfb4"
            stroke="#a5b598"
          />
          <text x="-48" y="7">
            +
          </text>
        </g>
        <path
          d="M291 36q-9-23 13-27q18-15 32 1q30-2 31 22q26 17 3 28h-68q-26-6-11-24"
          fill="#ccd9c9"
          stroke="#afc3b0"
        />
        <text x="330" y="41" textAnchor="middle">
          {signed < 0 ? '−' : '+'}
        </text>
        <path
          d="M100 75v28m-5-6 5 6 5-6M330 75v28m-5-6 5 6 5-6"
          stroke="#aebf9e"
          strokeWidth="2"
          strokeDasharray={release ? '2 8' : '4 4'}
          opacity={release ? 0.18 : 1}
          fill="none"
        />
        <EvidenceJar x={100} charge={left.charge} angle={left.angle} release={release} />
        <EvidenceJar x={330} charge={right.charge} angle={right.angle} release={release} />
      </svg>
      <div className="fee-evidence">
        <span>{t('可储存电荷')}</span>
        <span>{t('能使指示器张开')}</span>
        <span>{t('隔离后仍可放电')}</span>
      </div>
      <p className="fee-note">
        {t('现代等效模型展示证据关系；不是风筝装置复原，也不是历史实测数值。')}
      </p>
      {!film.watch && (
        <div className="fee-controls">
          <Segments
            label={t('比较阶段')}
            value={phase}
            onChange={setPhase}
            options={[
              { value: 'charge', label: t('积累电荷') },
              { value: 'hold', label: t('比较储存') },
              { value: 'discharge', label: t('隔离后释放') },
            ]}
          />
          <Range
            label={t('两路示意电源电压幅值')}
            value={amount}
            min={0}
            max={800}
            step={50}
            unit="V"
            onChange={setAmount}
          />
          <Segments
            label={t('云中来源模型的符号')}
            value={cloudSign}
            onChange={setCloudSign}
            options={[
              { value: 'positive', label: '+' },
              { value: 'negative', label: '−' },
            ]}
          />
          {phase !== 'hold' && (
            <Range
              label={t('模型经过时间')}
              value={time}
              min={0}
              max={5}
              step={0.05}
              unit="s"
              onChange={setTime}
            />
          )}
        </div>
      )}
      <details className="fee-details">
        <summary>{t('历史材料与现代模型的边界')}</summary>
        <p>
          {t(
            '1752 年的历史报告把云中取得的电与摩擦玻璃产生的电作比较，其中提到储存到瓶中并重复电学现象。本册只概述这一联系。此图用相同电容与带电指示器表示比较逻辑，不声称这就是原实验的全部装置。正负电荷都能使指示器张开，因此单凭张开不能判断符号。云的符号并非固定；模型参数是教学设定。雷暴取电不是课堂操作，本图不提供户外复现实验步骤。',
          )}
        </p>
      </details>
    </section>
  );
}
