import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FlameStateExchange, FlameSpectrumStrip } from './ChemFlameSpectra';
import { unknownLines } from '../../models/chem-flame-spectra';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
const view = (
  id: 'Na-D2' | 'Na-UV' | 'Li-670' | 'Li-610',
  progress: number,
  kind: 'emission' | 'absorption' | 'return',
  populated = true,
  matched = true,
) =>
  renderToStaticMarkup(
    <FlameStateExchange
      width={258}
      compact
      id={id}
      progress={progress}
      kind={kind}
      populated={populated}
      matched={matched}
    />,
  );
describe('spectroscopy scientific render states', () => {
  it('shows the actual unmatched photon wavelength and no captured energy', () => {
    const s = view('Na-D2', 0.8, 'absorption', true, false);
    expect(s).toContain('471.3 nm');
    expect(s).not.toContain('589.2 nm');
    expect(s).toContain('data-atom-ev="0"');
  });
  it('draws UV as an invisible neutral packet rather than visible violet', () => {
    const s = view('Na-UV', 0.8, 'emission');
    expect(s).toContain('data-invisible-uv="true"');
    expect(s).toContain('#bac4c0');
    expect(s).not.toContain('#b79ce9');
  });
  it('keeps three lithium samples separate and forms only the selected absorption line', () => {
    const ref = view('Li-670', 0.9, 'return'),
      empty = view('Li-610', 0.9, 'absorption', false),
      occupied = view('Li-610', 0.9, 'absorption');
    expect(ref).toContain('data-sample="reference-2s"');
    expect(ref).toContain('data-line-air-nm="670.7775"');
    expect(ref).not.toContain('data-line-air-nm="610.3654"');
    expect(empty).toContain('data-sample="prepared-2s"');
    expect(empty).toContain('data-absorbed="false"');
    expect(occupied).toContain('data-sample="prepared-2p"');
    expect(occupied).toContain('data-absorbed="true"');
    expect(occupied).not.toContain('data-line-air-nm="670.7775"');
  });
  it('renders fixed observed positions without a candidate prop or regenerated peaks', () => {
    const s = renderToStaticMarkup(<FlameSpectrumStrip label="unknown" lines={unknownLines()} />);
    expect(s).toContain('data-line-nm="435.8328"');
    expect(s).toContain('data-line-nm="546.0735"');
    expect(s).toContain('data-line-nm="579.0663"');
  });
});
