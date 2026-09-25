<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

// Driven by the slide's click counter; the slide sets `clicks: 4`.
//   1  the loop: observe -> compare -> act
//   2  our hand-built chain, mapped onto it
//   3  the same loop in Kubernetes
//   4  punchline
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const CX = 150
const CY = 165
const R = 110

// Stages on the loop, clockwise from the top.
const stages = [
  { name: 'observe', deg: -90 },
  { name: 'compare', deg: 30 },
  { name: 'act', deg: 150 },
].map((st) => {
  const a = (st.deg * Math.PI) / 180
  return { ...st, x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }
})

// Clockwise arcs between stages, trimmed so they don't run under the nodes.
function arc(fromDeg: number, toDeg: number) {
  const trim = 24
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return `${CX + R * Math.cos(a)},${CY + R * Math.sin(a)}`
  }
  return `M${p(fromDeg + trim)} A${R},${R} 0 0 1 ${p(toDeg - trim)}`
}

const arcs = [arc(-90, 30), arc(30, 150), arc(150, 270)]

const rows = [
  { stage: 'observe', talos: 'node addresses', k8s: 'ReplicaSet spec, running Pods' },
  { stage: 'compare', talos: 'addresses vs cert SANs', k8s: 'desired vs running replicas' },
  { stage: 'act', talos: 're-issue cert, restart static pod', k8s: 'create / delete Pods' },
]
</script>

<template>
  <div class="rl">
    <svg class="rl-svg" viewBox="0 0 300 330" aria-label="Reconciliation loop: observe, compare, act">
      <defs>
        <marker id="rl-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--tc-teal)" />
        </marker>
      </defs>
      <g class="rl-loop" :class="{ on: s >= 1 }">
        <path v-for="(d, i) in arcs" :key="i" :d="d" class="rl-arc" marker-end="url(#rl-head)" />
        <text :x="CX" :y="CY + 6" text-anchor="middle" class="rl-center">reconcile</text>
        <g v-for="st in stages" :key="st.name">
          <rect :x="st.x - 44" :y="st.y - 17" width="88" height="34" rx="17" class="rl-node" />
          <text :x="st.x" :y="st.y + 5" text-anchor="middle" class="rl-node-label">{{ st.name }}</text>
        </g>
      </g>
    </svg>

    <div class="rl-side">
      <div class="rl-lead" :class="{ on: s >= 1 }">
        It feels like… <strong>reconciliation</strong>
      </div>
      <table class="rl-table" :class="{ on: s >= 2 }">
        <thead>
          <tr>
            <th />
            <th :class="{ hide: s < 2 }">our chain</th>
            <th :class="{ hide: s < 3 }">Kubernetes ReplicaSet controller</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.stage">
            <td :class="{ hide: s < 2 }">{{ r.stage }}</td>
            <td :class="{ hide: s < 2 }">{{ r.talos }}</td>
            <td :class="{ hide: s < 3 }">{{ r.k8s }}</td>
          </tr>
        </tbody>
      </table>
      <div class="rl-punch" :class="{ on: s >= 4 }">
        …and we already know it well from <strong>Kubernetes</strong>!
      </div>
    </div>
  </div>
</template>

<style scoped>
.rl {
  display: grid;
  grid-template-columns: 300px 1fr;
  column-gap: 28px;
  height: 350px;
}

.rl-svg {
  width: 300px;
  height: 330px;
}

.rl-loop {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.rl-loop.on {
  opacity: 1;
}

.rl-arc {
  fill: none;
  stroke: var(--tc-teal);
  stroke-width: 3;
}

.rl-center {
  font-family: var(--tc-font);
  font-size: 20px;
  font-weight: 700;
  fill: var(--tc-ink);
}

.rl-node {
  fill: #ffffff;
  stroke: var(--tc-teal);
  stroke-width: 2;
}

.rl-node-label {
  font-family: var(--tc-font-mono);
  font-size: 14px;
  fill: var(--tc-teal);
}

.rl-side {
  font-size: 18px;
}

.rl-lead,
.rl-punch {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.rl-lead.on,
.rl-punch.on {
  opacity: 1;
}

.rl-lead {
  margin: 8px 0 16px;
  font-size: 22px;
}

.rl-side table {
  font-size: 16px;
}

.rl-table {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.rl-table.on {
  opacity: 1;
}

.rl-side td:first-child {
  font-family: var(--tc-font-mono);
  font-weight: 400;
  color: var(--tc-teal);
}

.rl-side td:not(:last-child) {
  white-space: normal;
}

.rl-side .hide {
  color: transparent !important;
  border-color: transparent;
}

th,
td {
  transition: color 0.4s ease, border-color 0.4s ease;
}

.rl-punch {
  margin-top: 22px;
  font-size: 22px;
  color: var(--tc-pink);
}
</style>
