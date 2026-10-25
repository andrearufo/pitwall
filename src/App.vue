<script setup>
import { ref } from 'vue'
import { newGame, load, save, STATS } from './game.js'
import { TEAMS, DRIVERS } from './data.js'
import Hub from './components/Hub.vue'
import Weekend from './components/Weekend.vue'

const game = ref(null)
const screen = ref('title')
const saved = ref(load())

function start(id) {
  game.value = newGame(id)
  save(game.value)
  screen.value = 'hub'
}
function cont() {
  game.value = load()
  screen.value = 'hub'
}
function newClick() {
  if (!saved.value || confirm('Start a new game? Your current save will be overwritten.')) screen.value = 'teams'
}
const avg = t => Math.round(Object.keys(STATS).reduce((s, k) => s + t[k], 0) / 4)
</script>

<template>
  <div v-if="screen === 'title'" class="title">
    <div class="logo">PIT<span>WALL</span></div>
    <p class="dim">Run a racing team. Call the strategy. Win the championship.</p>
    <div class="row" style="justify-content: center">
      <button v-if="saved" class="primary" @click="cont">Continue · Season {{ saved.season }}, round {{ saved.round + 1 }}</button>
      <button :class="{ primary: !saved }" @click="newClick">New game</button>
    </div>
  </div>

  <div v-else-if="screen === 'teams'" class="wrap">
    <div class="row">
      <h1>Choose your team</h1>
      <span class="spacer" />
      <button @click="screen = 'title'">Back</button>
    </div>
    <p class="dim">Top teams fight for wins from day one. Backmarkers are a career challenge.</p>
    <div class="grid">
      <button v-for="t in TEAMS" :key="t.id" class="panel team" :style="{ borderLeftColor: t.color }" @click="start(t.id)">
        <div class="row">
          <strong style="font-size: 16px">{{ t.name }}</strong>
          <span class="spacer" />
          <span class="mono dim">${{ t.budget }}M</span>
        </div>
        <div class="dim">{{ DRIVERS.filter(d => d.team === t.id).map(d => d.name).join(' · ') }}</div>
        <div v-for="(label, k) in STATS" :key="k" class="stat">
          <span class="dim">{{ label }}</span>
          <div class="bar"><div :style="{ width: (t[k] - 50) * 2 + '%', background: t.color }" /></div>
          <span class="mono">{{ t[k] }}</span>
        </div>
        <div class="dim">Overall {{ avg(t) }}</div>
      </button>
    </div>
  </div>

  <Hub v-else-if="screen === 'hub'" :game="game" @race="screen = 'weekend'" @quit="saved = load(); screen = 'title'" />
  <Weekend v-else-if="screen === 'weekend'" :game="game" @done="screen = 'hub'" />
</template>

<style scoped>
.title { min-height: 100vh; display: grid; place-content: center; text-align: center; padding: 16px; }
.logo { font: 900 clamp(48px, 12vw, 104px)/1 system-ui; letter-spacing: -.04em; font-style: italic; }
.logo span { color: var(--accent); }
.team { text-align: left; border-left: 4px solid; display: grid; gap: 8px; }
.stat { display: grid; grid-template-columns: 130px 1fr 28px; gap: 8px; align-items: center; }
</style>
