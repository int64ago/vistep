import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  PhotoComparison,
  PhotoEvent,
  PhotoNet,
  PhotoScale,
  PhotoSensors,
} from './ChemChlorinePhotolysis';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
describe('photolysis causal states visible to the learner', () => {
  it('withholds the numerical and verbal prediction answers until their own reveal', () => {
    const hidden = renderToStaticMarkup(
      <PhotoComparison width={258} mixing={1} revealGas={false} revealLiquid={false} />,
    );
    expect(hidden).not.toContain('21.46%');
    expect(hidden).not.toContain('19.77%');
    expect(hidden).not.toContain('Both:');
    expect(hidden).not.toContain('921.7');
    const gas = renderToStaticMarkup(
      <PhotoComparison width={258} revealGas revealLiquid={false} />,
    );
    expect(gas).toContain('21.46%');
    expect(gas).toContain('19.77%');
    expect(gas).not.toContain('921.7');
    const all = renderToStaticMarkup(<PhotoComparison width={258} />);
    expect(all).toContain('Both:');
    expect(all).toContain('921.7');
  });
  it('does not draw newly generated oxygen at zero decomposition', () => {
    expect(renderToStaticMarkup(<PhotoComparison width={258} extent={0} />)).not.toContain(
      'data-comparison-atom',
    );
    const product = renderToStaticMarkup(<PhotoComparison width={258} extent={1} />);
    expect(product.match(/data-comparison-atom=/g)).toHaveLength(4);
    expect(product).toContain('sample-A-O0');
    expect(product).toContain('sample-B-O0');
  });
  it('keeps the same six atom and two selected electron identities at the lens handoff', () => {
    const before = renderToStaticMarkup(<PhotoEvent width={258} time={32} />),
      after = renderToStaticMarkup(<PhotoNet width={258} time={0} />);
    const identities = (s: string) => s.match(/data-(?:atom|electron)="[^"]+"/g);
    expect(identities(after)).toEqual(identities(before));
    expect(after.match(/data-atom=/g)).toHaveLength(6);
    expect(after.match(/data-electron=/g)).toHaveLength(2);
    const net = renderToStaticMarkup(<PhotoNet width={258} time={16} />);
    expect(net).toContain('Net change · steps merged');
    expect(net).not.toContain('data-electron=');
    expect(net.match(/data-charge="1"/g)).toHaveLength(2);
    expect(net.match(/data-charge="-1"/g)).toHaveLength(2);
  });
  it('keeps gas transfer in the picture and in the same integer phase account', () => {
    for (const time of [20, 23, 25.9]) {
      const s = renderToStaticMarkup(<PhotoNet width={258} time={time} />);
      expect(s).toContain('data-headspace-oxygen="0"');
      expect(s).toContain('Not in gas');
    }
    expect(renderToStaticMarkup(<PhotoNet width={258} time={28} />)).toContain(
      'data-headspace-oxygen="1"',
    );
  });
  it('does not announce a cleaved bond in the unabsorbed alternative', () => {
    const s = renderToStaticMarkup(<PhotoEvent width={258} time={32} absorbed={false} />);
    expect(s).toContain('Unabsorbed: this bond stays intact');
    expect(s).not.toContain('bond has split homolytically');
    expect(s).not.toContain('data-photo-event="radicals"');
    expect(s.match(/data-electron-owner="selected-bond"/g)).toHaveLength(2);
  });
  it('separates fixed textbook trends from calculated scales and the ideal dark control', () => {
    const observed = renderToStaticMarkup(<PhotoSensors width={258} />);
    expect(observed).toContain('Textbook observed trends');
    expect(observed.match(/data-phase="liquid"/g)).toHaveLength(2);
    expect(observed.match(/data-phase="headspace"/g)).toHaveLength(1);
    expect(
      renderToStaticMarkup(<PhotoScale width={258} channel="oxygen" illuminated={false} />),
    ).toContain('18.00');
    const graph = renderToStaticMarkup(<PhotoScale width={258} channel="chloride" />);
    expect(graph).toContain('not measurements');
    expect(graph).toContain('not time');
  });
});
