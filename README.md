# Pitwall

A browser racing-team management game. Pick one of 10 fictional teams, develop the car between races, and call the strategy live while the cars (dots) lap top-down tracks.

**Play:** https://andrearufo.github.io/pitwall/

## Features

- 12 fictional circuits (straights and filleted corners; cars brake into corners and accelerate out of them), 12-race seasons, endless careers (new regulations each season pull the field together)
- Races in real time at 1× (laps of 1:16–1:32, ~35 min per race; up to 16×): push / normal / save modes, pit calls, auto-pit strategy
- Soft / Medium / Hard / Inter / Wet tyres with wear, and the two-dry-compound rule (30s penalty)
- Variable weather with forecasts, safety car, mechanical failures, driver errors and crashes
- Simulated qualifying sets the grid
- Budget: sponsor money + prize money, spent on engine, aero, reliability and tyre management upgrades
- Autosave in `localStorage`

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # race engine self-check (runs 36 AI races)
npm run build   # static build in dist/
```

Every push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Code map

- `src/sim.js`: race engine (pure JS, no DOM)
- `src/track.js`: track geometry and canvas drawing
- `src/game.js`: season, economy, save game
- `src/data.js`: teams, drivers, tracks
- `src/components/`: Vue screens (hub, weekend, live race)
