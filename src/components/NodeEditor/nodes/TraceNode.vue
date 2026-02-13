<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="trace-node-content">
      <div class="control-header">Trace Config</div>
      <div class="control-group">
        <label>Type</label>
        <select v-model="localType" @change="updateData">
          <option value="scatter">Scatter</option>
          <option value="bar">Bar</option>
          <option value="pie">Pie</option>
          <option value="heatmap">Heatmap</option>
          <option value="histogram">Histogram</option>
          <option value="box">Box</option>
          <option value="surface">Surface</option>
          <option value="mesh3d">Mesh 3D</option>
          <option value="scatter3d">Scatter 3D</option>
          <option value="scattergeo">Scatter Geo</option>
          <option value="choropleth">Choropleth</option>
          <option value="scattermapbox">Scatter Mapbox</option>
          <option value="densitymapbox">Density Mapbox</option>
          <option value="strip">Strip</option>
          <option value="violin">Violin</option>
          <option value="sunburst">Sunburst</option>
        </select>
      </div>

      <div class="control-group" v-if="showMode">
        <label>Mode</label>
        <select v-model="localMode" @change="updateData">
          <option value="lines">Lines</option>
          <option value="markers">Markers</option>
          <option value="lines+markers">Lines+Markers</option>
          <option value="text">Text</option>
        </select>
      </div>

      <div class="control-group">
        <label>Name</label>
        <input type="text" v-model="localName" @change="updateData" placeholder="Trace Name" />
      </div>

       <div class="control-group">
        <label>Advanced Config (JSON)</label>
        <textarea 
            v-model="localConfig" 
            @change="updateData" 
            placeholder='{"marker": {"color": "red"}}'
            class="config-area"
        ></textarea>
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const localType = ref('scatter');
const localMode = ref('lines+markers');
const localName = ref('');
const localConfig = ref('');

const showMode = computed(() => {
    return localType.value === 'scatter' || localType.value === 'scatter3d' || localType.value === 'scattergeo' || localType.value === 'scattermapbox';
});

// Initialize from node data
onMounted(() => {
    if (props.node.data.type) localType.value = props.node.data.type;
    if (props.node.data.mode) localMode.value = props.node.data.mode;
    if (props.node.data.name) localName.value = props.node.data.name;
    if (props.node.data.config) localConfig.value = props.node.data.config;
    
    // Ensure initial input state
    updateInputs();

    // Retroactive fix for existing nodes missing the output
    if (!props.node.outputs['trace']) {
        props.node.outputs['trace'] = null;
    }
});

// Watch for external changes (e.g. undo/redo or load)
watch(() => props.node.data, (newData) => {
    if (newData.type !== localType.value) {
        localType.value = newData.type || 'scatter';
        updateInputs();
    }
    if (newData.mode !== localMode.value) localMode.value = newData.mode || 'lines+markers';
    if (newData.name !== localName.value) localName.value = newData.name || '';
    if (newData.config !== localConfig.value) localConfig.value = newData.config || '';
}, { deep: true });

function updateInputs() {
    const inputs = props.node.inputs;
    const type = localType.value;
    
    // Define inputs based on type
    const requiredInputs = new Set<string>();
    
    // Common inputs
    if (['scatter', 'bar', 'histogram', 'box'].includes(type)) {
        requiredInputs.add('x');
        requiredInputs.add('y');
    }
    
    // Specific type inputs
    if (type === 'pie') {
        requiredInputs.add('labels');
        requiredInputs.add('values');
        requiredInputs.add('text');
        requiredInputs.add('marker.colors');
    } else if (type === 'scatter') {
        requiredInputs.add('text');
        requiredInputs.add('marker.color');
        requiredInputs.add('marker.size');
    } else if (type === 'bar') {
        requiredInputs.add('text');
        requiredInputs.add('marker.color');
        requiredInputs.add('base');
    } else if (type === 'heatmap') {
        requiredInputs.add('z');
        requiredInputs.add('x');
        requiredInputs.add('y');
        requiredInputs.add('text');
    } else if (type === 'surface') {
        requiredInputs.add('z');
        requiredInputs.add('x');
        requiredInputs.add('y');
        requiredInputs.add('surfacecolor');
    } else if (type === 'mesh3d') {
        requiredInputs.add('x');
        requiredInputs.add('y');
        requiredInputs.add('z');
        requiredInputs.add('i');
        requiredInputs.add('j');
        requiredInputs.add('k');
        requiredInputs.add('intensity');
        requiredInputs.add('text');
        requiredInputs.add('facecolor');
    } else if (type === 'scatter3d') {
        requiredInputs.add('x');
        requiredInputs.add('y');
        requiredInputs.add('z');
        requiredInputs.add('text');
        requiredInputs.add('marker.color');
        requiredInputs.add('marker.size');
    } else if (type === 'histogram') {
        requiredInputs.add('marker.color');
    } else if (type === 'box') {
        requiredInputs.add('marker.color');
    } else if (type === 'scattergeo') {
        requiredInputs.add('lon');
        requiredInputs.add('lat');
        requiredInputs.add('locations');
        requiredInputs.add('text');
        requiredInputs.add('marker.color');
        requiredInputs.add('marker.size');
    } else if (type === 'choropleth') {
        requiredInputs.add('locations');
        requiredInputs.add('z');
        requiredInputs.add('text');
    } else if (type === 'scattermapbox') {
        requiredInputs.add('lon');
        requiredInputs.add('lat');
        requiredInputs.add('text');
        requiredInputs.add('marker.color');
        requiredInputs.add('marker.size');
    } else if (type === 'densitymapbox') {
        requiredInputs.add('lon');
        requiredInputs.add('lat');
        requiredInputs.add('z');
        requiredInputs.add('radius');
    } else if (type === 'strip') {
        requiredInputs.add('x');
        requiredInputs.add('y');
        requiredInputs.add('text');
        requiredInputs.add('jitter');
    } else if (type === 'violin') {
        requiredInputs.add('y');
        requiredInputs.add('x');
        requiredInputs.add('text');
        requiredInputs.add('marker.color');
        requiredInputs.add('side'); // 'positive', 'negative', 'both'
        requiredInputs.add('box'); // boolean for inner box plot
        requiredInputs.add('meanline'); // boolean
    } else if (type === 'sunburst') {
        requiredInputs.add('labels');
        requiredInputs.add('parents');
        requiredInputs.add('values');
        requiredInputs.add('text');
        requiredInputs.add('marker.colors');
    }
    
    // Common inputs
    if (['scatter', 'bar', 'histogram', 'box'].includes(type) || true) { // Always add config
        requiredInputs.add('config');
    }

    if (['scatter', 'bar', 'histogram', 'box'].includes(type)) {
        requiredInputs.add('x');
        requiredInputs.add('y');
    }
    
    // Add missing inputs
    for (const key of requiredInputs) {
        if (!(key in inputs)) {
            inputs[key] = null;
        }
    }
    
    // Remove extra inputs
    for (const key in inputs) {
        if (!requiredInputs.has(key)) {
            delete inputs[key];
        }
    }
    
    triggerGraphUpdate();
}


function updateData() {
    props.node.data.type = localType.value;
    props.node.data.mode = localMode.value;
    props.node.data.name = localName.value;
    props.node.data.config = localConfig.value;
    
    updateInputs(); // Update inputs if type changed
    
    triggerGraphUpdate();
}
</script>

<style scoped>
.trace-node-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}

.control-header {
    font-size: 11px;
    font-weight: bold;
    color: #00d2ff;
    border-bottom: 1px solid #333;
    padding-bottom: 4px;
    margin-bottom: 4px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-group label {
  font-size: 10px;
  color: #888;
}

.control-group select, 
.control-group input, 
.control-group textarea {
  background: #252525;
  border: 1px solid #444;
  color: #ddd;
  border-radius: 3px;
  padding: 4px;
  font-size: 11px;
  width: 100%;
  box-sizing: border-box;
}

.control-group select:focus, 
.control-group input:focus, 
.control-group textarea:focus {
  border-color: #00d2ff;
  outline: none;
}

.config-area {
    font-family: monospace;
    min-height: 60px;
    resize: vertical;
}
</style>
