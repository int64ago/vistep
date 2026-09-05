import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { generatorPhaseX, GeneratorInstrument } from './ElectricGenerator';
import { MotorPlot } from './InductionMotor';
import { generatorShot } from '../../models/electric-generator';
import { motorSample, motorShot, motorSteadySlip } from '../../models/induction-motor';

it('keeps every generator tick, grid and quarter-turn peak on the same horizontal projection', () => {
  const html = renderToStaticMarkup(<GeneratorInstrument shot={generatorShot(3, 0.25)} />);
  for (const phase of [0, 0.25, 0.5, 0.75, 1]) {
    const x = generatorPhaseX(phase);
    expect(html).toContain(`d="M${x} 12V130"`);
    expect(html).toContain(`left:${x / 6}%`);
    for (const width of [244, 306, 540, 1090])
      expect((x / 6 / 100) * width).toBeCloseTo((x / 600) * width, 12);
  }
  expect(html).toContain('d="M156 8V131"');
});

it('labels the reversal-invariant motor plot as magnitudes on both axes', () => {
  const slip = motorSteadySlip(2)!;
  const plots = ([-1, 1] as const).map((direction) => {
    const state = motorSample(slip, Math.PI / 2, (direction * (1 - slip) * Math.PI) / 2, direction);
    expect(Math.sign(state.rpm)).toBe(direction);
    expect(Math.sign(state.torque)).toBe(direction);
    const html = renderToStaticMarkup(<MotorPlot shot={{ ...motorShot(5, 0.5), state }} />);
    expect(html).toContain('|n| · 3000 rpm');
    expect(html).toContain('|τ| · 30 N·m');
    return html.match(/<circle[^>]+>/)![0];
  });
  expect(plots[0]).toBe(plots[1]);
});
