<template>
  <div
    class="node-editor-canvas"
    ref="canvasRef"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @wheel.prevent="onWheel"
    @contextmenu.prevent="onContextMenu"
  >
    <!-- Connections Layer (SVG) -->
    <svg class="connections-layer">
      <g :style="transformStyle">
        <ConnectionLine
          v-for="conn in connections"
          :key="conn.id"
          :x1="getPortPosition(conn.sourceNodeId, conn.sourcePort, 'output').x"
          :y1="getPortPosition(conn.sourceNodeId, conn.sourcePort, 'output').y"
          :x2="getPortPosition(conn.targetNodeId, conn.targetPort, 'input').x"
          :y2="getPortPosition(conn.targetNodeId, conn.targetPort, 'input').y"
          :value="getConnectionValue(conn.id)"
          @click.stop="onConnectionClick(conn.id)"
        />
        <!-- Dragging Connection Line -->
        <ConnectionLine
          v-if="connectionState && connectionState.isConnecting"
          :x1="
            connectionState.sourceType === 'output' ? dragStart.x : dragEnd.x
          "
          :y1="
            connectionState.sourceType === 'output' ? dragStart.y : dragEnd.y
          "
          :x2="
            connectionState.sourceType === 'output' ? dragEnd.x : dragStart.x
          "
          :y2="
            connectionState.sourceType === 'output' ? dragEnd.y : dragStart.y
          "
          :value="null"
        />
      </g>
    </svg>

    <!-- Nodes Layer -->
    <div class="transform-layer" :style="transformStyle">
      <component
        v-for="node in nodes"
        :key="node.id"
        :is="getNodeComponent(node.type)"
        :node="node"
        :selected="selection.includes(node.id)"
        @connect-start="onConnectStart"
        @connect-end="onConnectEnd"
        @socket-click="onSocketClick"
      />
    </div>

    <div class="controls">
      <button
        class="add-node-btn"
        @click="toggleAddNodeMenuAtCenter"
        title="Add Node (Shift+A)"
      >
        + Add Node
      </button>

      <button
        class="doc-toggle-btn"
        :class="{ active: nodeEditorState.showDocPanel }"
        @click="nodeEditorState.showDocPanel = !nodeEditorState.showDocPanel"
        title="Toggle Plotly Documentation"
      >
        <div class="i-mdi-book-open-variant"></div>
      </button>

      <div class="zoom-level">{{ Math.round(zoom * 100) }}%</div>
    </div>

    <!-- Add Node Menu (Blender style) -->
    <AddNodeMenu
      :show="showAddNodeMenu"
      :x="menuPos.x"
      :y="menuPos.y"
      @close="showAddNodeMenu = false"
      @select="onNodeSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  nodeEditorState,
  setZoom,
  setPan,
  updateNodeDrag,
  endNodeDrag,
  clearSelection,
  addConnection,
  addNode,
  removeNode,
  generateId,
  endConnection,
  startConnection,
  updateConnectionPreview,
  removeConnectionsToInput,
  getConnectionValue,
  getSocketPosition,
  NODE_TYPES,
  duplicateNode,
  registerNodeType,
} from "./nodeEditorState";
import type { NodeDefinition } from "./nodeEditorState";
import ConnectionLine from "./ConnectionLine.vue";
import BaseNode from "./BaseNode.vue";
import ConfigNode from "./nodes/ConfigNode.vue";
import SubplotNode from "./nodes/SubplotNode.vue";
import StylingNode from "./nodes/StylingNode.vue";
import LayoutNode from "./nodes/LayoutNode.vue";
import RangeNode from "./nodes/RangeNode.vue";
import LinkNode from "./nodes/LinkNode.vue";
import IsolateColumnNode from "./nodes/IsolateColumnNode.vue";
import AddNodeMenu from "./AddNodeMenu.vue";

registerNodeType("config", ConfigNode);
registerNodeType("subplot", SubplotNode);
registerNodeType("styling", StylingNode);
registerNodeType("layoutNode", LayoutNode);
registerNodeType("range", RangeNode);
registerNodeType("link", LinkNode);
registerNodeType("isolateColumn", IsolateColumnNode);

// --- State Access ---
const nodes = computed(() => nodeEditorState.nodes);
const connections = computed(() => nodeEditorState.connections);
const zoom = computed(() => nodeEditorState.zoom);
const pan = computed(() => nodeEditorState.pan);
const selection = computed(() => nodeEditorState.selection);
const connectionState = computed(() => nodeEditorState.connectionState);

const canvasRef = ref<HTMLElement | null>(null);
const showAddNodeMenu = ref(false);
const menuPos = ref({ x: 0, y: 0 });
// Position for node creation (where the menu was opened)
const creationPos = ref({ x: 0, y: 0 });

// Remove legacy panel state
// const showAddNodePanel = ref(true);
// const hoveredNodeDescription = ref<string | null>(null);

// Watch for panel opening to trigger update
const lastMouseScreenPos = ref({ x: 0, y: 0 });

// --- Transform ---
const transformStyle = computed(() => ({
  transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
  transformOrigin: "0 0",
}));

// --- Mouse Interaction ---
let isPanning = false;
let startPan = { x: 0, y: 0 };
// Track mouse relative to canvas for connection preview
const mousePos = ref({ x: 0, y: 0 });

function updateMousePos(clientX: number, clientY: number) {
  lastMouseScreenPos.value = { x: clientX, y: clientY };
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = (clientX - rect.left - pan.value.x) / zoom.value;
  const y = (clientY - rect.top - pan.value.y) / zoom.value;
  mousePos.value = { x, y };
}

function onMouseDown(e: MouseEvent) {
  // Check if clicking on background
  const isBackground =
    e.target === canvasRef.value ||
    (e.target as HTMLElement).classList.contains("transform-layer");

  // Pan on Middle Click OR (Left Click on Background or with Alt)
  if (e.button === 1 || (e.button === 0 && (e.altKey || isBackground))) {
    isPanning = true;
    startPan = { x: e.clientX, y: e.clientY };

    // Clear selection if panning via background click (standard behavior)
    if (e.button === 0 && isBackground) {
      clearSelection();
    }
  }
}

function onMouseMove(e: MouseEvent) {
  updateMousePos(e.clientX, e.clientY);

  if (isPanning) {
    const dx = e.clientX - startPan.x;
    const dy = e.clientY - startPan.y;
    setPan({ x: pan.value.x + dx, y: pan.value.y + dy });
    startPan = { x: e.clientX, y: e.clientY };
  } else {
    updateNodeDrag(e.clientX, e.clientY);

    if (connectionState.value?.isConnecting) {
      updateConnectionPreview(mousePos.value.x, mousePos.value.y);
    }
  }
}

function onMouseUp() {
  isPanning = false;
  endNodeDrag();

  if (connectionState.value?.isConnecting) {
    // Handling "Drag output to background -> Create Display"
    if (connectionState.value.sourceType === "output") {
      // Create Display Node
      // Correct approach: Use mousePos which tracks world coordinates of mouse
      createNewNodeConnected("display", mousePos.value);
    }

    endConnection();
  }
}

function onWheel(e: WheelEvent) {
  const zoomSensitivity = 0.001;
  // Calculate new zoom
  let newZoom = zoom.value * (1 - e.deltaY * zoomSensitivity);
  newZoom = Math.max(0.1, Math.min(newZoom, 5));

  // Calculate new pan to center on mouse
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate world coordinates under mouse with old zoom
    const worldX = (mouseX - pan.value.x) / zoom.value;
    const worldY = (mouseY - pan.value.y) / zoom.value;

    // Calculate new pan so that world coordinates project to same mouse position
    // mouseX = newPanX + worldX * newZoom
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    setPan({ x: newPanX, y: newPanY });
  }

  setZoom(newZoom);
}

// --- Keyboard Interaction ---
function onKeyDown(e: KeyboardEvent) {
  // Avoid shortcuts if inside an input
  if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

  // Delete selected nodes
  if (e.key === "Delete" || e.key === "Backspace") {
    if (selection.value.length > 0) {
      [...selection.value].forEach((id) => removeNode(id));
      clearSelection();
    }
  }

  // Shift+A to toggle Add Node menu at mouse
  if (e.key === "A" && e.shiftKey) {
    e.preventDefault();
    openMenuAtCursor(lastMouseScreenPos.value.x, lastMouseScreenPos.value.y);
  }

  // Press 'a' while dragging from input -> Create Constant
  if (
    e.key.toLowerCase() === "a" &&
    !e.shiftKey &&
    connectionState.value.isConnecting &&
    connectionState.value.sourceType === "input"
  ) {
    e.preventDefault();
    createNewNodeConnected("constant", mousePos.value);
    endConnection();
  }

  // Press 'i' while dragging from input -> Create Input Control
  if (
    e.key.toLowerCase() === "i" &&
    !e.shiftKey &&
    connectionState.value.isConnecting &&
    connectionState.value.sourceType === "input"
  ) {
    e.preventDefault();
    createNewNodeConnected("input", mousePos.value);
    endConnection();
  }

  // Shift+D to duplicate selected nodes
  if (e.key === "D" && e.shiftKey) {
    e.preventDefault();
    if (selection.value.length > 0) {
      // Duplicate the first selected node for now (or all)
      const newIds: string[] = [];
      selection.value.forEach((id) => {
        const newId = duplicateNode(id);
        if (newId) newIds.push(newId);
      });
      // Select the new nodes
      if (newIds.length > 0) {
        clearSelection();
        newIds.forEach((id) => nodeEditorState.selection.push(id));
      }
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});

// --- Connection Logic ---

function onConnectStart({ nodeId, type, port }: any) {
  const { x, y } = getPortPosition(nodeId, port, type);
  // Start connection from either input or output
  startConnection(nodeId, port, type, x, y);
}

function onConnectEnd({ nodeId, type, port }: any) {
  const state = connectionState.value;
  if (state && state.isConnecting) {
    if (state.sourceNodeId === nodeId) return; // Self connection

    const finalSourceId = state.sourceNodeId!;
    const finalSourcePort = state.sourcePort!;
    const finalTargetId = nodeId;
    const finalTargetPort = port;

    // Check compatibility based on drag direction
    if (state.sourceType === "output" && type === "input") {
      // Standard Output -> Input, dragging from Output to Input socket

      // Before adding, if target input has connection, remove it (single connection rule)
      removeConnectionsToInput(finalTargetId, finalTargetPort);

      addConnection({
        id: generateId(),
        sourceNodeId: finalSourceId,
        sourcePort: finalSourcePort,
        targetNodeId: finalTargetId,
        targetPort: finalTargetPort,
      });
    } else if (state.sourceType === "input" && type === "output") {
      // Dragging from Input -> Output
      // Source is the Input socket (so it becomes the TARGET in the connection object)
      // Target is the Output socket (so it becomes the SOURCE in the connection object)

      // We are connecting TO the Input socket (finalSourceId, finalSourcePort)
      // FROM the Output socket (finalTargetId, finalTargetPort)

      // Remove existing connections to the 'source' input (since we are creating a new one to it)
      removeConnectionsToInput(finalSourceId, finalSourcePort);

      addConnection({
        id: generateId(),
        sourceNodeId: finalTargetId, // Output socket node
        sourcePort: finalTargetPort, // Output socket port
        targetNodeId: finalSourceId, // Input socket node
        targetPort: finalSourcePort, // Input socket port
      });
    }

    endConnection();
  }
}

function createNewNodeConnected(type: string, pos: { x: number; y: number }) {
  const newNode = createNodeAtPos(type, pos);
  // createNodeAtPos returns the node object now
  if (!newNode) return;

  const state = connectionState.value;
  // If we called this, connectionState should technically still be connecting
  // But we might need to rely on the passed-in context if we called endConnection immediately after.
  // However, in our usage in onKeyDown/onMouseUp, we call this BEFORE endConnection.

  if (!state.isConnecting) return;

  const sourceId = state.sourceNodeId!;
  const sourcePort = state.sourcePort!;
  const sourceType = state.sourceType!;

  if (sourceType === "input") {
    // We were dragging from an Input
    // So we want New Node (Output) -> Source Node (Input)
    const outputKeys = Object.keys(newNode.outputs);
    if (outputKeys.length > 0) {
      const targetPort = outputKeys[0]; // Pick first output

      removeConnectionsToInput(sourceId, sourcePort);

      addConnection({
        id: generateId(),
        sourceNodeId: newNode.id,
        sourcePort: targetPort,
        targetNodeId: sourceId,
        targetPort: sourcePort,
      });
    }
  } else {
    // We were dragging from an Output
    // So we want Source Node (Output) -> New Node (Input)
    const inputKeys = Object.keys(newNode.inputs);

    // Pick the most appropriate input
    // For Display node, it has 'value' input. For most, maybe 'input' or first one.
    let targetPort = inputKeys[0];
    if (inputKeys.includes("value")) targetPort = "value";
    if (inputKeys.includes("input")) targetPort = "input";

    if (targetPort) {
      // Technically remove connections to new node input is redundant but safe
      // removeConnectionsToInput(newNode.id, targetPort);

      addConnection({
        id: generateId(),
        sourceNodeId: sourceId,
        sourcePort: sourcePort,
        targetNodeId: newNode.id,
        targetPort: targetPort,
      });
    }
  }
}

function onSocketClick({ nodeId, type, port }: any) {
  // If it's an input socket, disconnect
  if (type === "input") {
    removeConnectionsToInput(nodeId, port);
  }
}

// Helper to calculate port position
function getPortPosition(
  nodeId: string,
  portName: string,
  type: "input" | "output"
) {
  // Try to get registered position first
  const registeredPos = getSocketPosition(nodeId, portName, type);
  if (registeredPos) {
    return registeredPos;
  }

  // Fallback to approximate position if not yet registered
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };

  let index = 0;
  const keys = Object.keys(type === "input" ? node.inputs : node.outputs);
  index = keys.indexOf(portName);

  // Approximate position as fallback
  const yOffset = 46 + index * 28;
  const xOffset = type === "input" ? 0 : 180;

  return {
    x: node.position.x + xOffset,
    y: node.position.y + yOffset,
  };
}

// Dragging line coordinates
const dragStart = computed(() => {
  if (!connectionState.value) return { x: 0, y: 0 };

  return getPortPosition(
    connectionState.value.sourceNodeId!,
    connectionState.value.sourcePort!,
    connectionState.value.sourceType || "output"
  );
});

const dragEnd = computed(() => {
  // Use mousePos directly
  return mousePos.value;
});

function onConnectionClick(_id: string) {
  // Select connection? Delete?
}

function getNodeComponent(type: string) {
  return NODE_TYPES[type] || BaseNode;
}

// --- Node Creation ---

function onContextMenu(e: MouseEvent) {
  openMenuAtCursor(e.clientX, e.clientY);
}

function openMenuAtCursor(clientX: number, clientY: number) {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();

  // UI position for the menu
  menuPos.value = {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };

  // World position for the node creation
  creationPos.value = {
    x: (clientX - rect.left - pan.value.x) / zoom.value,
    y: (clientY - rect.top - pan.value.y) / zoom.value,
  };

  showAddNodeMenu.value = true;
}

function toggleAddNodeMenuAtCenter() {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  openMenuAtCursor(rect.left + centerX, rect.top + centerY);
}

function onNodeSelected(type: string) {
  createNodeAtPos(type, creationPos.value);
}

function formatNodeType(type: string) {
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function createNodeAtPos(type: string, pos: { x: number; y: number }) {
  const id = generateId();
  const node: NodeDefinition = {
    id,
    type,
    label: formatNodeType(type),
    position: { x: pos.x - 100, y: pos.y - 20 }, // Offset a bit to center roughly
    data: {},
    inputs: {},
    outputs: {},
  };

  if (type === "math") {
    node.label = "Math Operation";
    node.data = { operation: "add" };
    node.inputs = { a: null, b: null };
    node.outputs = { result: null };
  } else if (type === "range") {
    node.label = "Range";
    node.data = { a: 10, b: 1, c: 0 };
    node.inputs = { size: null, step: null, start: null };
    node.outputs = { output: null };
  } else if (type === "display") {
    node.label = "Result";
    node.data = { value: 0 };
    node.inputs = { value: null };
    node.outputs = {};
  } else if (type === "number") {
    node.label = "Number";
    node.data = { value: 0 };
    node.inputs = {};
    node.outputs = { output: null };
  } else if (type === "input") {
    node.label = "Input Control";
    node.data = {
      inputType: "",
      label: "",
      defaultValue: null,
      currentValue: null,
    };
    node.inputs = {};
    node.outputs = { value: null };
  } else if (type === "chartEvent") {
    node.label = "Chart Event";
    node.data = {};
    node.inputs = {};
    node.outputs = { x: null, y: null, pointIndex: null, curveNumber: null };
  } else if (type === "link") {
    node.label = "Resource / URL";
    node.data = { manualUrl: "" };
    node.inputs = { url: null };
    node.outputs = { output: null };
  } else if (type === "constant") {
    node.label = "Constant";
    node.data = { dataType: "string", value: "" };
    node.inputs = {};
    node.outputs = { output: null };
  } else if (type === "color") {
    node.label = "Color";
    node.data = {
      inputFormat: "rgb",
      outputFormat: "rgb",
      r: 255,
      g: 0,
      b: 0,
      alpha: 1,
    };
    node.inputs = { input: null, r: null, g: null, b: null, alpha: null };
    node.outputs = {
      output: null,
      rgb: null,
      rgba: null,
      hex: null,
      hsv: null,
      r: null,
      g: null,
      b: null,
      h: null,
      s: null,
      v: null,
      alpha: null,
    };
  } else if (type === "csvInput") {
    node.label = "CSV Input";
    node.data = { fileName: "", csvData: null, width: 0, height: 0 };
    node.inputs = {};
    node.outputs = { data: null, width: null, height: null, fileName: null };
  } else if (type === "isolateColumn") {
    node.label = "Isolate Column";
    node.data = { columnIndex: 0 };
    node.inputs = { csvData: null };
    node.outputs = { name: null, data: null };
  } else if (type === "switch") {
    node.label = "Switch";
    node.data = { activeIndex: 0 };
    node.inputs = { index: null, input0: null };
    node.outputs = { output: null };
  } else if (type === "trace") {
    node.label = "Trace";
    node.data = { type: "scatter", mode: "lines+markers" };
    node.inputs = { x: null, y: null };
    node.outputs = { trace: null };
  } else if (type === "joiner") {
    node.label = "Joiner";
    node.data = {};
    node.inputs = { input0: null };
    node.outputs = { list: null };
  } else if (type === "compare") {
    node.label = "Compare";
    node.data = { operation: ">" };
    node.inputs = { a: null, b: null };
    node.outputs = { result: null };
  } else if (type === "logic") {
    node.label = "Logic";
    node.data = { operation: "AND" };
    node.inputs = { a: null, b: null };
    node.outputs = { result: null };
  } else if (type === "if") {
    node.label = "If / Else";
    node.data = { lastCondition: false };
    node.inputs = { condition: null, trueValue: null, falseValue: null };
    node.outputs = { output: null };
  } else if (type === "filter") {
    node.label = "Filter";
    node.data = {};
    node.inputs = { data: null, mask: null };
    node.outputs = { filtered: null };
  } else if (type === "plotly") {
    node.label = "Plotly Chart";
    node.data = {};
    node.inputs = { data: null, layout: null };
    node.outputs = { selectedPoint: null, hoverPoint: null };
  } else if (type === "config") {
    node.label = "Config";
    node.data = { isManual: false, manualConfig: {} };
    node.inputs = {}; // Will be populated by ConfigNode component
    node.outputs = { config: null };
  } else if (type === "subplot") {
    node.label = "Subplot Layout";
    node.data = {
      rows: 2,
      cols: 2,
      horizontalSpacing: 0.1,
      verticalSpacing: 0.1,
      subplotTypes: ["xy", "xy", "xy", "xy"],
    };
    node.inputs = {};
    node.outputs = { layout: null };
  } else if (type === "styling") {
    node.label = "Styling";
    node.data = { styling: {} };
    node.inputs = { trace: null };
    node.outputs = { trace: null };
  } else if (type === "layoutNode") {
    node.label = "Layout Master";
    node.data = {
      layoutConfig: {
        title_text: "",
        use_grid: false,
        grid_rows: 1,
        grid_cols: 1,
        axes: [],
        subplots: [],
        traceMappings: {},
      },
    };
    node.inputs = { traces: null };
    node.outputs = { layout: null, traces: null };
  }

  addNode(node);
  return node;
}
</script>

<style scoped>
.node-editor-canvas {
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
  overflow: hidden;
  position: relative;
  /* Dotted grid background */
  background-image: radial-gradient(#333 1px, transparent 1px);
  background-size: 20px 20px;
}

.transform-layer {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.connections-layer {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
  pointer-events: none;
}

/* Fix pointer events for SVG */
.connections-layer * {
  pointer-events: stroke;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.add-node-btn {
  background: #00b5dd;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
  font-size: 14px;
}

.add-node-btn:hover {
  background: #00a1c5;
}

.add-node-btn.active {
  background: #e24a4a;
}

.doc-toggle-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 34px;
  height: 34px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 18px;
}

.doc-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.doc-toggle-btn.active {
  background: rgba(0, 181, 221, 0.15);
  color: #00b5dd;
  border-color: rgba(0, 181, 221, 0.4);
}

.controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(30, 30, 30, 0.7);
  padding: 8px 12px;
  border-radius: 10px;
  color: #fff;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 15px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.zoom-level {
  min-width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
</style>
