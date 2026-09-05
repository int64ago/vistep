import { t } from '../../i18n';
import { useMemo, useState } from 'react';
import { Range, Metric } from '../lab/Controls';
import { useSimulation } from '../lab/useSimulation';
import { networkSteps } from '../../models/network';
import { useShowcase, ramp } from '../lab/Showcase';
import NetworkJourney from '../lab/NetworkJourney';
export default function Network() {
  const demo = useShowcase();
  const [manualRtt, setRtt] = useState(100),
    [manualDns, setDns] = useState(false),
    [manualWarm, setWarm] = useState(false),
    [manualCache, setCache] = useState(false),
    [manualLoss, setLoss] = useState(false),
    [playing, setPlaying] = useState(false),
    [manualElapsed, setElapsed] = useState(0);
  const rtt = demo.watch ? 100 : manualRtt,
    loss = demo.watch ? false : manualLoss;
  const dns = demo.watch ? demo.time >= 16 : manualDns,
    warm = demo.watch ? demo.time >= 16 : manualWarm,
    cache = demo.watch ? demo.time >= 23 : manualCache;
  const steps = useMemo(
    () => networkSteps(rtt, dns, warm, cache, loss),
    [rtt, dns, warm, cache, loss],
  );
  const total = steps.reduce((s, v) => s + v.duration, 0);
  const elapsed = demo.watch
    ? total *
      (demo.time < 16
        ? ramp(demo.time, 0.6, 13)
        : demo.time < 23
          ? ramp(demo.time, 16.5, 21)
          : ramp(demo.time, 23.5, 25))
    : manualElapsed;
  const host = useSimulation(
    (dt) =>
      setElapsed((t) => {
        const next = Math.min(t + dt * 110, total);
        if (next === total) setPlaying(false);
        return next;
      }),
    playing && !demo.watch,
  );
  let cumulative = 0;
  const states = steps.map((s) => {
    const start = cumulative;
    cumulative += s.duration;
    return { ...s, start, end: cumulative };
  });
  const current = states.findIndex((s) => s.duration > 0 && elapsed >= s.start && elapsed < s.end);
  const change = (f: (v: boolean) => void, v: boolean) => {
    f(v);
    setElapsed(0);
    setPlaying(false);
  };
  return (
    <div ref={host}>
      <div className="lab-toolbar">
        <h2>{t('请求发出后，把毫秒放慢看。')}</h2>
        <div className="lab-actions">
          <button
            className="btn primary"
            onClick={() => {
              if (elapsed >= total) setElapsed(0);
              setPlaying(!playing);
            }}
          >
            {playing ? t('Ⅱ 暂停') : t('▷ 发出请求')}
          </button>
          <button
            className="btn"
            disabled={elapsed >= total}
            onClick={() => {
              setPlaying(false);
              setElapsed(states[Math.max(0, current)].end);
            }}
          >
            {t('下一步 →')}
          </button>
          <button
            className="btn"
            onClick={() => {
              setElapsed(0);
              setPlaying(false);
            }}
          >
            {t('↻ 重播')}
          </button>
        </div>
      </div>
      <NetworkJourney
        stage={current}
        progress={current < 0 ? 1 : (elapsed - states[current].start) / states[current].duration}
        cached={cache}
        complete={elapsed >= total}
      />
      <div className="lab-grid">
        <div className="network-flow">
          {states.map((s, i) => (
            <div
              key={t(s.name)}
              className={`network-node ${i === current ? 'current' : ''} ${elapsed >= s.end ? 'done' : ''} ${s.duration === 0 ? 'skipped' : ''}`}
            >
              <span className="node-icon">
                {elapsed >= s.end ? '✓' : String(i + 1).padStart(2, '0')}
              </span>
              <span className="node-title">{t(s.name)}</span>
              <p>{t(s.description)}</p>
              <time>{s.duration ? `${s.duration}ms` : t('跳过')}</time>
              <div className="waterfall">
                <span
                  style={{
                    width: `${s.duration === 0 ? 100 : Math.max(0, Math.min(100, ((elapsed - s.start) / s.duration) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="lab-controls">
          <Range
            label={t('网络往返时延 RTT')}
            value={rtt}
            min={20}
            max={400}
            step={10}
            unit="ms"
            onChange={(v) => {
              setRtt(v);
              setElapsed(0);
              setPlaying(false);
            }}
          />
          <label className="checkline">
            <input
              type="checkbox"
              checked={dns}
              onChange={(e) => change(setDns, e.target.checked)}
            />
            {t('已有 DNS 缓存')}
          </label>
          <label className="checkline">
            <input
              type="checkbox"
              checked={warm}
              onChange={(e) => change(setWarm, e.target.checked)}
            />
            {t('复用已建立的连接')}
          </label>
          <label className="checkline">
            <input
              type="checkbox"
              checked={cache}
              onChange={(e) => {
                change(setCache, e.target.checked);
                if (e.target.checked) {
                  setDns(true);
                  setWarm(true);
                }
              }}
            />
            {t('页面资源缓存仍然新鲜')}
          </label>
          <label className="checkline">
            <input
              type="checkbox"
              checked={loss}
              disabled={cache}
              onChange={(e) => change(setLoss, e.target.checked)}
            />
            {t('模拟一次分段丢失')}
          </label>
          <div className="lab-callout">
            {t('试着把 RTT 提高到 300 ms，然后复用连接。减少等待往返，往往比增加动画速度更重要。')}
          </div>
        </div>
      </div>
      <div className="metrics">
        <Metric label={t('模拟总耗时')} value={total} unit="ms" />
        <Metric label={t('已经走过')} value={Math.round(elapsed)} unit="ms" />
        <Metric
          label={t('当前进度')}
          value={elapsed >= total ? t('完成') : `${Math.max(0, current) + 1} / 6`}
        />
      </div>
      <p className="lab-caption">
        {t('以')}
        <strong>HTTP/2 over TCP + TLS 1.3</strong>{' '}
        {t(
          '为例，阶段串行化便于理解。时延是可控教学值，并非当前网站测速；真实浏览器会并行、预连接和增量渲染，HTTP/3 的连接机制也不同。',
        )}
      </p>
    </div>
  );
}
