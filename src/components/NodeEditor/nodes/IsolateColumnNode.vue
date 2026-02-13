<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="isolate-column-config">
      <div v-if="availableColumns.length > 0" class="column-selector">
        <label class="column-label">Column:</label>
        <select
          v-model.number="node.data.columnIndex"
          @change="handleColumnChange"
          class="column-select"
          :disabled="isIndexOverridden"
          @mousedown.stop
        >
          <option
            v-for="col in availableColumns"
            :key="col.index"
            :value="col.index"
          >
            {{ col.index }}: {{ col.name }}
          </option>
        </select>
        <div v-if="isIndexOverridden" class="override-indicator">
          Using Input Index
        </div>
      </div>

      <!-- Fallback display if not using columns or just to show current index -->
      <div v-else class="simple-index-display">
        <label class="column-label">Index: {{ node.data.columnIndex }}</label>
        <div v-if="isIndexOverridden" class="override-indicator">
          (Input Controlled)
        </div>
      </div>

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

      <div v-else class="no-data">No data connected</div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import BaseNode from "../BaseNode.vue";
import type { NodeDefinition } from "../nodeEditorState";
import {
  triggerGraphUpdate,
  getNodeValues,
  nodeEditorState,
  pushHistoryState,
} from "../nodeEditorState";

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(["connect-start", "connect-end", "socket-click"]);

// Ensure 'index' input socket exists
onMounted(() => {
  if (!props.node.inputs["index"]) {
    props.node.inputs["index"] = { label: "index" };
    // Trigger generic update to ensure UI renders the new socket
    triggerGraphUpdate();
  }
});

// Initialize columnIndex if not set
if (props.node.data.columnIndex === undefined) {
  props.node.data.columnIndex = 0;
}

function handleColumnChange() {
  triggerGraphUpdate();
  pushHistoryState();
}

// Check if index input is connected
const isIndexOverridden = computed(() => {
  return nodeEditorState.connections.some(
    (c) => c.targetNodeId === props.node.id && c.targetPort === "index"
  );
});

// Computed property to list available columns from connected CSV data
const availableColumns = computed(() => {
  const connections = nodeEditorState.connections;
  // Find connection to 'csvData' input
  const conn = connections.find(
    (c) => c.targetNodeId === props.node.id && c.targetPort === "csvData"
  );
  if (!conn) return [];

  const sourceVals = getNodeValues.value[conn.sourceNodeId];
  if (!sourceVals) return [];

  // The value is stored at the source output port name
  const data = sourceVals[conn.sourcePort];

  // Check if it's a valid 2D array (headers in first row)
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
    return data[0].map((header: any, index: number) => ({
      index,
      name: String(header),
    }));
  }

  return [];
});

// Computed property to show column info based on connected input
const columnInfo = computed(() => {
  const values = getNodeValues.value[props.node.id];
  if (values && values["name"] !== null && values["data"] !== null) {
    return {
      name: values["name"],
      count: Array.isArray(values["data"]) ? values["data"].length : 0,
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

.column-selector {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.column-select {
  font-size: 11px;
  color: #fff;
  background: #333;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px;
  width: 100%;
}

.column-select:focus {
  outline: none;
  border-color: #00d2ff;
}

.column-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.column-label {
  font-size: 10px;
  color: #aaa;
  font-weight: bold;
}

.simple-index-display {
  padding: 4px;
  background: #252525;
  border-radius: 3px;
}

.override-indicator {
  font-size: 9px;
  color: #00d2ff;
  font-style: italic;
  margin-top: 2px;
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
