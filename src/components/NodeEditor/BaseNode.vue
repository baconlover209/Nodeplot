<template>
  <div
    ref="containerRef"
    class="node-container"
    :class="{ selected: selected }"
    :style="style"
    @mousedown.stop="onMouseDown"
  >
    <!-- Category Color Bar -->
    <div
      class="category-bar"
      :style="{ backgroundColor: getNodeColor(node.type) }"
    ></div>

    <div class="node-header">
      <button class="toggle-btn" @click.stop="toggleCollapse">
        {{ node.collapsed ? "+" : "-" }}
      </button>
      <input
        v-if="isEditing"
        ref="titleInputRef"
        v-model="editTitle"
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        @mousedown.stop
        class="node-title-input"
      />
      <span v-else @dblclick.stop="startEditing">{{ node.label }}</span>
    </div>

    <div class="node-body" :style="{ minHeight: minBodyHeight + 'px' }">
      <div class="inputs">
        <div
          v-for="(_input, key) in node.inputs"
          :key="key"
          :ref="el => { if (el) inputSocketRefs[key as string] = el as HTMLElement }"
          class="socket input-socket"
          @mousedown.stop.prevent="startConnect($event, 'input', key as string)"
          @mouseup.stop.prevent="endConnect($event, 'input', key as string)"
          @click.stop="onSocketClick($event, 'input', key as string)"
        >
          <div class="socket-handle"></div>
          <span class="socket-label">{{ key }}</span>
        </div>
      </div>

      <div class="outputs">
        <div
          v-for="(_output, key) in node.outputs"
          :key="key"
          :ref="el => { if (el) outputSocketRefs[key as string] = el as HTMLElement }"
          class="socket output-socket"
          @mousedown.stop.prevent="startConnect($event, 'output', key as string)"
          @mouseup.stop.prevent="endConnect($event, 'output', key as string)"
          @click.stop="onSocketClick($event, 'output', key as string)"
        >
          <span class="socket-label">{{ key }}</span>
          <div class="socket-handle"></div>
        </div>
      </div>

      <!-- Main slot for custom node UI -->
      <div
        class="node-content"
        v-if="!node.collapsed"
        :style="{ marginTop: portsHeight + 'px' }"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUpdated, nextTick, watch } from "vue";
import {
  startNodeDrag,
  registerSocketPosition,
  getNodeColor,
  layoutVersion,
} from "./nodeEditorState";
import type { NodeDefinition } from "./nodeEditorState";

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

const emit = defineEmits(["connect-start", "connect-end", "socket-click"]);

const containerRef = ref<HTMLElement | null>(null);
const inputSocketRefs = ref<Record<string, HTMLElement>>({});
const outputSocketRefs = ref<Record<string, HTMLElement>>({});
const titleInputRef = ref<HTMLInputElement | null>(null);

const isEditing = ref(false);
const editTitle = ref("");

function startEditing() {
  isEditing.value = true;
  editTitle.value = props.node.label;
  nextTick(() => {
    titleInputRef.value?.focus();
    titleInputRef.value?.select();
  });
}

function saveTitle() {
  if (isEditing.value) {
    if (editTitle.value.trim()) {
      props.node.label = editTitle.value.trim();
    }
    isEditing.value = false;
  }
}

const style = computed(() => ({
  transform: `translate(${props.node.position.x}px, ${props.node.position.y}px)`,
}));

// Calculate the height needed for ports
const portsHeight = computed(() => {
  const inputs = Object.keys(props.node.inputs).length;
  const outputs = Object.keys(props.node.outputs).length;
  const maxSockets = Math.max(inputs, outputs);
  // 24px per socket + 4px gap = 28px stride
  return Math.max(0, maxSockets * 28);
});

const minBodyHeight = computed(() => {
  // 34px top offset + ports height + 10px buffer
  return 34 + portsHeight.value + 10;
});

function toggleCollapse() {
  props.node.collapsed = !props.node.collapsed;
  // Update socket positions after layout change
  nextTick(() => updateSocketPositions());
}

function onMouseDown(e: MouseEvent) {
  startNodeDrag(props.node.id, e.clientX, e.clientY);
}

function startConnect(e: MouseEvent, type: "input" | "output", key: string) {
  emit("connect-start", { nodeId: props.node.id, type, port: key, event: e });
}

function endConnect(e: MouseEvent, type: "input" | "output", key: string) {
  emit("connect-end", { nodeId: props.node.id, type, port: key, event: e });
}

function onSocketClick(e: MouseEvent, type: "input" | "output", key: string) {
  emit("socket-click", { nodeId: props.node.id, type, port: key, event: e });
}

function getRelativePosition(element: HTMLElement, container: HTMLElement) {
  let x = 0;
  let y = 0;
  let el: HTMLElement | null = element;

  while (el && el !== container) {
    x += el.offsetLeft;
    y += el.offsetTop;
    el = el.offsetParent as HTMLElement;
  }

  return { x, y };
}

function updateSocketPositions() {
  if (!containerRef.value) return;

  // Register input socket positions
  Object.keys(props.node.inputs).forEach((portKey) => {
    const socketEl = inputSocketRefs.value[portKey];
    if (socketEl) {
      const handleEl = socketEl.querySelector(".socket-handle") as HTMLElement;
      if (handleEl) {
        // Calculate relative to node container using offsets
        // accurate regardless of zoom/pan transforms
        const socketPos = getRelativePosition(handleEl, containerRef.value!);

        // Add half width/height to get center
        const centerX =
          props.node.position.x + socketPos.x + handleEl.offsetWidth / 2;
        const centerY =
          props.node.position.y + socketPos.y + handleEl.offsetHeight / 2;

        registerSocketPosition(
          props.node.id,
          portKey,
          "input",
          centerX,
          centerY
        );
      }
    }
  });

  // Register output socket positions
  Object.keys(props.node.outputs).forEach((portKey) => {
    const socketEl = outputSocketRefs.value[portKey];
    if (socketEl) {
      const handleEl = socketEl.querySelector(".socket-handle") as HTMLElement;
      if (handleEl) {
        const socketPos = getRelativePosition(handleEl, containerRef.value!);

        const centerX =
          props.node.position.x + socketPos.x + handleEl.offsetWidth / 2;
        const centerY =
          props.node.position.y + socketPos.y + handleEl.offsetHeight / 2;

        registerSocketPosition(
          props.node.id,
          portKey,
          "output",
          centerX,
          centerY
        );
      }
    }
  });
}

onMounted(() => {
  nextTick(() => updateSocketPositions());
});

onUpdated(() => {
  nextTick(() => updateSocketPositions());
});

watch(layoutVersion, () => {
  nextTick(() => updateSocketPositions());
});
</script>

<style scoped>
.node-container {
  position: absolute;
  min-width: 200px;
  width: auto;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  user-select: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  cursor: grab;
  z-index: 1;
}

.node-container.selected {
  border-color: #00d2ff;
  box-shadow: 0 0 10px rgba(0, 210, 255, 0.4);
}

.node-header {
  background: #2c2c2c;
  padding: 8px 12px;
  border-bottom: 1px solid #333;
  font-weight: bold;
  font-size: 12px;
  color: #ddd;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  height: 32px;
  display: flex;
  align-items: center;
}

.node-title-input {
  background: #111;
  border: 1px solid #555;
  color: #fff;
  font-size: 12px;
  padding: 2px 4px;
  width: 100%;
  border-radius: 2px;
}

.category-bar {
  height: 4px;
  width: 100%;
  border-radius: 6px 6px 0 0;
}

.node-body {
  padding: 10px;
  position: relative;
  min-height: 40px;
}

.node-content {
  margin: 5px 0;
}

.inputs,
.outputs {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: none;
  z-index: 10;
}

.inputs {
  left: 0;
}

.outputs {
  right: 0;
}

.socket {
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 4px;
  pointer-events: auto;
}

.input-socket {
  justify-content: flex-start;
}

.output-socket {
  justify-content: flex-end;
}

.socket-handle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #444;
  border: 2px solid #111;
  cursor: crosshair;
  transition: all 0.2s;
  z-index: 2;
}

.socket-handle:hover {
  background: #00d2ff;
  border-color: #fff;
  transform: scale(1.3);
}

.input-socket .socket-handle {
  margin-left: -10px;
}

.output-socket .socket-handle {
  margin-right: -10px;
}

.socket-label {
  font-size: 10px;
  color: #888;
  margin: 0 10px;
  white-space: nowrap;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  margin-right: 4px;
  line-height: 1;
}

.toggle-btn:hover {
  color: #fff;
}
</style>
