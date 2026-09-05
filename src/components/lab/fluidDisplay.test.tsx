import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { siphonShot } from '../../models/siphon';
import { waterHammerShot } from '../../models/water-hammer';
import SiphonApparatus from './SiphonApparatus';
import { WaterHammerElastic } from './WaterHammerBench';

describe('fluid display contacts and phone instrument separation', () => {
  it('retains the outlet stream and wet mouth during branch discharge, including the flat view', () => {
    for (const initialWidth of [262, 880])
      for (const flat of [false, true]) {
        const draining = renderToStaticMarkup(
          createElement(SiphonApparatus, {
            shot: siphonShot(5, 0.65),
            compact: true,
            initialWidth,
            flat,
          }),
        );
        expect(draining).toContain('data-siphon-jet="branch"');
        expect(draining).toContain('data-siphon-outlet="wet"');
        const stopped = renderToStaticMarkup(
          createElement(SiphonApparatus, {
            shot: siphonShot(5, 0.9),
            compact: true,
            initialWidth,
            flat,
          }),
        );
        expect(stopped).not.toContain('data-siphon-jet=');
        expect(stopped).toContain('data-siphon-outlet="dry"');
      }
  });

  it('leaves a 16px text band plus at least 6px between phone instruments throughout the elastic chapter', () => {
    for (const initialWidth of [246, 262, 320])
      for (let i = 0; i <= 100; i++) {
        const html = renderToStaticMarkup(
          createElement(WaterHammerElastic, {
            state: waterHammerShot(2, i / 100).state,
            initialWidth,
          }),
        );
        const labels = [...html.matchAll(/<text\b[^>]*y="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g)];
        expect(labels).toHaveLength(4);
        const density = +labels[1][1],
          boreTitle = +labels[2][1],
          boreReading = +labels[3][1];
        // Conservative 16px Manrope/Noto ink extents (also measured in the isolated glyph audit).
        expect(boreTitle - 14 - (density + 3.5)).toBeGreaterThanOrEqual(6);
        expect(boreReading + 3.5).toBeLessThanOrEqual(302);
        expect(+labels[0][1] - 14).toBeGreaterThanOrEqual(0);
      }
  });
});
