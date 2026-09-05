# Verification · 2026-09-04

## Automated simulation tests

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
