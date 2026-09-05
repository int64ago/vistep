import { compressBlock } from '../models/jpeg';
self.onmessage = (
  e: MessageEvent<{ id: number; block: number[]; quality: number; keep: number }>,
) => {
  const { id, block, quality, keep } = e.data;
  self.postMessage({ id, ...compressBlock(block, quality, keep) });
};
