<template>
    <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
        @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
        <div class="range-controls">
            <div v-if="!isSizeConnected" class="control-group">
                <label>Size</label>
                <input type="number" v-model.number="node.data.a" @mousedown.stop @input="onUpdate" min="0" />
            </div>

            <div v-if="!isStepConnected" class="control-group">
                <label>Step</label>
                <input type="number" v-model.number="node.data.b" @mousedown.stop @input="onUpdate" />
            </div>

            <div v-if="!isStartConnected" class="control-group">
                <label>Start</label>
                <input type="number" v-model.number="node.data.c" @mousedown.stop @input="onUpdate" />
            </div>
        </div>
    </BaseNode>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate, nodeEditorState } from '../nodeEditorState';

const props = defineProps<{
    node: NodeDefinition;
    selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const isSizeConnected = computed(() =>
    nodeEditorState.connections.some(c => c.targetNodeId === props.node.id && c.targetPort === 'size')
);

const isStepConnected = computed(() =>
    nodeEditorState.connections.some(c => c.targetNodeId === props.node.id && c.targetPort === 'step')
);

const isStartConnected = computed(() =>
    nodeEditorState.connections.some(c => c.targetNodeId === props.node.id && c.targetPort === 'start')
);

function onUpdate() {
    triggerGraphUpdate();
}
</script>

<style scoped>
.range-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 5px 0;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

label {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
}

input {
    width: 100%;
    background: #333;
    color: #fff;
    border: 1px solid #555;
    border-radius: 3px;
    padding: 4px;
    font-size: 11px;
}

input:focus {
    border-color: #00d2ff;
    outline: none;
}
</style>
