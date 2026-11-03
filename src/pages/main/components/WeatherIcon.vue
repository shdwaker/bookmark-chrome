<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
    role="img"
    aria-hidden="true"
  >
    <template v-if="iconType === 'clear'">
      <g v-if="!night" stroke="#f4a72c" stroke-width="2.6" stroke-linecap="round">
        <circle cx="24" cy="24" r="8.5" fill="#ffcb55"/>
        <path d="M24 6.5v5M24 36.5v5M6.5 24h5M36.5 24h5M11.2 11.2l3.5 3.5M33.3 33.3l3.5 3.5M36.8 11.2l-3.5 3.5M14.7 33.3l-3.5 3.5"/>
      </g>
      <g v-else>
        <path d="M33 26.5a12 12 0 1 1-13.2-13.1A9.5 9.5 0 0 0 33 26.5Z" fill="#e8eef7" stroke="#9aa9bd" stroke-width="2.4" stroke-linejoin="round"/>
      </g>
    </template>

    <template v-else-if="iconType === 'partly'">
      <circle cx="18" cy="18" r="7" fill="#ffcb55" stroke="#f4a72c" stroke-width="2.4"/>
      <path d="M17 10.8v-3.3M10.8 18H7.5M11.7 11.7 9.4 9.4M24.3 11.7l2.3-2.3" stroke="#f4a72c" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M17 36h16a6.8 6.8 0 0 0 .7-13.56A9 9 0 0 0 16.4 24.4A5.8 5.8 0 0 0 17 36Z" fill="#f2f6fb" stroke="#8fa3bb" stroke-width="2.4" stroke-linejoin="round"/>
    </template>

    <template v-else-if="iconType === 'cloudy'">
      <path d="M15 35h18a7.5 7.5 0 0 0 .7-14.97A10 10 0 0 0 14.7 22.5A6.2 6.2 0 0 0 15 35Z" fill="#e6edf5" stroke="#8fa3bb" stroke-width="2.4" stroke-linejoin="round"/>
    </template>

    <template v-else-if="iconType === 'fog'">
      <path d="M16 28h16a6.8 6.8 0 0 0 .7-13.56A9 9 0 0 0 15.4 16.4A5.8 5.8 0 0 0 16 28Z" fill="#e9edf3" stroke="#96a5b8" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M11 33h26M14 38h20M17 43h14" stroke="#a3b1c4" stroke-width="2.6" stroke-linecap="round"/>
    </template>

    <template v-else-if="iconType === 'drizzle'">
      <path d="M15 30h18a7.2 7.2 0 0 0 .7-14.37A9.5 9.5 0 0 0 14.7 17.7A6 6 0 0 0 15 30Z" fill="#e6edf5" stroke="#8fa3bb" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M18 35v3M24 35v4M30 35v3" stroke="#4a90d9" stroke-width="2.6" stroke-linecap="round"/>
    </template>

    <template v-else-if="iconType === 'rain'">
      <path d="M15 29h18a7.2 7.2 0 0 0 .7-14.37A9.5 9.5 0 0 0 14.7 16.7A6 6 0 0 0 15 29Z" fill="#dce8f5" stroke="#7d94ae" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M17 34l-1.5 5M24 35l-2 6M31 34l-1.5 5" stroke="#4a90d9" stroke-width="2.8" stroke-linecap="round"/>
    </template>

    <template v-else-if="iconType === 'snow'">
      <path d="M15 29h18a7.2 7.2 0 0 0 .7-14.37A9.5 9.5 0 0 0 14.7 16.7A6 6 0 0 0 15 29Z" fill="#f4f8fd" stroke="#9fb0c3" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M17 35h2M23 37h2M29 35h2M20 41h2M27 41h2" stroke="#7093b8" stroke-width="2.6" stroke-linecap="round"/>
    </template>

    <template v-else-if="iconType === 'thunder'">
      <path d="M15 28h18a7.2 7.2 0 0 0 .7-14.37A9.5 9.5 0 0 0 14.7 15.7A6 6 0 0 0 15 28Z" fill="#e6edf5" stroke="#7d94ae" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M26 31l-7 8h5l-2 7 8-9h-5l3-6Z" fill="#ffc94d" stroke="#e79b00" stroke-width="1.8" stroke-linejoin="round"/>
    </template>

    <template v-else>
      <circle cx="24" cy="24" r="11" fill="#e6edf5" stroke="#8fa3bb" stroke-width="2.4"/>
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  code: {
    type: [Number, String],
    default: null
  },
  night: {
    type: Boolean,
    default: false
  },
  size: {
    type: [Number, String],
    default: 24
  }
})

const iconType = computed(() => {
  const code = Number(props.code)
  if (!Number.isFinite(code)) return 'unknown'
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return 'partly'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 51 && code <= 57) || code === 80 || code === 81) return 'drizzle'
  if ((code >= 61 && code <= 67) || code === 82) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunder'
  return 'unknown'
})
</script>
