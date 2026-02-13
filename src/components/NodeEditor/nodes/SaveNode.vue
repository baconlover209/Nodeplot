<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="save-node-content">
      <div class="status">Stored Value:</div>
      <div class="value-display">{{ displayValue }}</div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import BaseNode from "../BaseNode.vue";
import type { NodeDefinition } from "../nodeEditorState";

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(["connect-start", "connect-end", "socket-click"]);

onMounted(() => {
  // Ensure inputs
  if (!props.node.inputs["in"]) props.node.inputs["in"] = null;
  if (!props.node.inputs["store"]) props.node.inputs["store"] = null;

  // Ensure output
  if (!props.node.outputs["out"]) props.node.outputs["out"] = null;

  // Ensure internal state
  if (props.node.data.storedValue === undefined) props.node.data.storedValue = null;
  if (props.node.data.prevStore === undefined) props.node.data.prevStore = false;
});

const displayValue = computed(() => {
  const val = props.node.data.storedValue;
  if (val === undefined || val === null) return "(empty)";
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.length > 20) return str.slice(0, 17) + "...";
  return str;
});
</script>

<style scoped>
.save-node-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 120px;
}

.status {
  font-size: 10px;
  color: #888;
}

.value-display {
  font-size: 11px;
  background: #111;
  padding: 4px 8px;
  border-radius: 4px;
  color: #00ff88;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid #333;
}
</style>
