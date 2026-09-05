# Reference and design notes

Register: arcade sports game. The pitch is the first screen. Blue/orange team colors, the centered score/clock, compact camera prompt and circular boost display take precedence over ordinary website layout conventions. Dark UI, glow and condensed sports typography are intentional here.

Visual comparison used Rocket League's [official Anniversary Update announcement](https://www.rocketleague.com/news/patch-notes-v1-35-anniversary-update) and its [Champions Field promotional image](https://us-west-2-epicgames.graphassets.com/cmkr1i7c9047e07n0es5291ez/JSoH9lJGTGCRPGrpCCec). It informed the seating tiers, crowd density, flags, roof/floodlight language, cage, colored goal and metal buggy details. The reference capture is local QA evidence under ignored `test-results/`; it is not an application asset.

Octane hitbox dimensions and offsets were checked against [RocketSim's CarConfig.cpp](https://github.com/ZealanL/RocketSim/blob/main/src/Sim/Car/CarConfig/CarConfig.cpp). The implementation maps its longitudinal/lateral/up axes to Three.js negative-Z/X/Y and divides the values by 50. Its rounded collider radius is included in the overall dimensions. This uses public simulation data; it does not make the custom Rapier controller equivalent to RocketSim or Rocket League.

Implementation APIs were checked against [Rapier's rigid-body guide](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/) and [Three.js documentation](https://threejs.org/docs/), with the installed Rapier type declarations used for exact query signatures.

## Iterations

1. Built the playable scene, procedural car, stadium, HUD and core physics loop.
2. Browser rendering exposed washed-out turf and sparse/empty stand structure. Changed illumination, turf material, stadium structure and chase framing.
3. Fixed a non-finite input path when disabling the bot; verified drive/turn/boost/jump/flip scenarios in the browser.
4. Added crowd and corner seating, flags, procedural cloudy night sky, ball panels, goal shockwaves, smoke and camera velocity compensation.
5. Close-up inspection exposed inward-facing body/cockpit triangles. Corrected winding and added body detail/contact shadows.
6. Independent review exposed boost overriding aerial input, pause-button Space interception and missing later-kickoff GO cues. Fixed these and corrected the hitbox offsets against RocketSim. Added regression coverage.
7. Replaced sparse boost particles with short continuous ribbons, bounded their length to keep them in front of the camera, and checked final gameplay/window sizes.

The reference remains substantially richer in mesh detail, textures, lighting and effects. The work is a playable local recreation; an indistinguishable visual match was not achieved.

## Continuation · 2026-09-04

Compared the baseline and refined car at the same front three-quarter camera position, 42° field of view, field position and illumination in the live browser. The cabin now uses planar glass normals and a lower roof; the fenders have formed surfaces instead of round tubes. Split front lamps, twin rear lamps, vents, exhaust rims, rear diffuser and tire shoulders add detail. The first formed-fender pass covered too much tire and was narrowed after rendering. The official promotional image above remains a qualitative silhouette/material reference, not a matched-camera original-game measurement.

Checked handling against RocketSim's [Car.cpp](https://github.com/ZealanL/RocketSim/blob/main/src/Sim/Car/Car.cpp), specifically `_UpdateWheels` and `_UpdateAirTorque`. Boost intentionally sets forward ground throttle, so that behavior was preserved. Opposite pitch suppresses the pitch component of a flip while its lateral component and timing window continue. The implementation maps that axis behavior into the existing angular-velocity controller; it does not reproduce the reference torque solver.

An independent reviewer inspected the new front/rear captures and probed flip cancellation across front, back, side and diagonal inputs at multiple yaw orientations. No blocking regression was found. The car remains too simple and toy-like for Octane parity; stadium geometry, lighting and surface detail remain substantial gaps.
