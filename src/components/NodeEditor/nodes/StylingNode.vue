<template>
    <BaseNode :node="node" :selected="selected" class="styling-node" @connect-start="$emit('connect-start', $event)"
        @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
        <div class="styling-node-content">
            <div class="styling-header">
                <div class="header-main">
                    <div class="i-mdi-brush header-icon"></div>
                    <span>Trace Styler</span>
                </div>
                <div class="trace-count" v-if="traceInfo">
                    {{ traceInfo.count }} Trace{{ traceInfo.count > 1 ? 's' : '' }} detected
                </div>
            </div>

            <div class="trace-selector-row">
                <label>Target Trace</label>
                <select v-model="localSelectedIndex" @change="updateSelectedIndex">
                    <option :value="-1">All Traces</option>
                    <option v-for="(t, idx) in availableTraces" :key="idx" :value="idx">
                        Trace {{ idx + 1 }}: {{ t.name || t.type }}
                    </option>
                </select>
            </div>

            <div class="component-grid">
                <div v-for="comp in filteredComponents" :key="comp.id" class="comp-card"
                    :class="{ active: activeComp === comp.id, 'found': comp.isFound }" @click="activeComp = comp.id">
                    <div :class="comp.icon"></div>
                    <span class="comp-name">{{ comp.label }}</span>
                    <div class="found-dot" v-if="comp.isFound" title="Detected in trace"></div>
                </div>
            </div>

            <div class="styling-controls" v-if="activeComp">
                <div class="control-scroll-area" @wheel.stop>
                    <!-- Marker Controls -->
                    <div v-if="activeComp === 'marker'" class="comp-group">
                        <div class="group-title">Marker Properties</div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Color</label>
                                <input type="text" v-model="styling.marker_color" @input="updateData"
                                    placeholder="blue / #rgb">
                            </div>
                            <div class="input-wrap" style="width: 80px">
                                <label>Size</label>
                                <input type="number" v-model.number="styling.marker_size" @input="updateData">
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Symbol</label>
                                <select v-model="styling.marker_symbol" @change="updateData">
                                    <option value="circle">Circle</option>
                                    <option value="square">Square</option>
                                    <option value="diamond">Diamond</option>
                                    <option value="cross">Cross</option>
                                    <option value="x">X</option>
                                    <option value="triangle-up">Triangle</option>
                                    <option value="star">Star</option>
                                </select>
                            </div>
                            <div class="input-wrap" style="width: 80px">
                                <label>Opacity</label>
                                <input type="number" v-model.number="styling.marker_opacity" step="0.1" min="0" max="1"
                                    @input="updateData">
                            </div>
                        </div>
                        <div class="group-subtitle">Border</div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Line Color</label>
                                <input type="text" v-model="styling.marker_line_color" @input="updateData">
                            </div>
                            <div class="input-wrap" style="width: 80px">
                                <label>Width</label>
                                <input type="number" v-model.number="styling.marker_line_width" @input="updateData">
                            </div>
                        </div>
                    </div>

                    <!-- Line Controls -->
                    <div v-if="activeComp === 'line'" class="comp-group">
                        <div class="group-title">Line Properties</div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Color</label>
                                <input type="text" v-model="styling.line_color" @input="updateData">
                            </div>
                            <div class="input-wrap" style="width: 80px">
                                <label>Width</label>
                                <input type="number" v-model.number="styling.line_width" @input="updateData">
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Dash</label>
                                <select v-model="styling.line_dash" @change="updateData">
                                    <option value="solid">Solid</option>
                                    <option value="dash">Dash</option>
                                    <option value="dot">Dot</option>
                                    <option value="dashdot">DashDot</option>
                                    <option value="longdash">Long Dash</option>
                                </select>
                            </div>
                            <div class="input-wrap">
                                <label>Shape</label>
                                <select v-model="styling.line_shape" @change="updateData">
                                    <option value="linear">Linear</option>
                                    <option value="spline">Spline</option>
                                    <option value="hv">HV</option>
                                    <option value="vh">VH</option>
                                    <option value="hvh">HVH</option>
                                    <option value="vhv">VHV</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Fill Controls -->
                    <div v-if="activeComp === 'fill'" class="comp-group">
                        <div class="group-title">Fill Properties</div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Target</label>
                                <select v-model="styling.fill" @change="updateData">
                                    <option value="none">None</option>
                                    <option value="tozeroy">To Zero Y</option>
                                    <option value="tozerox">To Zero X</option>
                                    <option value="tonexty">To Next Y</option>
                                    <option value="tonextx">To Next X</option>
                                    <option value="toself">To Self</option>
                                </select>
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Fill Color</label>
                                <input type="text" v-model="styling.fillcolor" @input="updateData">
                            </div>
                        </div>
                    </div>

                    <!-- Text Controls -->
                    <div v-if="activeComp === 'text'" class="comp-group">
                        <div class="group-title">Text Properties</div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Position</label>
                                <select v-model="styling.textposition" @change="updateData">
                                    <option value="top center">Top Center</option>
                                    <option value="middle center">Middle Center</option>
                                    <option value="bottom center">Bottom Center</option>
                                    <option value="top left">Top Left</option>
                                    <option value="top right">Top Right</option>
                                </select>
                            </div>
                        </div>
                        <div class="group-subtitle">Font</div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Color</label>
                                <input type="text" v-model="styling.textfont_color" @input="updateData">
                            </div>
                            <div class="input-wrap" style="width: 80px">
                                <label>Size</label>
                                <input type="number" v-model.number="styling.textfont_size" @input="updateData">
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Family</label>
                                <input type="text" v-model="styling.textfont_family" @input="updateData"
                                    placeholder="Arial, sans-serif">
                            </div>
                        </div>
                    </div>

                    <!-- General Controls -->
                    <div v-if="activeComp === 'general'" class="comp-group">
                        <div class="group-title">General Properties</div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Trace Name</label>
                                <input type="text" v-model="styling.name" @input="updateData">
                            </div>
                        </div>
                        <div v-if="selectedTrace?.type === 'pie'" class="control-row">
                            <div class="input-wrap">
                                <label>Hole Size</label>
                                <input type="number" v-model.number="styling.hole" step="0.1" min="0" max="0.9"
                                    @input="updateData">
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="check-wrap">
                                <input type="checkbox" v-model="styling.showlegend" @change="updateData">
                                <label>Show Legend</label>
                            </div>
                            <div class="check-wrap">
                                <input type="checkbox" v-model="styling.visible" @change="updateData">
                                <label>Visible</label>
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="input-wrap">
                                <label>Opacity</label>
                                <input type="number" v-model.number="styling.opacity" step="0.1" min="0" max="1"
                                    @input="updateData">
                            </div>
                        </div>
                    </div>

                    <!-- Palette / Colorscale Controls -->
                    <div v-if="activeComp === 'palette'" class="comp-group">
                        <div class="group-title">Color Palette & Scale</div>

                        <div v-if="isDiscreteTrace" class="comp-subgroup">
                            <div v-if="discreteLabels.length > 0 && discreteLabels.length <= 12" class="category-list">
                                <div v-for="(label, idx) in discreteLabels" :key="idx" class="category-item">
                                    <span class="label-text">{{ label }}</span>
                                    <input type="color" v-model="categoryColors[label as string]"
                                        @input="updateCategoryStyles">
                                </div>
                            </div>
                            <div v-else-if="discreteLabels.length > 12" class="fallback-note">
                                Many categories detected ({{ discreteLabels.length }}). Using JSON fallback.
                            </div>

                            <div class="control-row">
                                <div class="input-wrap">
                                    <label>Colors (JSON Array or Variable)</label>
                                    <input type="text" v-model="styling.marker_colors_json" @input="updateData"
                                        placeholder='["red", "blue", "green"]'>
                                </div>
                            </div>
                        </div>

                        <div v-else class="comp-subgroup">
                            <div class="control-row">
                                <div class="input-wrap">
                                    <label>Colorscale</label>
                                    <select v-model="styling.colorscale" @change="updateData">
                                        <option value="Viridis">Viridis</option>
                                        <option value="Plasma">Plasma</option>
                                        <option value="Inferno">Inferno</option>
                                        <option value="Magma">Magma</option>
                                        <option value="Bluered">BlueRed</option>
                                        <option value="RdBu">RdBu</option>
                                        <option value="Reds">Reds</option>
                                        <option value="Greens">Greens</option>
                                        <option value="YlGnBu">YlGnBu</option>
                                        <option value="Hot">Hot</option>
                                        <option value="Jet">Jet</option>
                                    </select>
                                </div>
                            </div>
                            <div class="control-row">
                                <div class="check-wrap">
                                    <input type="checkbox" v-model="styling.showscale" @change="updateData">
                                    <label>Show Color Bar</label>
                                </div>
                                <div class="check-wrap">
                                    <input type="checkbox" v-model="styling.reversescale" @change="updateData">
                                    <label>Reverse Scale</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="empty-state">
                Select a component to start styling
            </div>

        </div>
    </BaseNode>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from 'vue';
import BaseNode from '../BaseNode.vue';
import { type NodeDefinition, triggerGraphUpdate, getNodeValues } from '../nodeEditorState';

const props = defineProps<{
    node: NodeDefinition;
    selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

const activeComp = ref('marker');
const localSelectedIndex = ref(-1);

const availableTraces = computed(() => {
    const values = getNodeValues.value[props.node.id];
    const inputTrace = values?.['_input_trace'];
    if (!inputTrace) return [];
    return Array.isArray(inputTrace) ? inputTrace : [inputTrace];
});

const selectedTrace = computed(() => {
    if (localSelectedIndex.value === -1) return availableTraces.value[0] || null;
    return availableTraces.value[localSelectedIndex.value] || null;
});

const isDiscreteTrace = computed(() => {
    const trace = selectedTrace.value;
    return trace && (trace.type === 'pie' || trace.type === 'sunburst' || trace.type === 'funnelarea');
});

const discreteLabels = computed(() => {
    const trace = selectedTrace.value;
    if (!trace || !trace.labels) return [];
    return Array.from(new Set(trace.labels));
});

const categoryColors = reactive<Record<string, string>>({});

const styling = reactive({
    marker_color: '',
    marker_size: 6,
    marker_symbol: 'circle',
    marker_opacity: 1,
    marker_line_color: '',
    marker_line_width: 0,
    line_color: '',
    line_width: 2,
    line_dash: 'solid',
    line_shape: 'linear',
    fill: 'none',
    fillcolor: '',
    textposition: 'top center',
    textfont_size: 12,
    textfont_color: '',
    textfont_family: '',
    name: '',
    showlegend: true,
    visible: true,
    opacity: 1,
    // New props
    colorscale: 'Viridis',
    showscale: true,
    reversescale: false,
    marker_colors_json: '',
    hole: 0
});

function updateCategoryStyles() {
    // Generate JSON array based on current trace labels order using categoryColors map
    const trace = selectedTrace.value;
    if (!trace || !trace.labels) return;

    const colorArray = trace.labels.map((l: string) => categoryColors[l] || '');
    styling.marker_colors_json = JSON.stringify(colorArray);
    updateData();
}

const filteredComponents = computed(() => {
    const info = traceInfo.value;
    const trace = selectedTrace.value;
    if (!trace) return [];

    const all = [
        { id: 'marker', label: 'Marker', icon: 'i-mdi-dots-horizontal-circle', isFound: info?.hasMarker, supported: ['scatter', 'bar', 'pie', 'box', 'violin', 'histogram', 'scatter3d', 'scattergeo', 'scattermapbox'] },
        { id: 'line', label: 'Line', icon: 'i-mdi-vector-line', isFound: info?.hasLine, supported: ['scatter', 'box', 'violin', 'scatter3d', 'scattergeo', 'scattermapbox'] },
        { id: 'fill', label: 'Fill', icon: 'i-mdi-format-color-fill', isFound: info?.hasFill, supported: ['scatter', 'bar', 'box', 'violin', 'histogram'] },
        { id: 'palette', label: 'Palette', icon: 'i-mdi-palette-outline', isFound: info?.hasPalette, supported: ['heatmap', 'pie', 'sunburst', 'surface', 'contour', 'scatter', 'bar', 'scatter3d'] },
        { id: 'text', label: 'Text', icon: 'i-mdi-format-text', isFound: info?.hasText, supported: ['scatter', 'bar', 'pie', 'scatter3d', 'scattergeo', 'scattermapbox'] },
        { id: 'general', label: 'General', icon: 'i-mdi-settings-outline', isFound: true, supported: '*' }
    ];

    return all.filter(c => c.supported === '*' || (trace.type && c.supported.includes(trace.type)));
});

const traceInfo = computed(() => {
    const traces = availableTraces.value;
    if (traces.length === 0) return null;

    const trace = selectedTrace.value || traces[0];
    if (!trace) return null;

    return {
        count: traces.length,
        hasMarker: !!trace.marker || ['scatter', 'bar', 'scatter3d', 'scattergeo', 'scattermapbox'].includes(trace.type),
        hasLine: !!trace.line || trace.type === 'scatter',
        hasFill: !!trace.fill && trace.fill !== 'none',
        hasText: !!trace.text,
        hasPalette: !!trace.colorscale || ['heatmap', 'pie', 'sunburst', 'surface'].includes(trace.type)
    };
});

onMounted(() => {
    // Load config values if present
    if (props.node.data.styling) {
        Object.assign(styling, props.node.data.styling);
    }
    if (props.node.data.selectedTraceIndex !== undefined) {
        localSelectedIndex.value = props.node.data.selectedTraceIndex;
    }

    // Initialize ports
    if (!props.node.inputs['trace']) props.node.inputs['trace'] = null;
    if (!props.node.outputs['trace']) props.node.outputs['trace'] = null;
});

function updateSelectedIndex() {
    props.node.data.selectedTraceIndex = localSelectedIndex.value;
    triggerGraphUpdate();
}

function updateData() {
    props.node.data.styling = { ...styling };
    triggerGraphUpdate();
}

watch(() => props.node.data.styling, (newVal) => {
    if (newVal) {
        Object.assign(styling, newVal);
    }
}, { deep: true });
</script>

<style scoped>
.styling-node :deep(.node-container) {
    min-width: 340px;
}

.styling-node-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    color: #eee;
}

.styling-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 8px;
}

.header-main {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    color: #00d2ff;
}

.header-icon {
    font-size: 18px;
}

.trace-count {
    font-size: 10px;
    color: #888;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 10px;
}

.trace-selector-row {
    background: #252525;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid #333;
}

.trace-selector-row label {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
    font-weight: bold;
}

.trace-selector-row select {
    background: #1a1a1a;
    border-color: #444;
}

.component-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
}

.comp-card {
    background: #252525;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.comp-card:hover {
    border-color: #555;
    background: #2a2a2a;
}

.comp-card.active {
    background: rgba(0, 210, 255, 0.1);
    border-color: #00d2ff;
}

.comp-card.found {
    border-style: solid;
}

.comp-card [class^="i-"] {
    font-size: 20px;
    color: #aaa;
}

.comp-card.active [class^="i-"] {
    color: #00d2ff;
}

.comp-name {
    font-size: 10px;
    font-weight: 500;
}

.found-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 4px;
    height: 4px;
    background: #00ff88;
    border-radius: 50%;
    box-shadow: 0 0 5px #00ff88;
}

.styling-controls {
    background: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #333;
}

.control-scroll-area {
    max-height: 250px;
    overflow-y: auto;
    padding: 12px;
}

.control-scroll-area::-webkit-scrollbar {
    width: 4px;
}

.control-scroll-area::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 2px;
}

.comp-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.comp-subgroup {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 4px;
    border-left: 2px solid rgba(0, 210, 255, 0.1);
}

.group-title {
    font-size: 11px;
    font-weight: bold;
    color: #00d2ff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.group-subtitle {
    font-size: 10px;
    color: #666;
    margin-top: 4px;
    border-bottom: 1px dotted #333;
}

.control-row {
    display: flex;
    gap: 8px;
}

.input-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.input-wrap label {
    font-size: 10px;
    color: #888;
}

.check-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
}

.check-wrap label {
    font-size: 11px;
    color: #ccc;
}

input[type="text"],
input[type="number"],
select {
    background: #252525;
    border: 1px solid #333;
    color: #ddd;
    border-radius: 4px;
    padding: 6px;
    font-size: 12px;
    width: 100%;
    box-sizing: border-box;
}

input:focus,
select:focus {
    border-color: #00d2ff;
    outline: none;
}

.fallback-note {
    font-size: 10px;
    color: #888;
    background: rgba(255, 100, 0, 0.05);
    padding: 8px;
    border-radius: 4px;
    border: 1px dashed rgba(255, 100, 0, 0.2);
}

.category-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #1a1a1a;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #333;
}

.category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.category-item .label-text {
    font-size: 11px;
    color: #ccc;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.category-item input[type="color"] {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
}

.category-item input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
}

.category-item input[type="color"]::-webkit-color-swatch {
    border: 1px solid #444;
    border-radius: 4px;
}

.empty-state {
    text-align: center;
    padding: 20px;
    color: #666;
    font-style: italic;
    font-size: 12px;
}
</style>
