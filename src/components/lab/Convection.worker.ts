import { ConvectionRun, type ConvectionOptions } from '../../models/convection';
const scope = self as unknown as {
  onmessage:
    ((e: MessageEvent<{ id: number; options: ConvectionOptions; time: number }>) => void) | null;
  postMessage: (value: unknown, transfer?: Transferable[]) => void;
};
let run: ConvectionRun | null = null,
  key = '';
scope.onmessage = ({ data }) => {
  try {
    const next = JSON.stringify(data.options);
    if (next !== key || !run) {
      run = new ConvectionRun(data.options);
      key = next;
    }
    const state = run.at(data.time);
    scope.postMessage({ id: data.id, state }, [
      state.temperature.buffer,
      state.dye.buffer,
      state.omega.buffer,
      state.psi.buffer,
    ]);
  } catch (error) {
    scope.postMessage({
      id: data.id,
      error: error instanceof Error ? error.message : 'Convection solver failed',
    });
  }
};
