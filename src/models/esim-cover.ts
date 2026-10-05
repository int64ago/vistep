import { ESIM_OBJECT, esimPackageBits } from './esim';
/** A separate wide composition, retaining the same phone/chip locations as the film. */
export function esimCover() {
  return {
    phone: { ...ESIM_OBJECT, x: 66, y: 26, scale: 0.66 },
    chip: { x: 268, y: 106, size: 68 },
    packet: { x: 209, y: 116 },
    bits: esimPackageBits(20),
  };
}
