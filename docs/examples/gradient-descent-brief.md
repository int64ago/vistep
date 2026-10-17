# Gradient descent — author brief

Misconceptions: a descending direction guarantees any finite step improves; zigzags always diverge; an approximate endpoint is exact; every loss has a unique global minimum. Prerequisite: coordinates and slope. Distinct from neural-network training: isolate step size and curvature on an analytically solvable fixed objective.

Art direction: sage loss-contour engraving with a continuous identity-preserving path and one warm current point. Geometry derives f=(x²+8y²)/2; equal-unit axes auto-fit the entire case, never clamp points. Dynamic contour levels cover explorer divergence too. Few24-unit SVG tick labels (about16.9px at254/360), native16px state and dark #355640. Plot max400px desktop; phone graph about198px plus compact actual state. Direction arrow is normalized in opening, true displacement in update. Markers fixed userSpace and end before dot clearance.

Sources: [Cornell quadratic convergence](https://www.cs.cornell.edu/courses/cs3780/2025sp/notes/lec10-gd-newton.pdf), [Boyd/Vandenberghe9.3](https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf). Fixed-step analysis, no claim matching exact line search or nonconvex/global training. Eigenvalues1/8 give universal-initialization convergence0<η<.25.

Six shots, planned132s: gradient direction; actual .08 first step; repeated .08 decay; .22 convergent alternating y; .3 divergent y; critical .25 preserves |y|1.5 and loss tends9. Independent closed forms x₀(1−η)^k/y₀(1−8η)^k test all regimes. Four tests also central finite differences, monotonic losses, input boundaries. Main phone-stage budget under400px, complete player740px pending review.

No external resources or independent clock. Author model/MDX checks only; browser, complete watch, bilingual recordings/listening, devices and independent review pending. Computing age12, related neural-network,backpropagation,linear-regression only if registered; actual packet links chosen from current registry. Speech pending keyframes.
