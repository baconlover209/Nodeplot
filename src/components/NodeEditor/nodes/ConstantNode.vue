<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="constant-config">
      <select v-model="node.data.dataType" @mousedown.stop @change="onTypeChange">
        <option value="raw">Raw (JSON/Data)</option>
        <option value="boolean">Boolean</option>
        <option value="string">String</option>
        <option value="color">Color</option>
        <option value="expression">Expression</option>
      </select>

      <div class="input-container">
        <!-- Boolean Toggle -->
        <div v-if="node.data.dataType === 'boolean'" class="boolean-toggle">
          <label class="switch">
            <input type="checkbox" v-model="node.data.value" @change="onUpdate">
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">{{ node.data.value ? 'True' : 'False' }}</span>
        </div>

        <!-- Color Input -->
        <div v-else-if="node.data.dataType === 'color'" class="color-row">
          <input type="color" v-model="node.data.value" @input="onUpdate" class="color-picker" />
          <input type="text" v-model="node.data.value" @mousedown.stop @input="onUpdate" class="text-input color-text"
            placeholder="#ffffff" />
        </div>

        <!-- Expression/Raw/String -->
        <textarea v-else v-model="node.data.value" @mousedown.stop @input="onUpdate" class="constant-input"
          :rows="node.data.dataType === 'raw' ? 4 : 1" :placeholder="getPlaceholder()"></textarea>
      </div>

      <div v-if="parseError" class="error-message">{{ parseError }}</div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const parseError = computed(() => {
  const type = props.node.data.dataType;
  const val = props.node.data.value;

  if (type === 'raw') {
    if (!val || val.trim() === '') return null;
    try {
      // Try parsing as JSON to validate
      JSON.parse(val);
      return null;
    } catch (e) {
      // It might be a simple string or number, which is fine for 'raw' 
      // but let's see if it looks like it should be JSON
      if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
        return 'Invalid JSON';
      }
      return null;
    }
  } else if (type === 'expression') {
    if (!val || val.trim() === '') return null;
    // Basic validation: try to see if it's a valid JS expression
    try {
      // We don't execute here, just check syntax roughly if possible
      // But actually, the evaluation happens in nodeEditorState
      return null;
    } catch (e) {
      return 'Invalid Expression';
    }
  }
  return null;
});

function getPlaceholder() {
  const type = props.node.data.dataType;
  if (type === 'string') return 'Enter string...';
  if (type === 'raw') return 'Enter JSON or raw data...';
  if (type === 'expression') return 'e.g. Math.PI * 2';
  return '';
}

function onTypeChange() {
  const type = props.node.data.dataType;
  // Set default value when type changes if current value is incompatible
  if (type === 'boolean') {
    if (typeof props.node.data.value !== 'boolean') {
      props.node.data.value = false;
    }
  } else if (type === 'color') {
    if (typeof props.node.data.value !== 'string' || !props.node.data.value.startsWith('#')) {
      props.node.data.value = '#3498db';
    }
  } else if (type === 'raw') {
    if (typeof props.node.data.value !== 'string') {
      props.node.data.value = '';
    }
  } else if (type === 'string') {
    if (typeof props.node.data.value !== 'string') {
      props.node.data.value = String(props.node.data.value);
    }
  } else if (type === 'expression') {
    if (typeof props.node.data.value !== 'string') {
      props.node.data.value = '';
    }
  }
  onUpdate();
}

function onUpdate() {
  triggerGraphUpdate();
}
</script>

<style scoped>
.constant-config {
  padding: 5px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

select {
  width: 100%;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px;
  font-size: 11px;
  cursor: pointer;
}

.input-container {
  width: 100%;
}

.constant-input {
  width: 100%;
  background: #222;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 6px;
  font-size: 11px;
  font-family: monospace;
  resize: vertical;
  min-height: 28px;
}

.boolean-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.toggle-label {
  font-size: 11px;
  color: #ccc;
}

.color-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.color-picker {
  width: 30px;
  height: 24px;
  padding: 0;
  border: 1px solid #555;
  border-radius: 3px;
  background: none;
  cursor: pointer;
}

.text-input {
  flex: 1;
  background: #222;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px 6px;
  font-size: 11px;
  font-family: monospace;
}

/* Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 18px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}

input:checked+.slider {
  background-color: #2ecc71;
}

input:focus+.slider {
  box-shadow: 0 0 1px #2ecc71;
}

input:checked+.slider:before {
  transform: translateX(16px);
}

.slider.round {
  border-radius: 18px;
}

.slider.round:before {
  border-radius: 50%;
}

.error-message {
  font-size: 9px;
  color: #ff6b6b;
  padding: 2px 4px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 2px;
}
</style>
