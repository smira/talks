<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { CX, CY, labelY, layers } from './layers'

// Driven by the slide's click counter; the slide sets `clicks: 10`.
//   1..7  boot: layers inflate one by one
//   8     config change arrives, can't reach the layer it targets
//   9     reboot: everything deflates
//   10    boot again with the new config
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const N = layers.length

function shown(i: number) {
  if (s.value <= N)
    return s.value > i
  if (s.value === 9)
    return false
  return true
}

// Staggered deflate (outer first) and re-inflate (inner first).
function delay(i: number) {
  if (s.value === 9)
    return `${(N - 1 - i) * 120}ms`
  if (s.value === 10)
    return `${i * 120}ms`
  return '0ms'
}

const currentLayer = computed(() => (s.value >= 1 && s.value <= N ? layers[s.value - 1] : null))

const stage = computed(() => {
  if (s.value <= N)
    return s.value === 0 ? -1 : 0
  return s.value - N
})

const stages = [
  { title: 'Boot', text: 'each layer is built on top of the previous one' },
  { title: 'Config change', text: 'the running layer can\'t change the layers below it' },
  { title: 'Reboot', text: 'deflate everything', phases: ['stopEverything', 'umount', 'reboot'] },
  { title: 'Boot again', text: 'inflate from scratch with the new config' },
]
</script>

<template>
  <div class="sb">
    <svg class="sb-svg" viewBox="0 0 520 350" aria-label="Talos boot sequence as layers of a balloon">
      <defs>
        <marker id="sb-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--tc-pink)" />
        </marker>
      </defs>

      <!-- outer layers first so inner ones paint on top -->
      <circle
        v-for="i in [...layers.keys()].reverse()" :key="`c${i}`"
        class="sb-layer" :class="{ on: shown(i), target: i === 2 && s === 8 }"
        :cx="CX" :cy="CY" :r="layers[i].r" :fill="layers[i].color"
        :style="{ transitionDelay: delay(i) }"
      />

      <text
        v-for="(l, i) in layers" :key="`t${i}`"
        class="sb-label" :class="{ on: shown(i) }"
        :x="CX" :y="labelY(i)" text-anchor="middle"
        :style="{ transitionDelay: delay(i) }"
      >
        {{ l.label }}{{ i === 2 && s >= 10 ? ' v2' : '' }}
      </text>

      <!-- config change that can't reach the config layer -->
      <g class="sb-change" :class="{ on: s === 8 }">
        <text x="508" y="150" text-anchor="end" class="sb-change-label">apply-config</text>
        <line x1="505" y1="164" x2="352" y2="164" class="sb-change-arrow" marker-end="url(#sb-head)" />
        <line x1="336" y1="164" x2="262" y2="164" class="sb-change-blocked" />
        <text x="372" y="192" text-anchor="middle" class="sb-change-x">✗</text>
      </g>
    </svg>

    <div class="sb-side">
      <div class="sb-intro">
        Strict sequence, like traditional UNIX runlevels
      </div>
      <ol class="sb-stages">
        <li
          v-for="(st, i) in stages" :key="st.title"
          :class="{ shown: stage >= i, current: stage === i }"
        >
          <strong>{{ st.title }}</strong>: {{ st.text }}
          <div v-if="i === 0 && currentLayer" class="sb-phases">
            <code v-for="p in currentLayer.phases" :key="p">{{ p }}</code>
            <span v-if="currentLayer.note" class="sb-note">{{ currentLayer.note }}</span>
          </div>
          <div v-if="st.phases && stage === i" class="sb-phases">
            <code v-for="p in st.phases" :key="p">{{ p }}</code>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.sb {
  display: grid;
  grid-template-columns: 520px 1fr;
  column-gap: 20px;
  height: 350px;
}

.sb-svg {
  width: 520px;
  height: 350px;
  overflow: visible;
}

.sb-layer {
  transform-box: view-box;
  transform-origin: 180px 172px;
  transform: scale(0);
  stroke: #ffffff;
  stroke-width: 1.5;
  transition: transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1), stroke 0.3s;
}

.sb-layer.on {
  transform: scale(1);
}

.sb-layer.target {
  stroke: var(--tc-pink);
  stroke-width: 4;
  stroke-dasharray: 6 4;
}

.sb-label {
  font-family: var(--tc-font);
  font-size: 13px;
  font-weight: 700;
  fill: #ffffff;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sb-label.on {
  opacity: 1;
}

.sb-change {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sb-change.on {
  opacity: 1;
}

.sb-change-label {
  font-family: var(--tc-font-mono);
  font-size: 14px;
  fill: var(--tc-pink);
}

.sb-change-arrow {
  stroke: var(--tc-pink);
  stroke-width: 3;
}

.sb-change-blocked {
  stroke: #ffffff;
  stroke-width: 2.5;
  stroke-dasharray: 5 5;
}

.sb-change-x {
  font-size: 22px;
  font-weight: 800;
  fill: var(--tc-pink);
}

.sb-side {
  font-size: 16px;
  line-height: 1.3;
}

.sb-intro {
  margin-bottom: 16px;
  color: var(--tc-muted);
  font-style: italic;
}

.sb-stages {
  margin: 0;
  padding-left: 1.4em;
  list-style: decimal;
}

.sb-stages li {
  margin: 0 0 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sb-stages li.shown {
  opacity: 0.45;
}

.sb-stages li.current {
  opacity: 1;
}

.sb-phases {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.sb-phases code {
  font-family: var(--tc-font-mono);
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #eeeeee;
}

.sb-note {
  font-size: 13px;
  color: var(--tc-muted);
}
</style>
