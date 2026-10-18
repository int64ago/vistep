# Independent optics review

Reviewer: mechanics scene owner `/root/newton_scene`; author of the six optical groups: root.

## Scope and evidence

Read the six independent models, actual SVG renderers, exploration state, and stated assumptions. No browser, complete-playback or listening review was performed by this worker. Root owns visual acceptance. After identifying issues, root authorized local corrections; checks of those corrections are author self-review.

Thirteen focused tests pass in `src/models/optics-independent-benchmarks.test.ts` and `src/components/experiments/optics-control-state.test.tsx`. Numerical references include separate SI midpoint integrals for the slit and an independent angular-integral definition of J0 for the circular-disk reference. They do not establish appearance or listening quality.

## Corrected findings

- Separate pin and plate observation angles. A 60° pin trial previously remained selected in the plate's 45° maximum control; model clamping to 50° disagreed with the UI and sent rays beyond the frame at n=1.3. Plate angle now starts at25° and remains independent; its outgoing path is recomposed with unchanged physical angle and20px minimum margin at n=1.3/45°.
- White-light slit mode no longer offers an ineffective wavelength control while the model uses fixed650/530/460nm samples.
- Circular aperture and opaque-disk radii now have independent state. Previously the initial0.6mm disk value exceeded the aperture control's0.4mm maximum.
- The weak slit profile retains its fixed-exposure strip, while its curve displays I/Imax and a numerical Imax/I0. This preserves throughput evidence and makes fringe shape visible. Root was asked to update the corresponding MDX sentence.
- The Poisson image has more space below the circular pattern and an explicit radial extent label.
- Returning from exploration to an automatic film restores n=1.5, Brewster-near56.31°, and Lloyd source height0.3mm. Previously normal-incidence exploration could remove the automatic Brewster brightness variation.

## Numerical and geometric findings

- Snell45° air→n1.5 gives28.125505702°; an80mm slab has apparent depth42.761798706mm for the illustrated symmetric45° rays. Both cylindrical water/glass and glass/air tangential wave-vector conditions are checked from actual ray segments.
- n1.5 normal Fresnel reflectance0.04, critical angle41.810314896°. A20mm cork radius in n1.333 gives threshold depth17.628261400mm; exact threshold is hidden as intended.
- Air wedge589nm,80mm plate,40μm paper gives0.2945mm for two sheets and0.589mm for one. Symmetric soap film has half-wave darkness and quarter-wave reflectance0.078271004.
- Double slit589nm/0.18mm/1.2m gives3.926666667mm; six centers at−7.853333333 and11.78mm infer589nm. Sensor pixel averaging agrees with independent physical-unit integration. Lloyd's zero-path-difference limit is dark and local spacing1.178mm.
- Slit fields agree with independent midpoint integration; opaque-disk off-axis intensity agrees with independently integrated angular/radial propagation. The axis has unit incident intensity without an inserted dot. At the extreme800μm/450nm/15mm tail,192-panel versus8192-panel integration differs by1.08e−6 in I/I0 (a weak-tail numerical limit, not a unit defect).
- Brewster56.309932474° gives Rp=0, Rs=0.147928994. Natural light remains0.5 through the analyzer, and the disclosed LCD mixture has extrema0.99/0.01.

No additional major unit or physical-formula defect was found in this bounded review. No claim of exhaustive correctness or visual acceptance is made.

## Reviewed working-tree hashes

- `src/models/geometric-optics-lab.ts`: `b2117aa634b838d66e63ad34c14a78fcf36481c435ef9a071c2c57f72f78a972`
- `src/models/total-reflection-lab.ts`: `176351a9b5d7f76f753f6e0451dda9e9743f4501d6b54e0b2db9e68b96bde5f0`
- `src/models/thin-film-lab.ts`: `d97164f91b70a9f5193384867d12873eb271b4a411f7dc58f7068564e9f401de`
- `src/models/double-slit-measurement-lab.ts`: `25d9f635b7d93b7193cd81f13863401d97b808e45ddda9d155ea1f1e8dc20a1d`
- `src/models/optical-diffraction-lab.ts`: `e0ca94245626c75cb6401da93c9d6533ac7ba7bb571907cc02a9014cb93a7f53`
- `src/models/polarization-evidence-lab.ts`: `a2dc3c7496ede3021c96d44a1d4c1399c90be687e0b22839cd9ea4893f547f9f`
- `src/components/experiments/GeometricOpticsLab.tsx`: `8897c41a3a065be6f9f25da58e0183b41096217fec7cd44752981ec7ba0d9de2`
- `src/components/experiments/TotalReflectionLab.tsx`: `1bbe89e27661df85c77668e65aba1516acdf146a4dbaca29c9d7d49254953f4f`
- `src/components/experiments/ThinFilmLab.tsx`: `92bcf6385296a2b51a6e63aec8c23b4f723606f69363a6b9dc18aea546f532fb`
- `src/components/experiments/DoubleSlitMeasurementLab.tsx`: `f5f857abf5bf3880a8618da18427d3a2130bcd4e6415c603a7f8d9092aa678c9`
- `src/components/experiments/OpticalDiffractionLab.tsx`: `c51e27e71f5ba84fbea89173e7cf4f16961ec2c6383d7c1999dbfa9cd74ad307`
- `src/components/experiments/PolarizationEvidenceLab.tsx`: `3983c46d4aeaf878240d4141f70d8636e904882b64a089e4184481a915b4c47e`
