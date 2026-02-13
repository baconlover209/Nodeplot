<template>
    <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
        @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
        <div class="geojson-node">
            <div class="control-group">
                <label>Upload GeoJSON</label>
                <input type="file" accept=".json,.geojson" @change="handleFileUpload" @mousedown.stop
                    class="file-input" />
            </div>

            <div class="divider">OR</div>

            <div class="control-group">
                <label>URL</label>
                <div class="url-input-container">
                    <input type="text" v-model="localUrl" placeholder="https://.../data.geojson" @change="fetchFromUrl"
                        @mousedown.stop />
                    <button @click="fetchFromUrl" class="fetch-btn">Fetch</button>
                </div>
            </div>

            <div v-if="node.data.fileName || node.data.url" class="file-info">
                <div class="file-name">{{ node.data.fileName || 'URL Loaded' }}</div>
                <div class="stats" v-if="node.data.geojsonData">
                    <div class="stat-item"><span class="label">Type:</span> {{ node.data.geojsonData.type }}</div>
                    <div class="stat-item" v-if="node.data.geojsonData.features">
                        <span class="label">Features:</span> {{ node.data.geojsonData.features.length }}
                    </div>
                </div>
            </div>

            <div v-if="error" class="error-msg">
                {{ error }}
            </div>
        </div>
    </BaseNode>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate } from '../nodeEditorState';

const props = defineProps<{
    node: NodeDefinition;
    selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const localUrl = ref(props.node.data.url || '');
const error = ref('');

onMounted(() => {
    if (!props.node.outputs['data']) {
        props.node.outputs['data'] = null;
    }
    if (props.node.data.url && !props.node.data.geojsonData) {
        fetchFromUrl();
    }
});

function handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    error.value = '';
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            updateNodeData(json, file.name, '');
        } catch (err) {
            error.value = 'Failed to parse GeoJSON file';
            console.error(err);
        }
    };
    reader.readAsText(file);
}

async function fetchFromUrl() {
    if (!localUrl.value) return;

    error.value = '';
    try {
        const response = await fetch(localUrl.value);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        updateNodeData(json, '', localUrl.value);
    } catch (err) {
        error.value = 'Failed to fetch GeoJSON from URL';
        console.error(err);
    }
}

function updateNodeData(data: any, fileName: string, url: string) {
    props.node.data.geojsonData = data;
    props.node.data.fileName = fileName;
    props.node.data.url = url;
    triggerGraphUpdate();
}
</script>

<style scoped>
.geojson-node {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 200px;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.control-group label {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
}

.file-input {
    font-size: 10px;
    color: #fff;
    background: #252525;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 4px;
    width: 100%;
    box-sizing: border-box;
}

.file-input::file-selector-button {
    background: #333;
    color: #fff;
    border: 1px solid #555;
    border-radius: 2px;
    padding: 2px 6px;
    cursor: pointer;
    font-size: 10px;
    margin-right: 8px;
}

.divider {
    font-size: 9px;
    color: #444;
    text-align: center;
    position: relative;
}

.divider::before,
.divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 30%;
    height: 1px;
    background: #333;
}

.divider::before {
    left: 0;
}

.divider::after {
    right: 0;
}

.url-input-container {
    display: flex;
    gap: 4px;
}

.url-input-container input {
    flex: 1;
    background: #252525;
    border: 1px solid #444;
    color: #ddd;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
}

.fetch-btn {
    background: #00d2ff22;
    color: #00d2ff;
    border: 1px solid #00d2ff44;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    cursor: pointer;
}

.fetch-btn:hover {
    background: #00d2ff33;
}

.file-info {
    background: rgba(0, 210, 255, 0.05);
    border: 1px solid rgba(0, 210, 255, 0.2);
    border-radius: 4px;
    padding: 8px;
}

.file-name {
    font-size: 11px;
    font-weight: bold;
    color: #00d2ff;
    margin-bottom: 4px;
    word-break: break-all;
}

.stats {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.stat-item {
    font-size: 10px;
    color: #aaa;
}

.stat-item .label {
    color: #666;
}

.error-msg {
    color: #ff4444;
    font-size: 10px;
    background: rgba(255, 68, 68, 0.1);
    padding: 4px;
    border-radius: 4px;
    border: 1px solid rgba(255, 68, 68, 0.2);
}
</style>
