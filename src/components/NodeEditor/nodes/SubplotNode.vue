<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="subplot-node-content">
      <div class="control-group">
        <label>Rows</label>
        <input type="number" v-model.number="rows" @change="updateLayout" min="1" max="10" />
      </div>

      <div class="control-group">
        <label>Columns</label>
        <input type="number" v-model.number="cols" @change="updateLayout" min="1" max="10" />
      </div>

      <div class="control-section">
        <div class="section-title">Spacing</div>
        <div class="control-row">
          <input type="number" v-model.number="horizontalSpacing" @change="updateLayout" placeholder="Horizontal"
            step="0.01" min="0" max="1" />
          <input type="number" v-model.number="verticalSpacing" @change="updateLayout" placeholder="Vertical"
            step="0.01" min="0" max="1" />
        </div>
      </div>

      <div class="control-section">
        <div class="section-title">Subplot Types</div>
        <div class="subplot-grid">
          <div v-for="(subplot, index) in subplots" :key="index" class="subplot-cell"
            :class="{ selected: selectedSubplot === index }" @click="selectedSubplot = index">
            <div class="cell-label">{{ index + 1 }}</div>
            <select v-model="subplot.type" @change="updateLayout" @click.stop>
              <option value="xy">XY</option>
              <option value="scene">3D</option>
              <option value="polar">Polar</option>
              <option value="ternary">Ternary</option>
              <option value="mapbox">Mapbox</option>
              <option value="geo">Geo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="info-text">
        {{ rows }}×{{ cols }} grid ({{ subplots.length }} subplots)
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import BaseNode from "../BaseNode.vue";
import { type NodeDefinition, triggerGraphUpdate } from "../nodeEditorState";

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(["connect-start", "connect-end", "socket-click"]);

const rows = ref(2);
const cols = ref(2);
const horizontalSpacing = ref(0.1);
const verticalSpacing = ref(0.1);
const selectedSubplot = ref<number | null>(null);

// Computed array of subplots based on grid
const subplots = computed(() => {
  const total = rows.value * cols.value;
  const result = [];
  for (let i = 0; i < total; i++) {
    result.push({
      type: props.node.data.subplotTypes?.[i] || "xy",
    });
  }
  return result;
});

onMounted(() => {
  // Load state
  if (props.node.data.rows !== undefined) {
    rows.value = props.node.data.rows;
  }
  if (props.node.data.cols !== undefined) {
    cols.value = props.node.data.cols;
  }
  if (props.node.data.horizontalSpacing !== undefined) {
    horizontalSpacing.value = props.node.data.horizontalSpacing;
  }
  if (props.node.data.verticalSpacing !== undefined) {
    verticalSpacing.value = props.node.data.verticalSpacing;
  }

  // Ensure output exists
  if (!props.node.outputs["layout"]) {
    props.node.outputs["layout"] = { type: "object" };
  }

  updateLayout();
});

function updateLayout() {
  // Save to node data
  props.node.data.rows = rows.value;
  props.node.data.cols = cols.value;
  props.node.data.horizontalSpacing = horizontalSpacing.value;
  props.node.data.verticalSpacing = verticalSpacing.value;

  // Save subplot types
  const types: string[] = [];
  for (let i = 0; i < subplots.value.length; i++) {
    const subplot = subplots.value[i];
    if (subplot) {
      types.push(subplot.type);
    }
  }
  props.node.data.subplotTypes = types;

  triggerGraphUpdate();
}

// Watch for changes in subplot types
watch(
  () => subplots.value.map((s) => s.type),
  (newTypes) => {
    props.node.data.subplotTypes = newTypes;
    triggerGraphUpdate();
  },
  { deep: true }
);
</script>

<style scoped>
.subplot-node-content {
  min-width: 200px;
  padding: 0px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.control-row {
  display: flex;
  gap: 4px;
}

label {
  font-size: 11px;
  color: #ccc;
  font-weight: 500;
}

input[type="number"],
select {
  background: #1a1a1a;
  border: 1px solid #444;
  color: #eee;
  font-size: 11px;
  padding: 4px;
  border-radius: 2px;
  width: 100%;
}

input[type="number"]:focus,
select:focus {
  border-color: #00d2ff;
  outline: none;
}

.subplot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  padding: 2px;
}

.subplot-grid::-webkit-scrollbar {
  width: 4px;
}

.subplot-grid::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 2px;
}

.subplot-cell {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.subplot-cell:hover {
  border-color: #00d2ff;
  background: #222;
}

.subplot-cell.selected {
  border-color: #00d2ff;
  background: #2a2a2a;
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.3);
}

.cell-label {
  font-size: 9px;
  color: #888;
  font-weight: bold;
  text-align: center;
}

.subplot-cell select {
  font-size: 9px;
  padding: 2px;
}

.info-text {
  font-size: 10px;
  color: #888;
  text-align: center;
  font-style: italic;
  padding: 4px;
  background: #1a1a1a;
  border-radius: 4px;
}
</style>
