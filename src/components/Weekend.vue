<script setup>
import { ref, markRaw, toRaw } from 'vue'
import { track, entries, team, applyResult } from '../game.js'
import { genWeather, qualify, createRace, classify, fmtTime, COMPOUNDS, idealWet } from '../sim.js'
import { POINTS } from '../data.js'
import TrackMap from './TrackMap.vue'
import Race from './Race.vue'

const props = defineProps({ game: Object })
const emit = defineEmits(['done'])
const g = props.game
const t = track(g.calendar[g.round])
const me = team(g, g.player)
const round = g.round + 1
const weather = genWeather(t)
const stage = ref('preview')
const grid = ref([])
const tyres = ref({})
const race = ref(null)
const result = ref(null)
const income = ref(0)

// The race runs on plain (non-reactive) copies of teams and drivers.
const raw = () => entries(g).map(e => ({ ...e, driver: { ...toRaw(e.driver) }, team: { ...toRaw(e.team) } }))

function runQuali() {
  grid.value = qualify(t, raw(), weather.quali)
  for (const e of grid.value) if (e.player) tyres.value[e.driver.id] = idealWet(weather.start) || 'M'
  stage.value = 'quali'
}
function startRace() {
  race.value = markRaw(createRace(t, grid.value.map(e => ({ ...e, tyre: e.player ? tyres.value[e.driver.id] : undefined })), weather))
  stage.value = 'race'
}
function finish() {
  result.value = classify(race.value)
  income.value = applyResult(g, result.value)
  stage.value = 'results'
}
const forecastText = f => `Rain ${f.heavy ? '(heavy) ' : ''}expected around laps ${Math.max(1, f.from)}–${f.to}`
</script>

<template>
  <Race v-if="stage === 'race'" :race="race" :forecast="weather.forecast.map(forecastText)" @finish="finish" />

  <div v-else class="wrap">
    <div class="row">
      <div>
        <h3 style="margin: 0">Round {{ round }}</h3>
        <h1>{{ t.name }} <span class="dim" style="font-weight: 400">· {{ t.country }}</span></h1>
      </div>
      <span class="spacer" />
      <button v-if="stage === 'preview'" @click="emit('done')">Back</button>
    </div>

    <div v-if="stage === 'preview'" class="grid">
      <div class="panel"><TrackMap :track="t" :height="320" /></div>
      <div class="panel">
        <h3>Weekend briefing</h3>
        <table>
          <tr><td class="dim">Laps</td><td>{{ t.laps }}</td></tr>
          <tr><td class="dim">Character</td><td>{{ t.power > 0.65 ? 'Power — engine matters' : t.power < 0.4 ? 'Downforce — aero matters' : 'Balanced' }}</td></tr>
          <tr><td class="dim">Tyre wear</td><td>{{ t.wear > 1.1 ? 'High' : t.wear < 0.9 ? 'Low' : 'Medium' }}</td></tr>
          <tr><td class="dim">Overtaking</td><td>{{ t.overtaking < 0.6 ? 'Hard — grid position is key' : t.overtaking > 1.15 ? 'Easy' : 'Medium' }}</td></tr>
        </table>
        <h3 style="margin-top: 16px">Forecast</h3>
        <p>Qualifying: {{ weather.quali > 0.15 ? '🌧 Wet' : '☀️ Dry' }}</p>
        <p v-if="!weather.forecast.length">Race: ☀️ Dry all race</p>
        <p v-for="f in weather.forecast" :key="f.from">Race: 🌧 {{ forecastText(f) }}</p>
        <h3 style="margin-top: 16px">Rules</h3>
        <p class="dim">In a dry race each car must use at least two different dry compounds (Soft / Medium / Hard), or take a 30s penalty. Using Inters or Wets lifts the rule.</p>
        <button class="primary" @click="runQuali">Run qualifying →</button>
      </div>
    </div>

    <div v-else-if="stage === 'quali'" class="grid">
      <div class="panel">
        <h3>Qualifying {{ weather.quali > 0.15 ? '· wet' : '' }}</h3>
        <table class="mono">
          <tr v-for="(e, i) in grid" :key="e.driver.id" :class="{ me: e.player }">
            <td class="dim">{{ i + 1 }}</td>
            <td><span class="swatch" :style="{ background: e.team.color }" /> {{ e.driver.name }}</td>
            <td>{{ fmtTime(e.time) }}</td>
            <td class="dim">{{ i ? '+' + (e.time - grid[0].time).toFixed(3) : '' }}</td>
          </tr>
        </table>
      </div>
      <div class="panel">
        <h3>Race start · tyre choice</h3>
        <p class="dim">{{ weather.start ? '🌧 The track is wet at the start.' : weather.forecast.length ? '🌦 Rain is forecast during the race.' : '☀️ Dry race expected.' }}</p>
        <div v-for="e in grid.filter(e => e.player)" :key="e.driver.id" style="margin-bottom: 12px">
          <div><strong>{{ e.driver.name }}</strong> <span class="dim">· starts P{{ grid.indexOf(e) + 1 }}</span></div>
          <div class="row" style="margin-top: 6px">
            <button v-for="(c, k) in COMPOUNDS" :key="k" :class="{ on: tyres[e.driver.id] === k }" @click="tyres[e.driver.id] = k">
              <span class="tyre" :style="{ borderColor: c.color }">{{ k }}</span> {{ c.name }}
            </button>
          </div>
        </div>
        <p class="dim" style="font-size: 12px">Soft is fastest but wears quickly; Hard is slow but lasts. Inters for a damp track, Wets for heavy rain.</p>
        <button class="primary" @click="startRace">Start the race →</button>
      </div>
    </div>

    <div v-else class="grid">
      <div class="panel">
        <h3>Race result</h3>
        <table class="mono">
          <tr v-for="r in result" :key="r.driverId" :class="{ me: r.player }">
            <td class="dim">{{ r.pos }}</td>
            <td><span class="swatch" :style="{ background: team(g, r.teamId).color }" /> {{ r.name }}</td>
            <td :class="{ dim: r.out }">{{ r.status }}{{ r.penalty ? ' (pen)' : '' }}</td>
            <td class="dim">{{ r.stops }} stop{{ r.stops === 1 ? '' : 's' }}</td>
            <td>{{ !r.out && POINTS[r.pos - 1] ? '+' + POINTS[r.pos - 1] : '' }}</td>
          </tr>
        </table>
      </div>
      <div class="panel">
        <h3>Your weekend</h3>
        <p v-for="r in result.filter(r => r.player)" :key="r.driverId">
          <strong>{{ r.name }}</strong>: {{ r.out ? r.status : 'P' + r.pos }} <span class="dim">(from P{{ r.grid }})</span>
        </p>
        <p>Income: <span class="mono">{{ income >= 0 ? '+' : '' }}${{ income.toFixed(1) }}M</span> · Budget <span class="mono">${{ me.budget.toFixed(1) }}M</span></p>
        <button class="primary" @click="emit('done')">Continue →</button>
      </div>
    </div>
  </div>
</template>
