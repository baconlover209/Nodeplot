<template>
  <div class="app-container">
    <!-- Left Sidebar -->
    <div class="sidebar left-panel" :style="{ width: leftWidth + 'px' }">
      <div class="top-bar">
        <div class="top-bar-left">
          <div class="io-group">
            <button
              class="io-btn projects-btn"
              @click="openProjectManager"
              title="Manage Projects"
            >
              Projects
            </button>
            <button
              class="io-btn save-btn-top"
              @click="handleQuickSave"
              title="Save Project"
            >
              Save
            </button>
            <button class="io-btn" @click="handleExport" title="Export Graph">
              Export
            </button>

            <div class="top-bar-divider"></div>
            <label class="data-checkbox" title="Include data in export">
              <input type="checkbox" v-model="includeData" />
              <span class="check-box"></span>
              <span
                >Include CSV <br />
                in export</span
              >
            </label>
          </div>
        </div>

        <div class="spacer" style="flex: 1"></div>

        <div class="top-bar-right">
          <label class="live-edit-toggle vertical" title="Auto-run on changes">
            <input
              type="checkbox"
              :checked="nodeEditorState.isLive"
              @change="e => setIsLive((e.target as HTMLInputElement).checked)"
            />
            <span class="toggle-slider"></span>
            <span class="toggle-label">Live</span>
          </label>
          <button class="run-btn" @click="runCode(true)">
            <span class="icon">▶</span>
            <span>Run</span>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          :class="{ active: activeTab === 'data' }"
          @click="activeTab = 'data'"
        >
          Csv Data
        </button>
        <button
          :class="{ active: activeTab === 'controls' }"
          @click="activeTab = 'controls'"
        >
          Controls
        </button>
        <button
          :class="{ active: activeTab === 'nodes' }"
          @click="activeTab = 'nodes'"
        >
          Node Editor
        </button>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <div v-show="activeTab === 'data'" class="tab-content">
          <div class="data-toolbar">
            <div class="data-file-selector">
              <select
                v-if="csvStore.files.length > 0"
                :value="csvStore.activeFileId"
                @change="handleGlobalCsvChange"
              >
                <option
                  v-for="file in csvStore.files"
                  :key="file.id"
                  :value="file.id"
                >
                  {{ file.name }} ({{ file.width }}x{{ file.height }})
                </option>
              </select>
              <span v-else class="no-file-text">No files loaded</span>
            </div>

            <div class="data-toolbar-actions">
              <label class="upload-csv-btn">
                <input
                  type="file"
                  @change="handleFileUpload"
                  accept=".csv,.txt"
                  style="display: none"
                />
                <span>Upload CSV</span>
              </label>

              <button
                v-if="csvStore.activeFileId"
                class="delete-btn"
                @click="deleteActiveFile"
                title="Delete current CSV file"
              >
                Delete File
              </button>
            </div>
          </div>
          <DataGrid :data="rawData" @update:data="handleDataUpdate" />
        </div>
        <div v-show="activeTab === 'controls'" class="tab-content">
          <!-- Input Controls -->
          <div class="input-controls-tab">
            <div
              v-if="
                inputDefinitions.length === 0 && nodeInputControls.length === 0
              "
              class="no-controls"
            >
              <p>No controls defined.</p>
              <p>
                Add InputNode in Node Editor or use <code>input.add()</code> in
                code.
              </p>
            </div>
            <div v-else class="controls-container">
              <!-- Edit Mode Toggle -->
              <div class="controls-toolbar">
                <label class="edit-mode-toggle">
                  <input type="checkbox" v-model="isEditControlMode" />
                  <span>{{
                    isEditControlMode ? "Done Editing" : "Edit Layout"
                  }}</span>
                </label>
                <button
                  v-if="isEditControlMode"
                  class="add-tile-btn"
                  @click="addControlTile"
                >
                  Add Tile
                </button>
              </div>

              <div class="controls-layout-wrapper">
                <!-- Unassigned Controls Sidebar (Edit Mode Only) -->
                <div v-if="isEditControlMode" class="unassigned-sidebar">
                  <div class="sidebar-header">Unassigned Controls</div>
                  <div class="unassigned-list">
                    <div
                      v-for="item in unassignedControls"
                      :key="item.id"
                      class="unassigned-item"
                      draggable="true"
                      @dragstart="onUnassignedDragStart($event, item)"
                    >
                      {{ item.label }}
                      <span class="item-type">{{ item.source }}</span>
                    </div>
                    <div
                      v-if="unassignedControls.length === 0"
                      class="empty-msg"
                    >
                      All controls assigned
                    </div>
                  </div>
                </div>

                <!-- Grid Layout -->
                <div
                  class="control-grid"
                  :class="{ editing: isEditControlMode }"
                  v-if="nodeEditorState.controlLayout"
                >
                  <ControlTile
                    v-for="(tile, index) in (nodeEditorState.controlLayout as any[])"
                    :key="tile.id"
                    :tile="tile"
                    :isEditing="isEditControlMode"
                    draggable="true"
                    @dragstart="onTileDragStart($event, index)"
                    @dragover.prevent
                    @drop="onTileDrop($event, index)"
                    @remove-tile="removeControlTile"
                    @remove-item="removeControlItem"
                    @drop-item="onItemDrop"
                  >
                    <template #control="{ item }">
                      <div
                        class="rendered-control"
                        v-if="item && getControlData(item)"
                      >
                        <component
                          :is="getControlRenderer(item)"
                          :control="getControlData(item)!"
                          @change="handleControlChange(item, $event)"
                        />
                      </div>
                    </template>
                  </ControlTile>

                  <div
                    v-if="
                      (!nodeEditorState.controlLayout ||
                        nodeEditorState.controlLayout.length === 0) &&
                      !isEditControlMode
                    "
                    class="legacy-list-warning"
                  >
                    <div class="auto-list">
                      <!-- Node-based controls -->
                      <div v-if="nodeInputControls.length > 0">
                        <div class="controls-section-header">
                          Node Editor Controls
                        </div>
                        <div
                          v-for="control in nodeInputControls"
                          :key="control.id"
                          class="control-item"
                        >
                          <ControlRenderer
                            :control="control"
                            @change="
                              handleNodeControlChange(control.id, $event)
                            "
                          />
                        </div>
                      </div>
                      <!-- Code-based controls -->
                      <div v-if="inputDefinitions.length > 0">
                        <div class="controls-section-header">Code Controls</div>
                        <div
                          v-for="input in inputDefinitions"
                          :key="input.name"
                          class="control-item"
                        >
                          <ControlRenderer
                            :control="input"
                            @change="handleInputChange"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-show="activeTab === 'nodes'" class="tab-content node-editor-tab">
          <NodeCanvas />
        </div>
      </div>
    </div>

    <!-- Left Resizer -->
    <div class="resizer" @mousedown="startResize('left')"></div>

    <!-- Main Chart Section -->
    <div class="main-panel" :class="{ 'is-resizing': !!resizingSide }">
      <ChartPanel
        ref="chartPanelRef"
        :data="chartData"
        :layout="chartLayout"
        :isResizing="!!resizingSide"
        @click="handleChartClick"
      />
    </div>

    <!-- Right Resizer -->
    <div
      v-if="nodeEditorState.showDocPanel"
      class="resizer"
      @mousedown="startResize('right')"
    ></div>

    <!-- Documentation Section -->
    <div
      v-if="nodeEditorState.showDocPanel"
      class="sidebar right-panel"
      :style="{ width: rightWidth + 'px' }"
    >
      <DocPanel />
    </div>

    <!-- Resize Overlay -->
    <div v-if="resizingSide" class="resizing-overlay"></div>

    <!-- Project Manager Modal -->
    <ProjectManager
      v-if="showProjectManager"
      :currentThumbnail="plotThumbnail"
      @close="showProjectManager = false"
      @load="handleProjectLoad"
      @loadExample="handleLoadExample"
    />

    <!-- Save Project Name Modal -->
    <div
      v-if="showSaveNameModal"
      class="save-name-modal-overlay"
      @click.self="cancelSaveName"
    >
      <div class="save-name-modal">
        <h3>Save Project</h3>
        <input
          v-model="saveProjectName"
          type="text"
          class="save-name-input"
          placeholder="Enter project name..."
          @keyup.enter="confirmSaveName"
          @keyup.escape="cancelSaveName"
          ref="saveNameInput"
        />
        <div class="save-name-actions">
          <button class="cancel-btn" @click="cancelSaveName">Cancel</button>
          <button
            class="confirm-btn"
            @click="confirmSaveName"
            :disabled="!saveProjectName.trim()"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
  watch,
  provide,
  nextTick,
} from "vue";
import Papa from "papaparse";
import ChartPanel from "./components/ChartPanel.vue";
import DocPanel from "./components/DocPanel.vue";
import DataGrid from "./components/DataGrid.vue";
import { csvStore } from "./stores/csvStore";
import ControlTile from "./components/ControlTile.vue";
import ControlRenderer from "./components/ControlRenderer.vue";
import ProjectManager from "./components/ProjectManager.vue";

// Node Editor Imports
import NodeCanvas from "./components/NodeEditor/NodeCanvas.vue";
import MathNode from "./components/NodeEditor/nodes/MathNode.vue";
import DisplayNode from "./components/NodeEditor/nodes/DisplayNode.vue";
import NumberNode from "./components/NodeEditor/nodes/NumberNode.vue";
import InputNode from "./components/NodeEditor/nodes/InputNode.vue";
import ChartEventNode from "./components/NodeEditor/nodes/ChartEventNode.vue";
import ConstantNode from "./components/NodeEditor/nodes/ConstantNode.vue";
import ColorNode from "./components/NodeEditor/nodes/ColorNode.vue";
import CSVInputNode from "./components/NodeEditor/nodes/CSVInputNode.vue";
import IsolateColumnNode from "./components/NodeEditor/nodes/IsolateColumnNode.vue";
import SwitchNode from "./components/NodeEditor/nodes/SwitchNode.vue";
import TraceNode from "./components/NodeEditor/nodes/TraceNode.vue";
import JoinerNode from "./components/NodeEditor/nodes/JoinerNode.vue";
import CompareNode from "./components/NodeEditor/nodes/CompareNode.vue";
import LogicNode from "./components/NodeEditor/nodes/LogicNode.vue";
import IfNode from "./components/NodeEditor/nodes/IfNode.vue";
import FilterNode from "./components/NodeEditor/nodes/FilterNode.vue";
import PlotlyNode from "./components/NodeEditor/nodes/PlotlyNode.vue";
import StylingNode from "./components/NodeEditor/nodes/StylingNode.vue";
import RangeNode from "./components/NodeEditor/nodes/RangeNode.vue";
import LinkNode from "./components/NodeEditor/nodes/LinkNode.vue";
import {
  registerNodeType,
  addNode,
  addConnection,
  clearGraph,
  nodeEditorState,
  triggerGraphUpdate,
  triggerLayoutUpdate,
  serializeGraph,
  loadGraph,
  generateId,
  setIsLive,
  forceEvaluation,
} from "./components/NodeEditor/nodeEditorState";

// Register Node Types
registerNodeType("math", MathNode);
registerNodeType("display", DisplayNode);
registerNodeType("number", NumberNode);
registerNodeType("input", InputNode);
registerNodeType("chartEvent", ChartEventNode);
registerNodeType("constant", ConstantNode);
registerNodeType("color", ColorNode);
registerNodeType("csvInput", CSVInputNode);
registerNodeType("isolateColumn", IsolateColumnNode);
registerNodeType("switch", SwitchNode);
registerNodeType("trace", TraceNode);
registerNodeType("joiner", JoinerNode);
registerNodeType("compare", CompareNode);
registerNodeType("logic", LogicNode);
registerNodeType("if", IfNode);
registerNodeType("filter", FilterNode);
registerNodeType("plotly", PlotlyNode);
registerNodeType("styling", StylingNode);
registerNodeType("range", RangeNode);
registerNodeType("link", LinkNode);

// Widths
const leftWidth = ref(800);
const rightWidth = ref(400);

const MIN_SIDEBAR_WIDTH = 0;
const MIN_MAIN_PANEL_WIDTH = 100;
const RESIZER_WIDTH = 4;

// Default code
const code = ref(`// Define interactive inputs
input.add('multiplier', { type: 'slider', min: 0.1, max: 5, step: 0.1, default: 1 });
input.add('barColor', { type: 'color', default: '#007acc' });

const trace = {
  x: data.map(row => row.category),
  y: data.map(row => row.value * inputs.multiplier),
  type: 'bar',
  marker: {
    color: inputs.barColor
  }
};

return {
  data: [trace],
  layout: {
    title: 'Data Visualization',
    xaxis: { title: 'Category' },
    yaxis: { title: 'Value' }
  }
};
`);

const chartData = ref<any[]>([]);
const chartLayout = ref<any>({});
// rawData is now computed from the active store file
const rawData = computed({
  get: () => {
    const file = csvStore.files.find((f) => f.id === csvStore.activeFileId);
    return file ? file.data : [];
  },
  set: (val) => {
    if (csvStore.activeFileId) {
      csvStore.updateFileContent(csvStore.activeFileId, val);
    }
  },
});
const activeTab = ref<"data" | "controls" | "nodes">("nodes");
// const isLiveEdit = ref(true); // Moved to global state
const inputDefinitions = ref<any[]>([]);
const resizingSide = ref<"left" | "right" | null>(null);
const lastChartClick = ref<any>(null);

const isEditControlMode = ref(false);
const showProjectManager = ref(false);
const plotThumbnail = ref<string | undefined>(undefined);
const chartPanelRef = ref<any>(null);
const showSaveNameModal = ref(false);
const saveProjectName = ref("");
const saveNameInput = ref<HTMLInputElement | null>(null);
const currentProjectId = ref<string | null>(null); // Track if we're updating an existing project

const currentProjectName = computed(() => {
  if (!currentProjectId.value) return "New Project";
  try {
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const project = projects.find((p: any) => p.id === currentProjectId.value);
    return project ? project.name : "New Project";
  } catch (e) {
    return "New Project";
  }
});

watch(
  currentProjectName,
  (newName) => {
    document.title = `Nodeplot - ${newName}`;
  },
  { immediate: true }
);

const unassignedControls = computed(() => {
  const assignedIds = new Set();
  nodeEditorState.controlLayout?.forEach((tile) => {
    tile.items.forEach((item) => assignedIds.add(item.id + ":" + item.type));
  });

  const list: any[] = [];

  // Node controls
  nodeInputControls.value.forEach((c) => {
    if (!assignedIds.has(c.id + ":node")) {
      list.push({
        ...c,
        id: c.id,
        type: "node",
        label: c.label,
        source: "Node",
      });
    }
  });

  // Code controls
  inputDefinitions.value.forEach((c) => {
    if (!assignedIds.has(c.name + ":code")) {
      list.push({
        ...c,
        id: c.name,
        type: "code",
        label: c.label,
        source: "Code",
      });
    }
  });

  return list;
});

function addControlTile() {
  if (!nodeEditorState.controlLayout) nodeEditorState.controlLayout = [];
  nodeEditorState.controlLayout.push({
    id: generateId(),
    label: "New Group",
    position: { x: 0, y: 0 },
    layout: "vertical",
    items: [],
  });
}

function removeControlTile(id: string) {
  if (confirm("Remove this group?")) {
    nodeEditorState.controlLayout = nodeEditorState.controlLayout.filter(
      (t) => t.id !== id
    );
  }
}

function removeControlItem(tileId: string, itemId: string) {
  const tile = nodeEditorState.controlLayout.find((t) => t.id === tileId);
  if (tile) {
    tile.items = tile.items.filter((i) => i.id !== itemId);
  }
}

function onTileDragStart(event: DragEvent, index: number) {
  if (!isEditControlMode.value) {
    event.preventDefault();
    return;
  }
  event.dataTransfer?.setData(
    "application/json",
    JSON.stringify({ type: "move-tile", index })
  );
}

function onTileDrop(event: DragEvent, targetIndex: number) {
  const dataStr = event.dataTransfer?.getData("application/json");
  if (!dataStr) return;
  const data = JSON.parse(dataStr);

  if (data.type === "move-tile") {
    const fromIndex = data.index;
    if (!nodeEditorState.controlLayout) return;
    const tile = nodeEditorState.controlLayout[fromIndex];
    if (tile) {
      nodeEditorState.controlLayout.splice(fromIndex, 1);
      nodeEditorState.controlLayout.splice(targetIndex, 0, tile);
    }
  }
}

function onUnassignedDragStart(event: DragEvent, item: any) {
  event.dataTransfer?.setData(
    "application/json",
    JSON.stringify({
      type: "add-item",
      id: item.id,
      itemType: item.type,
    })
  );
}

function onItemDrop(event: DragEvent, tileId: string) {
  const dataStr = event.dataTransfer?.getData("application/json");
  if (!dataStr) return;
  const data = JSON.parse(dataStr);

  if (!nodeEditorState.controlLayout) return;
  const tile = nodeEditorState.controlLayout.find((t) => t.id === tileId);
  if (!tile) return;

  if (data.type === "add-item") {
    // Add new item
    tile.items.push({ id: data.id, type: data.itemType });
  } else if (data.type === "move-item") {
    // Move existing item
    const sourceTile = nodeEditorState.controlLayout.find(
      (t) => t.id === data.tileId
    );
    if (sourceTile && sourceTile.items) {
      const item = sourceTile.items[data.index];
      if (item) {
        sourceTile.items.splice(data.index, 1);
        tile.items.push(item);
      }
    }
  }
}

function getControlRenderer(_item: any) {
  return ControlRenderer;
}

function getControlData(item: any) {
  if (item.type === "node") {
    return nodeInputControls.value.find((c) => c.id === item.id);
  } else {
    return inputDefinitions.value.find((c) => c.name === item.id);
  }
}

function handleControlChange(item: any, event: any) {
  if (item.type === "node") {
    handleNodeControlChange(item.id, event);
  } else {
    const def = inputDefinitions.value.find((c) => c.name === item.id);
    if (def) {
      def.value = event;
      handleInputChange();
    }
  }
}

const includeData = ref(true);

function handleExport() {
  const json = serializeGraph(includeData.value);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `graph-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleProjectLoad(projectData: string, projectId: string) {
  loadGraph(projectData);
  currentProjectId.value = projectId || null;
}

async function openProjectManager() {
  // Capture current plot thumbnail
  if (chartPanelRef.value && chartPanelRef.value.getThumbnail) {
    try {
      const thumbnail = await chartPanelRef.value.getThumbnail();
      plotThumbnail.value = thumbnail || undefined;
    } catch (e) {
      console.error("Failed to capture thumbnail:", e);
      plotThumbnail.value = undefined;
    }
  }
  showProjectManager.value = true;
}

async function handleLoadExample(exampleName: string) {
  try {
    const module = await import(`./examples/${exampleName}.json`);
    loadGraph(JSON.stringify(module.default));
  } catch (e) {
    console.error("Failed to load example", e);
    alert("Example not found");
  }
}

const STORAGE_KEY = "datatool_projects";

interface Project {
  id: string;
  name: string;
  savedAt: number;
  graphData: string;
  thumbnail: string | null;
  nodeCount: number;
}

async function handleQuickSave() {
  // Load existing projects
  let projects: Project[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      projects = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load projects:", e);
  }

  // Check if current project exists (by comparing graph structure)
  let existingProject: Project | null = null;
  if (currentProjectId.value) {
    existingProject =
      projects.find((p) => p.id === currentProjectId.value) || null;
  }

  if (existingProject) {
    // Update existing project
    await saveProject(existingProject.id, existingProject.name);
  } else {
    // Show modal to enter name
    saveProjectName.value = "";
    showSaveNameModal.value = true;
    nextTick(() => {
      saveNameInput.value?.focus();
    });
  }
}

async function saveProject(projectId: string | null, projectName: string) {
  const graphData = serializeGraph(true);

  // Capture thumbnail
  let thumbnail: string | null = null;
  if (chartPanelRef.value && chartPanelRef.value.getThumbnail) {
    try {
      thumbnail = await chartPanelRef.value.getThumbnail();
    } catch (e) {
      console.error("Failed to capture thumbnail:", e);
    }
  }

  // Count nodes
  let nodeCount = 0;
  try {
    const parsed = JSON.parse(graphData);
    nodeCount = parsed.nodes?.length || 0;
  } catch (e) {
    console.error("Failed to parse graph data:", e);
  }

  // Load projects
  let projects: Project[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      projects = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load projects:", e);
  }

  if (projectId) {
    // Update existing project
    const index = projects.findIndex((p) => p.id === projectId);
    if (index !== -1) {
      const oldProject = projects[index];
      if (oldProject) {
        const updatedProject: Project = {
          id: oldProject.id,
          name: projectName,
          savedAt: Date.now(),
          graphData,
          thumbnail,
          nodeCount,
        };
        projects[index] = updatedProject;
        currentProjectId.value = projectId;
      }
    }
  } else {
    // Create new project
    const newId = `project_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    projects.push({
      id: newId,
      name: projectName,
      savedAt: Date.now(),
      graphData,
      thumbnail,
      nodeCount,
    });
    currentProjectId.value = newId;
  }

  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    showNotification(projectId ? "Project updated!" : "Project saved!");
  } catch (e) {
    console.error("Failed to save projects:", e);
    alert("Failed to save project. Storage might be full.");
  }
}

async function confirmSaveName() {
  if (!saveProjectName.value.trim()) return;

  await saveProject(null, saveProjectName.value.trim());
  showSaveNameModal.value = false;
  saveProjectName.value = "";
}

function cancelSaveName() {
  showSaveNameModal.value = false;
  saveProjectName.value = "";
}

function showNotification(message: string) {
  // Simple notification - could be enhanced with a toast system
  const notification = document.createElement("div");
  notification.className = "project-notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Provide to child components (for InputNode and ChartEventNode)
provide("inputDefinitions", inputDefinitions);
provide("lastChartClick", lastChartClick);

const inputValues = computed(() => {
  const vals: any = {};
  inputDefinitions.value.forEach((d) => {
    vals[d.name] = d.value;
  });
  return vals;
});

// Computed property to get InputNode controls from node editor
const nodeInputControls = computed(() => {
  const controls: any[] = [];
  nodeEditorState.nodes.forEach((node) => {
    if (node.type === "input" && node.data.inputType) {
      controls.push({
        id: node.id,
        label: node.data.label || "Unnamed",
        type: node.data.inputType,
        value: node.data.currentValue ?? node.data.defaultValue,
        min: node.data.min,
        max: node.data.max,
        step: node.data.step,
        options: node.data.options,
      });
    }
  });
  return controls;
});

const handleFileUpload = (event: any) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    processCsvText(text, file.name);
  };
  reader.readAsText(file);
};

const processCsvText = (
  text: string,
  name: string
): Promise<{ id: string; data: any[]; arrayData: any[][] }> => {
  return new Promise((resolve) => {
    // 1. Parse as Objects (for Code/DataGrid)
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (resObj) => {
        // 2. Parse as Arrays (for Node Graph)
        Papa.parse(text, {
          header: false,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (resArr) => {
            const data = resObj.data as any[];
            const arrayData = resArr.data as any[][];

            const id = csvStore.addFile({
              name: name,
              data: data,
              arrayData: arrayData,
              width: data.length > 0 ? Object.keys(data[0] || {}).length : 0,
              height: data.length,
            });
            csvStore.setActiveFile(id);
            runCode(true);
            resolve({ id, data, arrayData });
          },
        });
      },
    });
  });
};

const handleGlobalCsvChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  csvStore.setActiveFile(select.value);
  runCode(true);
};

const deleteActiveFile = () => {
  if (csvStore.activeFileId) {
    // Confirm?
    if (confirm("Are you sure you want to delete this file?")) {
      csvStore.removeFile(csvStore.activeFileId);
    }
  }
};

const handleDataUpdate = (newData: any[]) => {
  if (csvStore.activeFileId) {
    csvStore.updateFileContent(csvStore.activeFileId, newData);
  }
  if (nodeEditorState.isLive) {
    triggerGraphUpdate(true);
    runCode();
  }
};

const handleInputChange = () => {
  if (nodeEditorState.isLive) runCode();
};

const handleNodeControlChange = (nodeId: string, value: any) => {
  const node = nodeEditorState.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  // Update node data using the value emitted by ControlRenderer
  // The value is already parsed (e.g. number) by the renderer
  node.data.currentValue = value;

  // Trigger graph update to propagate change
  triggerGraphUpdate(true);
};

const parseInputs = (codeStr: string) => {
  const definitions: any[] = [];
  const inputProxy = {
    add: (name: string, config: any) => {
      definitions.push({
        name,
        label: config.label || name,
        type: config.type || "text",
        value:
          config.default ??
          (config.type === "number" || config.type === "slider" ? 0 : ""),
        ...config,
      });
    },
  };

  try {
    const fn = new Function("input", codeStr);
    fn(inputProxy);

    // Merge existing values
    definitions.forEach((newDef) => {
      const oldDef = inputDefinitions.value.find((d) => d.name === newDef.name);
      if (oldDef && oldDef.type === newDef.type) {
        newDef.value = oldDef.value;
      }
    });

    inputDefinitions.value = definitions;
  } catch (e) {
    // Ignore parsing errors during editing
  }
};

let isExecuting = false;
let pendingExecution = false;

const runCode = (force = false) => {
  if (force) {
    executeCode(); // This executes the user code
    forceEvaluation(); // This forces the node graph to evaluate
    return;
  }

  if (isExecuting) {
    pendingExecution = true;
    return;
  }

  isExecuting = true;

  requestAnimationFrame(() => {
    executeCode();
    isExecuting = false;
    if (pendingExecution) {
      pendingExecution = false;
      runCode();
    }
  });
};

const executeCode = () => {
  try {
    if (!code.value) return;
    const fn = new Function("data", "inputs", "Plotly", code.value);
    const result = fn(rawData.value, inputValues.value, {});

    if (result) {
      chartData.value = result.data || [];
      chartLayout.value = result.layout || {};
    }
  } catch (err) {
    console.error("Code Error:", err);
  }
};

// Resizing
const startResize = (side: "left" | "right") => {
  resizingSide.value = side;
  window.addEventListener("mousemove", onResize);
  window.addEventListener("mouseup", stopResize);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
};

let resizeAnimationFrame: number | null = null;

const onResize = (e: MouseEvent) => {
  if (resizeAnimationFrame) return;

  resizeAnimationFrame = requestAnimationFrame(() => {
    if (resizingSide.value === "left") {
      const maxWidth =
        window.innerWidth -
        rightWidth.value -
        MIN_MAIN_PANEL_WIDTH -
        RESIZER_WIDTH * 2;
      leftWidth.value = Math.max(
        MIN_SIDEBAR_WIDTH,
        Math.min(e.clientX, maxWidth)
      );
    } else if (resizingSide.value === "right") {
      const maxWidth =
        window.innerWidth -
        leftWidth.value -
        MIN_MAIN_PANEL_WIDTH -
        RESIZER_WIDTH * 2;
      rightWidth.value = Math.max(
        MIN_SIDEBAR_WIDTH,
        Math.min(window.innerWidth - e.clientX, maxWidth)
      );
    }
    resizeAnimationFrame = null;
  });
};

const handleWindowResize = () => {
  const availableWidthForSidebars =
    window.innerWidth - MIN_MAIN_PANEL_WIDTH - RESIZER_WIDTH * 2;
  const currentTotal = leftWidth.value + rightWidth.value;

  if (currentTotal > availableWidthForSidebars) {
    if (availableWidthForSidebars <= 0) {
      leftWidth.value = 0;
      rightWidth.value = 0;
    } else {
      const ratio = availableWidthForSidebars / currentTotal;
      leftWidth.value = leftWidth.value * ratio;
      rightWidth.value = rightWidth.value * ratio;
    }
  }
};

const stopResize = () => {
  resizingSide.value = null;
  window.removeEventListener("mousemove", onResize);
  window.removeEventListener("mouseup", stopResize);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
};

// Sync Node Editor to Main Chart
import { getNodeValues } from "./components/NodeEditor/nodeEditorState";

// Watch for node graph updates to drive the main chart
import { watchEffect } from "vue";

watchEffect(() => {
  // Find a Plotly node
  const plotlyNode = nodeEditorState.nodes.find((n) => n.type === "plotly");

  if (plotlyNode) {
    // Get its data from values
    const values = getNodeValues.value[plotlyNode.id];
    if (values) {
      // Data
      const inputData = values["data"];
      if (Array.isArray(inputData)) {
        chartData.value = inputData.flat().filter((d) => d);
      } else if (typeof inputData === "object" && inputData !== null) {
        chartData.value = [inputData];
      } else {
        chartData.value = [];
      }

      // Layout
      if (values["layout"]) {
        chartLayout.value = values["layout"];
      } else {
        chartLayout.value = {
          margin: { t: 30, r: 20, b: 40, l: 40 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#ccc" },
          xaxis: { gridcolor: "#444", zerolinecolor: "#666" },
          yaxis: { gridcolor: "#444", zerolinecolor: "#666" },
          showlegend: true,
          legend: { x: 0, y: 1 },
          hovermode: "closest",
        };
      }
    }
  } else {
    // Fallback to code execution if no plotly node?
    // Or specific 'mode' switch?
    // For now, if code is empty and we have no node, it's empty.
    // If code has content, runCode updates chartData.
    // We might have a conflict if both exist.
    // Let's say Node Editor takes precedence if a Plotly node exists.
  }
});

watch(code, () => {
  parseInputs(code.value);
  // Only run code if NO plotly node exists
  const plotlyNode = nodeEditorState.nodes.find((n) => n.type === "plotly");
  if (!plotlyNode && nodeEditorState.isLive) runCode();
});

watch(activeTab, (newTab) => {
  if (newTab === "nodes") {
    // Give time for the DOM to render the node editor container
    setTimeout(() => {
      triggerLayoutUpdate();
    }, 100);
  }
});

const handleChartClick = (event: any) => {
  // 1. Update global state for code-based usage
  if (event && event.points && event.points[0]) {
    const point = event.points[0];
    lastChartClick.value = {
      x: point.x,
      y: point.y,
      pointIndex: point.pointIndex,
      curveNumber: point.curveNumber,
    };

    // 2. Update Plotly Node state for node-based usage
    const plotlyNode = nodeEditorState.nodes.find((n) => n.type === "plotly");
    if (plotlyNode) {
      if (!plotlyNode.data) plotlyNode.data = {};
      plotlyNode.data.selectedPoint = {
        x: point.x,
        y: point.y,
        curveNumber: point.curveNumber,
        pointIndex: point.pointIndex,
        data: point.data,
      };
      // Trigger update to propagate to Display nodes
      triggerGraphUpdate(true);
    }
  }
};

onMounted(() => {
  window.addEventListener("resize", handleWindowResize);

  // Clear existing nodes to avoid duplication on HMR/remount
  clearGraph();

  // Load example CSV and setup default graph
  fetch("/example.csv")
    .then((r) => r.text())
    .then(async (t) => {
      // 1. Process for both Code and Node modes
      const { id, arrayData } = await processCsvText(t, "example.csv");

      // 2. Setup Node Graph using this data
      const data = arrayData;

      // 1. CSV Input Node
      const csvNodeId = "node-csv";
      addNode({
        id: csvNodeId,
        type: "csvInput",
        label: "Example Data",
        position: { x: 50, y: 50 },
        data: {
          fileId: id,
          fileName: "example.csv",
          csvData: data,
          width: data[0]?.length || 0,
          height: data.length,
        },
        inputs: {},
        outputs: {
          data: null,
          width: null,
          height: null,
          fileName: null,
        },
      });

      // 2. Isolate Column Nodes (X and Y)
      const col1NodeId = "node-col-1";
      const col2NodeId = "node-col-2";

      addNode({
        id: col1NodeId,
        type: "isolateColumn",
        label: "Column 1 (X)",
        position: { x: 300, y: 50 },
        data: { columnIndex: 0 }, // First column
        inputs: { csvData: null },
        outputs: { name: null, data: null },
      });

      addNode({
        id: col2NodeId,
        type: "isolateColumn",
        label: "Column 2 (Y)",
        position: { x: 300, y: 200 },
        data: { columnIndex: 1 }, // Second column
        inputs: { csvData: null },
        outputs: { name: null, data: null },
      });

      // Connect CSV to Columns
      addConnection({
        id: "c1",
        sourceNodeId: csvNodeId,
        sourcePort: "data",
        targetNodeId: col1NodeId,
        targetPort: "csvData",
      });
      addConnection({
        id: "c2",
        sourceNodeId: csvNodeId,
        sourcePort: "data",
        targetNodeId: col2NodeId,
        targetPort: "csvData",
      });

      // 3. Trace Node
      const traceNodeId = "node-trace-1";
      addNode({
        id: traceNodeId,
        type: "trace",
        label: "Scatter Trace",
        position: { x: 550, y: 100 },
        data: {
          type: "scatter",
          mode: "lines+markers",
          name: "Data Series 1",
        },
        inputs: { x: null, y: null, z: null },
        outputs: { trace: null },
      });

      // Connect Columns to Trace
      addConnection({
        id: "c3",
        sourceNodeId: col1NodeId,
        sourcePort: "data",
        targetNodeId: traceNodeId,
        targetPort: "x",
      });
      addConnection({
        id: "c4",
        sourceNodeId: col2NodeId,
        sourcePort: "data",
        targetNodeId: traceNodeId,
        targetPort: "y",
      });

      // 4. Joiner Node
      const joinerNodeId = "node-joiner";
      addNode({
        id: joinerNodeId,
        type: "joiner",
        label: "Trace Joiner",
        position: { x: 800, y: 150 },
        data: {},
        inputs: { input0: null },
        outputs: { list: null },
      });

      // Connect Trace to Joiner
      addConnection({
        id: "c5",
        sourceNodeId: traceNodeId,
        sourcePort: "trace",
        targetNodeId: joinerNodeId,
        targetPort: "input0",
      });

      // 5. Plotly Node
      const plotlyNodeId = "node-plotly";
      addNode({
        id: plotlyNodeId,
        type: "plotly",
        label: "Main Chart",
        position: { x: 1000, y: 100 },
        data: {},
        inputs: { data: null, layout: null },
        outputs: { selectedPoint: null, hoverPoint: null },
      });

      // Connect Joiner to Plotly
      addConnection({
        id: "c6",
        sourceNodeId: joinerNodeId,
        sourcePort: "list",
        targetNodeId: plotlyNodeId,
        targetPort: "data",
      });

      // 6. Display Node for Events
      const displayNodeId = "node-display";
      addNode({
        id: displayNodeId,
        type: "display",
        label: "Selected Point",
        position: { x: 1000, y: 500 },
        data: { value: 0 },
        inputs: { value: null },
        outputs: {},
      });

      // Connect Plotly Event to Display
      addConnection({
        id: "c7",
        sourceNodeId: plotlyNodeId,
        sourcePort: "selectedPoint",
        targetNodeId: displayNodeId,
        targetPort: "value",
      });

      triggerGraphUpdate();
    });
});

onUnmounted(() => {
  window.removeEventListener("resize", handleWindowResize);
});
</script>

<style>
* {
  box-sizing: border-box;
}

body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #111;
  color: #fff;
  font-family: sans-serif;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: #222;
  overflow: hidden;
  min-width: 0;
  flex: 0 0 auto;
}

.resizer {
  width: 4px;
  cursor: col-resize;
  background: #333;
  position: relative;
  z-index: 10;
}

.resizer::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -4px;
  right: -4px;
  cursor: col-resize;
}

.resizer:hover {
  background: #555;
}

.main-panel {
  flex: 1;
  background: #111;
  display: flex;
  min-width: 100px;
  position: relative;
}

.main-panel.is-resizing {
  pointer-events: none;
}

.tabs {
  display: flex;
  background: #1a1a1a;
  padding: 6px;
  gap: 4px;
}

.tabs button {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s;
}

.tabs button:hover {
  color: #aaa;
  background: rgba(255, 255, 255, 0.03);
}

.tabs button.active {
  background: #333;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.node-editor-tab {
  overflow: hidden;
  padding: 0;
}

.input-controls-tab {
  padding: 20px;
}

.controls-section-header {
  font-size: 12px;
  font-weight: bold;
  color: #00d2ff;
  margin-top: 15px;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #333;
}

.controls-section-header:first-child {
  margin-top: 0;
}

.no-controls {
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.top-bar {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  gap: 16px;
  min-height: 56px;
  user-select: none;
}

.top-bar-left,
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar-divider {
  width: 1px;
  height: 24px;
  background: #3a3a3a;
  margin: 0 4px;
}

.icon {
  font-size: 14px;
  opacity: 0.8;
}

.custom-file-upload,
.run-btn,
.io-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.custom-file-upload {
  background: #2a2a2a;
  color: #efefef;
  border-color: #3a3a3a;
}

.custom-file-upload:hover {
  background: #333;
  border-color: #4a4a4a;
  transform: translateY(-1px);
}

.custom-file-upload input {
  display: none;
}

.run-btn {
  background: #00d672;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 204, 82, 0.2);
}

.run-btn:hover {
  background: #43feb3;
  transform: translateY(-1px);
  color: #000000;
  box-shadow: 0 6px 16px rgba(30, 238, 113, 0.3);
}

.run-btn:active {
  transform: translateY(0);
}

.io-btn {
  background: #252525;
  color: #ccc;
  border-color: #333;
}

.io-btn:hover {
  background: #2d2d2d;
  border-color: #444;
  color: #fff;
  transform: translateY(-1px);
}

.projects-btn {
  background: linear-gradient(
    135deg,
    rgba(0, 210, 255, 0.1) 0%,
    rgba(58, 123, 213, 0.1) 100%
  );
  border-color: rgba(0, 210, 255, 0.3);
  color: #00d2ff;
}

.projects-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 210, 255, 0.2) 0%,
    rgba(58, 123, 213, 0.2) 100%
  );
  border-color: rgba(0, 210, 255, 0.5);
  color: #00d2ff;
  box-shadow: 0 0 12px rgba(0, 210, 255, 0.2);
}

.projects-btn .icon {
  font-size: 16px;
}

.save-btn-top {
  background: rgba(0, 214, 114, 0.1) !important;
  border-color: rgba(0, 214, 114, 0.3) !important;
  color: #00d672 !important;
}

.save-btn-top:hover {
  background: rgba(0, 214, 114, 0.2) !important;
  border-color: rgba(0, 214, 114, 0.5) !important;
  box-shadow: 0 0 12px rgba(0, 214, 114, 0.2) !important;
}

.save-name-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  animation: fadeIn 0.2s ease;
}

.save-name-modal {
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.save-name-modal h3 {
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 18px;
}

.save-name-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  margin-bottom: 20px;
  outline: none;
}

.save-name-input:focus {
  border-color: #00d2ff;
}

.save-name-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.save-name-actions button {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ccc;
}

.confirm-btn {
  background: #00d2ff;
  color: #fff;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.data-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.data-checkbox input {
  display: none;
}

.data-checkbox .check-box {
  width: 14px;
  height: 14px;
  border: 1.5px solid #444;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s;
}

.data-checkbox input:checked + .check-box {
  background: #007acc;
  border-color: #007acc;
}

.data-checkbox input:checked + .check-box::after {
  content: "✓";
  position: absolute;
  top: -2px;
  left: 1px;
  color: white;
  font-size: 10px;
}

.live-edit-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 8px;
  cursor: pointer;
}

.live-edit-toggle input {
  display: none;
}

.toggle-slider {
  width: 28px;
  height: 16px;
  background: #333;
  border-radius: 10px;
  position: relative;
  transition: all 0.3s;
}

.live-edit-toggle input:checked + .toggle-slider {
  background: #00d672;
}

.toggle-slider::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: #ccc;
  border-radius: 50%;
  transition: all 0.3s;
}

.live-edit-toggle input:checked + .toggle-slider::after {
  transform: translateX(12px);
  background: #fff;
}

.toggle-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #777;
  font-weight: 700;
}

.live-edit-toggle input:checked ~ .toggle-label {
  color: #00d672;
}

.example-select {
  background: #252525;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.example-select:hover {
  background: #2d2d2d;
  border-color: #4a4a4a;
  color: #fff;
}

.resizing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  cursor: col-resize;
}
</style>

<style>
.io-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-edit-toggle.vertical {
  flex-direction: column;
  padding: 0;
  gap: 4px;
  justify-content: center;
  height: auto;
}

.live-edit-toggle.vertical .toggle-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.top-bar {
  justify-content: space-between;
}

.data-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 10px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  margin-bottom: 0;
  min-height: 46px;
}

.data-file-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #ccc;
}

.data-file-selector .label {
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.data-file-selector select {
  background: #252525;
  color: #eee;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  min-width: 200px;
  transition: all 0.2s;
}

.data-file-selector select:hover {
  background: #2d2d2d;
  border-color: #4a4a4a;
  color: #fff;
}

.data-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-csv-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(
    135deg,
    rgba(0, 210, 255, 0.1) 0%,
    rgba(58, 123, 213, 0.1) 100%
  );
  border: 1px solid rgba(0, 210, 255, 0.3);
  color: #00d2ff;
}

.upload-csv-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 210, 255, 0.2) 0%,
    rgba(58, 123, 213, 0.2) 100%
  );
  border-color: rgba(0, 210, 255, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(0, 210, 255, 0.2);
}

.upload-csv-btn .icon {
  font-size: 14px;
}

.delete-btn {
  background: rgba(255, 59, 48, 0.1);
  color: #ff453a;
  border: 1px solid rgba(255, 59, 48, 0.2);
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.delete-btn:hover {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.4);
  transform: translateY(-1px);
}

.delete-btn:active {
  transform: translateY(0);
}

.no-file-text {
  font-style: italic;
  color: #666;
  font-size: 13px;
  padding: 0 10px;
}

.csv-control-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.csv-select {
  background: #252525;
  color: #ccc;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 150px;
}

.csv-select:hover {
  background: #2d2d2d;
  border-color: #4a4a4a;
  color: #fff;
}

.controls-container {
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.controls-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 4px;
}

.edit-mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #007acc;
  user-select: none;
}

.edit-mode-toggle input {
  display: none;
}

.edit-mode-toggle span {
  padding: 4px 8px;
  border: 1px solid #007acc;
  border-radius: 4px;
  transition: all 0.2s;
}

.edit-mode-toggle input:checked + span {
  background: #007acc;
  color: white;
}

.add-tile-btn {
  background: #252525;
  border: 1px solid #444;
  color: #ccc;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.add-tile-btn:hover {
  background: #333;
  color: #fff;
}

.controls-layout-wrapper {
  flex: 1;
  display: flex;
  gap: 10px;
  overflow: hidden;
  position: relative;
}

.unassigned-sidebar {
  width: 200px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 8px;
  background: #222;
  border-bottom: 1px solid #333;
  font-size: 11px;
  font-weight: bold;
  color: #aaa;
  text-transform: uppercase;
}

.unassigned-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.unassigned-item {
  background: #252525;
  border: 1px solid #3a3a3a;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #ddd;
  cursor: grab;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unassigned-item:hover {
  border-color: #555;
  background: #2a2a2a;
}

.item-type {
  font-size: 9px;
  color: #666;
  background: #111;
  padding: 2px 4px;
  border-radius: 2px;
}

.empty-msg {
  color: #555;
  font-style: italic;
  font-size: 11px;
  text-align: center;
  margin-top: 20px;
}

.control-grid {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-content: flex-start;
  padding: 4px;
}

.control-grid.editing {
  background: rgba(0, 0, 0, 0.1);
}

.rendered-control {
  width: 100%;
}

.legacy-list-warning {
  width: 100%;
}

.auto-list {
  padding: 10px;
}
</style>
