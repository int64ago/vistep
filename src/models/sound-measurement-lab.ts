export type SoundClip = {
  samples: Float32Array;
  sampleRate: number;
  source: 'synthetic' | 'microphone';
  frequency: number | null;
};
export function syntheticSound(frequency: number, sampleRate = 48000, length = 16384): SoundClip {
  return {
    samples: Float32Array.from({ length }, (_, i) => {
      const p = (2 * Math.PI * frequency * i) / sampleRate;
      return 0.65 * Math.sin(p) + 0.2 * Math.sin(2 * p) + 0.1 * Math.sin(3 * p);
    }),
    sampleRate,
    source: 'synthetic',
    frequency,
  };
}
export function estimateSoundFrequency(samples: Float32Array, sampleRate: number) {
  const step = Math.max(1, Math.floor(sampleRate / 8000)),
    n = Math.min(4096, Math.floor(samples.length / step)),
    a = Float64Array.from({ length: n }, (_, i) => samples[i * step]),
    mean = a.reduce((s, x) => s + x, 0) / n;
  let energy = 0;
  for (let i = 0; i < n; i++) {
    a[i] -= mean;
    energy += a[i] * a[i];
  }
  if (n < 200 || energy / n < 1e-5) return null;
  const fs = sampleRate / step,
    first = Math.floor(fs / 1000),
    last = Math.min(Math.ceil(fs / 80), Math.floor(n / 3)),
    correlations = new Float64Array(last + 2);
  for (let lag = first - 1; lag <= last + 1; lag++) {
    let dot = 0,
      e1 = 0,
      e2 = 0;
    for (let i = 0; i < n - lag; i++) {
      dot += a[i] * a[i + lag];
      e1 += a[i] ** 2;
      e2 += a[i + lag] ** 2;
    }
    correlations[lag] = dot / Math.sqrt(e1 * e2);
  }
  for (let lag = first; lag <= last; lag++) {
    const c = correlations[lag];
    if (c > 0.85 && c >= correlations[lag - 1] && c > correlations[lag + 1]) {
      const delta =
        (0.5 * (correlations[lag - 1] - correlations[lag + 1])) /
        (correlations[lag - 1] - 2 * c + correlations[lag + 1]);
      return { frequency: fs / (lag + delta), confidence: c };
    }
  }
  return null;
}
export function waveformWindow(clip: SoundClip, seconds: number, points = 601) {
  const max = Math.min(seconds, (clip.samples.length - 1) / clip.sampleRate),
    amplitude = Math.max(0.01, ...clip.samples.map(Math.abs));
  return Array.from({ length: points }, (_, i) => {
    const sample = (i / (points - 1)) * max * clip.sampleRate,
      j = Math.floor(sample),
      p = sample - j;
    return (
      (clip.samples[j] * (1 - p) +
        (clip.samples[Math.min(j + 1, clip.samples.length - 1)] ?? 0) * p) /
      amplitude
    );
  });
}
export function equalTimeCycles(firstFrequency: number, secondFrequency: number, firstCycles = 10) {
  return {
    seconds: firstCycles / firstFrequency,
    first: firstCycles,
    second: (firstCycles * secondFrequency) / firstFrequency,
    ratio: secondFrequency / firstFrequency,
  };
}
export function lakeSoundMeasurement(distanceMetres = 14000, observedDelay = 10) {
  const lightSpeed = 299792458,
    lightTime = distanceMetres / lightSpeed,
    soundTime = observedDelay + lightTime;
  return {
    distance: distanceMetres,
    delay: observedDelay,
    lightTime,
    soundTime,
    speed: distanceMetres / soundTime,
    neglectLight: distanceMetres / observedDelay,
  };
}
