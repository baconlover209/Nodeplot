<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="display-box" :class="{ 'screen-mode': isScreenMode }">
      <!-- Image display -->
      <div v-if="isImage" class="image-display">
        <img :src="evaluatedValue" alt="Output Image" />
      </div>

      <!-- Color display -->
      <div v-else-if="isColor && !isScreenMode" class="color-display">
        <div class="color-swatch" :style="{ backgroundColor: evaluatedValue }"></div>
        <div class="color-value">{{ evaluatedValue }}</div>
      </div>

      <!-- JSON display -->
      <pre v-else-if="isJSON || Array.isArray(evaluatedValue)" class="json-display"
        :class="{ 'screen-text': isScreenMode }">{{ formattedJSON }}</pre>

      <!-- Regular display (Text fallback) -->
      <div v-else class="display-value" :class="{ 'screen-text': isScreenMode }">{{ displayValue }}</div>
    </div>

    <!-- Controls -->
    <div class="node-controls" v-if="!node.collapsed">
      <label class="screen-mode-toggle">
        <input type="checkbox" v-model="node.data.screenMode" @change="onToggleChange" />
        <span>Screen Mode</span>
      </label>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import { type NodeDefinition, getNodeValues, pushHistoryState } from '../nodeEditorState';

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

const isScreenMode = computed(() => props.node.data.screenMode === true);

const isImage = computed(() => {
  const val = evaluatedValue.value;
  if (typeof val !== 'string') return false;
  // Detect base64 images or common image URLs
  return val.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)($|\?)/i.test(val);
});

const isColor = computed(() => {
  const val = evaluatedValue.value;
  return typeof val === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(val);
});

const isJSON = computed(() => {
  const val = evaluatedValue.value;
  return typeof val === 'object' && val !== null && !Array.isArray(val);
});

const formattedJSON = computed(() => {
  if (isJSON.value || Array.isArray(evaluatedValue.value)) {
    return JSON.stringify(evaluatedValue.value, null, 2);
  }
  return '';
});

const displayValue = computed(() => {
  const val = evaluatedValue.value;
  if (isScreenMode.value) {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'true' : 'false';
  }

  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return String(val);
});

function onToggleChange() {
  pushHistoryState();
}
</script>

<style scoped>
.display-box {
  padding: 10px 5px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  overflow: hidden;
}

.display-box.screen-mode {
  background: #050505;
  border: 1px solid #1a1a1a;
  box-shadow: inset 0 0 15px rgba(0, 255, 0, 0.05);
  border-radius: 4px;
  margin: 5px;
  padding: 12px;
  justify-content: flex-start;
  align-items: flex-start;
  min-width: 180px;
}

.display-value {
  font-size: 16px;
  font-weight: bold;
  color: #00d2ff;
  font-family: 'JetBrains Mono', monospace;
  word-break: break-all;
  max-width: 100%;
}

.screen-text {
  color: #00ff41 !important;
  text-shadow: 0 0 8px rgba(0, 255, 65, 0.4);
  font-family: 'Courier New', Courier, monospace !important;
  font-size: 14px !important;
  font-weight: normal !important;
  text-align: left;
  white-space: pre-wrap;
}

.image-display {
  width: 100%;
  display: flex;
  justify-content: center;
}

.image-display img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 2px;
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
  border: 2px solid #333;
}

.color-value {
  font-size: 10px;
  color: #888;
  font-family: monospace;
}

.json-display {
  font-size: 11px;
  color: #00d2ff;
  font-family: 'JetBrains Mono', monospace;
  margin: 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  max-width: 100%;
  width: 100%;
  overflow-x: auto;
  text-align: left;
}

.node-controls {
  padding: 10px;
  border-top: 1px solid #333;
  margin-top: 5px;
}

.screen-mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #aaa;
  cursor: pointer;
  user-select: none;
}

.screen-mode-toggle input {
  cursor: pointer;
}

.screen-mode-toggle:hover {
  color: #fff;
}
</style>
