<script setup>
import { ref, computed } from 'vue'
import { team, track, driverStandings, teamStandings, upgradeCost, buy, save, sponsor, seasonOver, nextSeason, STATS } from '../game.js'
import TrackMap from './TrackMap.vue'

const props = defineProps({ game: Object })
const emit = defineEmits(['race', 'quit'])
const tab = ref('overview')
const g = props.game

const me = computed(() => team(g, g.player))
const next = computed(() => track(g.calendar[g.round]))
const driverName = id => g.drivers.find(d => d.id === id)
const teamColor = id => team(g, id).color
const avg = t => (Object.keys(STATS).reduce((s, k) => s + t[k], 0) / 4).toFixed(1)
const byCar = computed(() => [...g.teams].sort((a, b) => avg(b) - avg(a)))
const myRank = computed(() => teamStandings(g).findIndex(t => t.id === g.player) + 1)
const tags = t => [t.power > 0.65 ? 'Power' : t.power < 0.4 ? 'Downforce' : 'Balanced', t.wear > 1.1 ? 'High wear' : t.wear < 0.9 ? 'Low wear' : null, t.overtaking < 0.6 ? 'Hard to pass' : null, t.rain >= 0.35 ? 'Often wet' : null].filter(Boolean)

function upgrade(stat) {
  if (buy(g, me.value, stat)) save(g)
}
</script>

<template>
  <div class="wrap">
    <header class="row" :style="{ borderLeft: `4px solid ${me.color}`, paddingLeft: '12px' }">
      <div>
        <h1 style="margin: 0">{{ me.name }}</h1>
        <div class="dim">Season {{ g.season }} · Round {{ Math.min(g.round + 1, g.calendar.length) }}/{{ g.calendar.length }} · P{{ myRank }} constructors · {{ me.points }} pts</div>
      </div>
      <span class="spacer" />
      <div class="mono" style="font-size: 20px">${{ me.budget.toFixed(1) }}M</div>
      <button @click="emit('quit')">Menu</button>
    </header>

    <div class="tabs" style="margin-top: 16px">
      <button v-for="t in ['overview', 'car', 'standings', 'calendar']" :key="t" :class="{ on: tab === t }" @click="tab = t">{{ t[0].toUpperCase() + t.slice(1) }}</button>
    </div>

    <template v-if="tab === 'overview'">
      <div v-if="seasonOver(g)" class="panel" style="text-align: center">
        <h2>🏆 Season {{ g.season }} complete</h2>
        <p>Drivers' champion: <strong>{{ driverStandings(g)[0].name }}</strong> · Constructors: <strong>{{ teamStandings(g)[0].name }}</strong></p>
        <p>You finished <strong>P{{ myRank }}</strong> in the constructors' championship. New regulations bring the field closer together, and sponsors pay according to your final position.</p>
        <button class="primary" @click="nextSeason(g)">Start season {{ g.season + 1 }}</button>
      </div>
      <div v-else class="grid">
        <div class="panel">
          <h3>Next race · Round {{ g.round + 1 }}</h3>
          <h2>{{ next.name }} <span class="dim" style="font-weight: 400">· {{ next.country }}</span></h2>
          <TrackMap :track="next" />
          <div class="row dim" style="margin: 8px 0">
            <span>{{ next.laps }} laps</span>
            <span v-for="tag in tags(next)" :key="tag">· {{ tag }}</span>
          </div>
          <button class="primary" @click="emit('race')">{{ g.weekend?.round === g.round && g.weekend.season === g.season ? 'Resume race weekend' : 'Go to race weekend' }} →</button>
        </div>
        <div class="panel">
          <h3>Your drivers</h3>
          <table>
            <tr v-for="d in g.drivers.filter(d => d.team === g.player)" :key="d.id">
              <td><strong>{{ d.name }}</strong></td>
              <td class="dim">Pace {{ d.pace }} · Consistency {{ d.cons }}</td>
              <td class="mono">{{ d.points }} pts</td>
            </tr>
          </table>
          <h3 style="margin-top: 16px">Income</h3>
          <p class="dim">Sponsors pay <span class="mono">${{ sponsor(me) }}M</span> per race plus prize money for every finishing position. Crashes cost <span class="mono">$1.5M</span> in repairs. Spend it in the Car tab.</p>
          <h3 v-if="g.results.length" style="margin-top: 16px">Last podium · {{ track(g.results.at(-1).track).name }}</h3>
          <div v-if="g.results.length" class="row">
            <span v-for="(id, i) in g.results.at(-1).top" :key="id"><span class="swatch" :style="{ background: teamColor(driverName(id).team) }" /> {{ i + 1 }}. {{ driverName(id).name }}</span>
          </div>
          <template v-if="g.history.length">
            <h3 style="margin-top: 16px">Past seasons</h3>
            <div v-for="h in g.history" :key="h.season" class="dim">S{{ h.season }}: {{ h.driver }} / {{ h.team }} · you P{{ h.playerRank }}</div>
          </template>
        </div>
      </div>
    </template>

    <div v-else-if="tab === 'car'" class="grid">
      <div class="panel">
        <h3>Development</h3>
        <p class="dim">Each upgrade adds one point. The better the part, the more the next point costs.</p>
        <div v-for="(label, k) in STATS" :key="k" class="up">
          <div>
            <div>{{ label }}</div>
            <div class="bar"><div :style="{ width: (me[k] - 50) * 2 + '%', background: me.color }" /></div>
          </div>
          <span class="mono" style="font-size: 18px">{{ me[k] }}</span>
          <button :disabled="me.budget < upgradeCost(me[k]) || me[k] >= 99" @click="upgrade(k)">+1 · ${{ upgradeCost(me[k]) }}M</button>
        </div>
        <p class="dim" style="font-size: 12px">Engine matters on power tracks, aero on twisty ones. Reliability prevents failures. Tyre management slows tyre wear.</p>
      </div>
      <div class="panel">
        <h3>Field comparison</h3>
        <table class="mono">
          <tr><th>Team</th><th>ENG</th><th>AERO</th><th>REL</th><th>TYRE</th><th>AVG</th></tr>
          <tr v-for="t in byCar" :key="t.id" :class="{ me: t.id === g.player }">
            <td><span class="swatch" :style="{ background: t.color }" /> {{ t.name }}</td>
            <td>{{ t.engine }}</td><td>{{ t.aero }}</td><td>{{ t.rel }}</td><td>{{ t.tyre }}</td><td>{{ avg(t) }}</td>
          </tr>
        </table>
      </div>
    </div>

    <div v-else-if="tab === 'standings'" class="grid">
      <div class="panel">
        <h3>Drivers</h3>
        <table>
          <tr v-for="(d, i) in driverStandings(g)" :key="d.id" :class="{ me: d.team === g.player }">
            <td class="mono dim">{{ i + 1 }}</td>
            <td><span class="swatch" :style="{ background: teamColor(d.team) }" /> {{ d.name }}</td>
            <td class="dim">{{ team(g, d.team).name }}</td>
            <td class="mono">{{ d.points }}</td>
          </tr>
        </table>
      </div>
      <div class="panel">
        <h3>Constructors</h3>
        <table>
          <tr v-for="(t, i) in teamStandings(g)" :key="t.id" :class="{ me: t.id === g.player }">
            <td class="mono dim">{{ i + 1 }}</td>
            <td><span class="swatch" :style="{ background: t.color }" /> {{ t.name }}</td>
            <td class="mono">{{ t.points }}</td>
          </tr>
        </table>
      </div>
    </div>

    <div v-else class="cal">
      <div v-for="(id, i) in g.calendar" :key="id" class="panel" :class="{ next: i === g.round }" :style="{ opacity: i < g.round ? 0.6 : 1 }">
        <div class="row">
          <strong>R{{ i + 1 }} · {{ track(id).name }}</strong>
          <span class="spacer" />
          <span class="dim">{{ track(id).laps }} laps</span>
        </div>
        <TrackMap :track="track(id)" :height="130" />
        <div class="dim" style="font-size: 12px">
          <template v-if="g.results[i]">🏆 {{ driverName(g.results[i].top[0]).name }}</template>
          <template v-else>{{ tags(track(id)).join(' · ') }}</template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.up { display: grid; grid-template-columns: 1fr 40px auto; gap: 12px; align-items: center; margin-bottom: 12px; }
.cal { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.cal .panel { padding: 10px; }
.cal .next { border-color: var(--accent); }
</style>
