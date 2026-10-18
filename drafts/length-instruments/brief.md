# Contact before digits

Textbook: Required3 §11.3 pp.62–65 and Required1 p124. Three genuinely distinct paths: vernier external/internal jaws, micrometer screw/sleeve/thimble/contact, and ruler plus tightly wound copper wire. The same apparatus geometry drives scale position and readout. Every curriculum variant has a contiguous chapter range, and exploration initializes by variant.

Decisive observations: seventh vernier alignment gives the fractional 0.7mm; the micrometer sleeve's6.5mm mark is exposed but7.0mm is occluded by the thimble edge; ten turns make a ruler span ten times larger. Thin specimens get a separate contact magnification instead of enlarged fake thickness. Narrow views keep complete apparatus and move all explanatory text/readout arithmetic into CSS. Scale numbers use a separately enlarged view.

Model: vernier pitch (N−1)/N mm, 0.5mm screw lead and50 divisions, rigid nonpenetrating contact, captured zero correction; accumulation uses N tightly packed circular sections and an explicit total-span error bound. Coil helix angle and deformation are omitted; the illustration emphasizes axial sections. A positive zero error is explored; this is not a hardware calibration tutorial.

Independent benchmarks reproduce the textbook23.7mm and6.725mm examples. Boundary checks cover fractional carry at10mm, contact saturation, zero correction, and gap-induced accumulation bias. Five target tests passed. Packet validation passed (7 contiguous chapters, 176 planned seconds), and TSX syntax check passed. No actual rendered desktop/mobile, full-watch or listening acceptance claimed; root owns those after integration.

Sources: local textbook plus Mitutoyo official caliper and micrometer quick guides (URLs in packet). Reading precision and physical accuracy are explicitly distinguished.
