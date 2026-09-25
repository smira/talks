<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useIsSlideActive, useSlideContext } from '@slidev/client'

// Embeds the Reconciliation Theatre viewer from public/theatre.
// The iframe is only mounted while the slide is on screen, so playback
// (which starts on load) begins when the slide is shown, not when it's preloaded.
const props = withDefaults(defineProps<{
  trace?: string
  theme?: string
  speed?: number
  // logical width the viewer is laid out at before being scaled into the slide;
  // the viewer switches to a stacked mobile layout below 900px
  width?: number
}>(), {
  trace: 'talos-boot.jsonl',
  theme: 'projector',
  speed: 0.1,
  width: 1280,
})

const isActive = useIsSlideActive()
const { $renderContext } = useSlideContext()

const src = computed(() => {
  const q = new URLSearchParams({ theme: props.theme, speed: String(props.speed), trace: props.trace })
  return `${import.meta.env.BASE_URL}theatre/index.html?${q}`
})

const box = ref<HTMLElement>()
const scale = ref(0)
const height = ref(0)

// Slidev mounts upcoming slides while they're still hidden (0x0), so the box is
// measured whenever it changes size rather than once on mount. Offset sizes are
// layout pixels of the 960x540 canvas, unaffected by Slidev's scaling.
function measure() {
  const w = box.value?.offsetWidth ?? 0
  const h = box.value?.offsetHeight ?? 0
  if (!w || !h)
    return
  scale.value = w / props.width
  height.value = h / scale.value
}

// The viewer draws on <canvas>, sized for its own devicePixelRatio. Scaled into the slide
// (and the slide scaled to the screen) that bitmap gets stretched and looks blurry, so tell
// the viewer the real device pixels per CSS pixel of the iframe.
const frame = ref<HTMLIFrameElement>()

function sendDpr() {
  if (!frame.value?.contentWindow || !box.value)
    return
  const onScreen = box.value.getBoundingClientRect().width
  const dpr = (onScreen / box.value.offsetWidth) * scale.value * window.devicePixelRatio
  frame.value.contentWindow.postMessage({ type: 'theatre-dpr', dpr }, window.location.origin)
}

let observer: ResizeObserver | undefined

onMounted(() => {
  measure()
  observer = new ResizeObserver(() => {
    measure()
    sendDpr()
  })
  observer.observe(box.value!)
  window.addEventListener('resize', sendDpr)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', sendDpr)
})

// only load (and so start playback) once the slide is on screen and has a real size
const live = computed(() => isActive.value && scale.value > 0 && ['slide', 'presenter'].includes($renderContext.value))
</script>

<template>
  <div ref="box" class="td">
    <iframe
      v-if="live"
      ref="frame"
      :src="src"
      @load="sendDpr"
      title="Reconciliation Theatre"
      :style="{ width: `${width}px`, height: `${height}px`, transform: `scale(${scale})` }"
    />
    <div v-else class="td-placeholder">
      Reconciliation Theatre: live demo
    </div>
  </div>
</template>

<style scoped>
.td {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1.5px solid #d4d4d4;
  border-radius: 8px;
}

.td iframe {
  position: absolute;
  left: 0;
  top: 0;
  border: 0;
  transform-origin: 0 0;
}

.td-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 20px;
  color: var(--tc-muted);
}
</style>
