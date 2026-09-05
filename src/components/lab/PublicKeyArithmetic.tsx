import { t } from '../../i18n';
import {
  pkAt,
  type PowerTrace,
  type TeachingKey,
  type pkExchange,
  type pkGuess,
  type pkShot,
} from '../../models/public-key';
type Exchange = ReturnType<typeof pkExchange>;
export function PublicKeyEnvelope({
  value,
  label,
  sealed = false,
}: {
  value: number | string;
  label: string;
  sealed?: boolean;
}) {
  return (
    <div className="pk-envelope" data-sealed={sealed}>
      <svg viewBox="0 0 220 150" aria-hidden="true">
        <rect x="1" y="1" width="218" height="148" rx="13" />
        <path d="M5 8L110 78L215 8M5 143L67 94M215 143L153 94" />
      </svg>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
export function PublicKeyPower({
  trace,
  completed,
  privateSide = false,
  compact = false,
}: {
  trace: PowerTrace;
  completed: number;
  privateSide?: boolean;
  compact?: boolean;
}) {
  const state = pkAt(trace, completed),
    row = state.current;
  return (
    <div className="pk-power" data-private={privateSide} data-compact={compact}>
      <div className="pk-power-heading">
        <span>{privateSide ? t('私人指数') : t('公开指数')}</span>
        <b>{trace.exponent}</b>
        <span>
          ={' '}
          {trace.steps
            .filter((s) => s.selected)
            .map((s) => s.power)
            .join(' + ')}
        </span>
      </div>
      {compact ? (
        row && (
          <div className="pk-current-power" data-power={row.power} data-selected={row.selected}>
            <code>
              {trace.base}
              <sup>{row.power}</sup> mod {trace.modulus} = <b>{row.factor}</b>
            </code>
            <span>{row.selected ? t('取用') : t('不取用')}</span>
          </div>
        )
      ) : (
        <div className="pk-power-tape" aria-label={t('平方得到的幂及其余数')}>
          {trace.steps.map((s, i) => (
            <div
              key={s.power}
              data-active={i === completed - 1}
              data-selected={s.selected}
              data-past={i < completed}
            >
              <span>
                {trace.base}
                <sup>{s.power}</sup>
              </span>
              <strong>{s.factor}</strong>
              <small>{s.selected ? t('取用') : t('不取用')}</small>
            </div>
          ))}
        </div>
      )}
      <div className="pk-power-work">
        {row ? (
          <>
            <div className="pk-square">
              <span>{row.squareFrom === null ? t('从底数开始') : t('上一个余数再平方')}</span>
              <code>
                {row.squareFrom === null ? trace.base : `${row.squareFrom}² = ${row.squareProduct}`}
              </code>
              {row.squareFrom !== null && (
                <span>
                  {row.squareProduct} = {row.squareQuotient} × {trace.modulus} + <b>{row.factor}</b>
                </span>
              )}
            </div>
            <div className="pk-accumulate">
              <span>
                {row.selected ? t('乘入这一项，留下余数') : t('指数没有这一项，累积值不变')}
              </span>
              <div>
                <b>{row.before}</b>
                <span>×</span>
                <b>{row.selected ? row.factor : 1}</b>
                <span>→</span>
                <strong>{row.after}</strong>
              </div>
              <span>
                {row.product} = {row.quotient} × {trace.modulus} + {row.after}
              </span>
            </div>
          </>
        ) : (
          <div className="pk-power-start">
            <span>{t('累积值从 1 开始')}</span>
            <strong>1</strong>
            <p>{t('每次平方只留余数；指数选中的项才乘入。')}</p>
          </div>
        )}
      </div>
      <div className="pk-power-result">
        <span>
          {state.done ? (privateSide ? t('恢复的消息') : t('得到密文')) : t('当前累积值')}
        </span>
        <b>{state.accumulator}</b>
        <span>{state.done ? '✓' : `${completed} / ${trace.steps.length}`}</span>
      </div>
    </div>
  );
}
export function PublicKeyOrigin({
  k,
  phase,
  compact = false,
}: {
  k: TeachingKey;
  phase: number;
  compact?: boolean;
}) {
  const rows = k.inverse.filter((r) => r.quotient > 0 && r.remainder > 0);
  return (
    <div className="pk-origin">
      {!compact || phase === 0 ? (
        <div className="pk-primes">
          <div>
            <span>p</span>
            <strong>{k.p}</strong>
          </div>
          <span>×</span>
          <div>
            <span>q</span>
            <strong>{k.q}</strong>
          </div>
          <span>=</span>
          <div>
            <span>n</span>
            <strong>{k.n}</strong>
          </div>
        </div>
      ) : (
        <div className="pk-origin-context">
          n = {k.n} · e = {k.e}
          {phase > 1 ? ` · λ = ${k.lambda}` : ''}
        </div>
      )}
      <div className="pk-key-proof">
        {phase === 0 ? (
          <>
            <span>{t('两个不同的奇素数')}</span>
            <p>{t('公开它们的乘积；真实系统要保护素因子。')}</p>
          </>
        ) : phase === 1 ? (
          <>
            <span>{t('先求最小公倍数')}</span>
            <code>
              λ = lcm({k.p - 1}, {k.q - 1})
            </code>
            <strong>{k.lambda}</strong>
            <p>
              gcd({k.e}, {k.lambda}) = 1
            </p>
          </>
        ) : phase === 2 ? (
          <>
            <span>{t('欧几里得算法找到逆元')}</span>
            {rows.map((r, i) => (
              <code key={i}>
                {r.dividend} = {r.quotient} × {r.divisor} + {r.remainder}
              </code>
            ))}
            <code>
              {k.bezout.x} × {k.e} {k.bezout.y < 0 ? '−' : '+'} {Math.abs(k.bezout.y)} × {k.lambda}{' '}
              = 1
            </code>
          </>
        ) : (
          <>
            <span>{t('私钥的指数，不是普通倒数')}</span>
            <strong>d = {k.d}</strong>
            <code>
              {k.e} × {k.d} = 1 + {(k.e * k.d - 1) / k.lambda} × {k.lambda}
            </code>
            <p>{t('乘积除以 λ 的余数为 1。')}</p>
          </>
        )}
      </div>
      {(!compact || phase === 3) && (
        <div className="pk-key-pair">
          <div>
            <span>{t('可公开')}</span>
            <b>(n, e)</b>
            <code>
              ({k.n}, {k.e})
            </code>
          </div>
          <div>
            <span>{t('应保密')}</span>
            <b>(n, d)</b>
            <code>
              ({k.n}, {phase === 3 ? k.d : '…'})
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
export function PublicKeyRoute({
  k,
  r,
  phase,
  travel,
}: {
  k: TeachingKey;
  r: Exchange;
  phase: number;
  travel: number;
}) {
  return (
    <div className="pk-route">
      <div className="pk-public-notice">
        <span>{t('收件人发布')}</span>
        <strong>
          n = {k.n} <i>·</i> e = {k.e}
        </strong>
        <p>{t('任何人都能用它算出密文。')}</p>
      </div>
      <div className="pk-correspondents">
        <span>{t('发件人')}</span>
        <span>{t('收件人')}</span>
      </div>
      <div className="pk-mail-route">
        <div className="pk-mail-track" aria-hidden="true">
          <i style={{ left: `${8 + 84 * travel}%` }} />
        </div>
        <PublicKeyEnvelope
          value={phase < 2 ? r.message : r.cipher}
          label={phase < 2 ? t('原消息 m') : t('密文 c')}
          sealed={phase >= 2}
        />
      </div>
      <div className="pk-route-equation">
        <code>
          {r.message}
          <sup>{k.e}</sup> mod {k.n} = {r.cipher}
        </code>
        <span>{t('私人指数 d 留在收件人一侧。')}</span>
      </div>
    </div>
  );
}
export function PublicKeyResidues({
  r,
  k,
  domain,
  compact = false,
}: {
  r: Exchange;
  k: TeachingKey;
  domain: { count: number; correct: number };
  compact?: boolean;
}) {
  return (
    <div className="pk-residues">
      <div className="pk-return-trip">
        <div>
          <span>m</span>
          <strong>{r.message}</strong>
        </div>
        <span>→</span>
        <div>
          <span>c</span>
          <strong>{r.cipher}</strong>
        </div>
        <span>→</span>
        <div>
          <span>m′</span>
          <strong>{r.recovered}</strong>
        </div>
      </div>
      <p>
        gcd({r.message}, {k.n}) = <b>{r.gcd}</b>
      </p>
      <div className="pk-two-remainders">
        {r.residues.map((s) => (
          <div key={s.prime}>
            <span>mod {s.prime}</span>
            <code>
              {s.original} → {s.recovered}
            </code>
            <span>{s.original === 0 ? t('零余数仍回到零') : t('恢复同一余数')}</span>
          </div>
        ))}
      </div>
      {!compact && (
        <p>
          {r.gcd === 1
            ? t('两边余数都吻合，范围内的消息唯一。')
            : t('不互素也能恢复；不能只用互素情形来证明。')}
        </p>
      )}
      <div className="pk-domain-stamp">
        <b>
          {domain.correct} / {domain.count}
        </b>
        <span>{t('本模型完整整数域的往返核对')}</span>
      </div>
    </div>
  );
}
export function PublicKeyGuesses({
  r,
  attempts,
  count,
  compact = false,
}: {
  r: Exchange;
  attempts: ReturnType<typeof pkGuess>;
  count: number;
  compact?: boolean;
}) {
  const shown = attempts.slice(Math.max(0, count - (compact ? 2 : 3)), count),
    found = shown.at(-1)?.matches;
  return (
    <div className="pk-guesses">
      <div className="pk-repeat">
        <span>
          {r.message} → <b>{r.cipher}</b>
        </span>
        <span>
          {r.message} → <b>{r.cipher}</b>
        </span>
      </div>
      <p>{t('相同消息，相同密文：这里没有随机填充。')}</p>
      <div className="pk-guess-ledger">
        <div>
          <span>{t('公开猜测 m')}</span>
          <span>{t('算出的 c')}</span>
        </div>
        {shown.map((a) => (
          <div key={a.message} data-match={a.matches}>
            <code>{a.message}</code>
            <span>→</span>
            <code>{a.cipher}</code>
            <b>{a.matches ? '✓' : '≠'}</b>
          </div>
        ))}
      </div>
      <div className="pk-guess-result">
        <b>{count}</b>
        <span>{t('次公开计算')}</span>
      </div>
      <p>
        {found
          ? t('猜中 42，密文吻合；小域里的秘密已经失守。')
          : t('只用公开的 n 和 e，逐个测试候选消息。')}
      </p>
    </div>
  );
}
export function PublicKeySecure({ stage }: { stage: ReturnType<typeof pkShot>['secureStage'] }) {
  return (
    <div className="pk-secure" data-stage={stage.id}>
      <span className="pk-schematic-label">{t('现代用法示意 · 本页未执行')}</span>
      <div className="pk-secure-key">
        <span>{t('随机对称密钥')}</span>
        <b>K</b>
      </div>
      <div className="pk-secure-fork" aria-hidden="true">
        ↙ <i /> ↘
      </div>
      <div className="pk-secure-branches">
        <div data-active={stage.id === 'key' || stage.id === 'wrap'}>
          <b>RSA–OAEP</b>
          <span>{t('收件人的公钥保护 K')}</span>
          <span className="pk-secure-arrow">↓</span>
          <span>{t('私钥持有者恢复 K')}</span>
        </div>
        <div data-active={stage.id === 'content'}>
          <b>{t('带认证的对称加密')}</b>
          <span>{t('用 K 保护实际内容')}</span>
          <span className="pk-secure-arrow">↓</span>
          <span>{t('同一 K 恢复内容')}</span>
        </div>
      </div>
      <p className="pk-identity" data-active={stage.id === 'identity'}>
        {t('先确认公钥属于谁；加密本身不证明发件人身份。')}
      </p>
    </div>
  );
}
