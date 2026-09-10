import { describe, expect, it } from 'vitest';
import timeline from '../data/film-timeline.json';
import { NFC, NFC_EXAMPLE_BITS, nfcDecodeReply, nfcLink, nfcReplyTrace } from './nfc';
import { nfcRectifierTrace, nfcShot } from './nfc-film';

const film = timeline.nfc;
const windowSeconds = (chapter: number) =>
  (film.chapters[chapter + 1]?.at ?? film.duration) - film.chapters[chapter].at;

describe('NFC authored film: causal state and published timing', () => {
  it('reaches a usable tag before revealing its settled internal construction', () => {
    let previousGap = 60;
    const endpoints: boolean[] = [];
    for (let frame = 0; frame <= 120; frame++) {
      const progress = frame / 120,
        shot = nfcShot(0, progress, progress * windowSeconds(0)),
        link = nfcLink({ gapM: shot.gapMm / 1000, tiltDeg: shot.tiltDeg });
      expect(shot.gapMm).toBeLessThanOrEqual(previousGap);
      previousGap = shot.gapMm;
      if (shot.reveal > 0) {
        expect(shot.gapMm).toBe(8);
        expect(link.readable).toBe(true);
      }
      if (frame === 0 || frame === 120) endpoints.push(link.readable);
    }
    expect(endpoints).toEqual([false, true]);
  });

  it('holds four observable load states with one geometry and one carrier', () => {
    const seconds = windowSeconds(4),
      frames = 1000,
      runs: { loaded: boolean; duration: number }[] = [];
    const currents = new Map<boolean, number>();
    for (let frame = 0; frame < frames; frame++) {
      const progress = (frame + 0.5) / frames,
        shot = nfcShot(4, progress, film.chapters[4].at + progress * seconds),
        link = nfcLink({ gapM: shot.gapMm / 1000, tiltDeg: shot.tiltDeg });
      expect(shot.fieldOn && link.powered).toBe(true);
      expect(shot.gapMm).toBe(8);
      expect(shot.tiltDeg).toBe(0);
      const current = (shot.loadOn ? link.loaded : link.unloaded).readerCurrentRmsA;
      if (currents.has(shot.loadOn)) expect(current).toBe(currents.get(shot.loadOn));
      currents.set(shot.loadOn, current);
      if (runs.at(-1)?.loaded !== shot.loadOn) runs.push({ loaded: shot.loadOn, duration: 0 });
      runs.at(-1)!.duration += seconds / frames;
    }
    expect(runs.map((r) => r.loaded)).toEqual([false, true, false, true]);
    expect(Math.min(...runs.map((r) => r.duration))).toBeGreaterThan(4);
    expect(currents.get(true)! - currents.get(false)!).toBeGreaterThan(0.008);
  });

  it('lets the complete request and response settle inside their narration windows', () => {
    const link = nfcLink({ gapM: 0.008, tiltDeg: 0 });
    const response = nfcDecodeReply(nfcReplyTrace(link).map((s) => s.readerCurrentRmsA));
    expect(response.join('')).toBe(NFC_EXAMPLE_BITS);
    expect(NFC_EXAMPLE_BITS.length / NFC.bitRate).toBeCloseTo(75.51622418879056e-6, 15);
    for (const chapter of [3, 5]) {
      const seconds = windowSeconds(chapter);
      let previous = 0,
        lastCompleted = 0,
        firstFullProgress = 1;
      for (let frame = 0; frame <= 1000; frame++) {
        const progress = frame / 1000,
          shot = nfcShot(chapter, progress, film.chapters[chapter].at + progress * seconds),
          complete = Math.floor(shot.packetProgress * NFC_EXAMPLE_BITS.length + 1e-9);
        expect(shot.packetProgress).toBeGreaterThanOrEqual(previous);
        expect(shot.packetProgress).toBeLessThanOrEqual(1);
        expect(complete - lastCompleted).toBeGreaterThanOrEqual(0);
        expect(complete - lastCompleted).toBeLessThanOrEqual(1);
        expect(response.slice(0, complete).join('')).toBe(NFC_EXAMPLE_BITS.slice(0, complete));
        if (shot.packetProgress === 1) firstFullProgress = Math.min(firstFullProgress, progress);
        previous = shot.packetProgress;
        lastCompleted = complete;
      }
      expect(lastCompleted).toBe(8);
      expect((1 - firstFullProgress) * seconds).toBeGreaterThanOrEqual(4);
    }
  });

  it('preserves physical pose and global RF phase at every chapter boundary', () => {
    expect(film.chapters).toHaveLength(7);
    for (let chapter = 0; chapter < 6; chapter++) {
      const boundary = film.chapters[chapter + 1].at,
        before = nfcShot(chapter, 1, boundary),
        after = nfcShot(chapter + 1, 0, boundary);
      expect(after.gapMm).toBe(before.gapMm);
      expect(after.tiltDeg).toBe(before.tiltDeg);
      expect(after.phase).toBe(before.phase);
      expect(after.fieldOn).toBe(before.fieldOn);
      expect(after.reveal).toBe(before.reveal);
    }
    const end = nfcShot(6, 1, film.duration),
      link = nfcLink({ gapM: end.gapMm / 1000, tiltDeg: end.tiltDeg });
    expect(link.readable).toBe(true);
  });
});

/** Exact ideal diode/capacitor solution: maximize all preceding exponentially
 * decayed input peaks. The extrema of |sin(2πt)|exp(t/τ) are known analytically. */
function exactStored(t: number, tauCycles: number) {
  const firstCritical = (Math.PI - Math.atan(2 * Math.PI * tauCycles)) / (2 * Math.PI),
    lastCritical = firstCritical + Math.floor((t - firstCritical) / 0.5) * 0.5;
  const present = Math.abs(Math.sin(2 * Math.PI * t));
  return lastCritical < 0
    ? present
    : Math.max(
        present,
        Math.abs(Math.sin(2 * Math.PI * lastCritical)) * Math.exp(-(t - lastCritical) / tauCycles),
      );
}

describe('NFC isolated rectifier: independent continuous-time reference', () => {
  it('matches the ideal diode envelope across light and heavy discharge loads', () => {
    for (const tauCycles of [0.08, 0.8, 8])
      for (const cycles of [1, 3, 5]) {
        const trace = nfcRectifierTrace(cycles * 720 + 1, cycles, tauCycles);
        for (const p of trace) {
          expect(Math.abs(p.stored - exactStored(p.t, tauCycles))).toBeLessThan(0.0001);
          expect(p.stored).toBeGreaterThanOrEqual(0);
          expect(p.stored).toBeLessThanOrEqual(1);
          if (p.conducting) expect(p.stored).toBe(p.rectified);
        }
      }
  });
});
