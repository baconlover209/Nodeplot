<template>
  <BaseNode
    :node="node"
    :selected="selected"
    class="layout-node"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div class="layout-node-content">
      <div class="layout-header">
        <div class="header-main">
          <div class="i-mdi-view-quilt header-icon"></div>
          <span>Layout Master</span>
        </div>
        <div class="tabs">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </div>
        </div>
      </div>

      <div class="tab-content" @wheel.stop>
        <!-- General Tab -->
        <div v-if="activeTab === 'general'" class="config-group">
          <div class="section-title">Global Styles</div>
          <div class="control-row">
            <div class="input-wrap">
              <label>Title Text</label>
              <input
                type="text"
                v-model="config.title_text"
                @input="updateData"
                placeholder="Chart Title"
              />
            </div>
          </div>
          <div class="control-row">
            <div class="input-wrap">
              <label>Font Family</label>
              <input
                type="text"
                v-model="config.font_family"
                @input="updateData"
                placeholder="Inter, sans-serif"
              />
            </div>
            <div class="input-wrap" style="width: 70px">
              <label>Size</label>
              <input
                type="number"
                v-model.number="config.font_size"
                @input="updateData"
              />
            </div>
            <div class="input-wrap" style="width: 60px">
              <label>Color</label>
              <input
                type="color"
                v-model="config.font_color"
                @input="updateData"
              />
            </div>
          </div>

          <div class="section-title">Background & Margin</div>
          <div class="control-row">
            <div class="input-wrap">
              <label>Paper (Outer)</label>
              <input
                type="color"
                v-model="config.paper_bgcolor"
                @input="updateData"
              />
            </div>
            <div class="input-wrap">
              <label>Plot (Inner)</label>
              <input
                type="color"
                v-model="config.plot_bgcolor"
                @input="updateData"
              />
            </div>
          </div>
          <div class="control-grid-4">
            <div class="input-wrap">
              <label>Top</label>
              <input
                type="number"
                v-model.number="config.margin_t"
                @input="updateData"
              />
            </div>
            <div class="input-wrap">
              <label>Bottom</label>
              <input
                type="number"
                v-model.number="config.margin_b"
                @input="updateData"
              />
            </div>
            <div class="input-wrap">
              <label>Left</label>
              <input
                type="number"
                v-model.number="config.margin_l"
                @input="updateData"
              />
            </div>
            <div class="input-wrap">
              <label>Right</label>
              <input
                type="number"
                v-model.number="config.margin_r"
                @input="updateData"
              />
            </div>
          </div>
        </div>

        <!-- Grid/Subplots Tab -->
        <div v-if="activeTab === 'grid'" class="config-group">
          <div class="section-title">Subplot Grid</div>
          <div class="control-row flex-center">
            <div class="check-wrap">
              <input
                type="checkbox"
                v-model="config.use_grid"
                @change="updateData"
              />
              <label>Enable Grid Layout</label>
            </div>
          </div>

          <template v-if="config.use_grid">
            <div class="control-row">
              <div class="input-wrap">
                <label>Rows</label>
                <input
                  type="number"
                  v-model.number="config.grid_rows"
                  min="1"
                  max="10"
                  @input="updateData"
                />
              </div>
              <div class="input-wrap">
                <label>Cols</label>
                <input
                  type="number"
                  v-model.number="config.grid_cols"
                  min="1"
                  max="10"
                  @input="updateData"
                />
              </div>
            </div>
            <div class="control-row">
              <div class="input-wrap">
                <label>Pattern</label>
                <select v-model="config.grid_pattern" @change="updateData">
                  <option value="independent">Independent</option>
                  <option value="coupled">Coupled</option>
                </select>
              </div>
            </div>
            <div class="control-row">
              <div class="input-wrap">
                <label>H-Gap</label>
                <input
                  type="number"
                  v-model.number="config.grid_xgap"
                  step="0.01"
                  min="0"
                  max="1"
                  @input="updateData"
                />
              </div>
              <div class="input-wrap">
                <label>V-Gap</label>
                <input
                  type="number"
                  v-model.number="config.grid_ygap"
                  step="0.01"
                  min="0"
                  max="1"
                  @input="updateData"
                />
              </div>
            </div>
          </template>

          <div class="section-title">Specific Subplots</div>
          <div class="subplot-list">
            <div
              v-for="(sub, idx) in config.subplots"
              :key="idx"
              class="subplot-item"
            >
              <div class="item-header">
                <select v-model="sub.type" @change="updateData">
                  <option value="scene">3D Scene</option>
                  <option value="polar">Polar</option>
                  <option value="mapbox">Mapbox</option>
                  <option value="geo">Geo</option>
                  <option value="ternary">Ternary</option>
                </select>
                <input
                  type="text"
                  v-model="sub.id"
                  placeholder="ID (e.g. 2)"
                  style="width: 50px"
                  @input="updateData"
                />
                <button class="remove-btn" @click="removeSubplot(idx)">
                  ×
                </button>
              </div>
              <div class="domain-row">
                <label>Domain X:</label>
                <input
                  type="number"
                  v-model.number="sub.domain_start_x"
                  step="0.1"
                  @input="updateData"
                />
                <span>-</span>
                <input
                  type="number"
                  v-model.number="sub.domain_end_x"
                  step="0.1"
                  @input="updateData"
                />
              </div>
              <div class="domain-row">
                <label>Domain Y:</label>
                <input
                  type="number"
                  v-model.number="sub.domain_start_y"
                  step="0.1"
                  @input="updateData"
                />
                <span>-</span>
                <input
                  type="number"
                  v-model.number="sub.domain_end_y"
                  step="0.1"
                  @input="updateData"
                />
              </div>
            </div>
            <button class="add-btn" @click="addSubplot">
              + Add Mixed/Inset Subplot
            </button>
          </div>
        </div>

        <!-- Axes Tab -->
        <div v-if="activeTab === 'axes'" class="config-group">
          <div class="section-title">Axis Configuration</div>
          <div class="axis-list">
            <div
              v-for="(axis, idx) in config.axes"
              :key="idx"
              class="axis-item"
            >
              <div class="item-header">
                <div class="axis-type-badge" :class="axis.type">
                  {{ axis.type.toUpperCase() }}{{ axis.id || "1" }}
                </div>
                <input
                  type="text"
                  v-model="axis.title"
                  placeholder="Axis Title"
                  @input="updateData"
                />
                <button class="remove-btn" @click="removeAxis(idx)">×</button>
              </div>

              <div class="control-grid-2">
                <div class="input-wrap">
                  <label>Type</label>
                  <select v-model="axis.type_mode" @change="updateData">
                    <option value="linear">Linear</option>
                    <option value="log">Log</option>
                    <option value="date">Date</option>
                    <option value="category">Category</option>
                  </select>
                </div>
                <div class="input-wrap">
                  <label>Side</label>
                  <select v-model="axis.side" @change="updateData">
                    <option value="left" v-if="axis.type === 'y'">Left</option>
                    <option value="right" v-if="axis.type === 'y'">
                      Right
                    </option>
                    <option value="bottom" v-if="axis.type === 'x'">
                      Bottom
                    </option>
                    <option value="top" v-if="axis.type === 'x'">Top</option>
                  </select>
                </div>
              </div>

              <div class="control-row" v-if="axis.id">
                <div class="input-wrap">
                  <label>Overlaying</label>
                  <input
                    type="text"
                    v-model="axis.overlaying"
                    placeholder="e.g. y"
                    @input="updateData"
                  />
                </div>
                <div class="input-wrap">
                  <label>Anchor</label>
                  <input
                    type="text"
                    v-model="axis.anchor"
                    placeholder="e.g. x"
                    @input="updateData"
                  />
                </div>
              </div>

              <div
                class="domain-toggle"
                @click="axis.showDomain = !axis.showDomain"
              >
                {{
                  axis.showDomain ? "▼ Hide Domain/Pos" : "▶ Show Domain/Pos"
                }}
              </div>

              <div v-if="axis.showDomain" class="domain-box">
                <div class="domain-row">
                  <label>Domain:</label>
                  <input
                    type="number"
                    v-model.number="axis.domain_start"
                    step="0.1"
                    @input="updateData"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    v-model.number="axis.domain_end"
                    step="0.1"
                    @input="updateData"
                  />
                </div>
                <div class="domain-row" v-if="axis.id">
                  <label>Position:</label>
                  <input
                    type="number"
                    v-model.number="axis.position"
                    step="0.05"
                    @input="updateData"
                  />
                </div>
              </div>
            </div>

            <div class="add-buttons">
              <button class="add-btn x" @click="addAxis('x')">+ X Axis</button>
              <button class="add-btn y" @click="addAxis('y')">+ Y Axis</button>
            </div>
          </div>
        </div>

        <!-- Traces Tab -->
        <div v-if="activeTab === 'traces'" class="config-group">
          <div class="section-title">Trace to Axis Mapping</div>
          <div v-if="inputTraces.length === 0" class="empty-hint">
            Connect traces to see mapping options
          </div>
          <div class="trace-mapping-list" v-else>
            <div
              v-for="(trace, idx) in inputTraces"
              :key="idx"
              class="mapping-item"
            >
              <div class="mapping-trace-info">
                <span class="trace-index">#{{ idx + 1 }}</span>
                <span class="trace-name">{{
                  trace.name || trace.type || "Unnamed Trace"
                }}</span>
              </div>

              <div class="mapping-controls">
                <template
                  v-if="
                    ['scatter', 'bar', 'box', 'violin', 'histogram'].includes(
                      trace.type
                    )
                  "
                >
                  <div class="input-wrap">
                    <label>X Axis</label>
                    <select
                      v-model="getTraceMapping(idx).xaxis"
                      @change="updateData"
                    >
                      <option value="">Default (X1)</option>
                      <option v-for="id in axisIds.x" :key="id" :value="id">
                        X{{ id || "1" }}
                      </option>
                    </select>
                  </div>
                  <div class="input-wrap">
                    <label>Y Axis</label>
                    <select
                      v-model="getTraceMapping(idx).yaxis"
                      @change="updateData"
                    >
                      <option value="">Default (Y1)</option>
                      <option v-for="id in axisIds.y" :key="id" :value="id">
                        Y{{ id || "1" }}
                      </option>
                    </select>
                  </div>
                </template>

                <template
                  v-else-if="
                    trace.type === 'scatter3d' ||
                    trace.type === 'surface' ||
                    trace.type === 'mesh3d'
                  "
                >
                  <div class="input-wrap">
                    <label>3D Scene</label>
                    <select
                      v-model="getTraceMapping(idx).scene"
                      @change="updateData"
                    >
                      <option value="">Default (Scene1)</option>
                      <option
                        v-for="id in subplotIds('scene')"
                        :key="id"
                        :value="id"
                      >
                        Scene{{ id || "1" }}
                      </option>
                    </select>
                  </div>
                </template>

                <template v-else-if="trace.type.includes('mapbox')">
                  <div class="input-wrap">
                    <label>Mapbox</label>
                    <select
                      v-model="getTraceMapping(idx).mapbox"
                      @change="updateData"
                    >
                      <option value="">Default (Mapbox1)</option>
                      <option
                        v-for="id in subplotIds('mapbox')"
                        :key="id"
                        :value="id"
                      >
                        Mapbox{{ id || "1" }}
                      </option>
                    </select>
                  </div>
                </template>

                <template v-else-if="trace.type.includes('geo')">
                  <div class="input-wrap">
                    <label>Geo</label>
                    <select
                      v-model="getTraceMapping(idx).geo"
                      @change="updateData"
                    >
                      <option value="">Default (Geo1)</option>
                      <option
                        v-for="id in subplotIds('geo')"
                        :key="id"
                        :value="id"
                      >
                        Geo{{ id || "1" }}
                      </option>
                    </select>
                  </div>
                </template>

                <div v-else class="unsupported-mapping">
                  No mapping options for {{ trace.type }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Legend Tab -->
        <div v-if="activeTab === 'legend'" class="config-group">
          <div class="section-title">Legend Settings</div>
          <div class="control-row">
            <div class="check-wrap">
              <input
                type="checkbox"
                v-model="config.showlegend"
                @change="updateData"
              />
              <label>Show Legend</label>
            </div>
          </div>

          <div class="control-row">
            <div class="input-wrap">
              <label>Orientation</label>
              <select v-model="config.legend_orientation" @change="updateData">
                <option value="v">Vertical</option>
                <option value="h">Horizontal</option>
              </select>
            </div>
          </div>

          <div class="section-title">Positioning</div>
          <div class="control-grid-2">
            <div class="input-wrap">
              <label>X Position</label>
              <input
                type="number"
                v-model.number="config.legend_x"
                step="0.05"
                @input="updateData"
              />
            </div>
            <div class="input-wrap">
              <label>Y Position</label>
              <input
                type="number"
                v-model.number="config.legend_y"
                step="0.05"
                @input="updateData"
              />
            </div>
          </div>
          <div class="control-grid-2">
            <div class="input-wrap">
              <label>X Anchor</label>
              <select v-model="config.legend_xanchor" @change="updateData">
                <option value="auto">Auto</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div class="input-wrap">
              <label>Y Anchor</label>
              <select v-model="config.legend_yanchor" @change="updateData">
                <option value="auto">Auto</option>
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>

          <div class="section-title">Background</div>
          <div class="control-row">
            <div class="input-wrap">
              <label>BG Color</label>
              <input
                type="color"
                v-model="config.legend_bgcolor"
                @input="updateData"
              />
            </div>
            <div class="input-wrap">
              <label>Border Color</label>
              <input
                type="color"
                v-model="config.legend_bordercolor"
                @input="updateData"
              />
            </div>
            <div class="input-wrap" style="width: 60px">
              <label>Width</label>
              <input
                type="number"
                v-model.number="config.legend_borderwidth"
                @input="updateData"
              />
            </div>
          </div>
        </div>

        <!-- Help Tab -->
        <div v-if="activeTab === 'help'" class="config-group">
          <div class="section-title">Documentation & Help</div>
          <div class="help-accordion">
            <div
              v-for="section in helpSections"
              :key="section.id"
              class="help-section"
              :class="{ active: expandedHelp === section.id }"
            >
              <div
                class="help-header"
                @click="
                  expandedHelp = expandedHelp === section.id ? '' : section.id
                "
              >
                <span>{{ section.title }}</span>
                <div
                  :class="
                    expandedHelp === section.id
                      ? 'i-mdi-chevron-up'
                      : 'i-mdi-chevron-down'
                  "
                ></div>
              </div>
              <div v-if="expandedHelp === section.id" class="help-body">
                <div class="help-text" v-html="section.content"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="layout-footer" v-if="traceCount > 0">
        Connected to {{ traceCount }} Traces
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from "vue";
import BaseNode from "../BaseNode.vue";
import {
  type NodeDefinition,
  triggerGraphUpdate,
  getNodeValues,
} from "../nodeEditorState";

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(["connect-start", "connect-end", "socket-click"]);

const activeTab = ref("general");
const expandedHelp = ref("general");
const tabs = [
  { id: "general", label: "General" },
  { id: "grid", label: "Grid" },
  { id: "axes", label: "Axes" },
  { id: "traces", label: "Traces" },
  { id: "legend", label: "Legend" },
  { id: "help", label: "Help" },
];

const helpSections = [
  {
    id: "general",
    title: "General Styling",
    content:
      "Configure global chart properties like <b>Titles</b>, <b>Fonts</b>, and <b>Background Colors</b>. Margin offsets (T/B/L/R) control the padding between the plot and the paper edge.",
  },
  {
    id: "grid",
    title: "Subplot Grid",
    content:
      "Create a regular grid of subplots using rows and columns. Use <b>Independent</b> pattern for separate data per subplot, or <b>Coupled</b> to share axes. <b>Specific Subplots</b> allows adding 3D, Polar, or Map regions.",
  },
  {
    id: "axes",
    title: "Multi-Axis Layout",
    content:
      "Define secondary X and Y axes for mixed scales or dual-axis charts. Use <b>Domain</b> to set where an axis exists on the chart (0.0 to 1.0). <b>Position</b> allows shifting an axis to the right/top of its range.",
  },
  {
    id: "traces",
    title: "Trace Routing",
    content:
      'Assign specific input series to your defined axes or subplots. This is key for creating <b>Insets</b> or <b>Side-by-Side</b> comparisons from a single "traces" input.',
  },
  {
    id: "legend",
    title: "Legend Positioning",
    content:
      "Toggle the legend and set its orientation (V/H). Use <b>X/Y Position</b> to move it anywhere in or out of the plot area (e.g., X=1.05 puts it just outside the right edge).",
  },
  {
    id: "insets",
    title: "How to create Insets",
    content:
      "1. Add a new X and Y axis in the <b>Axes</b> tab.<br>2. Set their <b>Domains</b> to a small range (e.g., 0.6 to 0.9).<br>3. In the <b>Traces</b> tab, map the target series to these new axes (#2, #3, etc).",
  },
];

const config = reactive({
  title_text: "",
  title_font_size: 16,
  title_font_color: "#ffffff",
  title_font_family: "",
  title_x: 0.5,
  title_y: 0.95,

  font_family: "Inter, sans-serif",
  font_size: 12,
  font_color: "#bbbbbb",

  paper_bgcolor: "#111111",
  plot_bgcolor: "#1a1a1a",
  margin_t: 60,
  margin_b: 60,
  margin_l: 60,
  margin_r: 60,

  use_grid: false,
  grid_rows: 1,
  grid_cols: 1,
  grid_pattern: "independent",
  grid_roworder: "top to bottom",
  grid_xgap: 0.1,
  grid_ygap: 0.1,

  showlegend: true,
  legend_orientation: "v",
  legend_x: 1.02,
  legend_y: 1,
  legend_xanchor: "left",
  legend_yanchor: "top",
  legend_bgcolor: "rgba(0,0,0,0)",
  legend_bordercolor: "#444444",
  legend_borderwidth: 0,

  axes: [] as any[],
  subplots: [] as any[],
  traceMappings: {} as Record<number, any>,
});

const inputTraces = computed(() => {
  const values = getNodeValues.value[props.node.id];
  const traces = values?.["traces"];
  if (!traces) return [];
  return Array.isArray(traces) ? traces : [traces];
});

const traceCount = computed(() => inputTraces.value.length);

onMounted(() => {
  if (props.node.data.layoutConfig) {
    Object.assign(config, props.node.data.layoutConfig);
  }

  // Initialize sockets
  if (!props.node.inputs["traces"]) props.node.inputs["traces"] = null;
  if (!props.node.outputs["layout"]) props.node.outputs["layout"] = null;

  updateData();
});

function updateData() {
  props.node.data.layoutConfig = { ...config };
  triggerGraphUpdate();
}

function addAxis(type: "x" | "y") {
  const existingCount = config.axes.filter((a) => a.type === type).length;
  const id = existingCount === 0 ? "" : (existingCount + 1).toString();

  config.axes.push({
    type,
    id,
    title: "",
    type_mode: "linear",
    side: type === "x" ? "bottom" : "left",
    showgrid: true,
    gridcolor: "#333333",
    zeroline: true,
    overlaying: "",
    anchor: "",
    position: 0,
    domain_start: 0,
    domain_end: 1,
    showDomain: false,
  });
  updateData();
}

function removeAxis(index: number) {
  config.axes.splice(index, 1);
  updateData();
}

function addSubplot() {
  const id = (config.subplots.length + 2).toString();
  config.subplots.push({
    type: "scene",
    id,
    domain_start_x: 0,
    domain_end_x: 0.5,
    domain_start_y: 0,
    domain_end_y: 0.5,
  });
  updateData();
}

function removeSubplot(index: number) {
  config.subplots.splice(index, 1);
  updateData();
}

const axisIds = computed(() => {
  return {
    x: config.axes.filter((a) => a.type === "x").map((a) => a.id),
    y: config.axes.filter((a) => a.type === "y").map((a) => a.id),
  };
});

function subplotIds(type: string) {
  return config.subplots.filter((s) => s.type === type).map((s) => s.id);
}

function getTraceMapping(index: number) {
  if (!config.traceMappings[index]) {
    config.traceMappings[index] = {};
  }
  return config.traceMappings[index];
}

watch(
  () => props.node.data.layoutConfig,
  (newVal) => {
    if (newVal) {
      Object.assign(config, newVal);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.layout-node :deep(.node-container) {
  min-width: 380px;
  max-width: 450px;
}

.layout-node-content {
  display: flex;
  flex-direction: column;
  color: #eee;
  padding: 0;
}

.layout-header {
  padding: 12px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #cc33ff;
  margin-bottom: 12px;
}

.header-icon {
  font-size: 20px;
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
  background: #1e1e1e;
  border: 1px solid #333;
  color: #888;
  transition: all 0.2s;
}

.tab:hover {
  background: #333;
  color: #ccc;
}

.tab.active {
  background: #cc33ff33;
  border-color: #cc33ff;
  color: #fff;
}

.tab-content {
  padding: 12px;
  max-height: 400px;
  max-width: 500px;
  overflow-y: auto;
  background: #151515;
}

.tab-content::-webkit-scrollbar {
  width: 4px;
}

.tab-content::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 10px;
  font-weight: bold;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
  border-bottom: 1px solid #222;
  padding-bottom: 4px;
}

.control-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.flex-center {
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  padding: 8px;
  border-radius: 6px;
}

.control-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.control-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  color: #777;
}

.check-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-wrap label {
  font-size: 11px;
}

input[type="text"],
input[type="number"],
select {
  background: #222;
  border: 1px solid #333;
  color: #ddd;
  border-radius: 4px;
  padding: 6px;
  font-size: 11px;
  width: 100%;
  box-sizing: border-box;
}

input[type="color"] {
  height: 28px;
  padding: 2px;
  background: #222;
  border: 1px solid #333;
  border-radius: 4px;
  cursor: pointer;
}

input:focus,
select:focus {
  border-color: #cc33ff;
  outline: none;
}

.axis-list,
.subplot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.axis-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.axis-item,
.subplot-item {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.axis-type-badge {
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
}

.axis-type-badge.x {
  background: #00d2ff33;
  color: #00d2ff;
}

.axis-type-badge.y {
  background: #ffaa0033;
  color: #ffaa00;
}

.remove-btn {
  background: rgba(255, 50, 50, 0.1);
  border: none;
  color: #ff5555;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.remove-btn:hover {
  background: #ff5555;
  color: #fff;
}

.add-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.add-btn {
  padding: 6px;
  font-size: 10px;
  background: #252525;
  border: 1px dashed #444;
  color: #888;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  border-color: #cc33ff;
  color: #cc33ff;
  background: #2a2a2a;
}

.domain-toggle {
  font-size: 9px;
  color: #555;
  cursor: pointer;
  text-align: right;
}

.domain-toggle:hover {
  color: #888;
}

.domain-box {
  background: #111;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.domain-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #888;
}

.domain-row input {
  width: 50px;
  padding: 2px 4px;
}

.layout-footer {
  padding: 6px 12px;
  background: #222;
  border-top: 1px solid #333;
  font-size: 10px;
  color: #555;
  font-style: italic;
  text-align: right;
}

.empty-hint {
  padding: 20px;
  text-align: center;
  color: #555;
  font-size: 11px;
  font-style: italic;
  background: #111;
  border-radius: 6px;
  border: 1px dashed #333;
}

.trace-mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mapping-item {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 10px;
}

.mapping-trace-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.trace-index {
  background: #cc33ff22;
  color: #cc33ff;
  font-size: 9px;
  padding: 2px 5px;
  border-radius: 10px;
  font-weight: bold;
}

.trace-name {
  font-size: 12px;
  font-weight: 500;
}

.mapping-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.unsupported-mapping {
  grid-column: span 2;
  font-size: 10px;
  color: #666;
  font-style: italic;
}

.help-accordion {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-section {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
}

.help-section.active {
  border-color: #cc33ff55;
}

.help-header {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: #ccc;
  transition: background 0.2s;
}

.help-header:hover {
  background: #222;
  color: #fff;
}

.help-body {
  padding: 12px;
  background: #111;
  border-top: 1px solid #222;
}

.help-text {
  font-size: 11px;
  line-height: 1.5;
  color: #999;
}

.help-text b {
  color: #cc33ff;
}
</style>
