import { computeArrayCell, computeTrace } from './cpu-gpu-npu';
/** Actual partial sums and live data identities, composed for the catalog format. */
export function computeCover() {
  const cpu = computeTrace('cpu')[1],
    gpu = computeTrace('gpu')[1],
    npu = computeTrace('npu')[5];
  return {
    cpu: cpu.operations[0],
    gpu: gpu.operations,
    array: npu.sums.flatMap((row, i) =>
      row.map((sum, j) => ({
        sum,
        row: i,
        column: j,
        ...computeArrayCell(i, j),
        active: npu.operations.some((p) => p.row === i && p.column === j),
      })),
    ),
  };
}
