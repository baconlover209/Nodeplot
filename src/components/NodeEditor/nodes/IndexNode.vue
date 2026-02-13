<template>
    <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
        @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
        <div class="index-controls">
            <div v-if="!isIndexConnected" class="control-group">
                <label>Index</label>
                <input type="number" v-model.number="node.data.index" @mousedown.stop @input="onUpdate" min="0"
                    placeholder="0" />
            </div>
            <div class="info" v-if="displayValue !== null">
                <div class="info-label">Current Value:</div>
                <div class="info-value">{{ formattedValue }}</div>
            </div>
        </div>
    </BaseNode>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseNode from "../BaseNode.vue";
import type { NodeDefinition } from "../nodeEditorState";
import {
    triggerGraphUpdate,
    nodeEditorState,
    pushHistoryState,
    getNodeValues,
} from "../nodeEditorState";

const props = defineProps<{
    node: NodeDefinition;
    selected: boolean;
}>();

defineEmits(["connect-start", "connect-end", "socket-click"]);

const isIndexConnected = computed(() =>
    nodeEditorState.connections.some(
        (c) => c.targetNodeId === props.node.id && c.targetPort === "index"
    )
);

const displayValue = computed(() => {
    const values = getNodeValues.value[props.node.id];
    return values ? values["value"] : null;
});

const formattedValue = computed(() => {
    const val = displayValue.value;
    if (val === null || val === undefined) return "None";
    if (Array.isArray(val)) return `Array(${val.length})`;
    if (typeof val === "object") return "Object";
    return String(val);
});

function onUpdate() {
    triggerGraphUpdate();
    pushHistoryState();
}
</script>

<style scoped>
.index-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 5px 0;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

label {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

input {
    width: 100%;
    background: #252525;
    color: #fff;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
    border-color: #00d2ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 210, 255, 0.2);
}

.info {
    background: #1a1a1a;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #333;
}

.info-label {
    font-size: 9px;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 2px;
}

.info-value {
    font-size: 11px;
    color: #00ff88;
    word-break: break-all;
    font-family: 'Fira Code', 'Courier New', Courier, monospace;
}
</style>
