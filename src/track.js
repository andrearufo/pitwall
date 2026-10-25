// Track geometry: smooth the control points, resample by length, and build a
// "time fraction" table so cars slow down in corners while lap time stays exact.
const N = 1000
const cache = new Map()

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t
  const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3)
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]
}

export function geometry(track) {
  if (cache.has(track.id)) return cache.get(track.id)
  const P = track.pts, n = P.length
  const raw = []
  for (let i = 0; i < n; i++)
    for (let s = 0; s < 40; s++)
      raw.push(catmull(P[(i - 1 + n) % n], P[i], P[(i + 1) % n], P[(i + 2) % n], s / 40))

  // resample uniformly by arc length
  const cum = [0]
  for (let i = 1; i <= raw.length; i++) cum.push(cum[i - 1] + Math.hypot(...sub(raw[i % raw.length], raw[i - 1])))
  const len = cum[cum.length - 1]
  let pts = [], j = 0
  for (let k = 0; k < N; k++) {
    const d = (k / N) * len
    while (cum[j + 1] < d) j++
    const t = (d - cum[j]) / (cum[j + 1] - cum[j])
    const a = raw[j], b = raw[(j + 1) % raw.length]
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }

  // speed factor from curvature (turning angle over a short window), smoothed
  const W = 6
  let speed = pts.map((_, i) => {
    const a = pts[(i - W + N) % N], b = pts[i], c = pts[(i + W) % N]
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0])
    let turn = Math.abs(h2 - h1)
    if (turn > Math.PI) turn = 2 * Math.PI - turn
    return 1 / (1 + turn * 2.2)
  })
  for (let pass = 0; pass < 3; pass++)
    speed = speed.map((_, i) => (speed[(i - 2 + N) % N] + speed[(i - 1 + N) % N] + speed[i] + speed[(i + 1) % N] + speed[(i + 2) % N]) / 5)

  // start/finish line in the middle of the fastest stretch
  const win = Math.round(N * 0.1)
  let best = 0, bestSum = -1
  for (let i = 0; i < N; i++) {
    let s = 0
    for (let k = 0; k < win; k++) s += speed[(i + k) % N]
    if (s > bestSum) { bestSum = s; best = i }
  }
  const start = (best + Math.round(win * 0.65)) % N
  pts = pts.slice(start).concat(pts.slice(0, start))
  speed = speed.slice(start).concat(speed.slice(0, start))

  // cumulative time fraction per sample (time ∝ 1 / speed)
  const time = [0]
  for (let i = 0; i < N; i++) time.push(time[i] + 1 / speed[i])
  const total = time[N]
  for (let i = 0; i <= N; i++) time[i] /= total

  const g = { pts, time, speed }
  cache.set(track.id, g)
  return g
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]

// Point and unit direction at lap fraction u (0..1, time based).
export function pointAt(g, u) {
  u = ((u % 1) + 1) % 1
  let lo = 0, hi = N
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (g.time[mid] <= u) lo = mid
    else hi = mid
  }
  const t = (u - g.time[lo]) / (g.time[lo + 1] - g.time[lo])
  const a = g.pts[lo], b = g.pts[(lo + 1) % N]
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1
  return { x: a[0] + dx * t, y: a[1] + dy * t, dx: dx / l, dy: dy / l }
}

// Fit the 0-100 x 0-70 track space into a w x h canvas.
export function fit(w, h, pad = Math.min(24, h * 0.06)) {
  const s = Math.min((w - pad * 2) / 100, (h - pad * 2) / 72)
  const ox = (w - 100 * s) / 2, oy = (h - 72 * s) / 2 + s
  return { s, map: (x, y) => [ox + x * s, oy + y * s] }
}

// Pit lane runs parallel to the track around the start line.
export const PIT_OFFSET = 3.2
export function pitPoint(g, u) {
  const p = pointAt(g, u)
  return { x: p.x - p.dy * PIT_OFFSET, y: p.y + p.dx * PIT_OFFSET }
}

export function drawTrack(ctx, track, w, h, wet = 0) {
  const g = geometry(track)
  const { s, map } = fit(w, h)
  const path = (pts, close = true) => {
    ctx.beginPath()
    pts.forEach((p, i) => (i ? ctx.lineTo(...map(...p)) : ctx.moveTo(...map(...p))))
    if (close) ctx.closePath()
  }
  ctx.lineJoin = ctx.lineCap = 'round'

  // pit lane
  const pit = []
  for (let u = -0.05; u <= 0.05; u += 0.005) { const p = pitPoint(g, u); pit.push([p.x, p.y]) }
  path(pit, false)
  ctx.strokeStyle = '#3a3f4b'
  ctx.lineWidth = s * 1.6
  ctx.stroke()

  path(g.pts)
  ctx.strokeStyle = '#11141a'
  ctx.lineWidth = s * 3.6
  ctx.stroke()
  ctx.strokeStyle = wet > 0.15 ? `rgb(${60 - wet * 20}, ${68 - wet * 10}, ${84 + wet * 30})` : '#474d5a'
  ctx.lineWidth = s * 2.6
  ctx.stroke()

  // start/finish line
  const p = pointAt(g, 0)
  const [x, y] = map(p.x, p.y)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.atan2(p.dy, p.dx))
  const half = s * 1.3, sq = half / 2
  for (let i = 0; i < 4; i++)
    for (let k = 0; k < 2; k++) {
      ctx.fillStyle = (i + k) % 2 ? '#111' : '#fff'
      ctx.fillRect(k * sq - sq, -half + i * sq, sq, sq)
    }
  ctx.restore()
  return { g, s, map }
}
