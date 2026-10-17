import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DifferentialMean } from './DifferentialDiagram';
import { differentialShot } from '../../models/differential';
const layout = vi.hoisted(() => ({ compact: false }));
vi.mock('../lab/useCompact', () => ({ useCompact: () => layout.compact }));

describe('the mean-speed shot retains its connected parts and narrated central mark', () => {
  it.each([false, true])('keeps the relationships in the compact=%s composition', (compact) => {
    layout.compact = compact;
    for (const progress of [0, 0.25, 0.5, 1, 0.25]) {
      const motion = differentialShot(3, progress).motion,
        markup = renderToStaticMarkup(<DifferentialMean motion={motion} />);
      expect(markup).toContain('行星齿轮连接左右半轴');
      expect(markup).toContain('diff-mean-scale');
      expect(markup).toContain('差速器壳体');
      expect(markup).toContain(motion.leftRate.toFixed(2));
      expect(markup).toContain(motion.carrierRate.toFixed(2));
      expect(markup).toContain(motion.rightRate.toFixed(2));
      expect(markup).not.toMatch(/NaN|Infinity/);
    }
  });
});
