<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { bandPoint, CX, CY, labelY, layers } from './layers'

// Driven by the slide's click counter; the slide sets `clicks: 6`.
//   1..5  one hand-built path: address change -> static pod restart
//   6     now wire every other path the same way
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const chain = [
  { at: [1, -40], text: 'New address added', layer: 'network' },
  { at: [1, 10], text: 'Build the list of node addresses', layer: 'network' },
  { at: [5, 15], text: 'Compare with the SANs of the current cert', layer: 'services' },
  { at: [5, 55], text: 'Re-issue the certificate', layer: 'services' },
  { at: [6, 95], text: 'Restart the static pod', layer: 'Kubernetes' },
] as const

const points = chain.map(c => bandPoint(c.at[0], c.at[1]))

// Quadratic curve between two points, bulging away from the center.
function curve(a: [number, number], b: [number, number], bulge = 0.25) {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const dx = mx - CX
  const dy = my - CY
  const len = Math.hypot(dx, dy) || 1
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) * bulge
  return `M${a[0]},${a[1]} Q${mx + (dx / len) * d},${my + (dy / len) * d} ${b[0]},${b[1]}`
}

const links = points.slice(1).map((p, i) => curve(points[i], p))

const mess = ([
  [[2, 200], [6, 160]],
  [[2, 240], [5, 210]],
  [[1, 150], [4, 120]],
  [[4, 250], [6, 225]],
  [[3, 180], [6, 190]],
  [[1, 265], [5, 285]],
  [[2, 300], [4, 325]],
  [[0, 120], [3, 105]],
  [[4, 140], [1, 195]],
  [[5, 300], [2, 335]],
  [[3, 70], [6, 55]],
  [[0, 220], [5, 245]],
] as const).map(([a, b]) => curve(bandPoint(a[0], a[1]), bandPoint(b[0], b[1]), 0.35))
</script>

<template>
  <div class="wb">
    <svg class="wb-svg" viewBox="0 0 400 350" aria-label="Talos layers wired together by hand">
      <circle
        v-for="i in [...layers.keys()].reverse()" :key="`c${i}`"
        class="wb-layer" :cx="CX" :cy="CY" :r="layers[i].r" :fill="layers[i].color"
      />
      <text
        v-for="(l, i) in layers" :key="`t${i}`"
        class="wb-label" :x="CX" :y="labelY(i)" text-anchor="middle"
      >
        {{ l.label }}
      </text>

      <path
        v-for="(d, i) in mess" :key="`m${i}`"
        class="wb-mess" :class="{ on: s >= 6 }" :d="d"
        :style="{ transitionDelay: `${i * 60}ms` }"
      />

      <path
        v-for="(d, i) in links" :key="`l${i}`"
        class="wb-link" :class="{ on: s >= i + 2 }" :d="d"
      />
      <g
        v-for="(p, i) in points" :key="`p${i}`"
        class="wb-point" :class="{ on: s >= i + 1, current: s === i + 1 }"
      >
        <circle :cx="p[0]" :cy="p[1]" r="10" />
        <text :x="p[0]" :y="p[1] + 4" text-anchor="middle">{{ i + 1 }}</text>
      </g>
    </svg>

    <div class="wb-side">
      <ol class="wb-chain">
        <li
          v-for="(c, i) in chain" :key="i"
          :class="{ shown: s >= i + 1, current: s === i + 1 }"
        >
          <span class="wb-num">{{ i + 1 }}</span>
          <span class="wb-text">{{ c.text }}</span>
          <span class="wb-tag">{{ c.layer }}</span>
        </li>
      </ol>
      <div class="wb-verdict" :class="{ on: s >= 6 }">
        …and that's just <strong>one</strong> path.<br>
        <span class="tc-note">Every change needs its own wiring: a mess to build by hand</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wb {
  display: grid;
  grid-template-columns: 400px 1fr;
  column-gap: 20px;
  height: 350px;
}

.wb-svg {
  width: 400px;
  height: 350px;
  overflow: visible;
}

.wb-layer {
  stroke: #ffffff;
  stroke-width: 1.5;
}

.wb-label {
  font-family: var(--tc-font);
  font-size: 13px;
  font-weight: 700;
  fill: #ffffff;
}

.wb-link {
  fill: none;
  stroke: #ffffff;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  transition: stroke-dashoffset 0.6s ease;
}

.wb-link.on {
  stroke-dashoffset: 0;
}

.wb-mess {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.8;
  stroke-dasharray: 4 4;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.wb-mess.on {
  opacity: 0.85;
}

.wb-point {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.wb-point.on {
  opacity: 1;
}

.wb-point circle {
  fill: #ffffff;
  stroke: var(--tc-pink);
  stroke-width: 2;
}

.wb-point.current circle {
  fill: var(--tc-pink);
  stroke: #ffffff;
}

.wb-point text {
  font-family: var(--tc-font);
  font-size: 12px;
  font-weight: 800;
  fill: var(--tc-pink);
}

.wb-point.current text {
  fill: #ffffff;
}

.wb-side {
  font-size: 16px;
  line-height: 1.25;
}

.wb-chain {
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}

.wb-chain li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  padding: 8px 10px;
  border: 1.5px solid #d4d4d4;
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.3s ease, border-color 0.3s ease;
}

.wb-chain li:not(:last-child)::after {
  content: '↓';
  position: absolute;
  left: 18px;
  bottom: -17px;
  font-size: 13px;
  line-height: 1;
  color: var(--tc-muted);
}

.wb-chain li.shown {
  opacity: 0.55;
}

.wb-chain li.current {
  opacity: 1;
  border-color: var(--tc-pink);
}

.wb-num {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--tc-pink);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wb-text {
  flex: 1;
}

.wb-tag {
  flex: none;
  font-family: var(--tc-font-mono);
  font-size: 11px;
  color: var(--tc-muted);
}

.wb-verdict {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.wb-verdict.on {
  opacity: 1;
}

.wb-verdict .tc-note {
  margin-left: 0;
}
</style>
