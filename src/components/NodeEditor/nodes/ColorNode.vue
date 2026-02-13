<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)" @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="color-config">
      <!-- Input/Output Format Dropdowns -->
      <div class="format-selectors">
        <div class="format-group">
          <label>Input</label>
          <select v-model="node.data.inputFormat" @mousedown.stop @change="onFormatChange">
            <option value="rgb">RGB</option>
            <option value="hsv">HSV</option>
            <option value="hex">Hex</option>
            <option value="rgba">RGBA</option>
          </select>
        </div>
        <div class="format-group">
          <label>Output</label>
          <select v-model="node.data.outputFormat" @mousedown.stop @change="onFormatChange">
            <option value="rgb">RGB</option>
            <option value="hsv">HSV</option>
            <option value="hex">Hex</option>
            <option value="rgba">RGBA</option>
          </select>
        </div>
      </div>
      
      <!-- Color Viewer -->
      <div class="color-viewer" :style="{ backgroundColor: computedColor }"></div>
      
      <!-- Sliders (only show if not in hex mode) -->
      <div v-if="node.data.inputFormat !== 'hex'" class="sliders">
        <div class="slider-group">
          <label>{{ sliderLabels[0] }}</label>
          <input 
            type="range" 
            v-model.number="sliderValues[0]" 
            :min="sliderRanges[0]?.min ?? 0"
            :max="sliderRanges[0]?.max ?? 255"
            :step="sliderRanges[0]?.step ?? 1"
            @mousedown.stop 
            @input="onSliderChange"
          />
          <span class="value">{{ sliderValues[0] }}</span>
        </div>
        
        <div class="slider-group">
          <label>{{ sliderLabels[1] }}</label>
          <input 
            type="range" 
            v-model.number="sliderValues[1]" 
            :min="sliderRanges[1]?.min ?? 0"
            :max="sliderRanges[1]?.max ?? 255"
            :step="sliderRanges[1]?.step ?? 1"
            @mousedown.stop 
            @input="onSliderChange"
          />
          <span class="value">{{ sliderValues[1] }}</span>
        </div>
        
        <div class="slider-group">
          <label>{{ sliderLabels[2] }}</label>
          <input 
            type="range" 
            v-model.number="sliderValues[2]" 
            :min="sliderRanges[2]?.min ?? 0"
            :max="sliderRanges[2]?.max ?? 255"
            :step="sliderRanges[2]?.step ?? 1"
            @mousedown.stop 
            @input="onSliderChange"
          />
          <span class="value">{{ sliderValues[2] }}</span>
        </div>
        
        <!-- Alpha slider for RGBA -->
        <div v-if="node.data.inputFormat === 'rgba'" class="slider-group">
          <label>A</label>
          <input 
            type="range" 
            v-model.number="alphaValue" 
            min="0"
            max="1"
            step="0.01"
            @mousedown.stop 
            @input="onSliderChange"
          />
          <span class="value">{{ alphaValue.toFixed(2) }}</span>
        </div>
      </div>
      
      <!-- Hex Input -->
      <div v-else class="hex-input-group">
        <label>Hex Color</label>
        <input 
          type="text" 
          v-model="hexValue" 
          @mousedown.stop 
          @input="onHexChange"
          placeholder="#RRGGBB"
          class="hex-input"
        />
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

// Initialize data if not present
if (!props.node.data.inputFormat) {
  props.node.data.inputFormat = 'rgb';
  props.node.data.outputFormat = 'rgb';
  props.node.data.r = 255;
  props.node.data.g = 0;
  props.node.data.b = 0;
  props.node.data.alpha = 1;
}

const sliderValues = ref([
  (props.node.data.r as number | undefined) ?? 255,
  (props.node.data.g as number | undefined) ?? 0,
  (props.node.data.b as number | undefined) ?? 0
]);

const alphaValue = ref((props.node.data.alpha as number | undefined) ?? 1);

const hexValue = ref(rgbToHex(
  (props.node.data.r as number | undefined) ?? 255, 
  (props.node.data.g as number | undefined) ?? 0, 
  (props.node.data.b as number | undefined) ?? 0
));

const sliderLabels = computed(() => {
  if (props.node.data.inputFormat === 'rgb' || props.node.data.inputFormat === 'rgba') return ['R', 'G', 'B'];
  if (props.node.data.inputFormat === 'hsv') return ['H', 'S', 'V'];
  return ['', '', ''];
});

const sliderRanges = computed(() => {
  if (props.node.data.inputFormat === 'rgb' || props.node.data.inputFormat === 'rgba') {
    return [
      { min: 0, max: 255, step: 1 },
      { min: 0, max: 255, step: 1 },
      { min: 0, max: 255, step: 1 }
    ];
  } else if (props.node.data.inputFormat === 'hsv') {
    return [
      { min: 0, max: 360, step: 1 },
      { min: 0, max: 100, step: 1 },
      { min: 0, max: 100, step: 1 }
    ];
  }
  return [
    { min: 0, max: 255, step: 1 },
    { min: 0, max: 255, step: 1 },
    { min: 0, max: 255, step: 1 }
  ];
});

// Helper functions
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16).padStart(2, '0');
    return hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result && result[1] && result[2] && result[3] ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : (diff / max) * 100;
  const v = max * 100;
  
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / diff + 2) * 60;
    } else {
      h = ((r - g) / diff + 4) * 60;
    }
  }
  
  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

function hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number } {
  s /= 100;
  v /= 100;
  
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

const computedColor = computed(() => {
  // Always compute from RGB values stored in node.data
  return rgbToHex(props.node.data.r ?? 0, props.node.data.g ?? 0, props.node.data.b ?? 0);
});

function onFormatChange() {
  // Convert current RGB to the new input format's representation
  const rgb = { r: props.node.data.r ?? 0, g: props.node.data.g ?? 0, b: props.node.data.b ?? 0 };
  
  if (props.node.data.inputFormat === 'hsv') {
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    sliderValues.value = [hsv.h, hsv.s, hsv.v];
  } else if (props.node.data.inputFormat === 'rgb' || props.node.data.inputFormat === 'rgba') {
    sliderValues.value = [rgb.r, rgb.g, rgb.b];
  } else if (props.node.data.inputFormat === 'hex') {
    hexValue.value = rgbToHex(rgb.r, rgb.g, rgb.b);
  }
  
  triggerGraphUpdate();
}

function onSliderChange() {
  if (props.node.data.inputFormat === 'rgb' || props.node.data.inputFormat === 'rgba') {
    props.node.data.r = sliderValues.value[0];
    props.node.data.g = sliderValues.value[1];
    props.node.data.b = sliderValues.value[2];
    props.node.data.alpha = alphaValue.value;
  } else if (props.node.data.inputFormat === 'hsv') {
    const h = sliderValues.value[0] ?? 0;
    const s = sliderValues.value[1] ?? 0;
    const v = sliderValues.value[2] ?? 0;
    const rgb = hsvToRgb(h, s, v);
    props.node.data.r = rgb.r;
    props.node.data.g = rgb.g;
    props.node.data.b = rgb.b;
  }
  
  triggerGraphUpdate();
}

function onHexChange() {
  const rgb = hexToRgb(hexValue.value);
  if (rgb) {
    props.node.data.r = rgb.r;
    props.node.data.g = rgb.g;
    props.node.data.b = rgb.b;
    triggerGraphUpdate();
  }
}

// Watch for external input changes (from connected nodes)
watch(() => [props.node.data.inputR, props.node.data.inputG, props.node.data.inputB, props.node.data.inputAlpha], () => {
  // If inputs are provided, use them instead of sliders
  const hasInputs = props.node.data.inputR !== undefined || 
                    props.node.data.inputG !== undefined || 
                    props.node.data.inputB !== undefined;
  
  if (hasInputs) {
    props.node.data.r = props.node.data.inputR ?? props.node.data.r ?? 0;
    props.node.data.g = props.node.data.inputG ?? props.node.data.g ?? 0;
    props.node.data.b = props.node.data.inputB ?? props.node.data.b ?? 0;
    
    // Update slider values to reflect input
    if (props.node.data.inputFormat === 'rgb' || props.node.data.inputFormat === 'rgba') {
      sliderValues.value = [props.node.data.r, props.node.data.g, props.node.data.b];
      alphaValue.value = props.node.data.alpha ?? 1;
    } else if (props.node.data.inputFormat === 'hsv') {
      const hsv = rgbToHsv(props.node.data.r, props.node.data.g, props.node.data.b);
      sliderValues.value = [hsv.h, hsv.s, hsv.v];
    } else if (props.node.data.inputFormat === 'hex') {
      hexValue.value = rgbToHex(props.node.data.r, props.node.data.g, props.node.data.b);
    }
  }
}, { deep: true });
</script>

<style scoped>
.color-config {
  padding: 5px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-selectors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.format-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.format-group label {
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 0.5px;
}

select {
  width: 100%;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px;
  font-size: 11px;
}

.color-viewer {
  width: 100%;
  height: 50px;
  border-radius: 4px;
  border: 2px solid #555;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.slider-group label {
  font-size: 10px;
  color: #aaa;
  min-width: 12px;
  font-weight: bold;
}

.slider-group input[type="range"] {
  flex: 1;
  height: 4px;
  background: #444;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #00d2ff;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid #fff;
}

.slider-group input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #00d2ff;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid #fff;
}

.slider-group .value {
  font-size: 10px;
  color: #ccc;
  min-width: 30px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.hex-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hex-input-group label {
  font-size: 10px;
  color: #aaa;
  font-weight: bold;
}

.hex-input {
  width: 100%;
  background: #222;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 6px;
  font-size: 11px;
  font-family: monospace;
}
</style>
