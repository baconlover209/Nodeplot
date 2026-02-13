<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="compare-node-content">
      <select v-model="localOp" @change="updateOp">
        <option value=">">></option>
        <option value="<"><</option>
        <option value=">=">>=</option>
        <option value="<="><=</option>
        <option value="==">==</option>
        <option value="!=">!=</option>
      </select>
      <div class="result-preview" v-if="hasResult">
        {{ resultPreview }}
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate, getNodeValues } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const localOp = ref('>');

onMounted(() => {
    if (props.node.data.operation) {
        localOp.value = props.node.data.operation;
    }
    
    // Ensure inputs exist
    if (!props.node.inputs['a']) props.node.inputs['a'] = null;
    if (!props.node.inputs['b']) props.node.inputs['b'] = null;
    
    // Ensure output exists
    if (!props.node.outputs['result']) props.node.outputs['result'] = null;
});

watch(() => props.node.data.operation, (newOp) => {
    if (newOp !== localOp.value) {
        localOp.value = newOp || '>';
    }
});

function updateOp() {
    props.node.data.operation = localOp.value;
    triggerGraphUpdate();
}

const hasResult = computed(() => {
    const values = getNodeValues.value[props.node.id];
    return values && values['result'] !== undefined;
});

const resultPreview = computed(() => {
    const values = getNodeValues.value[props.node.id];
    if (!values) return '';
    const res = values['result'];
    if (Array.isArray(res)) {
        return `Array(${res.length})`;
    }
    return String(res);
});
</script>

<style scoped>
.compare-node-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 100px;
  align-items: center;
}

select {
  background: #222;
  color: #fff;
  border: 1px solid #444;
  padding: 2px 5px;
  border-radius: 4px;
  width: 100%;
  text-align: center;
  font-weight: bold;
}

.result-preview {
  font-size: 10px;
  color: #aaa;
}
</style>
