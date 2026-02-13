<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)" @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="input-config">
      <select v-model="node.data.inputType" @mousedown.stop @change="onTypeChange">
        <option value="" disabled>Select Type...</option>
        <option value="slider">Slider</option>
        <option value="number">Number</option>
        <option value="checkbox">Checkbox</option>
        <option value="text">Text</option>
        <option value="color">Color</option>
        <option value="dropdown">Dropdown</option>
      </select>
      
      <!-- Configuration based on type -->
      <div v-if="node.data.inputType" class="config-fields">
        <!-- Label (all types) -->
        <input 
          type="text" 
          v-model="node.data.label" 
          placeholder="Label"
          @mousedown.stop 
          @input="onUpdate"
          class="config-input"
        />
        
        <!-- Slider/Number specific -->
        <div v-if="node.data.inputType === 'slider' || node.data.inputType === 'number'" class="range-config">
          <input type="number" v-model.number="node.data.min" placeholder="Min" @mousedown.stop @input="onUpdate" class="config-input small" />
          <input type="number" v-model.number="node.data.max" placeholder="Max" @mousedown.stop @input="onUpdate" class="config-input small" />
          <input v-if="node.data.inputType === 'slider'" type="number" v-model.number="node.data.step" placeholder="Step" @mousedown.stop @input="onUpdate" class="config-input small" />
        </div>
        
        <!-- Dropdown options -->
        <div v-if="node.data.inputType === 'dropdown'" class="options-config">
          <textarea 
            v-model="node.data.optionsText" 
            placeholder="Options (one per line)"
            @mousedown.stop 
            @input="onOptionsChange"
            class="config-input options-textarea"
            rows="3"
          ></textarea>
        </div>
        
        <!-- Default value -->
        <input 
          v-if="node.data.inputType !== 'checkbox' && node.data.inputType !== 'dropdown'"
          type="text" 
          v-model="node.data.defaultValue" 
          placeholder="Default"
          @mousedown.stop 
          @input="onUpdate"
          class="config-input"
        />
        <label v-else-if="node.data.inputType === 'checkbox'" class="checkbox-default">
          <input type="checkbox" v-model="node.data.defaultValue" @mousedown.stop @change="onUpdate" />
          Default: {{ node.data.defaultValue ? 'On' : 'Off' }}
        </label>
        <input 
          v-else-if="node.data.inputType === 'dropdown'"
          type="number" 
          v-model.number="node.data.defaultValue" 
          placeholder="Default Index"
          @mousedown.stop 
          @input="onUpdate"
          class="config-input"
          min="0"
        />
        
        <div class="current-value">
          {{ displayValue }}
        </div>
      </div>
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

const displayValue = computed(() => {
  const val = props.node.data.currentValue ?? props.node.data.defaultValue;
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'On' : 'Off';
  
  // For dropdown, show index and selected option
  if (props.node.data.inputType === 'dropdown') {
    const options = props.node.data.options || [];
    const index = typeof val === 'number' ? val : 0;
    const option = options[index];
    return option ? `[${index}] ${option}` : `Index: ${index}`;
  }
  
  if (typeof val === 'number') return val.toFixed(2);
  return String(val);
});

function onOptionsChange() {
  // Parse options from textarea (one per line)
  const text = props.node.data.optionsText || '';
  props.node.data.options = text.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  onUpdate();
}

function onTypeChange() {
  // Set defaults when type changes
  if (props.node.data.inputType === 'slider') {
    props.node.data.min = props.node.data.min ?? 0;
    props.node.data.max = props.node.data.max ?? 100;
    props.node.data.step = props.node.data.step ?? 1;
    props.node.data.defaultValue = props.node.data.defaultValue ?? 50;
  } else if (props.node.data.inputType === 'number') {
    props.node.data.min = props.node.data.min ?? 0;
    props.node.data.max = props.node.data.max ?? 100;
    props.node.data.defaultValue = props.node.data.defaultValue ?? 0;
  } else if (props.node.data.inputType === 'checkbox') {
    props.node.data.defaultValue = props.node.data.defaultValue ?? false;
  } else if (props.node.data.inputType === 'color') {
    props.node.data.defaultValue = props.node.data.defaultValue ?? '#007acc';
  } else if (props.node.data.inputType === 'dropdown') {
    props.node.data.optionsText = props.node.data.optionsText ?? '';
    props.node.data.options = props.node.data.options ?? [];
    props.node.data.defaultValue = props.node.data.defaultValue ?? 0;
  } else {
    props.node.data.defaultValue = props.node.data.defaultValue ?? '';
  }
  
  props.node.data.currentValue = props.node.data.defaultValue;
  onUpdate();
}

function onUpdate() {
  triggerGraphUpdate();
}
</script>

<style scoped>
.input-config {
  padding: 5px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

select, .config-input {
  width: 100%;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px;
  font-size: 11px;
}

.config-input.small {
  flex: 1;
}

.range-config {
  display: flex;
  gap: 4px;
}

.options-config {
  display: flex;
  flex-direction: column;
}

.options-textarea {
  resize: vertical;
  font-family: monospace;
  font-size: 10px;
  line-height: 1.4;
}

.checkbox-default {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #aaa;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-value {
  background: #1a1a1a;
  padding: 6px;
  border-radius: 3px;
  color: #00d2ff;
  font-family: monospace;
  text-align: center;
  font-size: 11px;
  margin-top: 4px;
}
</style>
