<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { advance, standings, currentLap, COMPOUNDS, MODES, TIME_SCALE, fmtTime } from '../sim.js'
import { drawTrack, pointAt, pitPoint } from '../track.js'

const props = defineProps({ race: Object, forecast: Array })
const emit = defineEmits(['finish'])
const r = props.race
const canvas = ref(), box = ref()
const speed = ref(1)
const frame = ref(0)
const SPEEDS = [0, 1, 2, 4, 8, 16]
const teamIdx = Object.fromEntries([...new Set(r.cars.map(c => c.team.id))].map((id, i) => [id, i]))
let raf, last, lastUi = 0, w = 0, h = 0, ro

function resize() {
  const dpr = devicePixelRatio || 1
  w = box.value.clientWidth
  h = box.value.clientHeight
  canvas.value.width = w * dpr
  canvas.value.height = h * dpr
}

function draw() {
  const ctx = canvas.value.getContext('2d'), dpr = devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const { g, s, map } = drawTrack(ctx, r.track, w, h, r.wet)
  const rad = Math.max(4, s * 1.05)
  const dot = (x, y, fill, stroke, lw) => {
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.lineWidth = lw
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
  ctx.font = `700 ${Math.max(10, s * 1.4)}px ui-monospace, Menlo, monospace`
  for (const car of [...r.cars].sort((a, b) => !!b.out - !!a.out || a.player - b.player)) {
    if (car.finishTime !== null) continue
    const p = car.pitTimer > 0 ? pitPoint(g, -0.035 + teamIdx[car.team.id] * 0.007) : pointAt(g, car.dist)
    const [x, y] = map(p.x, p.y)
    if (car.out) { dot(x, y, '#3a3f4b', '#000', 1); continue }
    dot(x, y, car.team.color, car.player ? '#fff' : '#000', car.player ? 2.5 : 1)
    if (car.player) {
      ctx.fillStyle = '#fff'
      ctx.fillText(car.driver.code, x + rad + 3, y - rad)
    }
  }
  if (r.sc) {
    const q = pointAt(g, standings(r)[0].dist + 0.012)
    const [x, y] = map(q.x, q.y)
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    ctx.fillText('SC', x + rad + 3, y + rad)
  }
  if (r.rainNow) {
    ctx.fillStyle = `rgba(90, 130, 220, ${0.05 + r.rainNow * 0.08})`
    ctx.fillRect(0, 0, w, h)
  }
}

function loop(ts) {
  const dt = Math.min(0.1, (ts - (last ?? ts)) / 1000)
  last = ts
  if (speed.value && !r.over) advance(r, dt * TIME_SCALE * speed.value)
  draw()
  if (ts - lastUi > 150) {
    frame.value++
    lastUi = ts
  }
  raf = requestAnimationFrame(loop)
}

function key(e) {
  if (e.code !== 'Space' || e.target.tagName === 'BUTTON') return
  e.preventDefault()
  speed.value = speed.value ? 0 : 1
}

onMounted(() => {
  ro = new ResizeObserver(resize)
  ro.observe(box.value)
  resize()
  raf = requestAnimationFrame(loop)
  addEventListener('keydown', key)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro.disconnect()
  removeEventListener('keydown', key)
})

const order = computed(() => (frame.value, standings(r)))
const mine = computed(() => order.value.filter(c => c.player))
const lap = computed(() => (frame.value, currentLap(r)))

function gap(c, i) {
  const L = order.value[0]
  if (c.out) return 'OUT'
  if (i === 0) return c.finishTime !== null ? 'FINISH' : 'Leader'
  const d = L.dist - c.dist
  if (d >= 1) return `+${Math.floor(d)} lap${d >= 2 ? 's' : ''}`
  if (c.finishTime !== null && L.finishTime !== null) return '+' + (c.finishTime + c.penalty - L.finishTime - L.penalty).toFixed(1)
  return '+' + (d * c.lt).toFixed(1)
}
function interval(c, dir) {
  const i = order.value.indexOf(c), o = order.value[i + dir]
  if (!o || o.out || c.out) return '—'
  const d = Math.abs(o.dist - c.dist)
  return d >= 1 ? 'lapped' : (d * c.lt).toFixed(1) + 's'
}
const status = c => (c.out ? 'OUT' : c.finishTime !== null ? '🏁' : c.pitTimer > 0 ? 'PIT' : c.pit ? 'BOX' : '')
const touch = () => frame.value++
const toEnd = () => {
  for (const c of mine.value) c.auto = true
  advance(r, 3 * 3600)
  touch()
}
</script>

<template>
  <div class="race">
    <div ref="box" class="map">
      <canvas ref="canvas" />
      <div class="hud">
        <div class="mono lap">LAP {{ lap }}/{{ r.laps }}</div>
        <div v-if="r.sc" class="sc">SAFETY CAR</div>
        <div class="dim">{{ r.rainNow ? '🌧 Raining' : r.wet > 0.05 ? '🌤 Drying' : '☀️ Dry' }} · track {{ Math.round(r.wet * 100) }}% wet</div>
        <div v-for="f in forecast" :key="f" class="dim" style="font-size: 12px">Forecast: {{ f }}</div>
        <div v-if="r.fastest" class="dim" style="font-size: 12px">Fastest lap <span style="color: var(--purple)">{{ r.fastest.code }} {{ fmtTime(r.fastest.time) }}</span></div>
      </div>
      <div class="speed">
        <button v-for="s in SPEEDS" :key="s" :class="{ on: speed === s }" @click="speed = s">{{ s ? s + '×' : '❚❚' }}</button>
        <button title="Simulate to the end" @click="toEnd">⏭</button>
      </div>
      <div v-if="r.over" class="over panel">
        <h2>🏁 Chequered flag</h2>
        <button class="primary" @click="emit('finish')">See results →</button>
      </div>
    </div>

    <aside>
      <div v-for="c in mine" :key="c.id" class="panel drv" :style="{ borderLeftColor: c.team.color }">
        <div class="row">
          <strong>P{{ order.indexOf(c) + 1 }} · {{ c.driver.name }}</strong>
          <span class="spacer" />
          <span class="tag">{{ status(c) }}</span>
        </div>
        <template v-if="!c.out && c.finishTime === null">
          <div class="row mono" style="gap: 8px; font-size: 12px">
            <span class="tyre" :style="{ borderColor: COMPOUNDS[c.tyre].color }">{{ c.tyre }}</span>
            <div class="bar" style="flex: 1"><div :style="{ width: 100 - c.wear + '%', background: c.wear > 75 ? 'var(--accent)' : c.wear > 50 ? 'var(--warn)' : 'var(--good)' }" /></div>
            <span>{{ Math.round(100 - c.wear) }}%</span>
            <span class="dim">Last {{ fmtTime(c.lastLap) }}</span>
          </div>
          <div class="dim mono" style="font-size: 12px">▲ {{ interval(c, -1) }} · ▼ {{ interval(c, 1) }} · stops {{ c.stops }} · used {{ c.used.join(' ') }}</div>
          <div class="row" style="gap: 4px">
            <button v-for="(_, m) in MODES" :key="m" :class="{ on: c.mode === m }" @click="c.mode = m; touch()">{{ m }}</button>
            <span class="spacer" />
            <label class="dim" style="font-size: 12px"><input type="checkbox" :checked="c.auto" @change="c.auto = !c.auto; touch()" /> auto pit</label>
          </div>
          <div class="row" style="gap: 4px">
            <span class="dim" style="font-size: 12px">Box for</span>
            <button v-for="(t, k) in COMPOUNDS" :key="k" class="pitbtn" :class="{ on: c.pit === k }" :title="t.name" @click="c.pit = c.pit === k ? null : k; touch()">
              <span class="tyre" :style="{ borderColor: t.color }">{{ k }}</span>
            </button>
          </div>
        </template>
      </div>

      <div class="panel tower">
        <table class="mono">
          <tr v-for="(c, i) in order" :key="c.id" :class="{ me: c.player, out: c.out }">
            <td class="dim">{{ i + 1 }}</td>
            <td><span class="swatch" :style="{ background: c.team.color }" /> {{ c.driver.code }}</td>
            <td>{{ gap(c, i) }}</td>
            <td><span class="tyre small" :style="{ borderColor: COMPOUNDS[c.tyre].color }">{{ c.tyre }}</span></td>
            <td class="dim">{{ Math.round(100 - c.wear) }}%</td>
            <td><span :style="{ color: r.fastest?.id === c.id ? 'var(--purple)' : '' }">{{ status(c) || (c.stops ? c.stops + '×' : '') }}</span></td>
          </tr>
        </table>
      </div>

      <div class="panel log">
        <div v-for="(e, i) in r.log.slice(0, 10)" :key="r.log.length - i" :class="{ dim: !e.player }">
          <span class="mono dim">L{{ e.lap }}</span> {{ e.msg }}
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.race { display: grid; grid-template-columns: 1fr 400px; height: 100vh; }
.map { position: relative; min-height: 0; overflow: hidden; }
.map canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.hud { position: absolute; top: 12px; left: 16px; }
.lap { font-size: 22px; font-weight: 700; }
.sc { display: inline-block; background: #fbbf24; color: #000; font-weight: 800; padding: 2px 8px; border-radius: 4px; margin: 4px 0; }
.speed { position: absolute; bottom: 12px; left: 16px; display: flex; gap: 4px; }
.over { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
aside { overflow-y: auto; padding: 12px; display: grid; gap: 12px; align-content: start; border-left: 1px solid var(--line); }
.drv { border-left: 4px solid; padding: 10px; display: grid; gap: 8px; }
.drv button { padding: 3px 8px; text-transform: capitalize; }
.pitbtn { padding: 2px 4px !important; }
.tag { font: 700 11px var(--mono); color: var(--warn); }
.tower { padding: 6px; }
.tower td { padding: 1px 4px; font-size: 12px; }
.tower tr.out td { opacity: .45; }
.tyre.small { width: 16px; height: 16px; border-width: 2px; font-size: 9px; }
.log { font-size: 12px; display: grid; gap: 2px; max-height: 200px; overflow: hidden; }
@media (max-width: 900px) {
  .race { grid-template-columns: 1fr; height: auto; }
  .map { height: 60vh; }
  aside { border-left: 0; }
}
</style>
