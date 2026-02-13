<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="constant-config">
      <select v-model="node.data.dataType" @mousedown.stop @change="onTypeChange">
        <option value="string">String</option>
        <option value="number">number</option>
        <option value="json">JSON</option>
      </select>

      <textarea v-model="node.data.value" @mousedown.stop @input="onUpdate" class="constant-input"
        :rows="node.data.dataType === 'json' ? 4 : 2" :placeholder="getPlaceholder()"></textarea>

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
  if (props.node.data.dataType === 'json') {
    try {
      JSON.parse(props.node.data.value || '{}');
      return null;
    } catch (e) {
      return 'Invalid JSON';
    }
  } else if (props.node.data.dataType === 'number') {
    const val = props.node.data.value || '0';
    if (isNaN(Number(val))) {
      return 'Invalid number';
    }
    return null;
  }
  return null;
});

function getPlaceholder() {
  if (props.node.data.dataType === 'string') return 'Enter text...';
  if (props.node.data.dataType === 'number') return 'Enter number...';
  if (props.node.data.dataType === 'json') return '{"key": "value"}';
  return '';
}

function onTypeChange() {
  // Set default value when type changes
  if (props.node.data.dataType === 'json') {
    props.node.data.value = props.node.data.value || '{}';
  } else if (props.node.data.dataType === 'number') {
    props.node.data.value = props.node.data.value || '0';
  } else {
    props.node.data.value = props.node.data.value || '';
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
  gap: 6px;
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
  min-height: 40px;
}

.error-message {
  font-size: 9px;
  color: #ff6b6b;
  padding: 2px 4px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 2px;
}
</style>
