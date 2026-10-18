import { rippleGrid, type RippleInput } from '../models/ripple-tank-lab';
self.onmessage = (event: MessageEvent<RippleInput>) => {
  const input = event.data,
    field = rippleGrid(input);
  (self as unknown as Worker).postMessage({ input, field }, [field.buffer]);
};
