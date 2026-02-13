<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="if-node-content">
      <div class="label">If / Else</div>
      <div class="status" :class="{ true: conditionValue, false: !conditionValue }">
        {{ conditionValue ? 'True' : 'False' }}
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

onMounted(() => {
    // Ensure inputs
    if (!props.node.inputs['condition']) props.node.inputs['condition'] = null;
    if (!props.node.inputs['trueValue']) props.node.inputs['trueValue'] = null;
    if (!props.node.inputs['falseValue']) props.node.inputs['falseValue'] = null;
    
    // Ensure output
    if (!props.node.outputs['output']) props.node.outputs['output'] = null;
});

const conditionValue = computed(() => {
    // We can peek at 'condition' input value? 
    // Actually evaluateNode computes the output, but we might want to see the condition state here.
    // 'nodeValues' contains outputs of this node.
    // But we want to know if the condition is true/false to show in UI.
    // The evaluateNode function for 'if' will likely put the Result in outputs.
    // It doesn't necessarily store the boolean condition result in public values unless we put it there.
    
    // Let's rely on the output. If output === trueValue, then true.
    // Use a small heuristic or just updated node data?
    return props.node.data.lastCondition || false;
});
</script>

<style scoped>
.if-node-content {
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
    color: #ffd700;
}

.status {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: #333;
    color: #888;
}

.status.true {
    color: #00ff88;
    background: rgba(0, 255, 136, 0.1);
}

.status.false {
    color: #ff5555;
    background: rgba(255, 85, 85, 0.1);
}
</style>
