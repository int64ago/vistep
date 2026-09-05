# Binary addition — production brief

[简体中文](../zh-CN/examples/adder-brief.md)

Part of the [50-scene expansion](../expansion-50.md). The opening is a familiar column addition whose answer needs another place: `1 + 1 = 10₂`. Follow the carry from that extra place into a connected logic circuit, then along an eight-bit word.

Use a warm, lightly textured calculation sheet with aligned place values and copper-colored carry traces. Half- and full-adder views use recognizable gate shapes, visible terminals and junction dots; crossings without dots are not connections. Phone circuits get their own vertical arrangement rather than a miniature desktop diagram. Controls are optional numeric inputs and a signal-progression scrubber.

Eight chapters cover the binary place, half-adder truth cases, incoming carry, four-bit addition, the long `255 + 1` ripple, the ninth output bit, signed versus unsigned overflow, and a final `42 + 19` reconstruction. The clock reveals computed intermediate signals, not just highlighted labels.

The model constructs XOR/AND/OR full adders and links their carry outputs. Signal readiness is an earliest-guaranteed-knowledge teaching model: inputs start known, XOR needs both values, and controlling inputs can determine AND/OR early. Relative delays are XOR=2 and AND/OR=1. Unknown outputs stay unknown. This is not a transistor transient, hazard or measured nanosecond simulation. Signed overflow and carry-out must remain distinct.

Sources: [MIT 6.004 design tradeoffs](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c8/c8s1/), [Computation Structures adder lab](https://computationstructures.org/exercises/adder/lab.html), [Nand2Tetris Boolean arithmetic](https://www.nand2tetris.org/project02). The topic is integrated with a 178.0-second film and recorded Chinese/English narration. Five numerical tests include all 65,536 eight-bit operand pairs, readiness boundaries and signed overflow. Desktop and 320 px review checked aligned arithmetic, vertical phone wiring, unknown outputs, keyboard extremes and stable chapter heights. All 16 chapter/language pairs passed independent ASR (minimum similarity 0.8143); this does not establish vocal naturalness or complete listening. Continuous viewing, broader failure cases and physical-phone performance remain pending.
