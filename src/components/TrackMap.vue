<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { drawTrack } from '../track.js'

const props = defineProps({ track: Object, height: { type: Number, default: 220 } })
const canvas = ref()
let ro

function draw() {
  const c = canvas.value, dpr = devicePixelRatio || 1
  const w = c.clientWidth, h = props.height
  c.width = w * dpr
  c.height = h * dpr
  const ctx = c.getContext('2d')
  ctx.scale(dpr, dpr)
  drawTrack(ctx, props.track, w, h)
}

onMounted(() => {
  ro = new ResizeObserver(draw)
  ro.observe(canvas.value)
})
onBeforeUnmount(() => ro.disconnect())
watch(() => props.track, draw)
</script>

<template>
  <canvas ref="canvas" :style="{ width: '100%', height: height + 'px', display: 'block' }" />
</template>
