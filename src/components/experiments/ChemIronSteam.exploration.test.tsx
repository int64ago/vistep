import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SteamAtoms,
  SteamMass,
  SteamPrediction,
  SteamApparatus,
  SteamEvidence,
} from './ChemIronSteam';
vi.mock('../../i18n', () => ({ browserLocale: () => 'en' }));
describe('iron-steam visible causal state', () => {
  it('does not disclose yield or limiting reagent before the prediction is run and revealed', () => {
    const s = renderToStaticMarkup(<SteamPrediction width={258} progress={0} reveal={false} />);
    expect(s).not.toContain('16.65');
    expect(s).not.toContain('23.88');
    expect(s).not.toContain('Iron left');
    expect(s).not.toContain('Water left');
    const result = renderToStaticMarkup(<SteamPrediction width={258} progress={1} reveal />);
    expect(result).toContain('16.65');
    expect(result).toContain('23.88');
    expect(result).toContain('Iron left');
    expect(result).toContain('Water left');
  });
  it('renders the same15atom IDs before, during and after their redistribution', () => {
    const identities = (p: number) =>
      renderToStaticMarkup(<SteamAtoms width={258} progress={p} />).match(
        /data-steam-atom="[^"]+"/g,
      );
    expect(identities(0)).toHaveLength(15);
    expect(identities(0.5)).toEqual(identities(0));
    expect(identities(1)).toEqual(identities(0));
  });
  it('makes the transfer pool visible and delays solid mass gain until the packets arrive', () => {
    const transit = renderToStaticMarkup(<SteamMass width={258} progress={0.5} />),
      end = renderToStaticMarkup(<SteamMass width={258} progress={1} />);
    expect(transit).toContain('data-mass-phase="transfer"');
    expect(transit).toContain('In transfer');
    expect(transit).toContain('0.430 g');
    expect(transit).not.toContain('1.382 g');
    expect(end).toContain('1.382 g');
    expect(end).toContain('1.500 g');
  });
  it('does not show reaction-derived gas or oxygen transfer in the unheated control', () => {
    expect(renderToStaticMarkup(<SteamMass width={258} progress={1} hot={false} />)).not.toContain(
      'data-mass-parcel',
    );
    const air = renderToStaticMarkup(<SteamEvidence width={258} phase="bubble" />);
    expect(air).toContain('Air control');
    expect(air).not.toContain('combustible gas');
    expect(renderToStaticMarkup(<SteamApparatus width={258} water={0} />)).not.toContain(
      'data-tracked-path',
    );
  });
});
