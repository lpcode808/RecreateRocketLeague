# Champions Field · local rocket car soccer

A playable Three.js / Rapier browser game. It opens directly on the pitch, with a five-minute 1v1 against Maverick. The pause menu includes solo practice and a performance graphics setting.

**Continuing development? Read [HANDOFF.md](HANDOFF.md)** for the current baseline, next priorities, known limitations and regression notes.

**Ready to playtest:** follow the [five-minute human test](docs/HUMAN-TEST.md). The latest pass fixes a defensive bot stall, pause-menu Tab navigation and camera containment, and adds recessed goal tunnels and end-bowl floodlights.

## Run

Requires Node 20.19+ or 22.12+ and pnpm 10.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev --port 5173
```

Open **http://127.0.0.1:5173/**. Click the game or press a key to enable sound. Keep the browser tab active; leaving it pauses the match.

```sh
pnpm test     # deterministic match and real Rapier physics tests
pnpm build    # production files in dist/
pnpm preview  # serve the production build locally
```

## GitHub Pages

The public game is hosted at https://lpcode808.github.io/RecreateRocketLeague/.
Pages uses **GitHub Actions** as its source. `.github/workflows/pages.yml` tests and builds each push to `main`, then deploys only `dist/`. `vite.config.js` sets the repository asset prefix in Actions while preserving `/` for local development. Do not switch Pages back to serving the source branch directly.

## Controls

**Phone / tablet:** rotate to landscape. The match starts paused, with Performance graphics selected. Drag the left stick up/down to drive/reverse and sideways to steer; in the air it controls pitch/yaw. Hold BOOST, hold JUMP for height, then release and tap JUMP again for a second jump or directional flip. DRIFT and ROLL buttons handle powerslides and air roll. Camera and unlimited boost are tappable; the pause menu includes Recover Car and full instructions. Turning upright or leaving the page pauses play and clears held input. Return to landscape and tap Resume.

**Desktop:** keyboard bindings and High graphics default are preserved. Touch controls appear for coarse-pointer devices, or when a touch is detected on a hybrid computer.

| Key | Action |
| --- | --- |
| WASD / arrows | Drive and steer; pitch and yaw while airborne |
| Space | Jump; hold for extra height; tap again for double jump |
| Direction + second Space | Directional flip |
| Shift | Boost |
| **B** | **Toggle infinite boost** |
| Q / E | Air roll |
| Ctrl | Powerslide |
| C | Chase camera / ball camera |
| R | Recover car at kickoff position |
| Esc / P | Pause / resume |
| H | Open controls |
| M | Mute / unmute |

Land all four wheels on the ball to restore a flip. Space rights an overturned car. Full boost pads refill to 100 and return after 10 seconds; small pads add 12 and return after 4 seconds. Supersonic car impacts can demolish the opponent, who respawns after 3 seconds.

Hold opposite pitch during a directional flip to cancel its pitch rotation; a diagonal flip retains its lateral rotation. This is a custom approximation of the mechanic.

## What is implemented

- Dynamic Rapier car and ball bodies, continuous collision detection, four suspension rays, lateral tire grip, curved floor-to-wall transitions, rounded arena corners, ceiling and goal colliders.
- Ground acceleration, powerslides, boost, held jumps, double jumps, directional flips, local-axis aerial controls, wheel-contact flip resets, self-righting, bumping and demolitions.
- Full-ball goal crossing, goal celebration and explosion, kickoff reset and countdown, match clock, zero-second airborne continuation, sudden-death overtime and restart.
- A beatable bot that approaches behind the ball, drives around it when on the wrong side, boosts, makes short jumps and self-rights.
- Procedural Octane-inspired body, exposed tires, fenders, spoiler, cockpit, headlights, exhausts and animated wheels. The hitbox uses the Octane dimensions and offsets published in RocketSim, scaled to this world.
- Champions Field-inspired seating bowls, crowd instances, banners, floodlights, roof structures, turf markings, transparent cage, colored goals, 34 boost pads and a trophy silhouette.
- Chase/ball cameras with velocity compensation, boost ribbons, particles, fast-ball smoke, goal shockwaves, engine and event sounds, HUD, pause controls, graphics quality and window resizing.

## Accuracy and limits

This is a procedural recreation, **not a visually identical copy or a physics-equivalent replacement for Rocket League**. The car, stadium, ball surface, trophy and effects are newly constructed approximations. No original 3D models, game textures, engine code or audio are bundled.

The world uses 50 source game units per scene unit. Gravity, speed caps, jump impulse, boost use and arena proportions are modeled on the original's conventions; the suspension solver, tire grip, collision assistance, dodge behavior, camera and bot are custom implementations. Advanced mechanics are present, but exact flip-cancel timing, reset contact margins, tackling/demolition rules and competitive aerial feel have not been matched against instrumented original-game recordings.

Keyboard and landscape touch play are supported. Touch behavior has been checked in Chrome mobile emulation; real-phone ergonomics, Safari behavior and sustained mobile performance still need device testing. Gamepads, multiplayer, replays and car customization are not included. Fonts load from Google Fonts, with local fallbacks when offline. Graphics require WebGL2.

## Source layout

`src/main.js` owns the fixed-step loop and integration. `physics.js`, `controls.js`, `match.js`, `ui.js`, `render.js`, `effects.js`, `assets.js`, and `arena.js` separate the simulation, input, rules and presentation. `arena-geometry.js` shares corner geometry between rendering and collision. Constants and boost-pad locations live in `config.js`.

Development builds expose `window.__game` for reproducible test scenarios. Production builds omit it. See [verification notes](docs/VERIFICATION.md) for what was exercised and [references](docs/REFERENCES.md) for comparison sources.

Dependencies are pinned in `pnpm-lock.yaml`; installation scripts are disabled. Vite and esbuild were updated during verification to clear the dependency audit. Rapier 0.19 emits one upstream WASM initialization deprecation warning; it does not prevent initialization or play. The production bundle contains Rapier's embedded WASM and is about 0.98 MB gzipped; Vite reports the expected large-chunk warning.
