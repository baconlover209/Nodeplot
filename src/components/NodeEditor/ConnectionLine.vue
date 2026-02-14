<template>
  <path :d="path" :stroke="lineColor" :stroke-width="lineWidth" fill="none" :class="{ selected: selected, dim: isDim }"
    :style="{ opacity: isDim ? 0.3 : 1 }" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { nodeEditorState } from './nodeEditorState';

const props = defineProps<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  selected?: boolean;
  value?: any;
  id?: string;
}>();

const path = computed(() => {
  const { x1, y1, x2, y2 } = props;
  const dx = Math.abs(x1 - x2) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
});

const isDim = computed(() => {
  const val = props.value;
  return val === null || val === undefined;
});

const lineColor = computed(() => {
  if (props.id && nodeEditorState.connectionErrors[props.id]) {
    return '#ff0066'; // Bright pink/magenta for errors
  }

  if (isDim.value) return '#444';

  const val = props.value;
  if (typeof val === 'number') return '#00d2ff'; // Cyan
  if (typeof val === 'string') return '#ffcc00'; // Yellow
  if (typeof val === 'boolean') return '#44ff44'; // Green
  if (Array.isArray(val)) return '#ff8800'; // Orange for Arrays
  if (typeof val === 'object') return '#cc33ff'; // Purple

  return '#888';
});

const lineWidth = computed(() => {
  return props.selected ? 4 : 2;
});
</script>

<style scoped>
path {
  pointer-events: stroke;
  transition: stroke 0.3s, stroke-width 0.2s, opacity 0.3s;
  cursor: pointer;
}

path:hover {
  stroke: #fff !important;
  stroke-width: 4 !important;
  opacity: 1 !important;
}
</style>
