<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

// Driven by the slide's click counter; the slide sets `clicks: 5`.
//   1  a fleet of Talos machines, each with in-memory COSI
//   2  Omni on top, watching Talos state through COSI
//   3  Omni's own controllers reconcile clusters
//   4  COSI grew for Omni: persistent state, queue-based controllers
//   5  the same foundation underneath both
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const machines = [0, 1, 2, 3, 4]
const ops = ['cluster creation', 'scale up / down', 'upgrades', '…']

const W = 875
const MW = 150
const gap = (W - machines.length * MW) / (machines.length - 1)
const mx = (i: number) => i * (MW + gap)
</script>

<template>
  <div class="oc">
    <div class="oc-omni" :class="{ on: s >= 2 }">
      <div class="oc-omni-head">
        <span class="oc-omni-name">Omni</span>
        <span class="oc-muted">manages a fleet of Talos machines and clusters</span>
      </div>
      <div class="oc-ops" :class="{ on: s >= 3 }">
        <span class="oc-ops-label">reconciles</span>
        <span v-for="o in ops" :key="o" class="oc-chip">{{ o }}</span>
      </div>
      <div class="oc-tags" :class="{ on: s >= 4 }">
        <span class="oc-tag">state: <b>etcd</b> · <b>SQLite</b></span>
        <span class="oc-tag">queue-based <b>QControllers</b></span>
      </div>
    </div>

    <svg class="oc-arrows" :viewBox="`0 0 ${W} 300`" aria-hidden="true">
      <defs>
        <marker id="oc-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--tc-blue)" />
        </marker>
      </defs>
      <g class="oc-links" :class="{ on: s >= 2 }">
        <line
          v-for="i in machines" :key="i"
          :x1="mx(i) + MW / 2" y1="170" :x2="W / 2 + (i - 2) * 60" y2="118"
          marker-end="url(#oc-head)"
        />
      </g>
    </svg>

    <div class="oc-link-label" :class="{ on: s >= 2 }">
      watch Talos resources via COSI API
    </div>

    <div
      v-for="i in machines" :key="i"
      class="oc-machine" :class="{ on: s >= 1 }"
      :style="{ left: `${mx(i)}px`, transitionDelay: `${i * 80}ms` }"
    >
      <b>Talos</b>
      <span class="oc-muted">COSI · in-memory</span>
    </div>

    <div class="oc-foundation" :class="{ on: s >= 5 }">
      <span><b>COSI</b>: resources · controllers · state</span>
      <span class="oc-foundation-note">the same foundation for Talos and Omni</span>
    </div>
  </div>
</template>

<style scoped>
.oc {
  position: relative;
  width: 875px;
  height: 300px;
  font-size: 15px;
}

.oc-muted {
  color: var(--tc-muted);
  font-size: 13px;
}

.oc-omni {
  position: absolute;
  left: 110px;
  right: 110px;
  top: 0;
  height: 116px;
  padding: 10px 16px;
  border: 2px solid var(--tc-blue);
  border-radius: 10px;
  background: #e9f0f8;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.oc-omni.on {
  opacity: 1;
}

.oc-omni-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.oc-omni-name {
  font-size: 24px;
  font-weight: 800;
  color: var(--tc-blue);
}

.oc-ops,
.oc-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.oc-ops.on,
.oc-tags.on {
  opacity: 1;
}

.oc-ops-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--tc-blue);
}

.oc-chip {
  padding: 2px 8px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--tc-blue);
  font-size: 13px;
}

.oc-tag {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--tc-blue);
  color: #ffffff;
  font-size: 13px;
}

.oc-arrows {
  position: absolute;
  inset: 0;
  width: 875px;
  height: 300px;
  pointer-events: none;
}

.oc-links {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.oc-links.on {
  opacity: 1;
}

.oc-links line {
  stroke: var(--tc-blue);
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.oc-link-label {
  position: absolute;
  left: 50%;
  top: 132px;
  transform: translateX(-50%);
  padding: 2px 10px;
  border-radius: 10px;
  background: #ffffff;
  font-family: var(--tc-font-mono);
  font-size: 12px;
  color: var(--tc-blue);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.oc-link-label.on {
  opacity: 1;
}

.oc-machine {
  position: absolute;
  top: 172px;
  width: 150px;
  height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--tc-pink);
  border-radius: 8px;
  background: #fde8f1;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.oc-machine.on {
  opacity: 1;
  transform: none;
}

.oc-machine b {
  color: var(--tc-pink);
  font-size: 17px;
}

.oc-foundation {
  position: absolute;
  left: 0;
  right: 0;
  top: 248px;
  height: 46px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--tc-pink), var(--tc-purple) 45%, var(--tc-blue));
  color: #ffffff;
  font-size: 17px;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.oc-foundation.on {
  opacity: 1;
}

.oc-foundation-note {
  margin-left: auto;
  font-weight: 700;
}
</style>
