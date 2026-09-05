import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import {
  PK_DEFAULT_MESSAGE,
  PK_KEYS,
  pkDomain,
  pkExchange,
  pkGuess,
  pkParse,
  pkShot,
} from '../../models/public-key';
import {
  PublicKeyEnvelope,
  PublicKeyGuesses,
  PublicKeyOrigin,
  PublicKeyPower,
  PublicKeyResidues,
  PublicKeyRoute,
  PublicKeySecure,
} from '../lab/PublicKeyArithmetic';
import '../../styles/public-key.css';
const titles = [
  '把一把钥匙放到公开处',
  '两种指数，从哪里来',
  '只留下整除后的余数',
  '把幂拆开，算出密文',
  '私人指数把消息带回来',
  '零和不互素的数，也要回来',
  '算得回来，不代表守得住',
  '真实系统，多做了什么',
];
export default function PublicKey() {
  const director = useShowcase(),
    compact = useCompact(),
    id = useId();
  const [preset, setPreset] = useState(0),
    [message, setMessage] = useState(String(PK_DEFAULT_MESSAGE)),
    [direction, setDirection] = useState<'encrypt' | 'decrypt'>('encrypt'),
    [step, setStep] = useState(0),
    [detail, setDetail] = useState(false);
  const film = useMemo(() => {
    const key = PK_KEYS[0],
      exchange = pkExchange(PK_DEFAULT_MESSAGE, key);
    return {
      key,
      exchange,
      domain: pkDomain(key),
      attempts: pkGuess(exchange.cipher, { n: key.n, e: key.e }),
      cases: [0, key.p, key.q, key.n - 1].map((m) => pkExchange(m, key)),
    };
  }, []);
  const k = director.watch ? film.key : PK_KEYS[preset],
    parsed = pkParse(message, k.n);
  const manual = useMemo(() => (parsed === null ? null : pkExchange(parsed, k)), [parsed, k]);
  const shot = pkShot(director.chapter, director.chapterProgress),
    chapter = shot.chapter,
    r = director.watch ? film.exchange : manual;
  const trace = r ? (direction === 'encrypt' ? r.encryption : r.decryption) : null;
  const reset = () => {
    setPreset(0);
    setMessage(String(PK_DEFAULT_MESSAGE));
    setDirection('encrypt');
    setStep(0);
    setDetail(false);
  };
  const setM = (value: string) => {
    setMessage(value);
    setStep(0);
  };
  return (
    <section
      className="public-key-study"
      data-watch={director.watch}
      data-phone={director.watch && compact}
      data-chapter={chapter}
      data-playing={director.playing}
      aria-label={t('公钥密码整数实验')}
    >
      <header className="pk-heading">
        <span>RSA</span>
        <span>{t('微型教具 · 不安全')}</span>
      </header>
      {!(director.watch && compact) && (
        <div className="pk-intro">
          <h3>{t(director.watch ? titles[chapter] : '亲手走一次整数往返')}</h3>
          {!director.watch && <p>{t('选消息与一组小钥匙，逐项观察平方和乘入。')}</p>}
        </div>
      )}
      <div className="pk-film-surface">
        {director.watch ? (
          <>
            {chapter === 0 && (
              <PublicKeyRoute k={k} r={film.exchange} phase={shot.phase} travel={shot.travel} />
            )}
            {chapter === 1 && <PublicKeyOrigin k={k} phase={shot.phase} compact={compact} />}
            {chapter === 2 && (
              <div className="pk-remainder">
                <PublicKeyEnvelope value={film.exchange.message} label={t('整数消息 m')} />
                <div className="pk-domain-line">
                  <span>0</span>
                  <i />
                  <b>{film.exchange.message}</b>
                  <i />
                  <span>{k.n - 1}</span>
                </div>
                <div className="pk-division">
                  <span>{t('例如先平方一次')}</span>
                  <strong>
                    {film.exchange.message}² = {film.exchange.encryption.steps[1].squareProduct}
                  </strong>
                  {shot.phase >= 1 && (
                    <>
                      <code>
                        {film.exchange.encryption.steps[1].squareProduct} ={' '}
                        {film.exchange.encryption.steps[1].squareQuotient} × {k.n} +{' '}
                        <b>{film.exchange.encryption.steps[1].factor}</b>
                      </code>
                      <p>{t('整份的 n 去掉，只保留余数。')}</p>
                    </>
                  )}
                </div>
                {shot.phase >= 2 && (
                  <p className="pk-remainder-result">
                    {film.exchange.message}² mod {k.n} ={' '}
                    <b>{film.exchange.encryption.steps[1].factor}</b>
                  </p>
                )}
              </div>
            )}
            {chapter === 3 && (
              <PublicKeyPower
                trace={film.exchange.encryption}
                completed={shot.encryptionSteps}
                compact={compact}
              />
            )}
            {chapter === 4 && (
              <PublicKeyPower
                trace={film.exchange.decryption}
                completed={shot.decryptionSteps}
                privateSide
                compact={compact}
              />
            )}
            {chapter === 5 && (
              <PublicKeyResidues
                r={film.cases[shot.caseIndex]}
                k={k}
                domain={film.domain}
                compact={compact}
              />
            )}
            {chapter === 6 && (
              <PublicKeyGuesses
                r={film.exchange}
                attempts={film.attempts}
                count={shot.guesses}
                compact={compact}
              />
            )}
            {chapter === 7 && <PublicKeySecure stage={shot.secureStage} />}
          </>
        ) : r && trace ? (
          <PublicKeyPower
            trace={trace}
            completed={Math.min(step, trace.steps.length)}
            privateSide={direction === 'decrypt'}
          />
        ) : (
          <p className="pk-invalid" role="status">
            {t('请输入 0 到 {0} 的十进制整数，不自动取模。', k.n - 1)}
          </p>
        )}
      </div>
      {director.watch ? (
        !compact && (
          <p className="pk-film-note">
            {t(
              chapter === 7
                ? '这是加密原理，不是签名演示，也不提供真实加密。'
                : '小素数与私钥刻意公开，仅用于看清算法。',
            )}
          </p>
        )
      ) : (
        <div className="pk-explore">
          <div className="pk-fields">
            <label htmlFor={`${id}-key`}>
              {t('教学钥匙组')}
              <select
                id={`${id}-key`}
                value={preset}
                onChange={(e) => {
                  setPreset(Number(e.target.value));
                  setStep(0);
                }}
              >
                {PK_KEYS.map((key, i) => (
                  <option key={key.n} value={i}>
                    n={key.n}, e={key.e}, d={key.d}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-message`}>
              {t('整数消息 m')}
              <input
                id={`${id}-message`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={message}
                aria-describedby={`${id}-domain`}
                onChange={(e) => setM(e.target.value)}
              />
            </label>
          </div>
          <p id={`${id}-domain`}>{t('范围 0…{0}；这里只处理整数，不接收秘密文字。', k.n - 1)}</p>
          <div className="pk-example-buttons">
            {[0, k.p, k.q, k.n - 1].map((m) => (
              <button key={m} onClick={() => setM(String(m))}>
                {t('试 {0}', m)}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-direction`}>
            {t('查看哪次运算')}
            <select
              id={`${id}-direction`}
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as 'encrypt' | 'decrypt');
                setStep(0);
              }}
            >
              <option value="encrypt">{t('公钥加密：m → c')}</option>
              <option value="decrypt">{t('私钥解密：c → m')}</option>
            </select>
          </label>
          {r && trace && (
            <>
              <div className="pk-manual-trip">
                <span>m = {r.message}</span>
                <span>c = {r.cipher}</span>
                <span>m′ = {r.recovered}</span>
              </div>
              <label htmlFor={`${id}-step`}>{t('已处理的二进制幂')}</label>
              <output htmlFor={`${id}-step`}>
                {step} / {trace.steps.length}
              </output>
              <input
                id={`${id}-step`}
                type="range"
                min="0"
                max={trace.steps.length}
                step="1"
                value={step}
                aria-label={t('已处理的二进制幂')}
                aria-valuetext={t('已处理 {0} 项，共 {1} 项', step, trace.steps.length)}
                onChange={(e) => setStep(Number(e.target.value))}
              />
              <div className="pk-step-buttons">
                <button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                  {t('上一步')}
                </button>
                <button
                  disabled={step === trace.steps.length}
                  onClick={() => setStep((s) => s + 1)}
                >
                  {t('下一步')}
                </button>
              </div>
            </>
          )}
          <button className="pk-reset" onClick={reset}>
            {t('全部重置')}
          </button>
          <details open={detail} onToggle={(e) => setDetail(e.currentTarget.open)}>
            <summary>{t('展开钥匙与运算规则')}</summary>
            <p>
              p={k.p}, q={k.q}, λ={k.lambda}; {k.e} × {k.d} ≡ 1 (mod {k.lambda})
            </p>
            <p>{t('所有乘法都用整数精确计算；播放时间不是破解或运算耗时。')}</p>
            <p>{t('安全的 RSA 加密使用 OAEP 等规范方案；本教具没有填充、随机源或导出功能。')}</p>
          </details>
        </div>
      )}
    </section>
  );
}
