# Verification · 2026-09-04

## Initial build: automated simulation tests

`pnpm test`: **13 passing tests**, using real Rapier simulation and Node's test runner.

- Full ball crosses the correct goal plane; incomplete crossings and shots outside the opening do not score.
- Goals count once, freeze the clock, reset and return through kickoff.
- Zero time waits for a landing, tied games enter overtime and the next goal wins.
- Pad configuration contains 34 pads, including six large ones.
- Suspension settles; driving, steering, boosting and boost drain produce bounded motion.
- Single/held jump, directional second jump and completed flip.
- Car-ball impact and side-wall rebound.
- Curved-ramp transition onto a vertical wall.
- Missing optional input fields do not introduce NaNs.
- Four wheel contacts restore an aerial flip, which can then be used.
- Jump self-rights a roof-down car.
- Boost neither forces aerial pitch nor converts a neutral double jump into a forward flip.
- GO appears after later kickoffs, not only the opening kickoff.

## Browser checks

Real browser rendering and Playwright keyboard events at `http://127.0.0.1:5173/` confirmed:

- Nonblank WebGL canvas, stadium, car, ball, HUD and camera.
- W/Shift driving, steering, B infinite boost, Space jump and directional flip, C camera toggle and R recovery.
- P freezes the simulation clock and opens the menu; Escape resumes. Focused Resume can be activated with Space.
- A ball launched through the goal increments the score, shows the explosion/text, resets car/ball and returns to play after the countdown.
- Large pad pickup changes empty boost to 100; ordinary boosting drains boost; infinite boost stays at 100.
- Wall driving and ceiling bounds remain finite in scripted scenarios.
- Layouts at 1440×900, 1366×768, 800×600 and 390×844 fit the viewport without page overflow. Small-screen layout is not touch-play support.
- No browser console errors on the final runtime. One upstream Rapier initialization deprecation warning remains.

The final 1440×900 keyboard-driven sample measured approximately **53 fps** on this machine/browser (an earlier sample measured 56 fps). This is a short local measurement, not a device-wide performance guarantee.

A deterministic 120-second driving/jumping/wall scenario produced no non-finite car positions. A separate 60-second bot scenario moved the ball and scored against a stationary player. These accelerated simulations check stability; they are not substitutes for a human five-minute play session.

## Build and dependencies

- `pnpm build` succeeds with the embedded-WASM bundle-size warning.
- `pnpm audit` reports zero advisories after updating Vite to 7.3.5 and overriding esbuild to 0.28.1.
- Pinned releases were checked against npm publication dates; install scripts were disabled.

## Local screenshots

The ignored `test-results/` directory holds iteration screenshots, close-up car checks, the official reference capture, viewport checks, `goal-celebration.png`, and `final-gameplay.png`. These are test evidence, not runtime assets.

Exact original-game appearance, original-engine physics parity, competitive mechanic timing, extended human play, touch input, gamepads and cross-browser/device performance remain unverified.

## Continuation checks · 2026-09-04

- **14/14 tests pass** after adding diagonal pitch-cancel coverage and extending roof recovery to check stale flip-input cleanup. An independent reviewer also probed forward, backward, side and diagonal flips at multiple yaw orientations.
- **Production build passes**; `git diff --check` is clean. The current JavaScript bundle is 988.48 kB gzipped. The embedded-WASM chunk warning remains. Dependencies were unchanged; the initial audit above was not rerun.
- Matched front views of the old and new car and a new rear view were inspected in the Codex in-app browser. Fixed parts are combined by material: **228 → 37 meshes per car**, including hidden flame meshes; **25,188 → 46,092 triangles**. These are construction counts, not frame-rate measurements. Four wheel pivots and their independently rotating wheel groups remain intact.
- A browser scenario dispatched W/Shift/D/Space/S keyboard events to the canvas, covering driving, boost, steering, jumping, a directional second jump and opposite pitch. It reached the side wall with finite position and rotation, 100 infinite boost and two consumed jumps. These were synthetic events, separate from the native key checks below.
- Native B/C/R/P keys changed infinite boost, camera mode, recovery and pause state. Space activated the focused Resume button. Live gameplay/goal-reset sequences rendered at **1440×900** and **1366×768**; the settled laptop canvas matched the viewport with no horizontal document overflow.
- An accelerated scripted full match reached `finished`, clock 0, score **0–32**, with finite player positions throughout. The driving script loops without aiming at the ball; the result checks goal/reset/clock completion, not bot balance or human playability. It is not a human five-minute play session.
- No console errors on the final ordinary game page. The upstream Rapier initialization warning remains. An early local QA script dispatched synthetic events to `document` instead of the canvas and produced harness errors; the corrected sequence targeted the canvas.
- Independent review found no blocking source or visual regression and judged the car visibly improved. It did not establish original-game parity or sustained frame-rate performance. No new sustained FPS claim is made.

New ignored evidence: `continuation-baseline-front.png`, `continuation-car-front.png`, `continuation-car-rear.png`, `continuation-gameplay-1440.png`, `continuation-gameplay-1366.png`, `continuation-driving.txt` and `continuation-match.txt` under `test-results/`. The local `inspect.html`/`inspect.js` harness and baseline asset snapshot are also ignored and are not production entry points.

## Final pre-human-test pass · 2026-09-04

- **21/21 tests pass**, including a real Rapier defensive bot-stall regression, rounded-corner/goal camera bounds, exact half-turn heading convergence, and pause-menu keyboard defaults. Production build passes with the existing embedded-WASM chunk warning; `git diff --check` passes. Dependencies were unchanged.
- Reproduced Maverick parking against its own goal back wall with the ball deep in its half. Bounding its approach target keeps the tested bot on-field and advances the ball within 12 simulated seconds.
- Camera containment applies before smoothing and after smoothing/shake. Aerial views above the goal roof stay field-side at their original altitude. Browser placement of an exact 180° yaw exposed a normalized-vector interpolation deadlock; wrapped-angle interpolation fixes it. Frozen corner and aerial backboard views were inspected after the fix. Very close wall views can still crop the lower car; human camera-feel evaluation remains open.
- Fixed-view goal comparison showed the new recessed tunnel, frame, repeating ribs and lights. Removed the cage across the goal mouth, reduced cage opacity, and added end-bowl floodlights. Static opaque architecture is batched by shared material; transparent surfaces and animated pads remain separate. No before/after draw-call or FPS improvement claim is made.
- A rendered scripted driving sample at **1440×900, High graphics**, in the Codex in-app browser recorded **59.9 mean fps** and **18.2 ms p95 frame interval**, with no captured errors. The harness requested at least 30 seconds and recorded 2,254 frame intervals (about 37.6 seconds by their sum). This is a short local sample, not sustained five-minute/device coverage; it preceded the final heading/altitude repairs.
- A separate accelerated full-match scenario reached `finished`, time 0, score **0–31**, after 60,250 simulation ticks. Player position stayed finite and no errors were captured. The scripted player loops without aiming; the score is lifecycle evidence, not bot balance or human play.
- On the ordinary game page, native **P → Tab** moved focus from Resume to Restart; **Shift-Tab → Space** resumed. Native **B/C/R** visibly changed infinite boost, camera mode and recovery feedback. Menu selection of Performance and Solo practice worked; the timed solo HUD now says **PRACTICE** rather than FREE PLAY.
- Inspected **1440×900 High** and **1366×768 Performance** renders. Laptop document width equaled the viewport (no horizontal overflow). A launched goal scenario scored 1–0 and displayed YOU SCORED. No final browser console errors; Rapier's known initialization warning remains.
- Independent final reviewer reported **no blocker for human playtesting** after the camera repairs. This does not establish original-game visual/physics parity, human handling quality, bot difficulty, cross-browser support or competitive mechanic fidelity.

New local ignored evidence: `preflight-gameplay-1440.png`, `preflight-gameplay-1366.png`, `preflight-goal-detail.png`, `preflight-backboard-final.png`, `preflight-corner-final.png`, and `preflight-match.json` in `test-results/`. `preflight.html`/`preflight.js` are local scenario controls and are not production entry points. Human test instructions are tracked source in [HUMAN-TEST.md](HUMAN-TEST.md).

## Landscape touch controls — 2026-09-04

This pass supersedes the older keyboard-only limitation above. Added an analog driving stick, simultaneous hold controls for boost/jump/drift/air roll, landscape guidance, safe-area-aware HUD and scrollable touch instructions/recovery. Desktop uses the same keyboard bindings and High graphics default; initial touch devices use Performance. The composer now follows the selected pixel ratio as well as the renderer.

- 23 Node tests pass, including analog dead zone/bounds, keyboard/touch composition, jump edges and reset clearing; production build passes.
- Isolated installed Chrome with mobile emulation exercised simultaneous stick/boost/jump through browser touch events, selective jump release, pointer cancellation, portrait pause and frozen match clock, landscape return with deliberate resume, and desktop B/P/Space controls. No page errors were reported.
- Inspected rendered screenshots at 844×390, 667×375, 568×320, 1024×768 and portrait 390×844; desktop regression capture at 1440×900. Local ignored evidence and repeatable browser harness: `test-results/mobile-*.png`, `test-results/mobile-qa.mjs`.
- Not verified: physical multi-thumb comfort, iOS Safari/Android browser behavior, display-cutout hardware or sustained phone FPS. Browser emulation is not real-device validation. Existing Rapier initialization and large-bundle warnings remain.
