// Self-check: run full AI races on every track and assert the race invariants.
// Run with `npm test`.
import assert from 'node:assert/strict'
import { TEAMS, DRIVERS, TRACKS } from './data.js'
import { createRace, advance, genWeather, qualify, classify, TIME_SCALE } from './sim.js'
import { geometry } from './track.js'

const entries = DRIVERS.map(d => ({ driver: d, team: TEAMS.find(t => t.id === d.team) }))
let dnf = 0, stops = 0, minutes = 0, wins = {}
const runs = 3

for (const track of TRACKS) {
  const g = geometry(track)
  assert.equal(g.pts.length, 1000)
  assert.ok(Math.abs(g.time[1000] - 1) < 1e-9, 'time table normalised')
  assert.ok(Math.min(...g.speed) < Math.max(...g.speed) * 0.6, `${track.name}: cars slow down in corners`)

  for (let r = 0; r < runs; r++) {
    const weather = genWeather(track)
    const grid = qualify(track, entries, weather.quali)
    const race = createRace(track, grid, weather)
    advance(race, 60 * 60 * 3)
    assert.ok(race.over, `${track.name}: race ended`)
    const res = classify(race)
    assert.equal(res.length, 20)
    assert.equal(new Set(res.map(r => r.driverId)).size, 20)
    assert.ok(!res[0].out, 'winner finished')
    assert.ok(res.every((r, i) => r.pos === i + 1))
    const finished = race.cars.filter(c => !c.out)
    assert.ok(finished.every(c => c.dist <= track.laps && c.dist >= track.laps - 3), 'finishers near full distance')
    dnf += 20 - finished.length
    stops += finished.reduce((s, c) => s + c.stops, 0) / finished.length
    minutes += race.time / TIME_SCALE / 60
    wins[res[0].teamId] = (wins[res[0].teamId] || 0) + 1
  }
}
const n = TRACKS.length * runs
console.log(`ok · ${n} races · avg DNF ${(dnf / n).toFixed(1)} · avg stops ${(stops / n).toFixed(2)} · avg ${(minutes / n).toFixed(1)} min at 1x`)
console.log('wins by team', wins)
