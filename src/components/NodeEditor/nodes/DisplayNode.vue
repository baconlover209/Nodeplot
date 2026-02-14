<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <template #header-right>
      <div class="header-actions">
        <button class="copy-btn" @click.stop="copyToClipboard" :class="{ 'copied': showCopiedFeedback }"
          title="Copy to clipboard">
          <div :class="showCopiedFeedback ? 'i-mdi-check' : 'i-mdi-content-copy'"></div>
        </button>
        <label class="screen-mode-toggle" :class="{ 'is-active': isScreenMode }">
          <input type="checkbox" v-model="node.data.screenMode" @change="onToggleChange" />
          <span class="toggle-text">CRT</span>
        </label>
      </div>
    </template>

    <div class="display-box" :class="{ 'screen-mode': isScreenMode }">
      <!-- Screen Mode (Plain Terminal Text) -->
      <pre v-if="isScreenMode" class="screen-text">{{ screenText }}</pre>

      <!-- Normal Mode (Visual Tiles) -->
      <div v-else-if="displayItems.length > 0" class="display-container" :class="{ 'is-array': isArray }">
        <div v-for="(item, idx) in displayItems" :key="idx" class="display-tile"
          :class="{ 'image-tile': item.isImage, 'color-tile': item.isColor, 'text-tile': !item.isImage && !item.isColor }">

          <!-- Image Content -->
          <div v-if="item.isImage" class="tile-image">
            <img :src="item.value" alt="Output Image" />
          </div>

          <!-- Color Content -->
          <div v-else-if="item.isColor" class="tile-color">
            <div class="color-swatch" :style="{ backgroundColor: item.value }"></div>
            <div class="color-value">{{ item.value }}</div>
          </div>

          <!-- Text/JSON Content -->
          <div v-else class="tile-text">
            <pre v-if="item.isJSON" class="json-content">{{ item.formattedJSON }}</pre>
            <div v-else class="text-content">{{ item.displayValue }}</div>
          </div>
        </div>
      </div>

      <!-- Empty Fallback -->
      <div v-else class="display-value empty">—</div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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
const isArray = computed(() => Array.isArray(evaluatedValue.value));

function isItemImage(val: any): boolean {
  if (typeof val !== 'string') return false;
  return val.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)($|\?)/i.test(val);
}

function isItemColor(val: any): boolean {
  return typeof val === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(val);
}

function isItemJSON(val: any): boolean {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function processItem(val: any) {
  const isImage = isItemImage(val);
  const isColor = isItemColor(val);
  const isJSON = isItemJSON(val);

  let displayValue = '';
  if (isScreenMode.value) {
    if (val === null) displayValue = 'null';
    else if (val === undefined) displayValue = 'undefined';
    else if (typeof val === 'string') displayValue = `"${val}"`;
    else if (typeof val === 'number') displayValue = String(val);
    else if (typeof val === 'boolean') displayValue = val ? 'true' : 'false';
    else displayValue = String(val);
  } else {
    if (val === null || val === undefined) displayValue = '—';
    else if (typeof val === 'boolean') displayValue = val ? 'true' : 'false';
    else if (typeof val === 'number') displayValue = val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    else displayValue = String(val);
  }

  return {
    value: val,
    isImage,
    isColor,
    isJSON,
    displayValue,
    formattedJSON: isJSON || Array.isArray(val) ? JSON.stringify(val, null, 2) : ''
  };
}

const displayItems = computed(() => {
  const val = evaluatedValue.value;
  if (val === null || val === undefined) return [];

  if (Array.isArray(val)) {
    return val.map(item => processItem(item));
  }

  return [processItem(val)];
});

const screenText = computed(() => {
  const val = evaluatedValue.value;
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return JSON.stringify(val, null, 2);
});

function onToggleChange() {
  pushHistoryState();
}

const showCopiedFeedback = ref(false);

async function copyToClipboard() {
  const val = evaluatedValue.value;
  if (val === null || val === undefined) return;

  let textToCopy = '';
  if (typeof val === 'string') {
    textToCopy = val;
  } else if (typeof val === 'number' || typeof val === 'boolean') {
    textToCopy = String(val);
  } else {
    textToCopy = JSON.stringify(val, null, 2);
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    showCopiedFeedback.value = true;
    setTimeout(() => {
      showCopiedFeedback.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}
</script>

<style scoped>
.display-box {
  padding: 10px;
  min-height: 40px;
  max-height: 450px;
  width: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 140px;
}

.display-box.screen-mode {
  background: #050505;
  border: 1px solid #1a1a1a;
  box-shadow: inset 0 0 15px rgba(0, 255, 0, 0.05);
  border-radius: 4px;
  max-width: 500px;
}

.display-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.display-container.is-array {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.display-tile {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.2s;
}

.is-array .display-tile:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.06);
}

.display-tile.text-tile {
  padding: 10px;
  justify-content: center;
}

.tile-image {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.tile-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tile-color {
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.color-swatch {
  width: 100%;
  height: 40px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.color-value {
  font-size: 9px;
  font-family: monospace;
  color: #888;
}

.text-content {
  font-size: 14px;
  font-weight: bold;
  color: #00d2ff;
  font-family: 'JetBrains Mono', monospace;
  word-break: break-all;
  text-align: center;
}

.json-content {
  font-size: 10px;
  color: #00d2ff;
  font-family: 'JetBrains Mono', monospace;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.screen-text {
  color: #00ff41 !important;
  text-shadow: 0 0 8px rgba(0, 255, 65, 0.4);
  font-family: 'Courier New', Courier, monospace !important;
  font-size: 13px !important;
  font-weight: normal !important;
  text-align: left !important;
  white-space: pre-wrap;
  width: 100%;
  margin: 0;
}

/* Custom Scrollbar */
.display-box::-webkit-scrollbar {
  width: 6px;
}

.display-box::-webkit-scrollbar-track {
  background: transparent;
}

.display-box::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.display-box::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.empty {
  color: #555;
  font-style: italic;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-btn {
  background: #111;
  border: 1px solid #333;
  color: #555;
  padding: 3px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 14px;
}

.copy-btn:hover {
  color: #fff;
  border-color: #666;
  background: #222;
}

.copy-btn.copied {
  color: #00ff41;
  border-color: #00ff41;
  background: #001a00;
}

.screen-mode-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: #555;
  cursor: pointer;
  user-select: none;
  background: #111;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #333;
  transition: all 0.2s;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
}

.screen-mode-toggle.is-active {
  color: #00ff41;
  border-color: #00ff41;
  background: #001a00;
  box-shadow: 0 0 5px rgba(0, 255, 65, 0.2);
}

.screen-mode-toggle input {
  display: none;
}

.screen-mode-toggle:hover {
  border-color: #666;
}

.screen-mode-toggle.is-active:hover {
  border-color: #00ff41;
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.4);
}
</style>
