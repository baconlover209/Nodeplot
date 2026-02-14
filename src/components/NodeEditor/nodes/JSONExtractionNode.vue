<template>
    <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
        @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
        <div class="json-extraction-node-content">
            <div class="freeze-control">
                <label class="checkbox-container">
                    <input type="checkbox" v-model="node.data.freeze" />
                    <span class="checkmark"></span>
                    Freeze Structure
                </label>
            </div>
            <div class="info-text">
                {{ Object.keys(node.outputs).length }} fields extracted.
            </div>
        </div>
    </BaseNode>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate, getInputValueLive } from '../nodeEditorState';

const props = defineProps<{
    node: NodeDefinition;
    selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const jsonInput = computed(() => {
    return getInputValueLive(props.node.id, 'json');
});

function updateStructure() {
    if (props.node.data.freeze) return;

    const val = jsonInput.value;
    let changed = false;

    if (val && typeof val === 'object') {
        const keys = Array.isArray(val)
            ? ['length', ...Array.from({ length: Math.min(val.length, 50) }, (_, i) => i.toString())]
            : Object.keys(val);

        // Add missing outputs
        keys.forEach(key => {
            if (!(key in props.node.outputs)) {
                props.node.outputs[key] = null;
                changed = true;
            }
        });

        // Remove outputs that are no longer in the JSON
        Object.keys(props.node.outputs).forEach(key => {
            if (!keys.includes(key)) {
                delete props.node.outputs[key];
                changed = true;
            }
        });
    } else {
        // Not an object/array, clear outputs
        if (Object.keys(props.node.outputs).length > 0) {
            props.node.outputs = {};
            changed = true;
        }
    }

    if (changed) {
        triggerGraphUpdate();
    }
}

watch(jsonInput, () => {
    updateStructure();
}, { deep: true, immediate: true });

onMounted(() => {
    if (props.node.data.freeze === undefined) {
        props.node.data.freeze = false;
    }
    // Ensure 'json' input exists
    if (!('json' in props.node.inputs)) {
        props.node.inputs.json = null;
    }
    updateStructure();
});
</script>

<style scoped>
.json-extraction-node-content {
    padding: 10px;
    min-width: 160px;
}

.freeze-control {
    margin-bottom: 8px;
}

.info-text {
    font-size: 11px;
    color: #888;
}

.checkbox-container {
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 25px;
    cursor: pointer;
    font-size: 12px;
    color: #ccc;
    user-select: none;
}

.checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 16px;
    width: 16px;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 3px;
}

.checkbox-container:hover input~.checkmark {
    background-color: #444;
}

.checkbox-container input:checked~.checkmark {
    background-color: #00d2ff;
    border-color: #00d2ff;
}

.checkmark:after {
    content: "";
    position: absolute;
    display: none;
}

.checkbox-container input:checked~.checkmark:after {
    display: block;
}

.checkbox-container .checkmark:after {
    left: 5px;
    top: 2px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}
</style>
