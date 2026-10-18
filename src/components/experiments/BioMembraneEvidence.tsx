import { useState, type ReactNode } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  membraneChapters,
  membraneDurations,
  membraneDirector,
  membraneRamp,
  membraneEase,
  passivePartitionBarrier,
  partitionCrossing,
  areaHypothesis,
  areaRectangle,
  foldingLipids,
  interfaceEvidence,
  contrastSamples,
  membraneTracer,
  historicalSnapshot,
  membraneGeometry,
  type LipidGeometry,
  type MembraneChapter,
} from '../../models/bio-membrane-evidence';
import '../../styles/bio-membrane-evidence.css';
const names = ['通透性', '脂质铺展', '表面张力', '电镜暗纹', '细胞融合', '流动镶嵌', '结构模型'];
function Diagram({
  children,
  label,
  viewBox = '0 0 360 260',
}: {
  children: ReactNode;
  label: string;
  viewBox?: string;
}) {
  return (
    <svg className="bme2-diagram" viewBox={viewBox} fill="none" role="img" aria-label={t(label)}>
      {children}
    </svg>
  );
}
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = '#8a9c7e',
  width = 2.5,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
}) {
  const a = Math.atan2(y2 - y1, x2 - x1),
    l = 6;
  return (
    <path
      d={
        'M' +
        x1 +
        ' ' +
        y1 +
        'L' +
        x2 +
        ' ' +
        y2 +
        'M' +
        (x2 - l * Math.cos(a - 0.6)) +
        ' ' +
        (y2 - l * Math.sin(a - 0.6)) +
        'L' +
        x2 +
        ' ' +
        y2 +
        'L' +
        (x2 - l * Math.cos(a + 0.6)) +
        ' ' +
        (y2 - l * Math.sin(a + 0.6))
      }
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Lipid({
  q,
  material = false,
  highlight = false,
}: {
  q: LipidGeometry;
  material?: boolean;
  highlight?: boolean;
}) {
  return (
    <g data-lipid-id={q.id}>
      <path
        d={q.tails.map((p) => 'M' + q.x + ' ' + q.y + 'L' + p.x + ' ' + p.y).join(' ')}
        stroke={highlight ? '#bd7a5f' : '#b6a777'}
        strokeWidth={material ? 2.6 : 2}
        strokeLinecap="round"
      />
      {material ? (
        <rect
          x={q.x - 5}
          y={q.y - 5}
          width="10"
          height="10"
          rx="2"
          fill={highlight ? '#bd7a5f' : '#90ab87'}
          stroke="#6f8b71"
        />
      ) : (
        <circle cx={q.x} cy={q.y} r={4.5} fill={q.id === 5 ? '#b77950' : '#8fae83'} />
      )}
    </g>
  );
}
function EvidenceTag({ children }: { children: ReactNode }) {
  return <div className="bme2-tag">{children}</div>;
}
function SourceLegend() {
  return (
    <div className="bme2-legend">
      <span>
        <i className="bme2-mouse" />
        {t('小鼠来源')}
      </span>
      <span>
        <i className="bme2-human" />
        {t('人来源')}
      </span>
    </div>
  );
}
function Marker({
  x,
  y,
  origin,
  ring = false,
  pin = false,
}: {
  x: number;
  y: number;
  origin: string;
  ring?: boolean;
  pin?: boolean;
}) {
  return (
    <g transform={'translate(' + x + ' ' + y + ')'}>
      {origin === 'mouse' ? (
        <circle r="4.3" fill="#5c8b62" />
      ) : (
        <path d="M0 -5.5L5 0L0 5.5L-5 0Z" fill="#bb7a65" />
      )}
      {ring && <circle r="9" stroke="#9e8052" strokeWidth="2" />}
      {pin && <path d="M0 -11V-21M-5 -21H5" stroke="#6c7370" strokeWidth="2" />}
    </g>
  );
}
function HistoricalCell({ minutes, material = false }: { minutes: 5 | 40; material?: boolean }) {
  return (
    <svg viewBox="0 0 170 160" fill="none" aria-hidden="true">
      <ellipse
        cx="85"
        cy="79"
        rx="67"
        ry="62"
        fill={material ? 'none' : '#dce3ce'}
        stroke={material ? '#a6a293' : '#a5b294'}
        strokeWidth={material ? 5 : 2}
      />
      {!material && (
        <>
          <ellipse cx="66" cy="73" rx="15" ry="20" fill="#bac5af" />
          <ellipse cx="104" cy="90" rx="15" ry="19" fill="#b4beb0" />
        </>
      )}
      {material &&
        historicalSnapshot(minutes).map((q) => (
          <path
            key={'fix-' + q.id}
            d={
              'M' +
              (85 + 58 * q.x) +
              ' ' +
              (79 + 53 * q.y) +
              'L' +
              (85 + 73 * q.x) +
              ' ' +
              (79 + 68 * q.y)
            }
            stroke="#8c8b80"
            strokeWidth="1.5"
          />
        ))}
      {historicalSnapshot(minutes).map((q) => (
        <Marker key={q.id} x={85 + 62 * q.x} y={79 + 57 * q.y} origin={q.origin} />
      ))}
    </svg>
  );
}
function HistoricalPair() {
  return (
    <>
      <EvidenceTag>{t('不同取样时刻的代表重建')} · 37 ℃</EvidenceTag>
      <div className="bme2-history">
        <div>
          <HistoricalCell minutes={5} />
          <p>5 min</p>
        </div>
        <div>
          <HistoricalCell minutes={40} />
          <p>40 min</p>
        </div>
      </div>
      <SourceLegend />
    </>
  );
}
function DiffusionRing({
  time,
  anchored = false,
  anchorAt = 0,
}: {
  time: number;
  anchored?: boolean;
  anchorAt?: number;
}) {
  return (
    <Diagram label="解释模型中保持身份的标记沿一维闭合路径随机移动">
      <circle cx="180" cy="128" r="94" stroke="#b4c0a4" strokeWidth="14" />
      <circle cx="180" cy="128" r="94" stroke="#f0f2e8" strokeWidth="2" />
      {Array.from({ length: 48 }, (_, id) => {
        const q = membraneTracer(id, time, 0.18, anchored && id === 3, 48, anchorAt);
        return (
          <Marker
            key={id}
            x={180 + 94 * q.x}
            y={128 + 94 * q.y}
            origin={q.origin}
            ring={id === 3}
            pin={anchored && id === 3}
          />
        );
      })}
      <path d="M133 124Q180 91 226 125M133 134Q180 167 226 133" stroke="#d0d8c2" strokeWidth="2" />
    </Diagram>
  );
}
function Permeability({
  time,
  shot,
  K,
  watch,
}: {
  time: number;
  shot: number;
  K: number;
  watch: boolean;
}) {
  const teachingTime = membraneRamp(time, 0, 5.7) * 20,
    parameter = watch ? 1 + 3 * membraneRamp(time, 15.1, 21.3) : K;
  return (
    <>
      <EvidenceTag>
        {t(shot === 0 ? '匹配条件的通透线索' : '解释模型：只改变脂质分配倾向')}
      </EvidenceTag>
      {shot === 0 ? (
        <>
          <Diagram label="相同起点和体积下的两种胞内积累曲线">
            <path d="M43 30V218H326" stroke="#a4b39b" />
            {[4, 1].map((k, i) => (
              <path
                key={k}
                d={Array.from({ length: 81 }, (_, n) => {
                  const st = passivePartitionBarrier(n / 4, k);
                  return (n ? 'L' : 'M') + (43 + n * 3.4) + ' ' + (218 - st.inside * 330);
                }).join(' ')}
                stroke={i ? '#899fa7' : '#b78b55'}
                strokeWidth="3"
              />
            ))}
            {[4, 1].map((k) => {
              const s = passivePartitionBarrier(teachingTime, k);
              return (
                <circle
                  key={k}
                  cx={43 + teachingTime * 13.6}
                  cy={218 - s.inside * 330}
                  r="6"
                  fill={k === 4 ? '#b78b55' : '#899fa7'}
                />
              );
            })}
          </Diagram>
          <div className="bme2-legend">
            <span>{t('较易进入脂质')}</span>
            <span>{t('较难进入脂质')}</span>
          </div>
          <p className="bme2-note">{t('胞内积累随时间变化；教学曲线')}</p>
        </>
      ) : (
        <>
          <Diagram label="同一屏障上的双向通量与脂质分配">
            <rect x="15" y="30" width="127" height="190" rx="18" fill="#d9e7e2" />
            <rect x="218" y="30" width="127" height="190" rx="18" fill="#d9e7e2" />
            <rect x="146" y="30" width="68" height="190" rx="9" fill="#ddd0a6" />
            <rect
              x="27"
              y="43"
              width="103"
              height="164"
              rx="11"
              fill="#b18a52"
              opacity={passivePartitionBarrier(8, parameter).outside * 0.35}
            />
            <rect
              x="230"
              y="43"
              width="103"
              height="164"
              rx="11"
              fill="#b18a52"
              opacity={passivePartitionBarrier(8, parameter).inside * 0.35}
            />
            <rect
              x="152"
              y="43"
              width="56"
              height="164"
              rx="5"
              fill="#b18a52"
              opacity={passivePartitionBarrier(0, parameter).membraneAffinity * 0.6}
            />
            {[false, true].map((reverse) => {
              const q = partitionCrossing(
                membraneRamp(time, reverse ? 9 : 6, reverse ? 15 : 12),
                reverse,
              );
              return (
                <g key={String(reverse)} transform={'translate(' + q.x + ' ' + q.y + ')'}>
                  <path
                    d="M0 -8L7 -4L7 4L0 8L-7 4L-7 -4Z"
                    fill="#bd965f"
                    stroke="#8e6d3f"
                    strokeWidth="2"
                  />
                  <circle r="11" stroke="#b89560" strokeWidth="1" strokeDasharray="3 3" />
                </g>
              );
            })}
            {(() => {
              const s = passivePartitionBarrier(shot === 1 ? 4 : 12, parameter);
              return (
                <>
                  <Arrow
                    x1={123}
                    y1={108}
                    x2={237}
                    y2={108}
                    color="#8c7952"
                    width={1.5 + s.forward * 55}
                  />
                  <Arrow
                    x1={237}
                    y1={151}
                    x2={123}
                    y2={151}
                    color="#8c7952"
                    width={1.5 + s.reverse * 55}
                  />
                </>
              );
            })()}
          </Diagram>
          <div className="bme2-thirds">
            <span>{t('外侧水相')}</span>
            <span>{t('脂质相')}</span>
            <span>{t('内侧水相')}</span>
          </div>
          <p className="bme2-note">
            {t(shot === 3 ? '支持含脂质；层数仍未知' : '先进入脂质，再从另一侧离开')}
          </p>
        </>
      )}
    </>
  );
}
function AreaPlot({
  candidate = false,
  loss = 1,
  lossMode = false,
}: {
  candidate?: boolean;
  loss?: number;
  lossMode?: boolean;
}) {
  const items = lossMode
    ? [
        { label: '完整收集预测', a: 0.94, color: '#92a389', dashed: true },
        { label: '当前收集预测', a: 0.94 * loss, color: '#b58c62', dashed: false },
      ]
    : candidate
      ? [
          { label: '观测 B', a: 0.92, color: '#b58c62', dashed: false },
          { label: '一层预测', a: 0.47, color: '#92a389', dashed: true },
          { label: '两层预测', a: 0.94 * loss, color: '#92a389', dashed: true },
        ]
      : [
          { label: '总表面积 A', a: 0.47, color: '#8e9f99', dashed: false },
          { label: '铺展面积 B', a: 0.92, color: '#b58c62', dashed: false },
        ];
  return (
    <>
      <Diagram label="同宽面积图比较独立观测和候选预测" viewBox="0 0 360 225">
        {items.map((item, i) => {
          const q = areaRectangle(item.a),
            x = items.length === 2 ? 77 + i * 145 : 37 + i * 112;
          return (
            <g key={item.label}>
              <rect
                x={x}
                y={185 - q.height}
                width={q.width}
                height={q.height}
                fill={item.dashed ? 'none' : item.color}
                fillOpacity=".6"
                stroke={item.color}
                strokeWidth="2.5"
                strokeDasharray={item.dashed ? '6 4' : undefined}
              />
              <path d={'M' + (x - 4) + ' 188H' + (x + q.width + 4)} stroke="#9caa91" />
            </g>
          );
        })}
      </Diagram>
      <div className={items.length === 3 ? 'bme2-thirds' : 'bme2-halves'}>
        {items.map((item) => (
          <span key={item.label}>
            {t(item.label)}
            <strong>{item.a.toFixed(2)} m²</strong>
          </span>
        ))}
      </div>
    </>
  );
}
function Monolayer({ time, shot, extraction }: { time: number; shot: number; extraction: number }) {
  const fold = membraneRamp(time, 18.2, 27.5);
  return (
    <>
      {shot === 0 ? (
        <>
          <EvidenceTag>{t('先独立测量，内部层数未知')}</EvidenceTag>
          <Diagram label="红细胞完整表面积与提取脂质的水面铺展">
            <g fill="#b9aaa0" stroke="#9c9187" strokeWidth="2">
              {[0, 1, 2].map((i) => (
                <g
                  key={i}
                  transform={
                    'translate(' +
                    (70 + (i % 2) * 47) +
                    ' ' +
                    (80 + Math.floor(i / 2) * 60) +
                    ') rotate(' +
                    i * 28 +
                    ')'
                  }
                >
                  <ellipse rx="32" ry="19" />
                  <ellipse rx="14" ry="7" fill="#c9bdb3" />
                </g>
              ))}
            </g>
            <Arrow x1={151} y1={116} x2={203} y2={116} />
            <path d="M220 76L337 61V169L220 185Z" fill="#c5dcd9" stroke="#91b1ac" strokeWidth="2" />
            {Array.from({ length: 16 }, (_, i) => (
              <circle
                key={i}
                cx={232 + (i % 4) * 29}
                cy={86 + Math.floor(i / 4) * 25 - (i % 4) * 4}
                r="4"
                fill="#a4ac78"
              />
            ))}
          </Diagram>
          <div className="bme2-halves">
            <span>{t('全部细胞的完整表面积')}</span>
            <span>{t('提取后铺成单层')}</span>
          </div>
        </>
      ) : shot <= 2 ? (
        <>
          <EvidenceTag>
            {t(shot === 1 ? '原研究人细胞样本：独立观测' : '保持观测不动，再比较假说')}
          </EvidenceTag>
          <AreaPlot candidate={shot === 2} />
          <p className="bme2-note">
            {shot === 1 ? '0.92 / 0.47 ≈ 1.96' : t('相同分子占地、完整提取的预测')}
          </p>
        </>
      ) : shot <= 4 ? (
        <>
          <EvidenceTag>{t('理想几何模型：同一批 40 个脂质')}</EvidenceTag>
          <Diagram label="同一批脂质由水面单层折为双层，头尾长度不变">
            <rect
              x="10"
              y="140"
              width="340"
              height="100"
              rx="10"
              fill="#d3e5e1"
              opacity={1 - fold}
            />
            <rect x="10" y="30" width="340" height="90" rx="10" fill="#d3e5e1" opacity={fold} />
            <rect x="10" y="166" width="340" height="74" rx="10" fill="#d3e5e1" opacity={fold} />
            <rect x="100" y="120" width="164" height="46" fill="#e3d7ae" opacity={fold} />
            {foldingLipids(fold).map((q) => (
              <Lipid key={q.id} q={q} />
            ))}
            <rect x="20" y="204" width="320" height="10" rx="2" fill="#b6c3a8" />
            <rect x="100" y="224" width="160" height="10" rx="2" fill="#b6c3a8" />
          </Diagram>
          <div className="bme2-halves">
            <span>
              {t(
                fold <= 0.02
                  ? '水面：头接水，尾朝空气'
                  : fold < 0.98
                    ? '从水面单层，重排为双层'
                    : '两侧是水，尾留在内部',
              )}
            </span>
            <span>{t('棕色头始终是同一分子')}</span>
          </div>
        </>
      ) : (
        <>
          <EvidenceTag>{t('新预测：若提取时损失脂质')}</EvidenceTag>
          <AreaPlot lossMode loss={extraction} />
          <p className="bme2-note">{t('A 不变，收集到的脂质面积偏小')}</p>
        </>
      )}
    </>
  );
}
function Tension({ shot, coverage }: { shot: number; coverage: number }) {
  const c = shot === 0 ? 0 : coverage,
    s = interfaceEvidence(c);
  return (
    <>
      <EvidenceTag>
        {t(
          shot === 0
            ? '教材定性线索：细胞表面张力较低'
            : shot === 3
              ? '一个张力结果，不唯一决定排列'
              : '相同半径的油—水界面解释模型',
        )}
      </EvidenceTag>
      {shot === 3 ? (
        <>
          <div className="bme2-history">
            {[true, false].map((coat, i) => (
              <div key={i}>
                <svg viewBox="0 0 170 170" fill="none" aria-hidden="true">
                  <circle cx="85" cy="85" r="55" fill="#dbc89b" stroke="#ae9f7b" />
                  {Array.from({ length: coat ? 20 : 8 }, (_, j) => {
                    const a = (j * 2 * Math.PI) / (coat ? 20 : 8);
                    return (
                      <rect
                        key={j}
                        x={85 + 55 * Math.cos(a) - 5}
                        y={85 + 55 * Math.sin(a) - 5}
                        width="10"
                        height="10"
                        rx="4"
                        fill="#aa9bb1"
                      />
                    );
                  })}
                </svg>
                <p>{t(coat ? '连续覆盖候选' : '局部吸附候选')}</p>
              </div>
            ))}
          </div>
          <p className="bme2-note">{t('仅凭张力，不能选出唯一结构')}</p>
        </>
      ) : (
        <>
          <Diagram label="蛋白在油水界面吸附改变张力，箭头由力学状态推导">
            <rect x="20" y="15" width="320" height="230" rx="24" fill="#d5e5df" />
            <circle cx="180" cy="130" r="78" fill="#dcc79b" stroke="#b6a17d" strokeWidth="2" />
            {Array.from({ length: 14 }, (_, i) => {
              const a = (i * 2 * Math.PI) / 14,
                approach = membraneEase(c),
                r = 112 - (112 - 78) * approach,
                x = 180 + r * Math.cos(a),
                y = 130 + r * Math.sin(a);
              return (
                <g
                  key={i}
                  transform={'translate(' + x + ' ' + y + ') rotate(' + (a * 180) / Math.PI + ')'}
                  opacity={shot === 0 ? 0 : 1}
                >
                  <ellipse cx="-3" rx="8" ry="6" fill="#b8a077" />
                  <ellipse cx="4" rx="8" ry="6" fill="#9b8ba8" />
                </g>
              );
            })}
            <Arrow x1={180} y1={130} x2={180 + 52 * s.gamma} y2={130} color="#a38250" />
            <Arrow x1={180} y1={130} x2={180 - 52 * s.gamma} y2={130} color="#a38250" />
          </Diagram>
          <div className="bme2-halves">
            <span>
              {t('水相')} / {t('油滴')}
            </span>
            <span>{t(c > 0.6 ? '吸附后：张力降低' : '未吸附：张力较高')}</span>
          </div>
        </>
      )}
    </>
  );
}
function ElectronImage({ shot, sigma }: { shot: number; sigma: number }) {
  const samples = contrastSamples(sigma);
  return (
    <>
      <EvidenceTag>
        {t(shot === 1 ? '蛋白—脂质—蛋白：解释假说' : '同一对比源，不同成像展宽')}
      </EvidenceTag>
      <Diagram label="同一灰度数据同时生成条带图像与沿法线的对比度曲线">
        <rect x="20" y="20" width="320" height="100" rx="4" fill="#edeee6" />
        {samples.map((q, i) => (
          <rect
            key={i}
            x={20 + (i * 320) / (samples.length - 1) - 1}
            y="20"
            width={320 / (samples.length - 1)}
            height="100"
            fill="#43574a"
            opacity={Math.min(1, q.intensity)}
          />
        ))}
        <path d="M20 71H340" stroke="#b48a54" strokeDasharray="4 5" />
        <Arrow x1={20} y1={71} x2={340} y2={71} color="#b48a54" width={1.5} />
        <path d="M20 220H340M20 145V220" stroke="#9cab95" />
        <path
          d={samples
            .map(
              (q, i) =>
                (i ? 'L' : 'M') +
                (20 + (i * 320) / (samples.length - 1)) +
                ' ' +
                (220 - q.intensity * 95),
            )
            .join(' ')}
          stroke="#8a9875"
          strokeWidth="2.5"
        />
        {shot === 1 && (
          <>
            <path d="M140 15V128M220 15V128" stroke="#aa8a77" strokeDasharray="5 5" />
            <text x="140" y="146" textAnchor="middle">
              ?
            </text>
            <text x="220" y="146" textAnchor="middle">
              ?
            </text>
          </>
        )}
      </Diagram>
      <p className="bme2-note">
        {t(shot === 2 ? '变模糊的是像，成分没有因此改变' : '暗带没有自带化学名称')}
      </p>
    </>
  );
}
function Fusion({
  time,
  shot,
  anchored,
  anchorAt,
}: {
  time: number;
  shot: number;
  anchored: boolean;
  anchorAt: number;
}) {
  return (
    <>
      {shot === 0 ? (
        <HistoricalPair />
      ) : shot === 1 ? (
        <>
          <EvidenceTag>{t('观测与固定位置的反事实预测')}</EvidenceTag>
          <div className="bme2-history">
            <div>
              <HistoricalCell minutes={40} />
              <p>{t('40 min 取样重建')}</p>
            </div>
            <div>
              <HistoricalCell minutes={5} />
              <p>{t('若位置全部固定')}</p>
            </div>
          </div>
          <SourceLegend />
        </>
      ) : (
        <>
          <EvidenceTag>{t('一维闭合路径：连续运动解释模型')}</EvidenceTag>
          <DiffusionRing
            time={Math.max(0, time - 14.6) * 1.5}
            anchored={anchored}
            anchorAt={anchorAt}
          />
          <SourceLegend />
          <p className="bme2-note">
            {t(anchored ? '固定一枚，其余仍可移动' : '带环标记改变位置，不改变来源')}
          </p>
        </>
      )}
    </>
  );
}
function Bilayer({
  flipped = 0,
  material = false,
  protein = true,
}: {
  flipped?: number;
  material?: boolean;
  protein?: boolean;
}) {
  const g = membraneGeometry(0, flipped, protein);
  return (
    <Diagram label="水相与膜芯共同约束脂质和蛋白的朝向">
      <rect x="4" y="28" width="352" height="92" rx="18" fill="#d4e5e0" />
      <rect x="4" y="166" width="352" height="73" rx="18" fill="#d4e5e0" />
      <rect x="4" y="120" width="352" height="46" fill="#e0d4aa" />
      {g.lipids.map((q) => (
        <Lipid key={q.id} q={q} material={material} highlight={flipped > 0.5} />
      ))}
      {protein && (
        <>
          <path
            d="M161 94Q146 100 156 120L156 166Q146 184 164 190H196Q214 184 204 166V120Q214 100 199 94Z"
            fill="#c4b6cf"
            stroke="#9b88ac"
            strokeWidth="2"
          />
          <rect x="156" y="120" width="48" height="46" rx="5" fill="#a495ad" />
          <path d="M180 94V69L166 57M180 69L195 57" stroke="#b3955f" strokeWidth="3" />
          <circle cx="166" cy="56" r="4.5" fill="#c4a875" />
          <circle cx="195" cy="56" r="4.5" fill="#c4a875" />
        </>
      )}
      {material && (
        <path d="M5 120H355M5 166H355" stroke="#8c8d83" strokeWidth="1" strokeDasharray="2 4" />
      )}
    </Diagram>
  );
}
function Mosaic({ time, shot, flip }: { time: number; shot: number; flip: number }) {
  return (
    <>
      {shot === 0 ? (
        <>
          <EvidenceTag>{t('独立证据：提取脂质约两倍面积')}</EvidenceTag>
          <AreaPlot />
          <p className="bme2-note">{t('面积约束层数')}</p>
        </>
      ) : shot === 1 ? (
        <>
          <EvidenceTag>{t('独立证据：来源标记能够混合')}</EvidenceTag>
          <div className="bme2-history">
            <HistoricalCell minutes={5} />
            <HistoricalCell minutes={40} />
          </div>
          <SourceLegend />
        </>
      ) : shot < 4 ? (
        <>
          <EvidenceTag>
            {t(shot === 2 ? '两侧水相约束头尾方向' : '蛋白性质与定位研究提供额外约束')}
          </EvidenceTag>
          <Bilayer flipped={flip} protein={shot === 3} />
          <div className="bme2-halves">
            <span>{t('上方为细胞外侧')}</span>
            <span>{t(shot === 2 ? '疏水尾在膜芯' : '亲水端外露，疏水腰在膜芯')}</span>
          </div>
        </>
      ) : (
        <>
          <EvidenceTag>{t('流动仍保留内外与头尾关系')}</EvidenceTag>
          <DiffusionRing time={(time - 26.5) * 1.6} anchored />
          <SourceLegend />
          <p className="bme2-note">{t('示意侧向运动，并非全部蛋白自由漂移')}</p>
        </>
      )}
    </>
  );
}
function Build({ time, shot, flip }: { time: number; shot: number; flip: number }) {
  return (
    <>
      {shot < 2 ? (
        <>
          <EvidenceTag>
            {t(shot === 0 ? '同样数量的材料，方向可能错误' : '先检验水与头尾的接触关系')}
          </EvidenceTag>
          <Bilayer flipped={flip} material />
          <p className="bme2-note">
            {t(flip > 0.5 ? '尾部朝水：这个排列不合适' : '头接水、尾向内：空间关系得到保留')}
          </p>
        </>
      ) : shot === 2 ? (
        <>
          <EvidenceTag>{t('再用标记混合检验行为')}</EvidenceTag>
          <div className="bme2-history">
            <div>
              <HistoricalCell minutes={40} />
              <p>{t('取样观察：混合')}</p>
            </div>
            <div>
              <HistoricalCell minutes={5} material />
              <p>{t('固定材料：仍分区')}</p>
            </div>
          </div>
          <p className="bme2-note">{t('固定教具可表达双层，不能表达扩散')}</p>
        </>
      ) : (
        <>
          <EvidenceTag>{t('改进预测：连接允许侧向移动')}</EvidenceTag>
          <DiffusionRing time={(time - 24.8) * 2} />
          <p className="bme2-note">{t('运动是解释模型，不是材料的真实动力学')}</p>
        </>
      )}
    </>
  );
}
export default function BioMembraneEvidence() {
  const f = useShowcase(),
    [mode, setMode] = useState<MembraneChapter | null>(null),
    [progress, setProgress] = useState(0.65),
    [K, setK] = useState(4),
    [extraction, setExtraction] = useState(0.7),
    [coverage, setCoverage] = useState(1),
    [sigma, setSigma] = useState(0.7),
    [anchored, setAnchored] = useState(false),
    [flipped, setFlipped] = useState(false);
  const current = membraneChapters[Math.min(6, f.chapter)] ?? 'permeability',
    m = f.watch ? current : (mode ?? current),
    index = membraneChapters.indexOf(m),
    chapterTime = f.watch ? f.chapterTime : progress * membraneDurations[index],
    d = membraneDirector(index, chapterTime, browserLocale()),
    time = d.sceneTime,
    c = f.watch ? membraneRamp(time, 5, 14) : coverage,
    blur = f.watch ? (d.shot === 2 ? 0.4 + 1.3 * membraneRamp(time, 13, 18) : 0.45) : sigma,
    flip = f.watch ? (m === 'build' ? d.buildFlip : 0) : flipped ? 1 : 0;
  return (
    <section className="bme2" data-membrane-chapter={m} data-membrane-shot={d.shot}>
      <div className="bme2-canvas">
        {m === 'permeability' ? (
          <Permeability time={time} shot={d.shot} K={f.watch ? 4 : K} watch={f.watch} />
        ) : m === 'monolayer' ? (
          <Monolayer time={time} shot={d.shot} extraction={f.watch ? 0.7 : extraction} />
        ) : m === 'tension' ? (
          <Tension shot={d.shot} coverage={c} />
        ) : m === 'em' ? (
          <ElectronImage shot={d.shot} sigma={blur} />
        ) : m === 'fusion' ? (
          <Fusion
            time={time}
            shot={d.shot}
            anchored={f.watch ? d.shot === 3 : anchored}
            anchorAt={f.watch ? 18.9 : 0}
          />
        ) : m === 'mosaic' ? (
          <Mosaic time={time} shot={d.shot} flip={flip} />
        ) : (
          <Build time={time} shot={d.shot} flip={flip} />
        )}
      </div>
      {!f.watch && (
        <div className="bme2-controls">
          <Segments<MembraneChapter>
            label={t('选择证据')}
            value={m}
            onChange={setMode}
            options={membraneChapters.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('观察进度')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {m === 'permeability' && (
            <Range
              label={t('脂质分配系数 K')}
              value={K}
              min={0.2}
              max={4}
              step={0.2}
              onChange={(value) => {
                setK(value);
                setProgress(0.65);
              }}
            />
          )}
          {m === 'monolayer' && (
            <>
              <Range
                label={t('脂质收集比例')}
                value={extraction}
                min={0.2}
                max={1}
                step={0.05}
                onChange={(value) => {
                  setExtraction(value);
                  setProgress(0.96);
                }}
              />
              <p>
                {t('相同面积基准下的两层预测')}：
                {areaHypothesis(2, extraction).predictedRatio.toFixed(2)} A
              </p>
            </>
          )}
          {m === 'tension' && (
            <Range
              label={t('界面吸附程度')}
              value={coverage}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => {
                setCoverage(value);
                setProgress(0.55);
              }}
            />
          )}
          {m === 'em' && (
            <Range
              label={t('成像展宽')}
              value={sigma}
              min={0.3}
              max={1.7}
              step={0.1}
              onChange={setSigma}
            />
          )}
          {m === 'fusion' && (
            <button
              type="button"
              aria-pressed={anchored}
              onClick={() => {
                setAnchored(!anchored);
                setProgress(0.95);
              }}
            >
              {t(anchored ? '一枚已固定' : '固定一枚标记')}
            </button>
          )}
          {(m === 'mosaic' || m === 'build') && (
            <button
              type="button"
              aria-pressed={flipped}
              onClick={() => {
                setFlipped(!flipped);
                setProgress(m === 'mosaic' ? 0.65 : 0.2);
              }}
            >
              {t(flipped ? '恢复头朝水' : '翻转头尾方向')}
            </button>
          )}
          <p>{t('模型参数只用于解释；不是历史原始测量或真实膜的拟合。')}</p>
        </div>
      )}
    </section>
  );
}
