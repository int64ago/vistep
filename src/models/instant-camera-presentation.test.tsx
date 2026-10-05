import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/Showcase';
import InstantCamera from '../components/experiments/InstantCamera';
import InstantCameraDiagram from '../components/three/InstantCameraDiagram';
import { IC, icShot } from './instant-camera';

function frame(chapter: number, progress: number, playing = false) {
  return renderToStaticMarkup(
    <FilmContext.Provider
      value={{
        watch: true,
        playing,
        time: chapter * 24 + progress * 24,
        chapter,
        chapterProgress: progress,
        chapterTime: progress * 24,
        run: 0,
        duration: 168,
        chapters: [],
      }}
    >
      <InstantCamera />
    </FilmContext.Provider>,
  );
}

describe('instant film reconstructs the observed causal state on a paused seek', () => {
  it('distinguishes a waiting closed shutter, exposure, and latent image', () => {
    expect(frame(0, 0)).toContain('等待曝光，药囊仍封闭');
    expect(frame(0, 0.25)).toContain('光穿过覆盖片，记录在感光层');
    expect(frame(0, 0.7)).toContain('曝光留下潜像；肉眼尚看不到');
    expect(frame(0, 0.7)).toContain('data-instant-feed="0.000"');
  });
  it('keeps the sealed pod at the start of the nip closeup, then shows rupture on that same sheet', () => {
    const before = frame(2, 0),
      after = frame(2, 0.4);
    expect(before).toContain('滚轮从两面压向药囊');
    expect(before).toContain('data-instant-feed="20.000"');
    expect(after).toContain('药囊已破，试剂仍在相纸内部');
    expect(frame(2, 0.4, true)).toBe(after);
    frame(5, 0.8);
    frame(0, 0.1);
    expect(frame(2, 0.4)).toBe(after);
  });
  it('labels compressed chemical time in both layer and gradual-image shots', () => {
    const layered = frame(4, 1),
      ready = frame(5, 1);
    expect(layered).toContain('模型时间 03:00');
    expect(layered).toContain('染料迁入接收层，不是喷墨打印');
    expect(ready).toContain('15:00');
    expect(ready).toContain('彩色 i-Type 通常需要 10–15 分钟');
    expect(ready).toContain('分 : 秒 · 时间压缩');
  });
  it('retains the damaged comparison print after advice to clean before another exposure', () => {
    for (const p of [0, 0.4, 0.9]) {
      const comparison = frame(6, p);
      expect(comparison).toContain('data-instant-print-dirty="false"');
      expect(comparison).toContain('data-instant-print-dirty="true"');
      expect(comparison).toContain('清洁滚轮处理');
      expect(comparison).toContain('脏滚轮处理');
    }
    expect(frame(6, 0.9)).toContain('污点留在这张；清洁用于下一张');
  });
  it('uses the same compressed finite pod profile in the standalone phone fallback', () => {
    const shot = icShot(2, 0, { feedMm: 19, seconds: 0, dirty: false });
    const markup = renderToStaticMarkup(<InstantCameraDiagram shot={shot} width={288} />);
    expect(markup).toContain('viewBox="0 0 288 318"');
    expect(markup).not.toMatch(/NaN|Infinity/);
    const scale = Math.min((288 - 32) / 69, (318 - 44) / 40);
    const x = (v: number) => 16 + (v + 31) * scale;
    const y = (v: number) => 318 - 22 - (v - 8) * scale;
    const profile = [...shot.transport.podProfile]
      .reverse()
      .map(({ x: worldX, height }) => `L${x(worldX)} ${y(IC.plane + IC.thickness / 2 + height)}`)
      .join('');
    expect(markup).toContain(profile);
  });
});
