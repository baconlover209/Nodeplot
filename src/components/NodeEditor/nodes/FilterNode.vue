<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="filter-node-content">
      <div class="label">Filter Array</div>
      <div class="info" v-if="outputSize !== null">
        Output: {{ outputSize }} items
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { getNodeValues } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

onMounted(() => {
    // Inputs
    if (!props.node.inputs['data']) props.node.inputs['data'] = null;
    if (!props.node.inputs['mask']) props.node.inputs['mask'] = null;
    
    // Output
    if (!props.node.outputs['filtered']) props.node.outputs['filtered'] = null;
});

const outputSize = computed(() => {
    const values = getNodeValues.value[props.node.id];
    if (values && values['filtered'] && Array.isArray(values['filtered'])) {
        return values['filtered'].length;
    }
    return null;
});
</script>

<style scoped>
.filter-node-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 100px;
  align-items: center;
}

.label {
    font-size: 11px;
    font-weight: bold;
    color: #00d2ff;
}

.info {
    font-size: 10px;
    color: #aaa;
}
</style>
