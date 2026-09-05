# Continuation handoff · 2026-09-04

## Start here

Continue improving the existing game. The user wants a convincing Rocket League recreation, especially the Octane car, Champions Field, handling, aerial mechanics and small effects. The current build is playable and tested, but **the requested near-identical appearance and original-game physics fidelity have not been achieved**. Do not treat the passing tests as evidence that the creative brief is complete.

Read this file, [README.md](README.md), [docs/REFERENCES.md](docs/REFERENCES.md), and [docs/VERIFICATION.md](docs/VERIFICATION.md). Inspect the actual running game and available local screenshots before choosing changes. For a local checkout under Justin's Coding directory, follow its shared AGENTS.md/CLAUDE.md instructions and current planning context as well.

## User intent and authorization

- Open directly into the game, with no marketing page or separate start screen.
- Keep Three.js, a real physics engine, a clean separation of responsibilities, and a locally runnable browser build.
- Prioritize responsive handling, readable cameras, believable ball impact, detailed Octane/Champions Field visuals, goal feedback and a five-minute experience worth playing.
- Retain **B to toggle infinite boost**, WASD/arrows, Space, Shift, R, C and Esc/P.
- The user explicitly asked for reference comparison and repeated render/play/fix cycles. They prefer continued improvement over a quick shell and did not impose a deadline.
- On the follow-up, the user said **“Yes approve and make handoff doc for fresh agent to continue”** in response to approval to publish the source, lockfile, tests and documentation to the public GitHub repository. That approves this initial publication including this handoff. It is not blanket approval for unrelated future deployments or changes to other projects.

The separate GitHub setup task initialized the repository. Its task ID is `01a06fb1-682c-75b1-a3a3-54b60aa618c6`; this build task is `01a06f9c-c01a-70e2-ba11-b23e3ab7533d`. The build task took ownership of the initial commit/push because the explicit user approval is recorded here and the other task's execution gate could not accept cross-task approval. Repository: [lpcode808/RecreateRocketLeague](https://github.com/lpcode808/RecreateRocketLeague). Check current Git state rather than assuming publication has already completed. Do not race another task's Git writes.

## Run and inspect

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev --port 5173
pnpm test
pnpm build
```

Local URL: **http://127.0.0.1:5173/**. A server was left running at handoff time; check before starting another. Stack: modern JavaScript, Vite 7.3.5, Three.js 0.180.0, Rapier compat 0.19.0. Node 20.19+ or 22.12+, pnpm 10. No TypeScript or framework migration is needed.

Audio starts on a user gesture. Losing browser/window focus pauses the game, which also affects automation. The pause menu selects 1v1 or solo practice and high/performance graphics. Solo practice currently retains timed match rules; it is not Rocket League's full free-play training system.

Development builds expose `window.__game` with `physics`, `render`, `match`, `settings`, `controls`, `reset`, `action`, `simulate`, and `snapshot`. Production builds omit this interface. Use it to place reproducible scenarios, then exercise ordinary keyboard input too. To run deterministic simulation without the animation loop advancing it, set `settings.paused = true` directly; calling `action('pause')` also opens the menu. `simulate(input)` advances one 1/120-second tick. It respects the current match phase, so set `match.phase = 'playing'` for an immediate scenario. Changing settings directly is test setup, not UI verification.

## Architecture and conventions

| File | Responsibility |
| --- | --- |
| `src/main.js` | Fixed-step simulation, input buffering, pad pickups, mode state, integration and event effects |
| `src/physics.js` | Rapier arena/car/ball bodies, wheel raycasts, traction, jumping/flips, impact assistance, demolitions and bot decisions |
| `src/config.js` | World constants, timing, colors and 34 pad locations |
| `src/match.js` | Pure match state, scoring, clock, kickoff, overtime and winner |
| `src/controls.js` | Keyboard state, one-shot actions, jump edge and blur handling |
| `src/render.js` | Renderer, lights, camera, model synchronization, shadows, boost ribbons and postprocessing |
| `src/assets.js` | Procedural car and paneled ball, geometry/material/texture helpers |
| `src/arena.js` | Stadium, turf, seating/crowd instances, goals, pads and surrounding decoration |
| `src/arena-geometry.js` | Corner ramp samples shared by collision and rendering |
| `src/effects.js` | Pooled particles, ball smoke, goal shockwaves and synthesized audio |
| `src/ui.js`, `src/style.css` | HUD, pause panel, controls, messages and responsive styling |
| `tests/game.test.js` | 13 deterministic Node/Rapier regression tests |

World axes: Y up; player car points toward negative Z at kickoff. Blue starts at positive Z and scores through the negative-Z orange goal. Orange is the reverse. Source simulation units are divided by **50** for scene coordinates; speed HUD conversion is scene speed × 1.8 for km/h. Physics uses a fixed 120 Hz timestep.

The car hitbox dimensions and forward/vertical offsets were checked against RocketSim's public Octane config. The rounded-cuboid radius is included in its overall extents. This does **not** mean the custom suspension and controller reproduce RocketSim or Rocket League. Visual wheels and the body mesh are separate from the standard box hitbox.

## Working baseline

Implemented: 1v1 bot and solo practice; physical ball/car impacts; side, back, goal and ceiling bounds; floor-to-wall and corner ramps; suspension and lateral grip; boost drain/refill/infinite mode; held jump, double jump, directional dodge, pitch/yaw/roll, four-wheel ball flip resets and self-righting; bumps/demolitions; full-ball goal crossing; score, clock, kickoff resets, overtime and restart; chase/ball camera; procedural stadium/car/ball; boost ribbons, fast-ball smoke, explosion/shockwave feedback; engine/event audio; HUD and pause/settings controls.

Last checked in this build session:

- 13/13 automated tests pass; production build succeeds.
- Actual browser controls, canvas, goal celebration/reset, pad refill, infinite boost and menu keyboard activation were exercised.
- No final browser console errors. Rapier emits one upstream initialization deprecation warning.
- `pnpm audit` reports zero advisories. Scripts were disabled; versions were checked for age. esbuild 0.28.1 is deliberately pinned through a pnpm override to clear a dependency advisory.
- Final short 1440×900 keyboard-driven sample measured about 53 fps on this machine. Do not generalize this to other devices or call it a sustained benchmark.
- 120 seconds of accelerated driving/jump/wall simulation remained finite. A separate 60-second bot simulation scored against an idle player. No human five-minute play session was completed.

The build's approximately 0.98 MB gzipped JavaScript includes embedded Rapier WASM; Vite reports a large-chunk warning. Optional Google Fonts requests have local fallbacks. No original game models, textures or audio are bundled.

## Highest-value continuation

1. **Play a full match and record handling failures.** Check low/high-speed turn radius, braking/reverse, powerslide exits, first-touch ball power, aerial steering while boosting, wall exits, roof landings, repeated flip resets and camera behavior near posts/corners. Add regression tests for specific reproduced failures. Do not randomly retune several physics constants at once.
2. **Make a controlled original-versus-recreation visual comparison.** Match viewpoint, approximate car pose, field position and framing. Inspect silhouette/materials at close range and the full scene at 1440×900 and a laptop viewport. The current car is a recognizable procedural buggy, not a legitimate Octane mesh; the stadium remains coarse, with simplified roofs, stands, goal architecture, trophy, field material and lighting. Prioritize the largest visible gap rather than adding unrelated decorative effects.
3. **Improve the highest-impact assets and illumination.** Refine car proportions, panel topology, wheel/fender relationships, material roughness and surface details. Refine Champions Field's geometry, turf texture, crowd density and floodlight presentation. Current sharp boost ribbons, simple smoke, synthesized sound and radial goal particles still need artistic work. Preserve the working HUD hierarchy and visible ball/car contrast.
4. **Measure advanced-mechanic fidelity.** Current flip timing/cancellation, reset margins, jump hold behavior, impact assistance, traction and demo conditions are custom approximations. Use public simulation data or instrumented reference recordings to distinguish a real mismatch from taste. Improve one mechanic with a repeatable scenario before claiming original-game accuracy.
5. **Reassess the bot after handling changes.** It approaches behind the ball, circles from the wrong side, occasionally boosts/jumps and self-rights. It lacks sophisticated defense, boost routing, aerial play and competitive strategy. It should remain beatable, but avoid long dead periods or obvious own-goal behavior.

Touch controls, gamepads, multiplayer, replays and customization are absent. They are lower priority than the requested asset/handling fidelity unless the user redirects the task.

## Bugs already fixed—avoid regressions

- Disabled-bot input omitted optional axes and could introduce NaNs into Rapier. Input defaults now cover every axis/action.
- Car hull and cockpit faces had reversed winding. The fix is in `hull()`; do not remove it when changing topology.
- Uncompensated camera smoothing made the car shrink at speed because the camera lagged too far behind. Velocity anticipation now compensates for this.
- Boost used to overwrite the shared throttle axis, forcing air pitch and unintended forward flips. Ground propulsion now uses a separate `driveThrottle`; aerial/flip intent uses the original input.
- A flip reset obtained immediately after a test placement was mistaken for a ground/coyote jump. `hasFlipReset` distinguishes the restored aerial capability.
- Space was prevented globally and could not activate focused pause buttons. Menu keyboard defaults now pass through.
- GO text was tied to the opening clock value and missing after later kickoffs. `Match.goTime` now owns the cue.
- Score must increment only once per goal; do not reintroduce polling-based repeated scores or a center-only goal test.
- Hold jump input until a physics tick consumes it; rendering can run faster than 120 Hz.

## Evidence and next handoff

Local, ignored `test-results/` contains `final-gameplay.png`, `goal-celebration.png`, `car-detail-fixed.png`, `iteration-04-stadium.png`, viewport captures and `official-reference.png`. These files will **not** exist in a fresh remote clone. Reference URLs and iteration findings are preserved in `docs/REFERENCES.md`; take fresh screenshots when local evidence is unavailable. Do not force-add third-party reference captures to the public repository.

Keep source, lockfile, tests and docs reproducible. Run relevant tests after changes, inspect real rendered output, record exact evidence and remaining gaps, and update the verification/handoff documents. Use an independent reviewer for the final quality judgment when the applicable workspace instructions authorize it. A passing build alone does not establish playability, camera quality, visual fidelity or original-game parity.

Suggested fresh-agent kickoff:

> Read HANDOFF.md and the linked docs. Continue improving this existing Rocket League recreation toward the user's original visual and gameplay bar. Start by running the game and comparing the actual pixels and handling to the references. Preserve working controls, physics and match rules. Choose the largest evidenced gap, implement a focused improvement, test it in the browser, and iterate. Report what improved and what remains an approximation; do not describe this baseline as an indistinguishable match.
