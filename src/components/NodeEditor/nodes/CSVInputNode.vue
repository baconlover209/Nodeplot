<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="csv-input-config">
      <div v-if="csvStore.files.length > 0" class="file-select-container">
        <select @change="handleFileSelect" :value="node.data.fileId || ''" class="node-file-select" @mousedown.stop>
          <option value="" disabled>Select File...</option>
          <option v-for="file in csvStore.files" :key="file.id" :value="file.id">
            {{ file.name }}
          </option>
        </select>
      </div>

      <input type="file" accept=".csv" @change="handleFileUpload" @mousedown.stop class="file-input" />

      <div v-if="node.data.fileName" class="file-info">
        <div class="file-name">{{ node.data.fileName }}</div>
        <div class="dimensions">
          <span class="dim-label">Width:</span> {{ node.data.width }} cols
        </div>
        <div class="dimensions">
          <span class="dim-label">Height:</span> {{ node.data.height }} rows
        </div>
      </div>

      <div v-else class="no-file">
        No file selected
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">

import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate } from '../nodeEditorState';
import { csvStore } from '../../../stores/csvStore';
import Papa from 'papaparse';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

function handleFileSelect(event: Event) {
  const select = event.target as HTMLSelectElement;
  const fileId = select.value;
  const file = csvStore.files.find(f => f.id === fileId);

  if (file && file.arrayData) {
    updateNodeData(file.id, file.name, file.arrayData);
  }
}

function updateNodeData(fileId: string, fileName: string, data: any[][]) {
  props.node.data.fileId = fileId;
  props.node.data.fileName = fileName;
  props.node.data.csvData = data;
  props.node.data.width = (data.length > 0 && data[0]) ? data[0].length : 0;
  props.node.data.height = data.length;
  triggerGraphUpdate();
}

function handleFileUpload(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;

    // Parse 1: Objects (for Store/DataGrid)
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (resObj) => {
        // Parse 2: Arrays (for Node)
        Papa.parse(text, {
          header: false,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (resArr) => {
            const data = resObj.data as any[];
            const arrayData = resArr.data as any[][];

            const id = csvStore.addFile({
              name: file.name,
              data: data,
              arrayData: arrayData,
              width: (data.length > 0) ? Object.keys(data[0] || {}).length : 0,
              height: data.length
            });

            // Auto-select
            if (arrayData) {
              updateNodeData(id, file.name, arrayData);
            }
          }
        });
      }
    });
  };
  reader.readAsText(file);
}

// Watch for changes in the active file data to keep node in sync
import { watch } from 'vue';
watch(() => {
  const file = csvStore.files.find(f => f.id === props.node.data.fileId);
  return file?.arrayData;
}, (newArrayData) => {
  if (newArrayData && newArrayData !== props.node.data.csvData) {
    props.node.data.csvData = newArrayData;
    props.node.data.width = (newArrayData.length > 0 && newArrayData[0]) ? newArrayData[0].length : 0;
    props.node.data.height = newArrayData.length;
    // Only trigger update if this node is actually used
    triggerGraphUpdate();
  }
}, { deep: true });
</script>

<style scoped>
.csv-input-config {
  padding: 5px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-select-container {
  margin-bottom: 4px;
}

.node-file-select {
  width: 100%;
  background: #333;
  color: #eee;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 3px;
  font-size: 10px;
}

.file-input {
  font-size: 10px;
  color: #fff;
  background: #333;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px;
  cursor: pointer;
}

.file-input::file-selector-button {
  background: #444;
  color: #fff;
  border: 1px solid #666;
  border-radius: 2px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 10px;
}

.file-input::file-selector-button:hover {
  background: #555;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background: #1a1a1a;
  border-radius: 3px;
}

.file-name {
  font-size: 10px;
  color: #00d2ff;
  font-weight: bold;
  word-break: break-all;
}

.dimensions {
  font-size: 9px;
  color: #aaa;
  font-family: monospace;
}

.dim-label {
  color: #666;
  font-weight: bold;
}

.no-file {
  font-size: 10px;
  color: #666;
  text-align: center;
  padding: 8px;
}
</style>
