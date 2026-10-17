import { useId, useState } from 'react';
import { t } from '../../i18n';
import { dhBrute, dhExchange, dhMitm } from '../../models/diffie-hellman';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/diffie-hellman.css';
export default function DiffieHellman() {
  const d = useShowcase(),
    id = useId(),
    [a, setA] = useState(6),
    [b, setB] = useState(7),
    [attack, setAttack] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 3,
    p = d.watch ? d.chapterProgress : 1,
    aa = d.watch ? (c === 4 && p >= 0.4 ? 7 : 6) : a,
    bb = d.watch ? 7 : b,
    mitm = d.watch ? c === 6 : attack,
    honest = dhExchange(aa, bb),
    altered = dhMitm(aa, bb),
    q = mitm ? altered : honest,
    brute = dhBrute(honest.A),
    showPublic = !d.watch || c >= 1,
    showReceived = !d.watch || c >= 2,
    showShared = !d.watch || c >= 3;
  return (
    <section
      className="dh-study"
      data-watch={d.watch}
      aria-label={t('Diffie–Hellman 共享值协商实验')}
    >
      <header>
        <span>EXCHANGE / EXPONENTS</span>
        <b>{t('小群 p=23，可轻易穷举')}</b>
      </header>
      {d.watch && c === 5 ? (
        <div className="dh-enumerate">
          <p>{t('公开 A=18，尝试全部十个私数')}</p>
          <div>
            {brute.rows.map((row) => (
              <span key={row.exponent} data-found={row.value === honest.A}>
                {row.exponent}
                <b>→{row.value}</b>
              </span>
            ))}
          </div>
          <p>
            {t('恢复私数')} <strong>{brute.recovered}</strong> · {t('共享值')}{' '}
            <strong>{honest.alice}</strong>
          </p>
        </div>
      ) : (
        <>
          <div className="dh-actors">
            {[
              {
                name: 'Alice',
                secret: aa,
                out: honest.A,
                received: mitm ? altered.toAlice : honest.B,
                result: q.alice,
              },
              {
                name: 'Bob',
                secret: bb,
                out: honest.B,
                received: mitm ? altered.toBob : honest.A,
                result: q.bob,
              },
            ].map((actor) => (
              <article key={actor.name}>
                <h3>{actor.name}</h3>
                <div className="dh-private">
                  <span>{t('本地私数')}</span>
                  <b>{actor.secret}</b>
                </div>
                {showPublic && (
                  <div className="dh-public">
                    <span>{t('公开值')}</span>
                    <strong>{actor.out}</strong>
                  </div>
                )}
                {showReceived && (
                  <div className="dh-received" data-replaced={mitm}>
                    <span>{t('接收值')}</span>
                    <b>{actor.received}</b>
                  </div>
                )}
                {showShared && (
                  <div className="dh-secret" data-mitm={mitm}>
                    <span>{t('共享值')}</span>
                    <strong>{actor.result}</strong>
                  </div>
                )}
              </article>
            ))}
          </div>
          {c === 1 && d.watch && <p className="dh-law">A = 2ᵃ mod 23 · B = 2ᵇ mod 23</p>}
          {c === 2 && d.watch && (
            <div className="dh-cross">
              <span>A {honest.A} → Bob</span>
              <span>B {honest.B} → Alice</span>
            </div>
          )}
          {showShared && !mitm && (
            <p className="dh-law">
              {honest.B}
              <sup>{aa}</sup> mod 23 = {honest.A}
              <sup>{bb}</sup> mod 23 = {honest.alice}
            </p>
          )}
          {mitm && (
            <div className="dh-intruder">
              <span>{t('中间人可算出的两侧共享值')}</span>
              <b>
                {altered.attackerAlice} · {altered.attackerBob}
              </b>
            </div>
          )}
        </>
      )}
      {!d.watch && (
        <div className="dh-controls">
          <label htmlFor={`${id}-a`}>
            Alice · {t('私数')} {a}
          </label>
          <input
            id={`${id}-a`}
            type="range"
            min="1"
            max="10"
            value={a}
            onChange={(e) => setA(+e.target.value)}
          />
          <label htmlFor={`${id}-b`}>
            Bob · {t('私数')} {b}
          </label>
          <input
            id={`${id}-b`}
            type="range"
            min="1"
            max="10"
            value={b}
            onChange={(e) => setB(+e.target.value)}
          />
          <label>
            <input type="checkbox" checked={attack} onChange={(e) => setAttack(e.target.checked)} />
            {t('中间人替换两边公开值')}
          </label>
        </div>
      )}
      <details>
        <summary>{t('共享值相同，不等于身份已经认证')}</summary>
        <p>
          {t(
            '这里 p=23、q=11、g=2，只演示指数交换关系，完全不安全。收到的公开值先检查非平凡子群成员。真实协议需要安全群、密钥派生、上下文绑定与身份认证；单独 DH 不提供消息加密，也不防主动中间人。中间人两侧的值可能偶然相同，但只要它能分别算出就已失去端到端保密。',
          )}
        </p>
      </details>
    </section>
  );
}
