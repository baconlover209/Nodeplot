<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="joiner-node-content">
      <div class="info-text">
        Joins inputs into a list.
        <br>
        {{ activeInputCount }} inputs active.
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { nodeEditorState, triggerGraphUpdate } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const connections = computed(() => nodeEditorState.connections);

const activeInputCount = computed(() => {
    return Object.keys(props.node.inputs).length;
});

function updateInputs() {
    const inputs = props.node.inputs;
    
    // Find all 'inputN' keys
    const inputKeys = Object.keys(inputs)
        .filter(k => k.startsWith('input'))
        .sort((a, b) => {
            const numA = parseInt(a.replace('input', ''));
            const numB = parseInt(b.replace('input', ''));
            return numA - numB;
        });

    // Check which ones have connections
    const connectedInputs = new Set<string>();
    connections.value.forEach(conn => {
        if (conn.targetNodeId === props.node.id && conn.targetPort.startsWith('input')) {
            connectedInputs.add(conn.targetPort);
        }
    });

    // Determine max connected index
    let maxConnectedIndex = -1;
    inputKeys.forEach(key => {
        if (connectedInputs.has(key)) {
            const index = parseInt(key.replace('input', ''));
            if (index > maxConnectedIndex) maxConnectedIndex = index;
        }
    });

    // We want inputs up to maxConnectedIndex + 1
    const targetMaxIndex = maxConnectedIndex + 1;

    let changed = false;

    // Add missing inputs
    for (let i = 0; i <= targetMaxIndex; i++) {
        const key = `input${i}`;
        if (!(key in inputs)) {
            inputs[key] = null;
            changed = true;
        }
    }

    // Remove excess inputs
    Object.keys(inputs).forEach(key => {
        if (key.startsWith('input')) {
            const index = parseInt(key.replace('input', ''));
            if (index > targetMaxIndex) {
                 delete inputs[key];
                 changed = true;
            }
        }
    });

    if (changed) {
        triggerGraphUpdate();
    }
}

watch(connections, () => {
    updateInputs();
}, { deep: true, immediate: true });

onMounted(() => {
    updateInputs();
    if (!props.node.outputs['list']) {
        props.node.outputs['list'] = null;
    }
});
</script>

<style scoped>
.joiner-node-content {
  padding: 10px;
  min-width: 120px;
  text-align: center;
}

.info-text {
    font-size: 11px;
    color: #888;
}
</style>
