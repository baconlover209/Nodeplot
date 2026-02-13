<template>
    <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
        @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
        <div class="fetch-node-content">
            <div class="input-group" v-if="!isUrlConnected">
                <label>URL</label>
                <input v-model="node.data.manualUrl" placeholder="https://..." class="text-input" @mousedown.stop
                    @input="onUpdate" />
            </div>

            <div class="status-indicator" :class="status">
                <span class="status-dot"></span>
                <span class="status-text">{{ statusLabel }}</span>
            </div>

            <div class="error-msg" v-if="status === 'error'">
                {{ errorMsg }}
            </div>

            <div class="preview-info" v-if="node.data.fetchedContent">
                <div class="info-row">
                    <span class="label">Type:</span>
                    <span class="value">{{ node.data.contentType?.split(';')[0] || 'unknown' }}</span>
                </div>
                <div class="info-row" v-if="Array.isArray(node.data.fetchedContent)">
                    <span class="label">Rows:</span>
                    <span class="value">{{ node.data.fetchedContent.length }}</span>
                </div>
            </div>
        </div>
    </BaseNode>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate, getNodeValues, nodeEditorState } from '../nodeEditorState';
import Papa from 'papaparse';

const props = defineProps<{
    node: NodeDefinition;
    selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const isUrlConnected = computed(() =>
    nodeEditorState.connections.some(c => c.targetNodeId === props.node.id && c.targetPort === 'url')
);

const currentUrl = computed(() => {
    const values = getNodeValues.value;
    const conn = nodeEditorState.connections.find(
        c => c.targetNodeId === props.node.id && c.targetPort === 'url'
    );
    if (conn) {
        const sourceValues = values[conn.sourceNodeId];
        return sourceValues ? sourceValues[conn.sourcePort] : null;
    }
    return props.node.data.manualUrl || null;
});

const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const errorMsg = ref('');

const statusLabel = computed(() => {
    switch (status.value) {
        case 'loading': return 'Fetching...';
        case 'success': return 'Success';
        case 'error': return 'Error';
        default: return 'Idle';
    }
});

async function fetchData(url: string) {
    if (!url) {
        status.value = 'idle';
        props.node.data.fetchedContent = null;
        triggerGraphUpdate();
        return;
    }

    status.value = 'loading';
    try {
        // Simple proxy check or just direct fetch
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const contentType = response.headers.get('content-type') || '';
        props.node.data.contentType = contentType;

        const text = await response.text();

        if (contentType.includes('csv') || url.toLowerCase().includes('.csv')) {
            Papa.parse(text, {
                header: false,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    props.node.data.fetchedContent = results.data;
                    status.value = 'success';
                    triggerGraphUpdate(true);
                },
                error: (_err: any) => {
                    errorMsg.value = "CSV Parse Error";
                    status.value = 'error';
                    triggerGraphUpdate(true);
                }
            });
        } else if (contentType.includes('json') || url.toLowerCase().includes('.json')) {
            try {
                props.node.data.fetchedContent = JSON.parse(text);
                status.value = 'success';
            } catch (e) {
                errorMsg.value = "JSON Parse Error";
                status.value = 'error';
            }
            triggerGraphUpdate();
        } else {
            // Treat as text/raw
            props.node.data.fetchedContent = text;
            status.value = 'success';
            triggerGraphUpdate();
        }
    } catch (e: any) {
        console.error('Fetch error:', e);
        errorMsg.value = e.message;
        status.value = 'error';
        props.node.data.fetchedContent = null;
        triggerGraphUpdate();
    }
}

watch(currentUrl, (newUrl) => {
    fetchData(newUrl);
}, { immediate: true });

function onUpdate() {
    // This is called for manual URL changes
    // The watch will handle the fetch
}
</script>

<style scoped>
.fetch-node-content {
    padding: 5px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 160px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

label {
    font-size: 9px;
    color: #666;
    text-transform: uppercase;
    font-weight: bold;
}

.text-input {
    background: #333;
    border: 1px solid #444;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
}

.text-input:focus {
    border-color: #00d2ff;
    outline: none;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #555;
}

.loading .status-dot {
    background: #ffaa00;
    box-shadow: 0 0 5px #ffaa00;
}

.success .status-dot {
    background: #00ff88;
    box-shadow: 0 0 5px #00ff88;
}

.error .status-dot {
    background: #ff4444;
    box-shadow: 0 0 5px #ff4444;
}

.status-text {
    color: #aaa;
}

.loading .status-text {
    color: #ffaa00;
}

.success .status-text {
    color: #00ff88;
}

.error .status-text {
    color: #ff4444;
}

.error-msg {
    font-size: 9px;
    color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
    padding: 4px;
    border-radius: 2px;
    word-break: break-all;
}

.preview-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
}

.info-row .label {
    color: #666;
}

.info-row .value {
    color: #00d2ff;
    font-family: monospace;
}
</style>
