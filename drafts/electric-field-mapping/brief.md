# Fragment orientation before field-line diagrams

PEP Required 3 §9.3 pp.15–16. Tracked objects: hair fragments in castor oil. Decisive observation: changing the electrode arrangement changes their local axes. Fragments do not contain arrowheads, move along drawn trajectories, or measure potential. Computed lines, virtual probe and equipotentials are explicitly optional mathematical overlays, not claims about textbook equipment.

Four continuous shots: single positive electrode; opposite pair; like pair with the midpoint cancellation; parallel-plate central region. A shallow overhead oil tray fills the shot. Narrow composition retains the whole tray, with readable legend/readouts outside the SVG rather than miniature labels. The cover uses the same fragment/field model.

Independent model: Coulomb superposition for point sources, ideal central plate field, analytic overdamped induced-dipole rotation. Field traces use midpoint integration; contour segments use the same scalar potential. The screen model uses isotropic world-to-pixel mapping so perpendicular field/equipotential relationships are preserved. Rods do not translate or interact; rod geometry is schematic and electric-source singularities are masked. Plate edge effects are omitted explicitly.

Sources: [OpenStax field lines](https://openstax.org/books/university-physics-volume-2/pages/5-6-electric-field-lines), [dipole torque](https://openstax.org/books/university-physics-volume-2/pages/5-7-electric-dipoles); textbook supplies the actual oil/fragment apparatus.

Independent benchmark: 0.8 nC at 0.10 m produces 719.004143384 N/C and 71.9004143384 V. A central finite difference of potential independently verifies minus-gradient agreement for each arrangement. Boundary counterexample: opposite equal charges have zero potential but nonzero field at midpoint; like equal charges have zero field but positive potential. A zero-field rod retains its initial orientation; reversing E leaves the unoriented rod axis unchanged.

Author verification: 5 numerical tests passed. Packet validation passed (4 contiguous chapters, 96 planned seconds), as did the TSX syntax check. Actual rendered desktop/mobile observation, complete playback and listening remain not run until root integration. No visual acceptance is inferred from these tests.
