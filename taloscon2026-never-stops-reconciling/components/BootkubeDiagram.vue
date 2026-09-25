<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

// Driven by the slide's click counter; the slide sets `clicks: 7`.
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const components = [
  { name: 'kube-apiserver', kind: 'DaemonSet' },
  { name: 'controller-manager', kind: 'Deployment' },
  { name: 'scheduler', kind: 'Deployment' },
]

const steps = [
  '<code>bootkube start</code>: kubelet runs temporary static pods',
  'Temporary API server: create DaemonSet &amp; Deployments',
  'Self-hosted pods start',
  'Static pods torn down: the control plane runs itself',
  '<span class="bk-up">✓</span> <code>kubectl edit</code> the control plane',
  '<span class="bk-down">✗</span> One bad edit: API server down, nothing left to fix it',
  '<span class="bk-down">✗</span> <code>recover</code>: static pods again, from etcd',
]

const actor = computed(() => {
  if (s.value >= 1 && s.value <= 3)
    return 'bootkube start'
  if (s.value === 5 || s.value === 6)
    return 'kubectl edit ds/kube-apiserver'
  if (s.value >= 7)
    return 'recover'
  return ''
})

const staticState = computed(() => {
  if ((s.value >= 1 && s.value <= 3) || s.value >= 7)
    return 'running'
  if (s.value >= 4)
    return 'gone'
  return 'hidden'
})

const selfHostedState = computed(() => {
  if (s.value === 2)
    return 'pending'
  if (s.value >= 3)
    return 'running'
  return 'hidden'
})

const broken = computed(() => s.value >= 6)
</script>

<template>
  <div class="bk">
    <div class="bk-diagram">
      <div class="bk-node-label">control plane node</div>

      <div class="bk-box bk-actor" :class="{ on: actor, error: s === 6 }">
        <code>{{ actor || '&nbsp;' }}</code>
        <div v-if="s === 6" class="bk-sub">connection refused</div>
      </div>

      <div class="bk-box bk-etcd">
        etcd
        <div class="bk-sub">Talos service</div>
      </div>

      <div class="bk-lane bk-static" :class="staticState">
        <div class="bk-lane-label">
          static pods
          <span v-if="staticState === 'gone'" class="bk-tag">torn down</span>
        </div>
        <div v-for="c in components" :key="c.name" class="bk-chip">
          <code>{{ c.name }}</code>
          <div class="bk-sub">static pod</div>
        </div>
      </div>

      <div class="bk-lane bk-self" :class="selfHostedState">
        <div class="bk-lane-label">
          self-hosted
          <span class="bk-loop" :class="{ on: s >= 4, broken }">
            <template v-if="broken">✗ nothing left to fix it</template>
            <template v-else>↻ runs itself</template>
          </span>
        </div>
        <div
          v-for="(c, i) in components" :key="c.name" class="bk-chip"
          :class="{ error: broken && i === 0 }"
        >
          <code>{{ c.name }}</code>
          <div class="bk-sub">
            {{ broken && i === 0 ? 'CrashLoopBackOff' : selfHostedState === 'pending' ? 'Pending' : c.kind }}
          </div>
        </div>
      </div>

      <div class="bk-box bk-kubelet">
        kubelet <span class="bk-sub">Talos service</span>
      </div>

      <svg class="bk-arrows" viewBox="0 0 530 350" aria-hidden="true">
        <defs>
          <marker id="bk-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--tc-purple)" />
          </marker>
          <marker id="bk-head-error" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--tc-pink)" />
          </marker>
        </defs>
        <!-- bootkube / recover -> static pods -->
        <line
          class="bk-arrow" :class="{ on: (s >= 1 && s <= 3) || s >= 7 }"
          x1="150" y1="86" x2="150" y2="132" marker-end="url(#bk-head)"
        />
        <!-- temporary API server creates self-hosted objects -->
        <line
          class="bk-arrow" :class="{ on: s === 2 || s === 3 }"
          x1="150" y1="176" x2="150" y2="232" marker-end="url(#bk-head)"
        />
        <!-- kubectl edit -> self-hosted API server -->
        <line
          class="bk-arrow" :class="{ on: s === 5, error: s === 6 }"
          x1="150" y1="86" x2="150" y2="232" :marker-end="s === 6 ? 'url(#bk-head-error)' : 'url(#bk-head)'"
        />
        <!-- recover reads state from etcd -->
        <line
          class="bk-arrow" :class="{ on: s >= 7 }"
          x1="427" y1="86" x2="427" y2="132" marker-end="url(#bk-head)"
        />
      </svg>
    </div>

    <ol class="bk-steps">
      <li
        v-for="(text, i) in steps" :key="i"
        :class="{ shown: s > i, current: s === i + 1 }"
        v-html="text"
      />
    </ol>
  </div>
</template>

<style scoped>
.bk {
  display: grid;
  grid-template-columns: 530px 1fr;
  column-gap: 28px;
  height: 350px;
}

.bk-diagram {
  position: relative;
  width: 530px;
  height: 350px;
  border: 2px solid #d4d4d4;
  border-radius: 12px;
  font-size: 14px;
}

.bk-node-label {
  position: absolute;
  left: 16px;
  top: 8px;
  font-size: 12px;
  color: var(--tc-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.bk code {
  font-family: var(--tc-font-mono);
  font-size: 13px;
  background: none;
  padding: 0;
}

.bk-sub {
  font-size: 11px;
  color: var(--tc-muted);
}

.bk-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  transition: all 0.4s ease;
}

.bk-actor {
  left: 16px;
  top: 34px;
  width: 300px;
  height: 52px;
  border: 2px solid var(--tc-purple);
  color: var(--tc-purple);
  opacity: 0;
}

.bk-actor.on {
  opacity: 1;
}

.bk-actor.error {
  border-color: var(--tc-pink);
  color: var(--tc-pink);
}

.bk-etcd {
  left: 357px;
  top: 34px;
  width: 140px;
  height: 52px;
  border: 2px solid var(--tc-ink);
  font-weight: 600;
}

.bk-kubelet {
  left: 16px;
  top: 300px;
  width: 498px;
  height: 38px;
  flex-direction: row;
  gap: 8px;
  background: #f0f0f0;
  font-weight: 600;
}

.bk-lane {
  position: absolute;
  left: 16px;
  width: 498px;
  height: 80px;
  border-radius: 8px;
  transition: all 0.4s ease;
}

.bk-static {
  top: 104px;
  border: 2px dashed var(--tc-teal);
}

.bk-self {
  top: 204px;
  border: 2px solid var(--tc-blue);
}

.bk-lane-label {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 5px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.bk-static .bk-lane-label {
  color: var(--tc-teal);
}

.bk-self .bk-lane-label {
  color: var(--tc-blue);
}

.bk-tag {
  color: var(--tc-muted);
}

.bk-loop {
  opacity: 0;
  transition: all 0.4s ease;
}

.bk-loop.on {
  opacity: 1;
}

.bk-loop.broken {
  color: var(--tc-pink);
}

.bk-chip {
  position: absolute;
  top: 30px;
  width: 152px;
  height: 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  transition: all 0.4s ease;
}

.bk-chip:nth-of-type(2) { left: 10px; }
.bk-chip:nth-of-type(3) { left: 173px; }
.bk-chip:nth-of-type(4) { left: 336px; }

.bk-static .bk-chip {
  border: 1.5px dashed var(--tc-teal);
  background: #eef7f8;
}

.bk-self .bk-chip {
  border: 1.5px solid var(--tc-blue);
  background: #e9f0f8;
}

.bk-self.pending .bk-chip {
  border-style: dashed;
  background: #ffffff;
  opacity: 0.6;
}

.bk-chip.error {
  border-color: var(--tc-pink) !important;
  background: #fde8f1 !important;
  color: var(--tc-pink);
}

.bk-chip.error .bk-sub {
  color: var(--tc-pink);
  font-weight: 600;
}

.bk-lane.hidden {
  opacity: 0.15;
}

.bk-lane.hidden .bk-chip {
  opacity: 0;
}

.bk-static.gone .bk-chip {
  opacity: 0.15;
}

.bk-arrows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.bk-arrow {
  color: var(--tc-purple);
  stroke: currentColor;
  stroke-width: 2.5;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.bk-arrow.on {
  opacity: 1;
}

.bk-arrow.error {
  opacity: 1;
  color: var(--tc-pink);
  stroke-dasharray: 5 5;
}

.bk-steps {
  margin: 0;
  padding-left: 1.4em;
  list-style: decimal;
  font-size: 16px;
  line-height: 1.25;
}

.bk-steps li {
  margin: 0 0 9px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.bk-steps li.shown {
  opacity: 0.45;
}

.bk-steps li.current {
  opacity: 1;
  font-weight: 600;
}

.bk-steps :deep(code) {
  font-size: 14px;
}

.bk-steps :deep(.bk-up) {
  color: var(--tc-green);
}

.bk-steps :deep(.bk-down) {
  color: var(--tc-pink);
}
</style>
