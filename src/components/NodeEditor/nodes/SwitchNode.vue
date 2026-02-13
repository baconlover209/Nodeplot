<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="switch-node-content">
      <div v-if="currentInputIndex !== null" class="current-index">
        Active Input: {{ currentInputIndex }}
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

// Computed to get the currently active input index from nodeValues
// We need to access the reactive state directly to be reactive
const currentInputIndex = computed(() => {
    // Access internal nodeValues state if possible, or we rely on the node data if we store it there
    // The evaluateNode function in nodeEditorState updates nodeValues.
    // We can also compute it here for display purposes if needed, 
    // but better to let the evaluation engine handle it.
    // However, for the UI "Active Input: X", we want to know what the switch is doing.
    // Let's assume evaluation puts it in `node.data.activeIndex` or similar if we want to show it,
    // or we can read the input 'index' value directly here.
    
    // For now, simple display logic:
    return null; 
});

// Watch connections to manage inputs
const connections = computed(() => nodeEditorState.connections);

function updateInputs() {
    const inputs = props.node.inputs;
    
    // Ensure 'index' exists
    if (!('index' in inputs)) {
        inputs['index'] = null;
    }

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
    // e.g. if input2 is connected, we want input0, input1, input2, input3.
    // If nothing connected, we want input0.
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
    // We must be careful not to remove 'index' or non-input keys (though this specific node only has index + inputN)
    // And strict rule: only remove if it's > targetMaxIndex AND not connected (double check logic)
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
        // Force update if needed, though Vue reactivity on objects should handle it 
        // if `inputs` is reactive. Node definitions in state are reactive.
        triggerGraphUpdate();
    }
}

watch(connections, () => {
    updateInputs();
}, { deep: true, immediate: true });

onMounted(() => {
    updateInputs();
});

</script>

<style scoped>
.switch-node-content {
    padding: 5px;
    font-size: 10px;
    color: #aaa;
}
</style>
