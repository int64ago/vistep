import { useEffect, useMemo, useRef, useState } from 'react';
import { Metric, Range, Segments } from '../lab/Controls';
import { compressBlock, sampleBlock } from '../../models/jpeg';
function PixelBlock({
  values,
  selected,
  onSelect,
  heat = false,
}: {
  values: number[];
  selected?: number;
  onSelect?: (n: number) => void;
  heat?: boolean;
}) {
  const maximum = Math.max(1, ...values.map(Math.abs));
  return (
    <div
      className="pixel-block"
      role="group"
      aria-label={heat ? '64 个频率系数' : '8 乘 8 像素图块'}
    >
      {values.map((v, i) => (
        <button
          key={i}
          type="button"
          disabled={!onSelect}
          aria-label={`${heat ? '频率系数' : '像素'} ${(i % 8) + 1},${Math.floor(i / 8) + 1}：${v.toFixed(1)}`}
          aria-pressed={selected === i}
          onClick={() => onSelect?.(i)}
          style={{
            background: heat
              ? v === 0
                ? '#e9edf5'
                : `rgba(${v > 0 ? '165,83,115' : '72,103,174'},${0.18 + (0.82 * Math.abs(v)) / maximum})`
              : `rgb(${v},${v},${v})`,
          }}
        >
          {heat && v === 0 ? <span>·</span> : null}
        </button>
      ))}
    </div>
  );
}
export default function Jpeg() {
  const [pattern, setPattern] = useState('edge'),
    [quality, setQuality] = useState(35),
    [keep, setKeep] = useState(64),
    [selected, setSelected] = useState(1),
    [view, setView] = useState<'image' | 'basis'>('image');
  const block = useMemo(() => sampleBlock(pattern), [pattern]);
  const [result, setResult] = useState(() => compressBlock(block, quality, keep));
  const worker = useRef<Worker | null>(null),
    request = useRef(0);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    try {
      const w = new Worker(new URL('../../workers/jpeg.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.current = w;
      w.onmessage = (e) => {
        if (e.data.id === request.current) setResult(e.data);
      };
      w.onerror = () => {
        setFallback(true);
        worker.current = null;
        w.terminate();
      };
      return () => w.terminate();
    } catch {
      setFallback(true);
    }
  }, []);
  useEffect(() => {
    const id = ++request.current;
    if (worker.current) worker.current.postMessage({ id, block, quality, keep });
    else setResult(compressBlock(block, quality, keep));
  }, [block, quality, keep, fallback]);
  const u = selected % 8,
    v = Math.floor(selected / 8);
  const basis = Array.from(
    { length: 64 },
    (_, i) =>
      128 +
      110 *
        Math.cos(((2 * (i % 8) + 1) * u * Math.PI) / 16) *
        Math.cos(((2 * Math.floor(i / 8) + 1) * v * Math.PI) / 16),
  );
  return (
    <div className="jpeg-lab">
      <div className="lab-toolbar">
        <h2>把一小块图像，拆成 64 种频率。</h2>
        <button
          className="btn"
          onClick={() => {
            setPattern('edge');
            setQuality(35);
            setKeep(64);
            setSelected(1);
            setView('image');
          }}
        >
          ↻ 重置
        </button>
        <Segments
          label="图像内容"
          value={pattern}
          options={[
            { value: 'edge', label: '斜边' },
            { value: 'gradient', label: '渐变' },
            { value: 'texture', label: '纹理' },
          ]}
          onChange={setPattern}
        />
      </div>
      <div className="lab-tabs">
        <Segments
          label="观察方式"
          value={view}
          options={[
            { value: 'image', label: '像素 → 频率 → 重建' },
            { value: 'basis', label: '看看一种频率' },
          ]}
          onChange={setView}
        />
        <span className="note">点击中间的格子，查看对应频率。</span>
      </div>
      <div className="jpeg-workbench">
        <div className="jpeg-panel">
          <p className="eyebrow">01 / {view === 'basis' ? 'BASIS PATTERN' : 'ORIGINAL'}</p>
          <h3>{view === 'basis' ? `频率 (${u}, ${v}) 的基图案` : '原始亮度图块'}</h3>
          <PixelBlock values={view === 'basis' ? basis : block} />
          <p>
            {view === 'basis'
              ? '越靠右、越靠下，变化越密。'
              : '每个格子是一处亮度，0 黑 / 255 白。'}
          </p>
        </div>
        <span className="jpeg-arrow" aria-hidden="true">
          →
        </span>
        <div className="jpeg-panel">
          <p className="eyebrow">02 / DCT + QUANTIZATION</p>
          <h3>量化后的频率系数</h3>
          <PixelBlock values={result.quantized} selected={selected} onSelect={setSelected} heat />
          <p>
            高亮：({u}, {v})　值 {result.coefficients[selected].toFixed(1)} →{' '}
            {result.quantized[selected]}
          </p>
        </div>
        <span className="jpeg-arrow" aria-hidden="true">
          →
        </span>
        <div className="jpeg-panel">
          <p className="eyebrow">03 / RECONSTRUCTED</p>
          <h3>重新拼回的图像</h3>
          <PixelBlock values={result.reconstructed} />
          <p>被舍去的细节，不会凭空回来。</p>
        </div>
      </div>
      <div className="jpeg-controls">
        <label className="control">
          <span className="control-top">选一个频率位置</span>
          <select
            aria-label="选择频率系数"
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {Array.from({ length: 64 }, (_, i) => (
              <option key={i} value={i}>
                ({i % 8}, {Math.floor(i / 8)}) · {i === 0 ? '整体亮度' : '频率系数'}
              </option>
            ))}
          </select>
        </label>
        <Range
          label="画质参数"
          value={quality}
          min={1}
          max={100}
          onChange={setQuality}
          help="数值越低，量化通常越粗。"
        />
        <Range
          label="允许保留的低频位置"
          value={keep}
          min={1}
          max={64}
          onChange={setKeep}
          help="从左上角的整体亮度，逐渐加入细节。"
        />
        <div className="lab-callout">
          把保留位置拖到 1：图像只剩一块平均亮度。再慢慢增加，观察轮廓怎样先于纹理出现。
        </div>
      </div>
      <div className="metrics">
        <Metric label="非零系数" value={result.nonzero} unit="/ 64" />
        <Metric label="重建均方误差 MSE" value={result.mse.toFixed(1)} />
        <Metric label="选中位置量化步长" value={result.table[selected]} />
      </div>
      <p className="lab-caption">
        这是 JPEG 的<strong>亮度图块教学实验</strong>，真实计算 DCT、量化和逆变换。未生成 JPEG
        文件；非零系数数量并不等于文件大小。色度降采样、熵编码和文件结构在下方继续展开。
      </p>
    </div>
  );
}
