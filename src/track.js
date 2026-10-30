// Track geometry: straights between the control points with every corner
// filleted by a circular arc, resampled by length, plus a "time fraction" table
// from a simple physics speed profile (corner speed from radius, limited
// acceleration and braking) so lap time stays exact.
const N = 1000
const M_PER_UNIT = 15 // track space units to metres
const R = 5 // default corner radius in track units (~75 m)
const VMAX = 92, A_LAT = 30, A_ACC = 12, A_BRK = 40 // m/s, m/s²
const cache = new Map()

// Polygon -> closed outline of straights and arcs. Tight angles or short
// segments shrink the radius so neighbouring corners never overlap.
function outline(P) {
  const out = [], n = P.length
  for (let i = 0; i < n; i++) {
    const p = P[i], a = P[(i - 1 + n) % n], b = P[(i + 1) % n]
    const la = Math.hypot(...sub(a, p)), lb = Math.hypot(...sub(b, p))
    const u = sub(a, p).map(x => x / la), v = sub(b, p).map(x => x / lb)
    const half = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))) / 2
    if (half > 1.55) { out.push(p); continue } // practically straight
    const t = Math.min(R / Math.tan(half), la * 0.45, lb * 0.45), r = t * Math.tan(half)
    const bl = Math.hypot(u[0] + v[0], u[1] + v[1])
    const c = [p[0] + ((u[0] + v[0]) / bl) * (r / Math.sin(half)), p[1] + ((u[1] + v[1]) / bl) * (r / Math.sin(half))]
    const A = [p[0] + u[0] * t, p[1] + u[1] * t], B = [p[0] + v[0] * t, p[1] + v[1] * t]
    const a0 = Math.atan2(A[1] - c[1], A[0] - c[0])
    let d = Math.atan2(B[1] - c[1], B[0] - c[0]) - a0
    d = Math.atan2(Math.sin(d), Math.cos(d)) // shortest way round
    for (let k = 0; k <= 12; k++) out.push([c[0] + r * Math.cos(a0 + (d * k) / 12), c[1] + r * Math.sin(a0 + (d * k) / 12)])
  }
  return out
}

export function geometry(track) {
  if (cache.has(track.id)) return cache.get(track.id)
  const raw = outline(track.pts)

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

  // corner speed from the radius through 3 nearby points
  const ds = (len / N) * M_PER_UNIT, W = 4
  let speed = pts.map((_, i) => {
    const a = pts[(i - W + N) % N], b = pts[i], c = pts[(i + W) % N]
    const ab = Math.hypot(...sub(b, a)), bc = Math.hypot(...sub(c, b)), ca = Math.hypot(...sub(a, c))
    const area2 = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]))
    const r = area2 < 1e-9 ? Infinity : ((ab * bc * ca) / (2 * area2)) * M_PER_UNIT
    return Math.min(VMAX, Math.sqrt(A_LAT * r))
  })
  // braking into corners (backward) and accelerating out of them (forward); twice to wrap around
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 2 * N - 1; i >= 0; i--) {
      const k = i % N
      speed[k] = Math.min(speed[k], Math.sqrt(speed[(k + 1) % N] ** 2 + 2 * A_BRK * ds))
    }
    for (let i = 0; i < 2 * N; i++) {
      const k = i % N, v = speed[(k - 1 + N) % N]
      speed[k] = Math.min(speed[k], Math.sqrt(v ** 2 + 2 * (A_ACC * (1 - (v / VMAX) ** 2) + 0.3) * ds))
    }
  }

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
  ctx.lineWidth = s * 1.1
  ctx.stroke()

  path(g.pts)
  ctx.strokeStyle = '#11141a'
  ctx.lineWidth = s * 2.6
  ctx.stroke()
  ctx.strokeStyle = wet > 0.15 ? `rgb(${60 - wet * 20}, ${68 - wet * 10}, ${84 + wet * 30})` : '#474d5a'
  ctx.lineWidth = s * 1.8
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
