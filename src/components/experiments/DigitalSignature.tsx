import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  SIGN_GROUP,
  SIGN_MESSAGE,
  SIGN_PRIVATE,
  signaturePublic,
  signatureRecoverReusedNonce,
  signatureSign,
  signatureVerify,
} from '../../models/digital-signature';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/digital-signature.css';
const signed = signatureSign(SIGN_MESSAGE),
  second = signatureSign('WORLD'),
  recovered = signatureRecoverReusedNonce(
    { message: SIGN_MESSAGE, signature: signed.signature },
    { message: 'WORLD', signature: second.signature },
    signed.publicKey,
  );
export default function DigitalSignature() {
  const d = useShowcase(),
    id = useId(),
    [message, setMessage] = useState(SIGN_MESSAGE),
    [wrong, setWrong] = useState(false),
    [error, setError] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 3,
    received = d.watch ? (c === 4 ? 'HELLO!' : SIGN_MESSAGE) : message,
    key = d.watch
      ? c === 5
        ? signaturePublic(99)
        : signed.publicKey
      : wrong
        ? signaturePublic(99)
        : signed.publicKey,
    check = useMemo(() => signatureVerify(received, signed.signature, key), [received, key]);
  return (
    <section className="sig-study" data-watch={d.watch} aria-label={t('数字签名与公钥验证实验')}>
      <header>
        <span>SIGNATURE / BINDING</span>
        <b>{t('小整数教学，非安全参数')}</b>
      </header>
      {c === 0 && d.watch ? (
        <div className="sig-keypair">
          <div>
            <span>{t('私钥')}</span>
            <strong>{SIGN_PRIVATE}</strong>
          </div>
          <span>→</span>
          <div>
            <span>{t('公钥')}</span>
            <strong>{signed.publicKey}</strong>
          </div>
          <p>
            y = {SIGN_GROUP.g}
            <sup>{SIGN_PRIVATE}</sup> mod {SIGN_GROUP.p}
          </p>
        </div>
      ) : c === 6 && d.watch ? (
        <div className="sig-reuse">
          <h3>{t('相同 R，不同消息')}</h3>
          <div>
            <span>HELLO</span>
            <code>
              e={signed.challenge} · s={signed.signature.s}
            </code>
          </div>
          <div>
            <span>WORLD</span>
            <code>
              e={second.challenge} · s={second.signature.s}
            </code>
          </div>
          <p>{t('从两式恢复私钥')}</p>
          <strong>{recovered}</strong>
          <code>x = (s₁−s₂)/(e₁−e₂) mod 509</code>
        </div>
      ) : (
        <>
          <div className="sig-letter">
            <span>{t('公开消息')}</span>
            <strong>{received || '∅'}</strong>
            <small>e = H(R ∥ y ∥ m) mod 509 = {check.challenge ?? '—'}</small>
          </div>
          {(c >= 2 || !d.watch) && (
            <div className="sig-seal">
              <span>{t('签名')}</span>
              <b>R {signed.signature.R}</b>
              <b>s {signed.signature.s}</b>
            </div>
          )}
          {c === 1 && d.watch && (
            <p className="sig-formula">R = 4¹²³ mod 1019 = {signed.signature.R}</p>
          )}
          {(c >= 3 || !d.watch) && (
            <div className="sig-balance" data-valid={check.valid}>
              <div>
                <span>gˢ mod p</span>
                <strong>{check.left ?? '—'}</strong>
              </div>
              <b>{check.valid ? '=' : '≠'}</b>
              <div>
                <span>R · yᵉ mod p</span>
                <strong>{check.right ?? '—'}</strong>
              </div>
              <p>
                {t(check.valid ? '验证关系成立' : '验证关系不成立')} · y={key}
              </p>
            </div>
          )}
          {c === 2 && d.watch && <p className="sig-formula">s = k + e · x mod 509</p>}
        </>
      )}
      {!d.watch && (
        <div className="sig-controls">
          <label htmlFor={`${id}-message`}>{t('收到的消息，原签名保持不变')}</label>
          <input
            id={`${id}-message`}
            maxLength={24}
            type="text"
            value={message}
            onChange={(e) => {
              try {
                signatureVerify(e.target.value, signed.signature, key);
                setMessage(e.target.value);
                setError(false);
              } catch {
                setError(true);
              }
            }}
          />
          {error && <p role="alert">{t('请输入有效 Unicode 短文本。')}</p>}
          <label>
            <input type="checkbox" checked={wrong} onChange={(e) => setWrong(e.target.checked)} />
            {t('使用另一把公钥')}
          </label>
          <button
            onClick={() => {
              setMessage(SIGN_MESSAGE);
              setWrong(false);
            }}
          >
            {t('恢复签名时的消息')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('签名不隐藏消息，也不自动认证身份')}</summary>
        <p>
          {t(
            '这是 p=1019、q=509、g=4 的不安全小群 Schnorr 风格演示，不是标准密码套件。挑战实际使用带域标签的 SHA-256 编码并模 q；图中省略编码细节。生产签名需要审查过的标准实现、安全参数与正确 nonce。公开验签关系只核对消息与这把公钥，身份仍需可信绑定；nonce 复用会泄露私钥。',
          )}
        </p>
      </details>
    </section>
  );
}
