// Race engine. Distances are in laps (car.dist = completed laps + lap fraction),
// times in race seconds. Pure logic, no DOM: the Race view just calls advance().
export const TIME_SCALE = 4.8 // race seconds per real second at 1x
const DT = 0.25

export const COMPOUNDS = {
  S: { name: 'Soft', color: '#ef4444', pace: -0.9, wear: 5.5, dry: true },
  M: { name: 'Medium', color: '#facc15', pace: 0, wear: 3.6, dry: true },
  H: { name: 'Hard', color: '#e5e7eb', pace: 0.7, wear: 2.4, dry: true },
  I: { name: 'Inter', color: '#22c55e', pace: 0, wear: 3, dry: false },
  W: { name: 'Wet', color: '#3b82f6', pace: 0, wear: 2.5, dry: false },
}

export const MODES = {
  push: { pace: -0.35, wear: 1.45, err: 2 },
  normal: { pace: 0, wear: 1, err: 1 },
  save: { pace: 0.5, wear: 0.7, err: 0.6 },
}

const rand = (a, b) => a + Math.random() * (b - a)
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2

// Time lost on a compound at track wetness w (0 dry .. 1 flooded).
function wetDelta(c, w) {
  if (c === 'I') return 2.5 + 15 * Math.max(0, w - 0.6)
  if (c === 'W') return 4.5 + 10 * Math.max(0, 0.6 - w)
  return 30 * w ** 1.2
}

export const idealWet = w => (w > 0.65 ? 'W' : w > 0.15 ? 'I' : null)

export function basePace(track, team, driver, tyre, wet) {
  const perf = team.engine * track.power + team.aero * (1 - track.power)
  return track.base + wet * 8 + (90 - perf) * 0.08 + (90 - driver.pace) * 0.05 * (1 + wet)
    + COMPOUNDS[tyre].pace + wetDelta(tyre, wet)
}

export function wearRate(race, car, c = car.tyre) {
  const w = race.wet
  const overheat = (c === 'I' && w < 0.15) || (c === 'W' && w < 0.35) ? 3 : 1
  return COMPOUNDS[c].wear * race.track.wear * (1.25 - car.team.tyre / 200) * MODES[car.mode].wear * overheat
}

function lapTime(race, car) {
  if (race.sc) return race.track.base * 1.4
  return basePace(race.track, car.team, car.driver, car.tyre, race.wet)
    + 0.02 * car.wear + Math.max(0, car.wear - 70) ** 2 * 0.01
    + MODES[car.mode].pace
    + 0.03 * Math.max(0, race.laps - car.dist) // fuel load
    + car.noise
}

export function genWeather(track) {
  const segs = []
  if (Math.random() < track.rain) {
    const from = Math.floor(rand(0, track.laps * 0.8))
    segs.push({ from, to: Math.min(track.laps + 1, from + Math.floor(rand(3, 13))), intensity: rand(0.4, 1) })
  }
  const fuzz = () => Math.round(rand(-2, 2))
  return {
    segs,
    forecast: segs.map(s => ({ from: Math.max(0, s.from + fuzz()), to: s.to + fuzz(), heavy: s.intensity > 0.7 })),
    start: segs[0]?.from === 0 ? segs[0].intensity * 0.8 : 0,
    quali: Math.random() < track.rain * 0.5 ? rand(0.3, 0.9) : 0,
  }
}

export function qualify(track, entries, wet) {
  const tyre = idealWet(wet) || 'S'
  return entries
    .map(e => ({
      ...e,
      time: basePace(track, e.team, e.driver, tyre, wet) + gauss() * (0.1 + (100 - e.driver.cons) * 0.006)
        + (Math.random() < 0.03 * (1 + wet * 2) ? rand(1.5, 4) : 0),
    }))
    .sort((a, b) => a.time - b.time)
}

// Plan pit laps up front: one stop around mid-race, two on high-wear tracks.
function plan(track) {
  if (track.wear >= 1.1 && Math.random() < 0.5) return [Math.round(track.laps * rand(0.28, 0.38)), Math.round(track.laps * rand(0.6, 0.7))]
  return [Math.round(track.laps * rand(0.4, 0.6))]
}

// grid: [{ driver, team, player, tyre? }] in starting order.
export function createRace(track, grid, weather) {
  const race = {
    track, laps: track.laps, time: 0, wet: weather.start, rainNow: weather.start ? 1 : 0, segs: weather.segs,
    sc: null, log: [], finished: false, over: false, fastest: null,
  }
  race.cars = grid.map((e, i) => {
    const stops = plan(track)
    const tyre = e.tyre || idealWet(race.wet) || (stops.length > 1 || Math.random() < 0.3 ? 'S' : 'M')
    return {
      ...e, id: e.driver.id, grid: i + 1, dist: -0.002 - i * 0.003, tyre, used: [tyre], wear: 0, mode: 'normal',
      pit: null, pitTimer: 0, stops: 0, plan: stops, auto: true, stall: rand(0, 0.5) + (Math.random() < 0.05 ? 1.5 : 0),
      out: null, finishTime: null, lapStart: 0, lastLap: null, bestLap: null, noise: 0, lt: track.base, penalty: 0, crashed: false,
    }
  })
  return race
}

export const standings = race =>
  [...race.cars].sort((a, b) => !!a.out - !!b.out || b.dist - a.dist || (a.finishTime ?? 0) + a.penalty - (b.finishTime ?? 0) - b.penalty)

const leaderOf = race => standings(race)[0]
export const currentLap = race => Math.min(race.laps, Math.max(1, Math.floor(leaderOf(race).dist) + 1))

function log(race, msg, car) {
  race.log.unshift({ lap: currentLap(race), msg, player: !!car?.player })
  race.log.length = Math.min(race.log.length, 60)
}

export function advance(race, seconds) {
  for (let t = 0; t < seconds && !race.over; t += DT) tick(race)
}

function tick(race) {
  race.time += DT
  const order = standings(race)
  const leader = order[0]
  const done = Math.max(0, Math.floor(leader.dist))

  // weather
  const seg = race.segs.find(s => done >= s.from && done < s.to)
  const r = seg ? seg.intensity : 0
  if (!!r !== !!race.rainNow) log(race, r ? '🌧 Rain is falling' : '🌤 The rain has stopped')
  race.rainNow = r
  race.wet = Math.min(1, Math.max(0, race.wet + (r - race.wet) * (r > race.wet ? 0.004 : 0.0015) * DT))

  if (race.sc && done >= race.sc.endLap) {
    race.sc = null
    log(race, '🟢 Safety car in, racing resumes')
  }

  let ahead = null
  for (const car of order) {
    if (car.out || car.finishTime !== null) continue
    if (car.pitTimer > 0) {
      car.pitTimer -= DT
      if (car.pitTimer <= 0) car.pitTimer = 0
      continue
    }
    if (car.stall > 0) {
      car.stall -= DT
      continue
    }
    const lt = (car.lt = lapTime(race, car))
    let speed = 1 / lt
    const close = ahead && ahead.dist - car.dist < 0.5
    if (race.sc && close && (ahead.dist - car.dist) * lt > 0.6) speed *= 1.35 // close up the pack
    let nd = car.dist + speed * DT

    if (close) {
      const minGap = 0.25 / lt
      if (nd > ahead.dist - minGap) {
        const drs = race.wet < 0.2 && done >= 2 ? 0.3 : 0
        const p = race.sc ? 0 : 0.04 * race.track.overtaking * Math.max(0, ahead.lt - lt + drs - 0.3) * DT
        if (Math.random() < p) {
          nd = ahead.dist + 0.0008
          if (car.player || ahead.player) log(race, `${car.driver.code} passes ${ahead.driver.code}`, car)
        } else nd = Math.max(car.dist, ahead.dist - minGap)
      }
    }

    const du = nd - car.dist
    const lapBefore = Math.floor(car.dist)
    car.dist = nd
    car.wear = Math.min(100, car.wear + wearRate(race, car) * du)
    incidents(race, car, du)
    if (!car.out && Math.floor(nd) > lapBefore) crossLine(race, car)
    if (!car.out) ahead = car
  }

  race.over = race.cars.every(c => c.out || c.finishTime !== null)
}

function incidents(race, car, du) {
  const w = race.wet
  const pFail = 0.003 * ((100 - car.team.rel) / 20) ** 2
  const mismatch = COMPOUNDS[car.tyre].dry ? 1 + w * 10 : car.tyre === 'W' && w < 0.3 ? 2 : 1
  const pErr = 0.004 * (1 + (100 - car.driver.cons) / 20) * MODES[car.mode].err * (1 + w * 2) * mismatch
    * (car.wear > 85 ? 2.5 : 1) * (race.sc ? 0.1 : 1)

  if (Math.random() < pFail * du) {
    const parts = ['engine', 'gearbox', 'hydraulics', 'brakes', 'power unit', 'suspension']
    return retire(race, car, parts[Math.floor(Math.random() * parts.length)] + ' failure', 0.35)
  }
  if (Math.random() >= pErr * du) return
  const roll = Math.random()
  if (roll < 0.68) {
    car.stall = rand(1.5, 4)
    if (car.player) log(race, `${car.driver.code} runs wide, loses time`, car)
  } else if (roll < 0.92) {
    car.stall = rand(7, 14)
    log(race, `🌀 ${car.driver.code} spins!`, car)
  } else {
    car.crashed = true
    retire(race, car, 'accident', 0.75)
  }
}

function retire(race, car, reason, scChance) {
  car.out = reason
  log(race, `❌ ${car.driver.code} out: ${reason}`, car)
  const done = Math.floor(leaderOf(race).dist)
  if (!race.sc && done < race.laps - 4 && Math.random() < scChance) {
    race.sc = { endLap: Math.max(1, done) + 3 }
    log(race, '🟡 Safety car deployed')
  }
}

const ruleOk = car => car.used.some(c => !COMPOUNDS[c].dry) || new Set(car.used).size >= 2

function crossLine(race, car) {
  const lap = Math.floor(car.dist)
  if (lap >= 1) {
    const t = race.time - car.lapStart
    car.lastLap = t
    if (!car.bestLap || t < car.bestLap) car.bestLap = t
    if (!race.sc && (!race.fastest || t < race.fastest.time)) race.fastest = { id: car.id, code: car.driver.code, time: t }
  }
  car.lapStart = race.time
  car.noise = gauss() * (0.12 + (100 - car.driver.cons) * 0.008)

  if (race.finished || lap >= race.laps) {
    if (!race.finished) log(race, `🏁 ${car.driver.code} wins!`, car)
    race.finished = true
    car.dist = lap
    car.finishTime = race.time
    if (!ruleOk(car)) {
      car.penalty = 30
      log(race, `⚠️ ${car.driver.code} +30s: only one dry compound used`, car)
    }
    return
  }
  if (car.auto) autoPit(race, car, lap)
  if (car.pit) pitStop(race, car, lap)
}

function pitStop(race, car, lap) {
  const stop = rand(2.2, 3.2) + (Math.random() < 0.04 ? rand(4, 8) : 0)
  const from = car.tyre
  car.pitTimer = 19 + stop
  car.tyre = car.pit
  car.pit = null
  car.wear = 0
  car.stops++
  if (!car.used.includes(car.tyre)) car.used.push(car.tyre)
  car.plan = car.plan.filter(l => Math.abs(l - lap) > 4)
  log(race, `🔧 ${car.driver.code} pits ${from}→${car.tyre} (${stop.toFixed(1)}s)`, car)
}

// Strategy used by AI cars and by player cars set to "auto".
function autoPit(race, car, lap) {
  const left = race.laps - lap
  if (left <= 1 || car.pit) return
  const w = race.wet, wet = idealWet(w), dry = COMPOUNDS[car.tyre].dry
  const react = Math.random() < 0.6 // AI isn't instant: player can beat it to the call
  if (wet) {
    if ((dry || (car.tyre !== wet && Math.abs(w - 0.65) > 0.12)) && react) car.pit = wet
    return
  }
  if (!dry) {
    if (w < 0.1 && react) car.pit = dryChoice(race, car, left)
    return
  }
  const planned = car.plan.length && lap >= car.plan[0]
  if (planned || car.wear > 80 || (race.sc && car.wear > 35 && left > 5) || (!ruleOk(car) && left <= 3))
    car.pit = dryChoice(race, car, left)
}

export function dryChoice(race, car, left) {
  const next = car.plan.find(l => l > race.laps - left + 4)
  const stint = next ? next - (race.laps - left) : left
  const options = ruleOk(car) ? ['S', 'M', 'H'] : ['S', 'M', 'H'].filter(c => !car.used.includes(c))
  return options.find(c => wearRate(race, car, c) * stint < 72) || options[options.length - 1]
}

export function fmtTime(s) {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  return (m ? m + ':' + (s % 60).toFixed(3).padStart(6, '0') : (s % 60).toFixed(3))
}

// Final classification with display status.
export function classify(race) {
  const order = standings(race)
  const win = order[0]
  return order.map((c, i) => {
    let status
    if (c.out) status = 'DNF · ' + c.out
    else if (i === 0) status = fmtTime(c.finishTime + c.penalty)
    else if (win.dist - c.dist >= 1) status = `+${win.dist - c.dist} lap${win.dist - c.dist > 1 ? 's' : ''}`
    else status = '+' + (c.finishTime + c.penalty - win.finishTime - win.penalty).toFixed(3) + 's'
    return {
      pos: i + 1, driverId: c.driver.id, teamId: c.team.id, code: c.driver.code, name: c.driver.name, status,
      out: !!c.out, crashed: c.crashed, stops: c.stops, bestLap: c.bestLap, penalty: c.penalty, grid: c.grid, player: c.player,
    }
  })
}
