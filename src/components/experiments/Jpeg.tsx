import { t } from '../../i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Metric, Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { smooth } from '../../models/direction';
import JpegDetail from '../lab/JpegDetail';
import { compressBlock, sampleBlock, frequencyOrder } from '../../models/jpeg';
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
  const demo = useShowcase();
  const maximum = Math.max(1, ...values.map(Math.abs));
  if (!heat && (!onSelect || demo.watch))
    return (
      <svg
        className="pixel-block"
        viewBox="0 0 8 8"
        shapeRendering="crispEdges"
        role="img"
        aria-label={t('8 乘 8 亮度图块')}
      >
        <title>{t('8 乘 8 亮度图块')}</title>
        {values.map((v, i) => (
          <rect
            key={i}
            x={i % 8}
            y={Math.floor(i / 8)}
            width="1"
            height="1"
            fill={`rgb(${v},${v},${v})`}
          />
        ))}
      </svg>
    );
  return (
    <div
      className="pixel-block"
      role={demo.watch ? 'img' : 'group'}
      aria-label={heat ? t('64 个频率系数') : t('8 乘 8 像素图块')}
    >
      {values.map((v, i) => (
        <button
          key={i}
          type="button"
          disabled={!onSelect || demo.watch}
          tabIndex={demo.watch ? -1 : undefined}
          aria-hidden={demo.watch ? true : undefined}
          aria-label={t(
            '{0} {1},{2}：{3}',
            heat ? t('频率系数') : t('像素'),
            (i % 8) + 1,
            Math.floor(i / 8) + 1,
            v.toFixed(1),
          )}
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
  const demo = useShowcase();
  const [manualPattern, setPattern] = useState('edge'),
    [manualQuality, setQuality] = useState(35),
    [manualKeep, setKeep] = useState(64),
    [manualSelected, setSelected] = useState(1),
    [manualView, setView] = useState<'image' | 'basis'>('image');
  const pattern = demo.watch ? 'edge' : manualPattern;
  const c = demo.chapter,
    q = smooth(demo.chapterProgress);
  const quality = demo.watch
    ? c < 7
      ? 85
      : c === 7
        ? Math.round(85 - 77 * q)
        : c === 11
          ? Math.round(8 + 77 * q)
          : 8
    : manualQuality;
  const keep = demo.watch
    ? c === 3
      ? 1
      : c === 4
        ? Math.round(1 + 15 * q)
        : c === 5
          ? Math.round(16 + 48 * q)
          : 64
    : manualKeep;
  const selected = demo.watch
    ? c === 1 || c === 2
      ? [0, 1, 8, 9, 3, 24][Math.min(5, Math.floor(q * 6))]
      : frequencyOrder[Math.min(63, keep - 1)]
    : manualSelected;
  const view = demo.watch ? 'image' : manualView;
  const previewBasis = demo.watch && (c === 1 || c === 2);
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
        <h2>{t('把一小块图像，拆成 64 种频率。')}</h2>
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
          {t('↻ 重置')}
        </button>
        <Segments
          label={t('图像内容')}
          value={pattern}
          options={[
            { value: 'edge', label: t('斜边') },
            { value: 'gradient', label: t('渐变') },
            { value: 'texture', label: t('纹理') },
          ]}
          onChange={setPattern}
        />
      </div>
      <div className="lab-tabs">
        <Segments
          label={t('观察方式')}
          value={view}
          options={[
            { value: 'image', label: t('像素 → 频率 → 重建') },
            { value: 'basis', label: t('看看一种频率') },
          ]}
          onChange={setView}
        />
        <span className="note">{t('点击中间的格子，查看对应频率。')}</span>
      </div>
      <div
        className="jpeg-workbench"
        data-detail={demo.watch && c >= 8 && c <= 10 ? true : undefined}
      >
        <div className="jpeg-panel">
          <p className="eyebrow">01 / {view === 'basis' ? 'BASIS PATTERN' : 'ORIGINAL'}</p>
          <h3>{view === 'basis' ? t('频率 ({0}, {1}) 的基图案', u, v) : t('原始图像')}</h3>
          <PixelBlock values={view === 'basis' ? basis : block} />
          <p>
            {view === 'basis'
              ? t('越靠右、越靠下，变化越密。')
              : t('每个格子是一处亮度，0 黑 / 255 白。')}
          </p>
        </div>
        <span className="jpeg-arrow" aria-hidden="true">
          →
        </span>
        <div className="jpeg-panel">
          <p className="eyebrow">02 / DCT + QUANTIZATION</p>
          <h3>{previewBasis ? t('一种频率 ({0}, {1})', u, v) : t('频率系数')}</h3>
          <PixelBlock
            values={previewBasis ? basis : result.quantized}
            selected={previewBasis ? undefined : selected}
            onSelect={setSelected}
            heat={!previewBasis}
          />
          <p>
            {t('高亮：(')}
            {u}, {v}
            {t(') 值')}
            {result.coefficients[selected].toFixed(1)} → {result.quantized[selected]}
          </p>
        </div>
        <span className="jpeg-arrow" aria-hidden="true">
          →
        </span>
        <div className="jpeg-panel">
          <p className="eyebrow">03 / RECONSTRUCTED</p>
          <h3>{t('重建图像')}</h3>
          <PixelBlock values={result.reconstructed} />
          <p>{t('被舍去的细节，不会凭空回来。')}</p>
        </div>
      </div>
      {demo.watch && c >= 8 && c <= 10 && (
        <JpegDetail chapter={c} progress={demo.chapterProgress} block={block} result={result} />
      )}
      <div className="jpeg-controls">
        <label className="control">
          <span className="control-top">{t('选一个频率位置')}</span>
          <select
            aria-label={t('选择频率系数')}
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {Array.from({ length: 64 }, (_, i) => (
              <option key={i} value={i}>
                ({i % 8}, {Math.floor(i / 8)}) · {i === 0 ? t('整体亮度') : t('频率系数')}
              </option>
            ))}
          </select>
        </label>
        <Range
          label={t('画质参数')}
          value={quality}
          min={1}
          max={100}
          onChange={setQuality}
          help={t('数值越低，量化通常越粗。')}
        />
        <Range
          label={t('允许保留的低频位置')}
          value={keep}
          min={1}
          max={64}
          onChange={setKeep}
          help={t('从左上角的整体亮度，逐渐加入细节。')}
        />
        <div className="lab-callout">
          {t('把保留位置拖到 1：图像只剩一块平均亮度。再慢慢增加，观察轮廓怎样先于纹理出现。')}
        </div>
      </div>
      <div className="metrics">
        <Metric label={t('非零系数')} value={result.nonzero} unit="/ 64" />
        <Metric label={t('重建均方误差 MSE')} value={result.mse.toFixed(1)} />
        <Metric label={t('选中位置量化步长')} value={result.table[selected]} />
      </div>
      <p className="lab-caption">
        {t('这是 JPEG 的')}
        <strong>{t('亮度图块教学实验')}</strong>
        {t(
          '，真实计算 DCT、量化和逆变换。未生成 JPEG 文件；非零系数数量并不等于文件大小。色度降采样、熵编码和文件结构在下方继续展开。',
        )}
      </p>
    </div>
  );
}
