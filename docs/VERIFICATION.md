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
