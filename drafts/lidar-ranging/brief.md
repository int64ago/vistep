# Lidar ranging

Track one ray and the first cylinder hit. Opening: outbound pulse. Turn: round-trip delay plus known angle becomes Cartesian coordinates. Result: scanning, angular density, first-return occlusion, radial timing jitter and weak-return dropout. Eight causal chapters × 20 planned seconds.

Analytic segment/ray and circle/ray intersections select the nearest positive hit. No painted point clouds or hidden back-wall points. Noise uses a fixed Box–Muller seed per beam index, so direct seeking preserves identities. Threshold strength proportional to reflectivity × incidence / range² is explicitly a teaching model, not calibrated radiometry or detection probability. A single horizontal 2D slice is disclosed. Desktop uses a landscape room; phone rotates the world projection 90° into a portrait room without changing coordinates or shrinking labels.

Primary sources actually opened 2026-10-17: Ouster lidar fundamentals and firmware-3.2 coordinate documentation. Real sensor offsets and calibration are outside this point-source planar model. Source/model checks do not establish physical-phone performance or spoken delivery.
