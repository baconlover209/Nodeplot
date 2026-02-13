<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="config-node-content">
      <div class="header-row">
        <span class="mode-label"
          >Mode: {{ localIsManual ? "Manual" : "Ports" }}</span
        >
        <label class="switch">
          <input type="checkbox" v-model="localIsManual" @change="updateMode" />
          <span class="slider round"></span>
        </label>
      </div>

      <div v-if="localIsManual" class="manual-controls" @wheel.stop>
        <div class="control-group">
          <label>Name</label>
          <input
            type="text"
            v-model="config.name"
            @change="updateData"
            placeholder="Trace Name"
          />
        </div>

        <div class="control-section">
          <div class="section-title">Line</div>
          <div class="control-row">
            <input
              type="text"
              v-model="config.line_color"
              @change="updateData"
              placeholder="Color"
            />
            <input
              type="number"
              v-model.number="config.line_width"
              @change="updateData"
              placeholder="Width"
              style="width: 50px"
            />
          </div>
          <div class="control-row">
            <select v-model="config.line_dash" @change="updateData">
              <option value="">Solid</option>
              <option value="dash">Dash</option>
              <option value="dot">Dot</option>
              <option value="dashdot">DashDot</option>
            </select>
            <select v-model="config.line_shape" @change="updateData">
              <option value="">Linear</option>
              <option value="spline">Spline</option>
              <option value="hv">HV</option>
              <option value="vh">VH</option>
              <option value="hvh">HVH</option>
              <option value="vhv">VHV</option>
            </select>
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Marker</div>
          <div class="control-row">
            <input
              type="text"
              v-model="config.marker_color"
              @change="updateData"
              placeholder="Color"
            />
            <input
              type="number"
              v-model.number="config.marker_size"
              @change="updateData"
              placeholder="Size"
              style="width: 50px"
            />
          </div>
          <div class="control-row">
            <input
              type="text"
              v-model="config.marker_symbol"
              @change="updateData"
              placeholder="Symbol (circle)"
            />
            <input
              type="number"
              v-model.number="config.marker_opacity"
              @change="updateData"
              placeholder="Opacity (0-1)"
              step="0.1"
              style="width: 60px"
            />
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Fill</div>
          <div class="control-row">
            <select v-model="config.fill" @change="updateData">
              <option value="none">None</option>
              <option value="tozeroy">To Zero Y</option>
              <option value="tozerox">To Zero X</option>
              <option value="tonexty">To Next Y</option>
              <option value="tonextx">To Next X</option>
              <option value="toself">To Self</option>
            </select>
            <input
              type="text"
              v-model="config.fillcolor"
              @change="updateData"
              placeholder="Fill Color"
            />
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Text</div>
          <div class="control-row">
            <select v-model="config.textposition" @change="updateData">
              <option value="top center">Top Center</option>
              <option value="middle center">Middle Center</option>
              <option value="bottom center">Bottom Center</option>
              <option value="top left">Top Left</option>
              <option value="top right">Top Right</option>
            </select>
          </div>
          <div class="control-row">
            <input
              type="number"
              v-model.number="config.textfont_size"
              @change="updateData"
              placeholder="Font Size"
            />
            <input
              type="text"
              v-model="config.textfont_color"
              @change="updateData"
              placeholder="Font Color"
            />
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">General</div>
          <div class="control-row">
            <label
              ><input
                type="checkbox"
                v-model="config.showlegend"
                @change="updateData"
              />
              Show Legend</label
            >
            <label
              ><input
                type="checkbox"
                v-model="config.visible"
                @change="updateData"
              />
              Visible</label
            >
          </div>
          <div class="control-row">
            <input
              type="number"
              v-model.number="config.opacity"
              @change="updateData"
              placeholder="Opacity"
              step="0.1"
            />
            <select v-model="config.mode" @change="updateData">
              <option value="">Auto</option>
              <option value="lines">Lines</option>
              <option value="markers">Markers</option>
              <option value="lines+markers">Lines+Markers</option>
              <option value="text">Text</option>
            </select>
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Error Bars</div>
          <div class="control-row">
            <input
              type="number"
              v-model.number="config.error_x_value"
              @change="updateData"
              placeholder="X Error Value"
              step="0.1"
            />
            <input
              type="text"
              v-model="config.error_x_color"
              @change="updateData"
              placeholder="X Error Color"
            />
          </div>
          <div class="control-row">
            <input
              type="number"
              v-model.number="config.error_y_value"
              @change="updateData"
              placeholder="Y Error Value"
              step="0.1"
            />
            <input
              type="text"
              v-model="config.error_y_color"
              @change="updateData"
              placeholder="Y Error Color"
            />
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Hover & Legend</div>
          <div class="control-row">
            <input
              type="text"
              v-model="config.hovertemplate"
              @change="updateData"
              placeholder="Hover Template"
            />
          </div>
          <div class="control-row">
            <input
              type="text"
              v-model="config.legendgroup"
              @change="updateData"
              placeholder="Legend Group"
            />
            <select v-model="config.hoverinfo" @change="updateData">
              <option value="">Default</option>
              <option value="x">X Only</option>
              <option value="y">Y Only</option>
              <option value="x+y">X+Y</option>
              <option value="text">Text</option>
              <option value="name">Name</option>
              <option value="all">All</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Axes</div>
          <div class="control-row">
            <input
              type="text"
              v-model="config.xaxis"
              @change="updateData"
              placeholder="X Axis (x, x2, x3...)"
            />
            <input
              type="text"
              v-model="config.yaxis"
              @change="updateData"
              placeholder="Y Axis (y, y2, y3...)"
            />
          </div>
        </div>
      </div>

      <div v-else class="ports-info">Connect inputs to configure</div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import BaseNode from "../BaseNode.vue";
import {
  type NodeDefinition,
  triggerGraphUpdate,
  removeConnectionsToInput,
  pushHistoryState,
} from "../nodeEditorState";

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(["connect-start", "connect-end", "socket-click"]);

const localIsManual = ref(false);

// default config state for manual mode
const config = reactive({
  name: "",
  mode: "",
  visible: true,
  showlegend: true,
  opacity: 1,
  line_color: "",
  line_width: 2,
  line_dash: "",
  line_shape: "",
  marker_color: "",
  marker_size: 6,
  marker_symbol: "circle",
  marker_opacity: 1,
  fill: "none",
  fillcolor: "",
  textposition: "top center",
  textfont_size: 12,
  textfont_color: "",
  error_x_value: 0,
  error_x_color: "",
  error_y_value: 0,
  error_y_color: "",
  hovertemplate: "",
  hoverinfo: "",
  legendgroup: "",
  xaxis: "",
  yaxis: "",
});

const ALL_PORTS = [
  "line.color",
  "line.width",
  "line.dash",
  "line.shape",
  "marker.color",
  "marker.size",
  "marker.symbol",
  "marker.opacity",
  "fill",
  "fillcolor",
  "mode",
  "name",
  "visible",
  "opacity",
  "showlegend",
  "textposition",
  "textfont.size",
  "textfont.color",
  "error_x.value",
  "error_x.color",
  "error_y.value",
  "error_y.color",
  "hovertemplate",
  "hoverinfo",
  "legendgroup",
  "xaxis",
  "yaxis",
];

onMounted(() => {
  // Load state
  if (props.node.data.isManual !== undefined) {
    localIsManual.value = props.node.data.isManual;
  }

  // Load config values if present
  const savedConfig = props.node.data.manualConfig || {};
  Object.assign(config, savedConfig);

  updateInputs();

  // Ensure output exists
  if (!props.node.outputs["config"]) {
    props.node.outputs["config"] = { type: "object" };
  }
});

function updateMode() {
  props.node.data.isManual = localIsManual.value;
  updateInputs();
  updateData(); // trigger eval
  pushHistoryState();
}

function updateInputs() {
  if (localIsManual.value) {
    // Remove all inputs
    for (const key of ALL_PORTS) {
      if (key in props.node.inputs) {
        // If we switch to manual, we should probably disconnect things or just hide them?
        // The prompt says "turn into manual input... (not json)".
        // Usually removing the port disconnects the wires.
        // Let's remove them to clean up the node visual.
        delete props.node.inputs[key];
        removeConnectionsToInput(props.node.id, key);
      }
    }
  } else {
    // Add all inputs
    for (const key of ALL_PORTS) {
      if (!(key in props.node.inputs)) {
        props.node.inputs[key] = { type: "any" };
      }
    }
  }
  triggerGraphUpdate();
}

function updateData() {
  // Save current manual config to node data so it persists
  props.node.data.manualConfig = { ...config };
  triggerGraphUpdate();
  pushHistoryState();
}

watch(
  () => props.node.data,
  (newData) => {
    if (
      newData.isManual !== undefined &&
      newData.isManual !== localIsManual.value
    ) {
      localIsManual.value = newData.isManual;
      updateInputs();
    }
    if (newData.manualConfig) {
      Object.assign(config, newData.manualConfig);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.config-node-content {
  min-width: 180px;
  padding: 0px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid #333;
}

.mode-label {
  font-size: 11px;
  color: #00d2ff;
  font-weight: bold;
}

.switch {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 16px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #00d2ff;
}

input:checked + .slider:before {
  transform: translateX(14px);
}

.slider.round {
  border-radius: 16px;
}

.slider.round:before {
  border-radius: 50%;
}

.manual-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.manual-controls::-webkit-scrollbar {
  width: 4px;
}

.manual-controls::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}

.control-section {
  background: #252525;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #333;
}

.section-title {
  font-size: 10px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: bold;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.control-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.control-row:last-child {
  margin-bottom: 0;
}

input[type="text"],
input[type="number"],
select {
  background: #1a1a1a;
  border: 1px solid #444;
  color: #eee;
  font-size: 11px;
  padding: 3px;
  border-radius: 2px;
  width: 100%;
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus {
  border-color: #00d2ff;
  outline: none;
}

.ports-info {
  font-size: 11px;
  color: #888;
  text-align: center;
  padding: 10px;
  font-style: italic;
}

label {
  font-size: 10px;
  color: #ccc;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
