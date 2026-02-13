<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="isolate-column-config">
      <label class="column-label">Column Index:</label>
      <input type="number" v-model.number="node.data.columnIndex" @input="handleColumnChange" @mousedown.stop min="0"
        class="column-input" />

      <div v-if="columnInfo" class="column-info">
        <div class="info-item">
          <span class="info-label">Name:</span>
          <span class="info-value">{{ columnInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Values:</span>
          <span class="info-value">{{ columnInfo.count }}</span>
        </div>
      </div>

      <div v-else class="no-data">
        No data connected
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate, getNodeValues } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

// Initialize columnIndex if not set
if (props.node.data.columnIndex === undefined) {
  props.node.data.columnIndex = 0;
}

function handleColumnChange() {
  triggerGraphUpdate();
}

// Computed property to show column info based on connected input
const columnInfo = computed(() => {
  const values = getNodeValues.value[props.node.id];
  if (values && values['name'] !== null && values['data'] !== null) {
    return {
      name: values['name'],
      count: Array.isArray(values['data']) ? values['data'].length : 0
    };
  }
  return null;
});
</script>

<style scoped>
.isolate-column-config {
  padding: 5px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-label {
  font-size: 10px;
  color: #aaa;
  font-weight: bold;
}

.column-input {
  font-size: 11px;
  color: #fff;
  background: #333;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px 6px;
  width: 100%;
}

.column-input:focus {
  outline: none;
  border-color: #00d2ff;
}

.column-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background: #1a1a1a;
  border-radius: 3px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  font-family: monospace;
}

.info-label {
  color: #666;
  font-weight: bold;
}

.info-value {
  color: #00d2ff;
}

.no-data {
  font-size: 10px;
  color: #666;
  text-align: center;
  padding: 8px;
}
</style>
