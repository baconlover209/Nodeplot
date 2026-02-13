<template>
    <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
        @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
        <div class="advanced-trace-node">
            <div class="node-section-label">Trace Configuration</div>

            <!-- Searchable Category Dropdown -->
            <div class="control-group">
                <label>Trace Type</label>
                <div class="searchable-select" v-click-outside="closeDropdown">
                    <div class="select-trigger" @click="toggleDropdown">
                        <span class="selected-label">{{ selectedTraceLabel }}</span>
                        <span class="chevron">▾</span>
                    </div>

                    <div v-if="dropdownOpen" class="dropdown-content">
                        <div class="search-box">
                            <input ref="searchInput" v-model="searchQuery" placeholder="Search trace types..."
                                @click.stop />
                        </div>
                        <div class="groups-container">
                            <div v-for="group in filteredGroups" :key="group.category" class="type-group">
                                <div class="group-header">{{ group.category }}</div>
                                <div v-for="type in group.types" :key="type.label" class="type-item"
                                    :class="{ active: localType === type.value && localPlotlyType === type.plotlyType }"
                                    @click="selectType(type)">
                                    {{ type.label }}
                                </div>
                            </div>
                            <div v-if="filteredGroups.length === 0" class="no-results">
                                No matches found
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="control-row">
                <div class="control-group half">
                    <label>Name</label>
                    <input type="text" v-model="localName" @change="updateData" placeholder="Trace Name" />
                </div>
                <div class="control-group half" v-if="showMode">
                    <label>Mode</label>
                    <select v-model="localMode" @change="updateData">
                        <option value="lines">Lines</option>
                        <option value="markers">Markers</option>
                        <option value="lines+markers">Lines+Markers</option>
                        <option value="text">Text</option>
                    </select>
                </div>
            </div>

            <!-- Specific UI for Plot Types -->
            <div class="specific-ui-container">
                <!-- Marker Styles -->
                <div v-if="hasMarkers" class="ui-section">
                    <div class="section-title">Marker Styles</div>
                    <div class="ui-grid">
                        <div class="ui-item">
                            <label>Color</label>
                            <input type="color" v-model="styles.marker_color" @change="updateData" />
                        </div>
                        <div class="ui-item">
                            <label>Size</label>
                            <input type="number" v-model.number="styles.marker_size" @change="updateData" min="1" />
                        </div>
                        <div class="ui-item">
                            <label>Symbol</label>
                            <select v-model="styles.marker_symbol" @change="updateData">
                                <option value="circle">Circle</option>
                                <option value="square">Square</option>
                                <option value="diamond">Diamond</option>
                                <option value="cross">Cross</option>
                                <option value="x">X</option>
                                <option value="triangle-up">Triangle</option>
                                <option value="pentagon">Pentagon</option>
                                <option value="hexagon">Hexagon</option>
                                <option value="star">Star</option>
                            </select>
                        </div>
                        <div class="ui-item">
                            <label>Opacity</label>
                            <input type="range" v-model.number="styles.marker_opacity" @input="updateData" min="0"
                                max="1" step="0.1" />
                        </div>
                    </div>
                </div>

                <!-- Line Styles -->
                <div v-if="hasLines" class="ui-section">
                    <div class="section-title">Line Styles</div>
                    <div class="ui-grid">
                        <div class="ui-item">
                            <label>Color</label>
                            <input type="color" v-model="styles.line_color" @change="updateData" />
                        </div>
                        <div class="ui-item">
                            <label>Width</label>
                            <input type="number" v-model.number="styles.line_width" @change="updateData" min="0" />
                        </div>
                        <div class="ui-item">
                            <label>Dash</label>
                            <select v-model="styles.line_dash" @change="updateData">
                                <option value="solid">Solid</option>
                                <option value="dot">Dot</option>
                                <option value="dash">Dash</option>
                                <option value="longdash">Long Dash</option>
                                <option value="dashdot">Dash Dot</option>
                            </select>
                        </div>
                        <div class="ui-item">
                            <label>Shape</label>
                            <select v-model="styles.line_shape" @change="updateData">
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

                <!-- Colorscale Styles -->
                <div v-if="hasColorscale" class="ui-section">
                    <div class="section-title">Colorscale</div>
                    <div class="ui-grid">
                        <div class="ui-item full">
                            <label>Scale</label>
                            <select v-model="styles.colorscale" @change="updateData">
                                <option value="Viridis">Viridis</option>
                                <option value="Plasma">Plasma</option>
                                <option value="Inferno">Inferno</option>
                                <option value="Magma">Magma</option>
                                <option value="Cividis">Cividis</option>
                                <option value="Greys">Greys</option>
                                <option value="Reds">Reds</option>
                                <option value="Blues">Blues</option>
                                <option value="Hot">Hot</option>
                                <option value="Jet">Jet</option>
                                <option value="Rainbow">Rainbow</option>
                            </select>
                        </div>
                        <div class="ui-item checkbox">
                            <label>Show Scale</label>
                            <input type="checkbox" v-model="styles.showscale" @change="updateData" />
                        </div>
                        <div class="ui-item checkbox">
                            <label>Reverse</label>
                            <input type="checkbox" v-model="styles.reversescale" @change="updateData" />
                        </div>
                    </div>
                </div>

                <!-- Pie/Circular Specific -->
                <div v-if="localPlotlyType === 'pie'" class="ui-section">
                    <div class="section-title">Pie Specific</div>
                    <div class="ui-grid">
                        <div class="ui-item">
                            <label>Hole Size</label>
                            <input type="range" v-model.number="styles.hole" @input="updateData" min="0" max="0.9"
                                step="0.1" />
                        </div>
                        <div class="ui-item">
                            <label>Direction</label>
                            <select v-model="styles.direction" @change="updateData">
                                <option value="clockwise">Clockwise</option>
                                <option value="counterclockwise">Counter-Clockwise</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Financial Specific -->
                <div v-if="['candlestick', 'ohlc'].includes(localPlotlyType)" class="ui-section">
                    <div class="section-title">Financial Appearance</div>
                    <div class="ui-grid">
                        <div class="ui-item">
                            <label>Increasing</label>
                            <input type="color" v-model="styles.increasing_color" @change="updateData" />
                        </div>
                        <div class="ui-item">
                            <label>Decreasing</label>
                            <input type="color" v-model="styles.decreasing_color" @change="updateData" />
                        </div>
                    </div>
                </div>

                <!-- Map & Geo Settings -->
                <div v-if="hasGeo" class="ui-section">
                    <div class="section-title">Map & Geo Settings</div>
                    <div class="ui-grid">
                        <div class="ui-item full">
                            <label>Location Mode</label>
                            <select v-model="styles.locationmode" @change="updateData">
                                <option value="ISO-3">ISO-3 (Codes)</option>
                                <option value="USA-states">USA States</option>
                                <option value="country names">Country Names</option>
                                <option value="geojson-id">GeoJSON ID</option>
                            </select>
                        </div>
                        <div class="ui-item">
                            <label>Scope (Region)</label>
                            <select v-model="styles.geo_scope" @change="updateData">
                                <option value="world">World</option>
                                <option value="usa">USA</option>
                                <option value="europe">Europe</option>
                                <option value="asia">Asia</option>
                                <option value="africa">Africa</option>
                                <option value="north america">North America</option>
                                <option value="south america">South America</option>
                            </select>
                        </div>
                        <div class="ui-item">
                            <label>Projection</label>
                            <select v-model="styles.geo_projection_type" @change="updateData">
                                <option value="equirectangular">Equirectangular</option>
                                <option value="mercator">Mercator</option>
                                <option value="orthographic">Orthographic</option>
                                <option value="natural earth">Natural Earth</option>
                                <option value="albers usa">Albers USA (States)</option>
                                <option value="mollweide">Mollweide</option>
                                <option value="robinson">Robinson</option>
                            </select>
                        </div>
                        <div class="ui-item full" v-if="inputs.geojson !== undefined">
                            <label>GeoJSON ID Path</label>
                            <label>Matches CSV keys to GeoJSON properties</label>
                            <div class="input-with-hint">
                                <input type="text" v-model="styles.featureidkey" placeholder="e.g. properties.name"
                                    @change="updateData" />

                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mapbox Specific -->
                <div v-if="hasMapbox" class="ui-section">
                    <div class="section-title">Mapbox Layer Settings</div>
                    <div class="ui-grid">
                        <div class="ui-item full">
                            <label>Map Style</label>
                            <select v-model="styles.mapbox_style" @change="updateData">
                                <option value="open-street-map">Open Street Map</option>
                                <option value="carto-positron">Carto Positron (Light)</option>
                                <option value="carto-darkmatter">Carto Dark (Dark)</option>
                                <option value="stamen-terrain">Stamen Terrain</option>
                                <option value="white-bg">No Background (White)</option>
                            </select>
                        </div>
                        <div class="ui-item">
                            <label>Zoom</label>
                            <input type="number" v-model.number="styles.mapbox_zoom" @change="updateData" step="1" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="node-section-label">General</div>
            <div class="options-grid">
                <div class="option-item">
                    <label>Opacity</label>
                    <input type="range" min="0" max="1" step="0.1" v-model.number="localOpacity" @input="updateData" />
                </div>
                <div class="option-item">
                    <label>Show Legend</label>
                    <input type="checkbox" v-model="localShowLegend" @change="updateData" />
                </div>
            </div>

            <div class="advanced-json collapsible" v-if="showExtraConfig">
                <div class="node-section-label" @click="extraConfigOpen = !extraConfigOpen">
                    Extra JSON Config {{ extraConfigOpen ? '▾' : '▸' }}
                </div>
                <textarea v-if="extraConfigOpen" v-model="localConfig" @change="updateData"
                    placeholder='{"marker": {"color": "red"}}' class="config-area"></textarea>
            </div>
        </div>
    </BaseNode>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, reactive } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate } from '../nodeEditorState';

const props = defineProps<{
    node: NodeDefinition;
    selected: boolean;
}>();

const emit = defineEmits(['connect-start', 'connect-end', 'socket-click']);

// Trace Groups Definition
const ALL_TRACE_GROUPS = [
    {
        category: 'Basic & Hierarchical',
        types: [
            { label: 'Scatter', value: 'scatter', plotlyType: 'scatter' },
            { label: 'Bar', value: 'bar', plotlyType: 'bar' },
            { label: 'Pie', value: 'pie', plotlyType: 'pie' },
            { label: 'Heatmap', value: 'heatmap', plotlyType: 'heatmap' },
            { label: 'Histogram', value: 'histogram', plotlyType: 'histogram' },
            { label: 'Box', value: 'box', plotlyType: 'box' },
            { label: 'Violin', value: 'violin', plotlyType: 'violin' },
            { label: 'Strip', value: 'strip', plotlyType: 'box' },
            { label: 'Sunburst', value: 'sunburst', plotlyType: 'sunburst' },
            { label: 'Treemap', value: 'treemap', plotlyType: 'treemap' },
            { label: 'Sankey Diagram', value: 'sankey', plotlyType: 'sankey' },
            { label: 'Waterfall Chart', value: 'waterfall', plotlyType: 'waterfall' },
            { label: 'Funnel Charts', value: 'funnel', plotlyType: 'funnel' },
            { label: 'Table', value: 'table', plotlyType: 'table' },
        ]
    },
    {
        category: 'Statistical',
        types: [
            { label: '2D Histogram', value: 'histogram2d', plotlyType: 'histogram2d' },
            { label: '2D Histogram Contour', value: 'histogram2dcontour', plotlyType: 'histogram2dcontour' },
            { label: 'Contour Plots', value: 'contour', plotlyType: 'contour' },
            { label: 'Splorm', value: 'splom', plotlyType: 'splom' },
            { label: 'Parallel Coordinates Plot', value: 'parcoords', plotlyType: 'parcoords' },
            { label: 'Parallel Category Chart', value: 'parcats', plotlyType: 'parcats' },
        ]
    },
    {
        category: 'Specialized',
        types: [
            { label: 'Ternary Plots', value: 'scatterternary', plotlyType: 'scatterternary' },
            { label: 'Ternary Contour', value: 'ternarycontour', plotlyType: 'scatterternary' },
            { label: 'Radar Chart', value: 'scatterpolar', plotlyType: 'scatterpolar' },
            { label: 'Polar Chart', value: 'polar', plotlyType: 'scatterpolar' },
            { label: 'Wind Rose Chart', value: 'barpolar', plotlyType: 'barpolar' },
            { label: 'Carpet Plot', value: 'carpet', plotlyType: 'carpet' },
            { label: 'Carpet Scatter', value: 'scattercarpet', plotlyType: 'scattercarpet' },
            { label: 'Carpet Contour', value: 'contourcarpet', plotlyType: 'contourcarpet' },
        ]
    },
    {
        category: '3D Plots',
        types: [
            { label: '3D Scatter Plots', value: 'scatter3d', plotlyType: 'scatter3d' },
            { label: '3D Line Plots', value: 'scatter3d-lines', plotlyType: 'scatter3d' },
            { label: '3D Surface Plots', value: 'surface', plotlyType: 'surface' },
            { label: '3D Mesh Plots', value: 'mesh3d', plotlyType: 'mesh3d' },
            { label: '3D Ribbon Plots', value: 'ribbon', plotlyType: 'streamtube' },
            { label: '3D Cone Plots', value: 'cone', plotlyType: 'cone' },
            { label: '3D Streamtube Plots', value: 'streamtube', plotlyType: 'streamtube' },
            { label: '3D Isosurface Plots', value: 'isosurface', plotlyType: 'isosurface' },
            { label: '3D Cluster Graph', value: 'cluster3d', plotlyType: 'scatter3d' },
            { label: 'Tri-Surf Plots', value: 'trisurf', plotlyType: 'mesh3d' },
        ]
    },
    {
        category: 'Finance & Indicators',
        types: [
            { label: 'Candlestick Chart', value: 'candlestick', plotlyType: 'candlestick' },
            { label: 'OHLC Chart', value: 'ohlc', plotlyType: 'ohlc' },
            { label: 'Time Series', value: 'timeseries', plotlyType: 'scatter' },
            { label: 'Indicators', value: 'indicator', plotlyType: 'indicator' },
            { label: 'Gauge Chart', value: 'gauge', plotlyType: 'indicator' },
            { label: 'Bullet Charts', value: 'bullet', plotlyType: 'indicator' },
        ]
    },
    {
        category: 'Maps',
        types: [
            { label: 'Tile Map Layer', value: 'tilemap', plotlyType: 'choroplethmapbox' },
            { label: 'Tile Density Heatmap', value: 'densitymapbox', plotlyType: 'densitymapbox' },
            { label: 'Choropleth Tile Map', value: 'choroplethmapbox', plotlyType: 'choroplethmapbox' },
            { label: 'Lines on Map', value: 'maplines', plotlyType: 'scattermapbox' },
            { label: 'Bubble Map', value: 'mapbubble', plotlyType: 'scattermapbox' },
            { label: 'Scatter on Map', value: 'mapscatter', plotlyType: 'scattermapbox' },
            { label: 'Scatter on Tile Map', value: 'maptile', plotlyType: 'scattermapbox' },
            { label: 'Choropleth Map', value: 'choropleth', plotlyType: 'choropleth' },
        ]
    }
];

// State
const localType = ref('scatter');
const localPlotlyType = ref('scatter');
const localMode = ref('lines+markers');
const localName = ref('');
const localConfig = ref('');
const localOpacity = ref(1);
const localShowLegend = ref(true);

const styles = reactive({
    marker_color: '#00d2ff',
    marker_size: 8,
    marker_symbol: 'circle',
    marker_opacity: 1,
    line_color: '#00d2ff',
    line_width: 2,
    line_dash: 'solid',
    line_shape: 'linear',
    colorscale: 'Viridis',
    showscale: false,
    reversescale: false,
    hole: 0,
    direction: 'clockwise',
    increasing_color: '#3D9970',
    decreasing_color: '#FF4136',
    locationmode: 'ISO-3',
    geo_scope: 'world',
    geo_projection_type: 'equirectangular',
    mapbox_style: 'open-street-map',
    mapbox_zoom: 1,
    featureidkey: 'properties.name'
});

const dropdownOpen = ref(false);
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const extraConfigOpen = ref(false);

// Directives
const vClickOutside = {
    mounted(el: any, binding: any) {
        el.clickOutsideEvent = (event: MouseEvent) => {
            if (!(el === event.target || el.contains(event.target))) {
                binding.value();
            }
        };
        document.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el: any) {
        document.removeEventListener('click', el.clickOutsideEvent);
    },
};

// Computed
const selectedTraceLabel = computed(() => {
    for (const group of ALL_TRACE_GROUPS) {
        const found = group.types.find(t => t.value === localType.value && t.plotlyType === localPlotlyType.value);
        if (found) return found.label;
    }
    return 'Select Trace Type';
});

const filteredGroups = computed(() => {
    if (!searchQuery.value) return ALL_TRACE_GROUPS;
    const q = searchQuery.value.toLowerCase();
    return ALL_TRACE_GROUPS.map(group => ({
        ...group,
        types: group.types.filter(t => t.label.toLowerCase().includes(q))
    })).filter(group => group.types.length > 0);
});

const showMode = computed(() => {
    return ['scatter', 'scatter3d', 'scattergeo', 'scattermapbox', 'scatterpolar', 'scatterternary'].includes(localPlotlyType.value);
});

const hasMarkers = computed(() => {
    return ['scatter', 'scatter3d', 'scattergeo', 'scattermapbox', 'scatterpolar', 'scatterternary', 'bar'].includes(localPlotlyType.value);
});

const hasLines = computed(() => {
    return ['scatter', 'scatter3d', 'scattergeo', 'scattermapbox', 'scatterpolar', 'scatterternary'].includes(localPlotlyType.value);
});

const hasColorscale = computed(() => {
    return ['heatmap', 'surface', 'contour', 'histogram2d', 'histogram2dcontour', 'densitymapbox', 'choropleth', 'choroplethmapbox', 'choropleth'].includes(localPlotlyType.value);
});

const hasGeo = computed(() => {
    return ['choropleth', 'scattergeo'].includes(localPlotlyType.value);
});

const hasMapbox = computed(() => {
    return ['choroplethmapbox', 'scattermapbox', 'densitymapbox'].includes(localPlotlyType.value);
});

const inputs = computed(() => props.node.inputs);

const showExtraConfig = computed(() => true);

// Methods
function toggleDropdown() {
    dropdownOpen.value = !dropdownOpen.value;
    if (dropdownOpen.value) {
        setTimeout(() => searchInput.value?.focus(), 0);
    }
}

function closeDropdown() {
    dropdownOpen.value = false;
    searchQuery.value = '';
}

function selectType(type: any) {
    localType.value = type.value;
    localPlotlyType.value = type.plotlyType;

    // Set default modes for specific types
    if (type.value === 'scatter3d-lines') localMode.value = 'lines';
    else if (type.value === 'scatter3d') localMode.value = 'markers';

    updateData();
    closeDropdown();
}

onMounted(() => {
    // Sync from node data
    const d = props.node.data;
    if (d.type) localType.value = d.type;
    if (d.plotlyType) localPlotlyType.value = d.plotlyType;
    if (d.mode) localMode.value = d.mode;
    if (d.name) localName.value = d.name;
    if (d.config) localConfig.value = d.config;
    if (d.opacity !== undefined) localOpacity.value = d.opacity;
    if (d.showlegend !== undefined) localShowLegend.value = d.showlegend;

    if (d.styles) {
        Object.assign(styles, d.styles);
    }

    updateInputs();

    if (!props.node.outputs['trace']) {
        props.node.outputs['trace'] = null;
    }
});

// Watch for external data changes
watch(() => props.node.data, (newData) => {
    if (newData.type !== localType.value || newData.plotlyType !== localPlotlyType.value) {
        localType.value = newData.type || 'scatter';
        localPlotlyType.value = newData.plotlyType || 'scatter';
        updateInputs();
    }
    if (newData.mode !== localMode.value) localMode.value = newData.mode || 'lines+markers';
    if (newData.name !== localName.value) localName.value = newData.name || '';
    if (newData.config !== localConfig.value) localConfig.value = newData.config || '';
    if (newData.opacity !== undefined) localOpacity.value = newData.opacity;
    if (newData.showlegend !== undefined) localShowLegend.value = newData.showlegend;
    if (newData.styles) {
        Object.assign(styles, newData.styles);
    }
}, { deep: true });

function updateInputs() {
    const inputs = props.node.inputs;
    const type = localType.value;
    const pType = localPlotlyType.value;

    const requiredInputs = new Set<string>();
    // Removed 'config' as a required port

    // Mappings of type to inputs
    const inputMapping: Record<string, string[]> = {
        'scatter': ['x', 'y', 'text'],
        'bar': ['x', 'y', 'text', 'base'],
        'pie': ['labels', 'values', 'text'],
        'heatmap': ['z', 'x', 'y', 'text'],
        'histogram': ['x', 'y'],
        'box': ['x', 'y'],
        'violin': ['y', 'x', 'text'],
        'strip': ['y', 'x', 'text'],
        'sunburst': ['labels', 'parents', 'values', 'text'],
        'treemap': ['labels', 'parents', 'values', 'text'],
        'sankey': ['node.label', 'link.source', 'link.target', 'link.value'],
        'waterfall': ['x', 'y', 'text', 'measure'],
        'funnel': ['x', 'y', 'text'],
        'table': ['header.values', 'cells.values'],
        'histogram2d': ['x', 'y', 'z'],
        'histogram2dcontour': ['x', 'y', 'z'],
        'contour': ['z', 'x', 'y'],
        'splom': ['dimensions'],
        'parcoords': ['dimensions'],
        'parcats': ['dimensions'],
        'scatterternary': ['a', 'b', 'c', 'text'],
        'ternarycontour': ['a', 'b', 'c', 'z'],
        'scatterpolar': ['r', 'theta', 'text'],
        'polar': ['r', 'theta', 'text'],
        'barpolar': ['r', 'theta', 'text'],
        'carpet': ['a', 'b', 'x', 'y'],
        'scattercarpet': ['a', 'b', 'carpet'],
        'contourcarpet': ['a', 'b', 'z', 'carpet'],
        'scatter3d': ['x', 'y', 'z', 'text'],
        'scatter3d-lines': ['x', 'y', 'z', 'text'],
        'surface': ['z', 'x', 'y', 'surfacecolor'],
        'mesh3d': ['x', 'y', 'z', 'i', 'j', 'k', 'intensity', 'facecolor'],
        'trisurf': ['x', 'y', 'z'],
        'cluster3d': ['x', 'y', 'z'],
        'ribbon': ['x', 'y', 'z', 'u', 'v', 'w'],
        'cone': ['x', 'y', 'z', 'u', 'v', 'w'],
        'streamtube': ['x', 'y', 'z', 'u', 'v', 'w'],
        'isosurface': ['x', 'y', 'z', 'value'],
        'candlestick': ['x', 'open', 'high', 'low', 'close'],
        'ohlc': ['x', 'open', 'high', 'low', 'close'],
        'timeseries': ['x', 'y'],
        'indicator': ['value', 'title'],
        'gauge': ['value', 'title'],
        'bullet': ['value', 'title'],
        'tilemap': ['locations', 'z', 'geojson'],
        'densitymapbox': ['lat', 'lon', 'z', 'radius'],
        'choroplethmapbox': ['locations', 'z', 'geojson'],
        'maplines': ['lat', 'lon', 'text'],
        'mapbubble': ['lat', 'lon'],
        'mapscatter': ['lat', 'lon', 'text'],
        'maptile': ['lat', 'lon'],
        'choropleth': ['locations', 'z', 'text', 'geojson']
    };

    const typeInputs = inputMapping[type] || inputMapping[pType] || ['x', 'y'];
    typeInputs.forEach(inp => requiredInputs.add(inp));

    // Cleanup and sync ports
    for (const key of requiredInputs) {
        if (!(key in inputs)) inputs[key] = null;
    }
    for (const key in inputs) {
        if (!requiredInputs.has(key)) delete inputs[key];
    }

    triggerGraphUpdate();
}

function updateData() {
    props.node.data.type = localType.value;
    props.node.data.plotlyType = localPlotlyType.value;
    props.node.data.mode = localMode.value;
    props.node.data.name = localName.value;
    props.node.data.config = localConfig.value;
    props.node.data.opacity = localOpacity.value;
    props.node.data.showlegend = localShowLegend.value;

    // Store styles in data
    props.node.data.styles = { ...styles };

    updateInputs();
    triggerGraphUpdate();
}
</script>

<style scoped>
.advanced-trace-node {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 100px;
    max-width: 300px;
}

.node-section-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #00d2ff;
    border-bottom: 1px solid #333;
    padding-bottom: 4px;
    margin-bottom: 4px;
    font-weight: 600;
    cursor: pointer;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.control-group.half {
    flex: 1;
}

.control-row {
    display: flex;
    gap: 8px;
}

.control-group label {
    font-size: 10px;
    color: #888;
}

.control-group input[type="text"],
.control-group select,
.config-area {
    background: #252525;
    border: 1px solid #444;
    color: #ddd;
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 12px;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.control-group input[type="text"]:focus,
.control-group select:focus,
.config-area:focus {
    border-color: #00d2ff;
    outline: none;
}

.searchable-select {
    position: relative;
    user-select: none;
}

.select-trigger {
    background: #252525;
    border: 1px solid #444;
    padding: 6px 10px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 12px;
}

.select-trigger:hover {
    border-color: #555;
    background: #2a2a2a;
}

.dropdown-content {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #2b2b2b;
    border: 1px solid #444;
    border-radius: 6px;
    z-index: 1000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    max-height: 350px;
    display: flex;
    flex-direction: column;
}

.search-box {
    padding: 8px;
    border-bottom: 1px solid #3d3d3d;
}

.search-box input {
    background: #1e1e1e;
    border: 1px solid #444;
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    width: 100%;
    font-size: 12px;
    outline: none;
}

.groups-container {
    overflow-y: auto;
    padding: 4px 0;
}

.type-group {
    padding: 4px 0;
}

.group-header {
    font-size: 9px;
    text-transform: uppercase;
    color: #666;
    padding: 4px 12px;
    font-weight: bold;
}

.type-item {
    padding: 8px 16px;
    font-size: 12px;
    cursor: pointer;
    color: #ccc;
    transition: all 0.15s;
}

.type-item:hover {
    background: #3d3d3d;
    color: #fff;
}

.type-item.active {
    background: #00d2ff22;
    color: #00d2ff;
    font-weight: 500;
}

.specific-ui-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.ui-section {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid #333;
    border-radius: 6px;
    padding: 8px;
}

.section-title {
    font-size: 10px;
    color: #aaa;
    margin-bottom: 8px;
    border-bottom: 1px solid #333;
    padding-bottom: 4px;
}

.ui-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.ui-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.ui-item.full {
    grid-column: span 2;
}

.ui-item.checkbox {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding-top: 14px;
}

.ui-item label {
    font-size: 9px;
    color: #777;
}

.ui-item input[type="color"] {
    height: 24px;
    width: 100%;
    background: none;
    border: 1px solid #444;
    padding: 0;
    cursor: pointer;
}

.ui-item input[type="number"],
.ui-item select {
    background: #1e1e1e;
    border: 1px solid #444;
    color: #fff;
    font-size: 11px;
    padding: 2px 4px;
    border-radius: 3px;
}

.options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: center;
}

.option-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.option-item label {
    font-size: 10px;
    color: #888;
}

.advanced-json {
    margin-top: 4px;
}

.config-area {
    font-family: monospace;
    min-height: 80px;
    resize: vertical;
}

.no-results {
    padding: 20px;
    text-align: center;
    color: #666;
    font-size: 12px;
}

/* Scrollbar */
.groups-container::-webkit-scrollbar {
    width: 6px;
}

.groups-container::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 3px;
}
</style>
