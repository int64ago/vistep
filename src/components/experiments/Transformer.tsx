import { useEffect, useRef, useState } from 'react';
import { Metric, Range, Segments } from '../lab/Controls';
import type { Inspection } from '../../models/transformer';
const vocab = ['猫', '狗', '鸟', '爱', '吃', '鱼', '肉', '虫', '。'];
export default function Transformer() {
  const [inspection, setInspection] = useState<Inspection | null>(null),
    [mode, setMode] = useState<'train' | 'generate'>('train'),
    [subject, setSubject] = useState('猫'),
    [text, setText] = useState('猫爱吃'),
    [temperature, setTemperature] = useState(0.7),
    [rate, setRate] = useState(0.015),
    [running, setRunning] = useState(false),
    [loss, setLoss] = useState<number | null>(null),
    [history, setHistory] = useState<number[]>([]),
    [error, setError] = useState(''),
    [matrix, setMatrix] = useState<'attention' | 'embedding'>('attention');
  const worker = useRef<Worker | null>(null);
  const textRef = useRef(text);
  textRef.current = text;
  useEffect(() => {
    try {
      const w = new Worker(new URL('../../workers/transformer.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.current = w;
      w.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'error') {
          setError(data.message);
          setRunning(false);
          return;
        }
        setInspection(data);
        if (data.running !== undefined) setRunning(data.running);
        if (typeof data.loss === 'number') {
          setLoss(data.loss);
          setHistory((old) => [...old, data.loss]);
        }
        if (data.type === 'sample') setText((old) => old + data.next);
      };
      w.onerror = () => {
        setError('后台计算未能运行。请刷新页面重试，原理讲解仍可阅读。');
        setRunning(false);
      };
      return () => w.terminate();
    } catch {
      setError('此浏览器暂不支持后台模型计算。');
    }
  }, []);
  const switchSubject = (s: string) => {
    setSubject(s);
    const input = s + '爱吃';
    setText(input);
    worker.current?.postMessage({ type: 'inspect', context: input });
  };
  const reset = () => {
    worker.current?.postMessage({ type: 'reset' });
    setText('猫爱吃');
    setSubject('猫');
    setHistory([]);
    setLoss(null);
    setRunning(false);
    setError('');
  };
  const probs =
    inspection?.probabilities.map((p, i) => ({ p, token: vocab[i] })).sort((a, b) => b.p - a.p) ||
    [];
  const grid = matrix === 'attention' ? inspection?.attention : inspection?.embeddings;
  const tokens = [...(inspection?.context || text.slice(-4))];
  const lossMax = Math.max(2.5, ...history);
  return (
    <div>
      <div className="lab-toolbar">
        <h2>让一个很小的模型，真实地学一件事。</h2>
        <div className="lab-actions">
          <Segments
            label="模型工作阶段"
            value={mode}
            options={[
              { value: 'train', label: '训练：更新权重' },
              { value: 'generate', label: '生成：权重不变' },
            ]}
            onChange={(v) => {
              if (running) worker.current?.postMessage({ type: 'stop' });
              setMode(v);
            }}
          />
          <button className="btn" onClick={reset}>
            ↻ 重置模型
          </button>
        </div>
      </div>
      <div className="training-layout">
        <div className="training-core">
          <p className="eyebrow">
            {mode === 'train' ? 'THE TRAINING EXAMPLE' : 'AUTOREGRESSIVE GENERATION'}
          </p>
          <h3 className="lab-subtitle">
            {mode === 'train' ? '看过这些句子，猜下一个字' : '每次只生成一个字，再把它放回上下文'}
          </h3>
          <div className="token-row">
            {[...text].map((ch, i) => (
              <span className={`token ${i >= 3 ? 'predicted' : ''}`} key={i}>
                {ch}
              </span>
            ))}
            {mode === 'generate' && <span className="token">?</span>}
          </div>
          <div className="lab-actions" style={{ marginBottom: 23 }}>
            <Segments
              label="示例句子的主语"
              value={subject}
              options={[
                { value: '猫', label: '猫' },
                { value: '狗', label: '狗' },
                { value: '鸟', label: '鸟' },
              ]}
              onChange={switchSubject}
            />
          </div>
          <Segments
            label="模型内部视图"
            value={matrix}
            options={[
              { value: 'attention', label: '注意力矩阵' },
              { value: 'embedding', label: '词元 + 位置向量' },
            ]}
            onChange={setMatrix}
          />
          <div style={{ marginTop: 20 }}>
            {matrix === 'attention' && (
              <div className="attention-cols">
                {tokens.map((ch, i) => (
                  <span key={i}>{ch}</span>
                ))}
              </div>
            )}
            <div className="attention-view">
              <div className="attention-labels">
                {tokens.map((ch, i) => (
                  <span key={i}>{ch}</span>
                ))}
              </div>
              <div
                className="matrix-grid"
                style={{
                  gridTemplateColumns: `repeat(${matrix === 'attention' ? tokens.length : 8},1fr)`,
                }}
              >
                {grid?.flatMap((row, i) =>
                  row.map((n, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="matrix-cell"
                      title={`${tokens[i]} → ${matrix === 'attention' ? tokens[j] : `维度 ${j + 1}`}：${n.toFixed(4)}`}
                      style={{
                        background:
                          matrix === 'attention'
                            ? j > i
                              ? '#312b3b'
                              : `rgba(173,133,203,${0.08 + n * 0.68})`
                            : `rgba(${n > 0 ? '140,92,177' : '72,125,184'},${Math.min(0.8, 0.15 + Math.abs(n))})`,
                      }}
                    >
                      {matrix === 'attention' ? (j > i ? '×' : n.toFixed(2)) : n.toFixed(1)}
                    </div>
                  )),
                )}
              </div>
            </div>
          </div>
          <div className="transformer-path" aria-label="模型计算路径">
            <span>字与位置</span>
            <i>→</i>
            <span className="active">注意力</span>
            <i>→</i>
            <span>前馈网络</span>
            <i>→</i>
            <span>下一字概率</span>
          </div>
          <div className="transformer-loop">
            {mode === 'train'
              ? '训练时：预测误差 → 反向传播 → Adam 更新权重 ↺'
              : '生成时：采样一个字 → 追加到上下文 ↺'}
          </div>
          <p className="note" style={{ marginTop: 15 }}>
            {matrix === 'attention'
              ? '每行对应一个词元。因果掩码隐藏右上方的“未来”；颜色深浅来自模型实际计算。'
              : '每个字用 8 个数表示，并加入当前位置的可学习向量。这里显示实际张量值。'}
          </p>
          <svg
            className="loss-chart"
            viewBox="0 0 420 110"
            role="img"
            aria-label="训练损失曲线，越低表示模型给正确字更高概率"
          >
            <path d="M24 15v75h376" stroke="#dfd5e9" fill="none" />
            {history.length > 1 && (
              <polyline
                points={history
                  .map(
                    (v, i) =>
                      `${24 + (i / Math.max(1, history.length - 1)) * 375},${90 - (v / lossMax) * 70}`,
                  )
                  .join(' ')}
                stroke="#9872bf"
                fill="none"
                strokeWidth="1.8"
              />
            )}
            <text x="28" y="20" fill="#a78bb9" fontSize="9">
              CROSS-ENTROPY LOSS
            </text>
            <text x="352" y="105" fill="#a78bb9" fontSize="9">
              训练步数 →
            </text>
          </svg>
        </div>
        <div className="training-side">
          <h3 className="lab-subtitle">下一个字的概率</h3>
          {!inspection && !error && (
            <p className="note" role="status">
              正在初始化 8 维教学模型…
            </p>
          )}
          {probs.slice(0, 6).map(({ p, token }) => (
            <div className="prob-row" key={token}>
              <span>{token}</span>
              <div className="prob-track">
                <span style={{ width: `${p * 100}%` }} />
              </div>
              <output>{(p * 100).toFixed(1)}%</output>
            </div>
          ))}
          {mode === 'train' ? (
            <>
              <div className="control" style={{ margin: '22px 0 13px' }}>
                <span className="control-top">训练语料（固定）</span>
                <p className="note">
                  猫爱吃鱼。
                  <br />
                  狗爱吃肉。
                  <br />
                  鸟爱吃虫。
                </p>
              </div>
              <Range
                label="学习率"
                value={rate}
                min={0.005}
                max={0.03}
                step={0.005}
                onChange={setRate}
              />
              <button
                className="btn primary"
                disabled={!inspection || !!error}
                onClick={() => {
                  if (running) {
                    worker.current?.postMessage({ type: 'stop' });
                    return;
                  }
                  setRunning(true);
                  worker.current?.postMessage({
                    type: 'train',
                    steps: 50,
                    context: text.slice(-4),
                    rate,
                  });
                }}
              >
                {running ? 'Ⅱ 暂停训练' : '训练 50 步 →'}
              </button>
              <p className="train-stat">一次更新：预测 → 计算损失 → 反向传播 → Adam 更新</p>
            </>
          ) : (
            <>
              <Range
                label="采样温度"
                value={temperature}
                min={0}
                max={1.5}
                step={0.1}
                onChange={setTemperature}
                help="0 选择最可能的字；更高温度增加随机性。"
              />
              <button
                className="btn primary"
                disabled={!inspection || running || !!error || text.length >= 15}
                onClick={() =>
                  worker.current?.postMessage({
                    type: 'sample',
                    context: text.slice(-4),
                    temperature,
                  })
                }
              >
                生成下一个字 →
              </button>
              <p className="note" style={{ marginTop: 12 }}>
                原始概率显示在上方；采样时再应用温度。输入只保留最近 4 个字，权重不会因此改变。
              </p>
            </>
          )}
          <h3 className="lab-subtitle" style={{ marginTop: 24 }}>
            Q 权重的一行 · 实际参数
          </h3>
          <div className="weight-values">
            {inspection?.weights.map((v, i) => (
              <span key={i}>{v.toFixed(3)}</span>
            ))}
          </div>
          {error && (
            <p role="alert" className="lab-callout">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="metrics">
        <Metric label="已更新权重" value={inspection?.step || 0} unit="次" />
        <Metric label="最近训练损失" value={loss === null ? '尚未训练' : loss.toFixed(3)} />
        <Metric label="可学习参数" value={inspection?.parameterCount || '—'} />
      </div>
      <p className="lab-caption">
        <strong>真实计算的教学 Transformer：</strong>1 层、1 个注意力头、8 维向量、4 字上下文、9
        字词表；包含因果注意力、残差、RMSNorm
        和前馈网络。规模与语料刻意很小，不具备通用语言能力。训练在本地后台线程运行，不调用 AI 服务。
      </p>
    </div>
  );
}
