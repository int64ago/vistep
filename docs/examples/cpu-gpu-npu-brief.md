# CPU, GPU and NPU — production brief

[简体中文](../zh-CN/examples/cpu-gpu-npu-brief.md) · [Production guide](../creating-a-scene.md)

## Question and direction

Why can several kinds of processor compute the same answer, yet organize work differently? The reader follows a stable output identity, Y11, through one fixed `ReLU(XW)` task. The turning point is not a speed contest: the GPU shares an instruction across data identities, while the NPU example shares passing values across adjacent MAC cells. All sixteen answers are checked at the end.

The medium is a numerical dataflow study, implemented as HTML matrices and connected SVG buses. Copper weight signals and blue-green activations remain distinguishable in an otherwise quiet paper composition. There is no decorative chip photograph or fictional 3D enclosure. CPU control, GPU lanes and the NPU array each have their own layout.

## Model and technical sources

- [NVIDIA CUDA programming model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html): heterogeneous host/device tasks, SIMT masks, tile programming and memory locality. Four displayed lanes are not a 32-thread NVIDIA warp. ReLU is deliberately expressed as two paths to reveal masking; compiled implementations may be branchless.
- [Google's first TPU paper](https://research.google/pubs/in-datacenter-performance-analysis-of-a-tensor-processing-unit/): primary matrix-accelerator and local-storage example. The output-stationary 4×4 teaching array is not a replica or a claim about every NPU.
- [Intel NPU technical documentation](https://edc.intel.com/content/www/us/en/design/products/platforms/details/arrow-lake-s/core-ultra-200s-series-processors-datasheet-volume-1-of-2/intel-neural-processing-unit-intel-npu/): specialized MAC engines, near-compute memory and scheduling.

`src/models/cpu-gpu-npu.ts` defines the task, deterministic traces and chapter director. CPU processes each output with four MACs and one conditional write. GPU dispatches groups of four output identities, then only the nonempty keep/zero masks. The array aligns both streams at `tick = i + j + k`, holds each output's partial sum locally and applies activation after the tile finishes. All schedules perform exactly 64 MACs. The weights remain frozen. No actual timing, energy, quantization, cache or temperature claim is made.

## Film and responsive composition

Planned shared windows total 170 seconds. Recorded lengths must be measured by the integration owner; this planned timeline is not a recording claim.

| Chapter / planned start | Visible event                                                        | Desktop                                                    | Phone                                                                                                              |
| ----------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| One task / 0 s          | Fixed X row and W column produce Y11=2.                              | Two readable tiles, one equation ribbon.                   | Two small input tiles; equation and processor names occupy separate lines.                                         |
| CPU / 24 s              | Four products change a partial sum; conditional write follows.       | Program ribbon, dot-product strip and written-output tile. | Current product and accumulator dominate; the redundant program ribbon is omitted. Model limits remain expandable. |
| GPU / 48 s              | Four distinct partial sums update under a shared instruction.        | Instruction bus connects four lanes.                       | Four lanes keep readable 16 px labels; no scaled desktop SVG text.                                                 |
| Masks / 72 s            | First Y13 waits; then only Y13 writes zero.                          | Same lane geometry with actual model masks.                | Same identities and hatching, with the instruction on its own line.                                                |
| NPU / 96 s              | Matching operands meet on a diagonal wavefront.                      | 400 px array with product detail inside cells.             | Separately composed 272 px array; products move to a named selected-cell receipt to keep text readable.            |
| Data delivery / 122 s   | Preparation, transfers, supported operations and result consumption. | One horizontal graph and memory strip.                     | Two graph rows with a connecting step; no claim that every task must traverse all devices.                         |
| Equality / 146 s        | All sixteen outputs match in all three schedules.                    | Three result tiles.                                        | Three compact result tiles preserve their real numbers; the limitation has its own text line.                      |

The shared Showcase clock is the only automatic time source. The film uses chapter-relative progress, so direct seeks reconstruct the same trace state. Pausing disables presentation transitions. Exploration has no animation clock: previous/next events, engine selection, zero and negated input directly alter the model. Selecting an array cell changes the pedagogical focus and names its exact operands. All targets are at least 44 px, and body/diagram text is at least 16 CSS pixels.

## Author self-review and handoff

Key reproducible samples: CPU chapter 1 at progress 0.40 completes Y11=2; GPU chapter 3 at 0.50 masks only Y13, and at 0.90 masks the other three lanes; NPU chapter 4 near 0.45 displays diagonal activity, and at 1.00 has applied ReLU to all sixteen outputs. The array grid has 18% cell width, 24% pitch and centers matching the model/SVG coordinates; its final cell and selection outline fit inside the surface.

Model regressions check every output against independent multiplication, all 64 product identities, positive/negative/zero masks, skewed stream arrival, invalid inputs and immutable replay. Presentation regressions check direct masked seeks, all seven scene views and actual all-zero exploration after changing engines. Boundary tiles include all-zero, negated, identity weights and fractional values.

This is author self-review, not independent visual acceptance. Browser review of both languages at desktop/390/320 px, continuous playback, keyboard/touch, reduced motion, cover entry points, both generated tracks and physical-device performance are integration checks. The renderer requires no per-scene Worker, WebGL or audio resource; common player startup and audio failure behavior still require their own evidence. The packet is a handoff artifact and must be removed after canonical integration.
