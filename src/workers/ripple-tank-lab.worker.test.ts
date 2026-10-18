import { it, expect, vi } from 'vitest';
import { RIPPLE_DEFAULT, rippleGrid } from '../models/ripple-tank-lab';
it('transfers a field together with the exact apparatus parameters used to compute it', async () => {
  let result: any;
  const scope = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: (data: any, transfer: Transferable[]) => {
      result = structuredClone(data, { transfer });
    },
  };
  vi.stubGlobal('self', scope);
  try {
    await import('./ripple-tank-lab.worker');
    const input = { ...RIPPLE_DEFAULT, mode: 'diffraction' as const, gap: 0.073 };
    scope.onmessage!({ data: input } as MessageEvent);
    expect(result.input).toEqual(input);
    expect(result.field).toBeInstanceOf(Float32Array);
    expect(Array.from(result.field)).toEqual(Array.from(rippleGrid(input)));
  } finally {
    vi.unstubAllGlobals();
  }
});
