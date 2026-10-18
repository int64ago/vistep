import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChlorineOxygenAccount, ChlorineTrain } from './ChemChlorineDiscovery';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
describe('chlorine scientific render states', () => {
  it('keeps the traced oxygen identity from oxide to water', () => {
    for (const progress of [0, 0.5, 1]) {
      const s = renderToStaticMarkup(<ChlorineOxygenAccount width={258} progress={progress} />);
      expect(s.match(/data-atom=/g)).toHaveLength(6);
      expect(s).toContain('data-atom="oxygen-oxide-0"');
      expect(s).toContain('Modern atom ledger');
    }
  });
  it('groups ionic compositions without drawing Pb—O or Pb—Cl molecular bonds', () => {
    for (const progress of [0, 1]) {
      const s = renderToStaticMarkup(<ChlorineOxygenAccount width={258} progress={progress} />);
      expect(s).toContain(`data-composition-group="${progress ? 'PbCl2' : 'PbO'}"`);
      expect(s).not.toContain('data-covalent-pair="lead-0/');
      expect(s.match(/data-covalent-pair=/g)).toHaveLength(2);
    }
  });
  it('holds the answer in the independent model prediction then reveals the actual empty O inventory', () => {
    const question = renderToStaticMarkup(
        <ChlorineOxygenAccount width={258} progress={0} oxide={false} reveal={false} />,
      ),
      answer = renderToStaticMarkup(
        <ChlorineOxygenAccount width={258} progress={0} oxide={false} />,
      );
    expect(question).toContain('Can new water form?');
    expect(question).not.toContain('New water 0');
    expect(question).not.toContain('O = 0');
    expect(question).toContain('Separate model trial');
    expect(answer).toContain('O = 0');
    expect(answer).toContain('New water 0 · initial water 0');
    expect(answer).not.toContain('data-element="O"');
  });
  it('renders initial-water oxygen distinctly and never counts it as newly made', () => {
    const s = renderToStaticMarkup(
      <ChlorineOxygenAccount width={258} progress={1} oxide={false} externalWater />,
    );
    expect(s).toContain('data-atom="external-O"');
    expect(s).not.toContain('data-atom="oxygen-oxide-0"');
    expect(s).toContain('New water 0 · initial water 1');
    expect(s.match(/data-atom=/g)).toHaveLength(7);
  });
  it('keeps the complete gas ledger visible, including a real capacity-limited unabsorbed fraction', () => {
    const s = renderToStaticMarkup(
      <ChlorineTrain width={258} throughput={4} hydroxide={1} progress={1} ledger />,
    );
    expect(s).toContain('Retained');
    expect(s).toContain('Absorbed');
    expect(s).toContain('Unabsorbed');
    expect(s).toContain('0.98');
    expect(s).toContain('0.50');
    expect(s).toContain('2.52');
  });
});
