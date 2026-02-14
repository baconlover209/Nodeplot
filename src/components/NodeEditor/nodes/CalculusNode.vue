<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div ref="rootEl" class="operation-selector">
      <div class="dropdown-trigger" @click.stop="toggleDropdown">
        <span class="label-text">{{ currentLabel }}</span>
        <span class="arrow">▼</span>
      </div>

      <div v-if="isOpen" class="dropdown-menu">
        <ul class="options-list" @mousedown.stop>
          <li v-for="op in operations" :key="op.value" @click.stop="selectOperation(op.value)"
            :class="{ active: op.value === node.data.operation }">
            {{ op.label }}
          </li>
        </ul>
      </div>
    </div>
    
    <div class="info-text">
      {{ infoText }}
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import BaseNode from "../BaseNode.vue";
import type { NodeDefinition } from "../nodeEditorState";
import {
  triggerGraphUpdate,
  pushHistoryState,
} from "../nodeEditorState";

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

// Initialize data if not set
if (props.node.data.operation === undefined) props.node.data.operation = "derivative";

defineEmits(["connect-start", "connect-end", "socket-click"]);

const rootEl = ref<HTMLElement | null>(null);
const isOpen = ref(false);

const operations = [
  { value: "derivative", label: "Derivative (dy/dx)" },
  { value: "integral", label: "Integral (∫y dx)" },
];

const currentLabel = computed(() => {
  const op = operations.find((o) => o.value === props.node.data.operation);
  return op ? op.label : "Select Operation";
});

const infoText = computed(() => {
  if (props.node.data.operation === 'derivative') {
    return "Calculates rate of change between points.";
  } else {
    return "Calculates cumulative sum (trapezoidal rule).";
  }
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectOperation(val: string) {
  props.node.data.operation = val;
  isOpen.value = false;
  triggerGraphUpdate();
  pushHistoryState();
}

function handleClickOutside(event: MouseEvent) {
  if (
    isOpen.value &&
    rootEl.value &&
    !rootEl.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("mousedown", handleClickOutside);
});
</script>

<style scoped>
.operation-selector {
  padding: 5px 0;
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  width: 100%;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  user-select: none;
  min-height: 24px;
}

.dropdown-trigger:hover {
  border-color: #00d2ff;
  background: #3a3a3a;
}

.label-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow {
  font-size: 9px;
  margin-left: 6px;
  color: #888;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  min-width: 160px;
  background: #252525;
  border: 1px solid #444;
  border-radius: 3px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.options-list li {
  padding: 8px 10px;
  cursor: pointer;
  font-size: 11px;
  color: #ccc;
  border-bottom: 1px solid #2a2a2a;
}

.options-list li:last-child {
  border-bottom: none;
}

.options-list li:hover {
  background: #333;
  color: #fff;
}

.options-list li.active {
  background: #00d2ff;
  color: #000;
  font-weight: bold;
}

.info-text {
  font-size: 10px;
  color: #888;
  font-style: italic;
  margin-top: 4px;
  padding: 0 4px;
  line-height: 1.4;
}
</style>
