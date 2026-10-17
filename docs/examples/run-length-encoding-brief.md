# Run-length encoding — author brief

Misconceptions: repeated colors anywhere compress as one run; RLE always shrinks; packet counts are actual image file sizes; character repetition equals byte repetition. Prerequisite: counting and sequential traversal. Different from lz77/huffman: only adjacent same-byte runs, no backreferences or frequency code.

Art direction: colored textile-like8×8 bitmap with a moving scan outline, count/value packets, then exact byte ledger. Decode reveals only complete expanded runs. Last chapter replaces bitmap with two real hex records at127/128. Desktop bitmap max240px beside packets; phone max192px over two-row packets (negative case shows only first2 plus explicit rest count), all labels16px+. Soft deep olive #615940; background pale. Stage budget350–430px pending complete-player740px review.

Claim basis: [Microsoft BMP RLE](https://learn.microsoft.com/en-us/windows/win32/gdi/bitmap-compression) for adjacent count/value concept, [WebAssembly unsigned LEB128](https://webassembly.github.io/spec/core/binary/values.html#integers) for count bits. Our R1 format has own52/31 header, shortest positive counts and4096-byte expansion limit; not BMP or WebAssembly serialization. Actual source64 byte pixels, no2-bit packing; dimensions/palette external. Sizes include format header, not estimates.

Six shots, planned132s: source64; scan contiguous runs; encode four16-count runs into10 actual bytes; expand and restore; thin stripes64runs→130bytes;127/128 count4→5encodedbytes. Checkerboard exploration yields57runs/116bytes because equal row-boundary bytes join, an independent negative benchmark.

Four tests: exact known bytes;127/128/4096 boundaries and empty stream;60 deterministic roundtrips and repeated Unicode bytes; canonical/truncation/expansion guards. Decode recovers original bytes, not a visually similar image. No browser resources or independent clock. Browser/full watch/recordings/listening/device/independent review remain pending; author checks only. Computing age10, related lz77,huffman,jpeg. Speech pending keyframes.
