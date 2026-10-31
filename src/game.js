// Season, economy and save game.
import { TEAMS, DRIVERS, TRACKS, POINTS, PRIZE } from './data.js'

const KEY = 'pitwall-save-v1'
export const STATS = { engine: 'Engine', aero: 'Aerodynamics', rel: 'Reliability', tyre: 'Tyre management' }
export const CRASH_COST = 1.5

export function newGame(teamId) {
  return {
    season: 1, round: 0, player: teamId,
    teams: TEAMS.map(t => ({ ...t, points: 0, rank: TEAMS.indexOf(t) + 1 })),
    drivers: DRIVERS.map(d => ({ ...d, points: 0 })),
    calendar: TRACKS.map(t => t.id),
    results: [], history: [],
  }
}

export const save = g => { try { localStorage.setItem(KEY, JSON.stringify(g)) } catch {} }
export function load() { try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null } }

export const team = (g, id) => g.teams.find(t => t.id === id)
export const track = id => TRACKS.find(t => t.id === id)
export const entries = g => g.drivers.map(d => ({ driver: d, team: team(g, d.team), player: d.team === g.player }))
export const driverStandings = g => [...g.drivers].sort((a, b) => b.points - a.points)
export const teamStandings = g => [...g.teams].sort((a, b) => b.points - a.points)

// Each upgrade point costs more the better the car already is.
export const upgradeCost = v => +(2 + ((v - 50) / 10) ** 2 * 1.2).toFixed(1)
// Sponsors pay per race, more to teams that finished higher last season.
export const sponsor = t => +(3.2 - (t.rank - 1) * 0.2).toFixed(1)

export function buy(g, t, stat) {
  const cost = upgradeCost(t[stat])
  if (t[stat] >= 99 || t.budget < cost) return false
  t.budget = +(t.budget - cost).toFixed(1)
  t[stat]++
  return true
}

// Apply a race classification: points, prize money, crash bills, AI spending.
export function applyResult(g, classification) {
  const income = {}
  classification.forEach((r, i) => {
    const pts = r.out ? 0 : POINTS[i] || 0
    g.drivers.find(d => d.id === r.driverId).points += pts
    const t = team(g, r.teamId)
    t.points += pts
    income[t.id] = (income[t.id] || 0) + PRIZE[i] - (r.crashed ? CRASH_COST : 0)
  })
  for (const t of g.teams) {
    income[t.id] += sponsor(t)
    t.budget = +(t.budget + income[t.id]).toFixed(1)
  }
  g.results.push({ round: g.round, track: g.calendar[g.round], top: classification.slice(0, 3).map(r => r.driverId) })
  g.round++
  delete g.weekend
  for (const t of g.teams) if (t.id !== g.player) aiSpend(g, t)
  save(g)
  return income[g.player]
}

// AI keeps a small reserve and upgrades its weakest areas first.
function aiSpend(g, t) {
  const reserve = 2 + Math.random() * 4
  for (;;) {
    const stat = Object.keys(STATS).sort((a, b) => t[a] - t[b] + (Math.random() - 0.5) * 6)[0]
    if (t.budget - upgradeCost(t[stat]) < reserve || !buy(g, t, stat)) break
  }
}

export const seasonOver = g => g.round >= g.calendar.length

// New regulations pull every car back toward the pack; drivers drift a little.
export function nextSeason(g) {
  const champ = driverStandings(g)[0]
  const ranks = teamStandings(g)
  g.history.push({
    season: g.season, driver: champ.name, team: ranks[0].name,
    playerRank: ranks.findIndex(t => t.id === g.player) + 1,
  })
  ranks.forEach((t, i) => {
    t.rank = i + 1
    for (const s of Object.keys(STATS)) t[s] = Math.round(70 + (t[s] - 70) * 0.8)
    t.points = 0
  })
  for (const d of g.drivers) {
    d.points = 0
    d.pace = Math.max(70, Math.min(97, d.pace + Math.round(Math.random() * 4 - 2)))
  }
  g.season++
  g.round = 0
  g.results = []
  save(g)
}
