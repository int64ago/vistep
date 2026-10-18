import {
  diffractionGrid,
  debyeCurve,
  planarPoints,
  penrosePoints,
  powderPoints,
} from '../models/chem-crystal-diffraction';
self.onmessage = (
  event: MessageEvent<{ id: number; kind: string; size: number; extent: number }>,
) => {
  const { id, kind, size, extent } = event.data;
  if (kind === 'powder') {
    self.postMessage({
      id,
      periodic: debyeCurve(powderPoints()),
      disordered: debyeCurve(powderPoints(1)),
    });
    return;
  }
  const values = diffractionGrid(
    kind === 'quasi' ? penrosePoints() : planarPoints(kind === 'disordered' ? 1 : 0),
    size,
    extent,
  );
  self.postMessage({ id, values }, { transfer: [values.buffer] });
};
