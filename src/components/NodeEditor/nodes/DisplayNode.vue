<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)" @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="display-box">
      <!-- Color display -->
      <div v-if="isColor" class="color-display">
        <div class="color-swatch" :style="{ backgroundColor: evaluatedValue }"></div>
        <div class="color-value">{{ evaluatedValue }}</div>
      </div>
      
      <!-- JSON display -->
      <pre v-else-if="isJSON" class="json-display">{{ formattedJSON }}</pre>
      
      <!-- Regular display -->
      <div v-else class="display-value">{{ displayValue }}</div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { getNodeValues } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

// Get the evaluated value from node values
const evaluatedValue = computed(() => {
  const values = getNodeValues.value[props.node.id];
  if (values && values['value'] !== undefined) {
    return values['value'];
  }
  return null;
});

const isColor = computed(() => {
  const val = evaluatedValue.value;
  return typeof val === 'string' && /^#[0-9A-Fa-f]{6}$/.test(val);
});

const isJSON = computed(() => {
  const val = evaluatedValue.value;
  return typeof val === 'object' && val !== null;
});

const formattedJSON = computed(() => {
  if (isJSON.value) {
    return JSON.stringify(evaluatedValue.value, null, 2);
  }
  return '';
});

const displayValue = computed(() => {
  const val = evaluatedValue.value;
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val.toFixed(2);
  return String(val);
});
</script>

<style scoped>
.display-box {
  padding: 10px 0;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-value {
  font-size: 18px;
  font-weight: bold;
  color: #00d2ff;
  font-family: monospace;
  word-break: break-all;
  max-width: 100%;
}

.color-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 2px solid #555;
}

.color-value {
  font-size: 10px;
  color: #888;
  font-family: monospace;
}

.json-display {
  font-size: 9px;
  color: #00d2ff;
  font-family: monospace;
  margin: 0;
  padding: 6px;
  background: #1a1a1a;
  border-radius: 3px;
  max-width: 100%;
  overflow-x: auto;
  text-align: left;
}
</style>
