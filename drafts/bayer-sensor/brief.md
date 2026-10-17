# Bayer sampling

Track one red site at (8,10). Opening retains a generated linear-RGB reference; turn exposes the three measured channels as one sample per site; result estimates green from cardinal neighbors and blue from diagonals. Fine achromatic stripes expose false color and subpixel dependence. 8 chapters × 20 planned seconds.

The model does actual RGGB sampling and nearest-distance bilinear interpolation without looking at hidden reference channels. Measured values are preserved. Boundary neighbors renormalize over valid sites. sRGB encoding applies only at display. Phone uses a single current image or 5×5 neighborhood, with an actual-pixel SVG width; comparison is a spatial split of one complete frame.

Primary sources opened 2026-10-17: Bryce Bayer US3971065A; Malvar, He and Cutler (Microsoft Research) publication. We demonstrate ordinary bilinear interpolation, not their higher-quality algorithm. Author numerical checks do not certify final visual or speech review.
