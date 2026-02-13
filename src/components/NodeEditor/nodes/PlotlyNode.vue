<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="plotly-node-content">
      <div class="info-icon">📊</div>
      <div class="info-text">Output to Main Chart</div>
      <div class="status" :class="{ active: hasData }">
        {{ hasData ? 'Receiving Data' : 'No Data' }}
      </div>
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

import { onMounted } from 'vue';

onMounted(() => {
    if (!props.node.inputs['data']) props.node.inputs['data'] = null;
    if (!props.node.inputs['layout']) props.node.inputs['layout'] = null;
    // Also outputs
    if (!props.node.outputs['selectedPoint']) props.node.outputs['selectedPoint'] = null;
    if (!props.node.outputs['hoverPoint']) props.node.outputs['hoverPoint'] = null;
});

const hasData = computed(() => {
    const values = getNodeValues.value[props.node.id];
    if (!values) return false;
    const data = values['data'];
    return data && (Array.isArray(data) ? data.length > 0 : true);
});
</script>

<style scoped>
.plotly-node-content {
  padding: 15px;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #151515;
  border-radius: 4px;
}

.info-icon {
  font-size: 24px;
}

.info-text {
  font-size: 12px;
  color: #ccc;
  font-weight: bold;
}

.status {
  font-size: 10px;
  color: #666;
  padding: 2px 6px;
  border-radius: 10px;
  background: #222;
  transition: all 0.3s ease;
}

.status.active {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
}
</style>
