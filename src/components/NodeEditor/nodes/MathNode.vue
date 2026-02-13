<template>
  <BaseNode
    :node="node"
    :selected="selected"
    @connect-start="$emit('connect-start', $event)"
    @connect-end="$emit('connect-end', $event)"
    @socket-click="$emit('socket-click', $event)"
  >
    <div ref="rootEl" class="operation-selector">
      <div class="dropdown-trigger" @click.stop="toggleDropdown">
        <span class="label-text">{{ currentLabel }}</span>
        <span class="arrow">▼</span>
      </div>

      <div v-if="isOpen" class="dropdown-menu">
        <input
          ref="searchInput"
          v-model="searchQuery"
          placeholder="Search..."
          @mousedown.stop
          @click.stop
          class="search-input"
        />
        <ul class="options-list" @wheel.stop @mousedown.stop>
          <li
            v-for="op in filteredOperations"
            :key="op.value"
            @click.stop="selectOperation(op.value)"
            :class="{ active: op.value === node.data.operation }"
          >
            {{ op.label }}
          </li>
          <li v-if="filteredOperations.length === 0" class="no-results">
            No results
          </li>
        </ul>
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import BaseNode from "../BaseNode.vue";
import type { NodeDefinition } from "../nodeEditorState";
import { triggerGraphUpdate } from "../nodeEditorState";

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(["connect-start", "connect-end", "socket-click"]);

const rootEl = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const searchQuery = ref("");
const searchInput = ref<HTMLInputElement | null>(null);

// Sorted by frequency/likely usage
const operations = [
  // Arithmetic (High usage)
  { value: "add", label: "Add (a + b)" },
  { value: "sub", label: "Subtract (a - b)" },
  { value: "mul", label: "Multiply (a * b)" },
  { value: "div", label: "Divide (a / b)" },

  // Common Math (Medium usage)
  { value: "pow", label: "Power (a ^ b)" },
  { value: "sqrt", label: "Square Root (√a)" },
  { value: "abs", label: "Absolute (abs(a))" },
  { value: "round", label: "Round (round(a))" },
  { value: "floor", label: "Floor (floor(a))" },
  { value: "ceil", label: "Ceil (ceil(a))" },
  { value: "min", label: "Min (min(a, b))" },
  { value: "max", label: "Max (max(a, b))" },

  // Trigonometry
  { value: "sin", label: "Sin (sin(a))" },
  { value: "cos", label: "Cos (cos(a))" },
  { value: "tan", label: "Tan (tan(a))" },
  { value: "asin", label: "Asin (asin(a))" },
  { value: "acos", label: "Acos (acos(a))" },
  { value: "atan", label: "Atan (atan(a))" },
  { value: "atan2", label: "Atan2 (atan2(a, b))" },

  // Log/Exp
  { value: "log", label: "Log (log_b(a))" },
  { value: "log10", label: "Log10 (log10(a))" },
  { value: "log2", label: "Log2 (log2(a))" },
  { value: "exp", label: "Exp (e^a)" },

  // Others
  { value: "mod", label: "Modulo (a % b)" },
  { value: "sign", label: "Sign (sign(a))" },
  { value: "trunc", label: "Trunc (trunc(a))" },
  { value: "random", label: "Random (0-1)" },
  { value: "hypot", label: "Hypot (sqrt(a² + b²))" },
  { value: "cbrt", label: "Cube Root (∛a)" },
  { value: "sinh", label: "Sinh (sinh(a))" },
  { value: "cosh", label: "Cosh (cosh(a))" },
  { value: "tanh", label: "Tanh (tanh(a))" },
  { value: "asinh", label: "Asinh (asinh(a))" },
  { value: "acosh", label: "Acosh (acosh(a))" },
  { value: "atanh", label: "Atanh (atanh(a))" },
  { value: "expm1", label: "Expm1 (e^a - 1)" },
  { value: "log1p", label: "Log1p (ln(1 + a))" },
  { value: "imul", label: "Imul (32-bit mul)" },
  { value: "clz32", label: "Clz32 (leading zeros)" },
  { value: "fround", label: "Fround (float32)" },
];

const filteredOperations = computed(() => {
  if (!searchQuery.value) return operations;
  const query = searchQuery.value.toLowerCase();
  return operations.filter(
    (op) =>
      op.label.toLowerCase().includes(query) ||
      op.value.toLowerCase().includes(query)
  );
});

const currentLabel = computed(() => {
  const op = operations.find((o) => o.value === props.node.data.operation);
  return op ? op.label : props.node.data.operation || "Select...";
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      searchInput.value?.focus();
    });
  } else {
    searchQuery.value = "";
  }
}

function selectOperation(val: string) {
  props.node.data.operation = val;
  isOpen.value = false;
  searchQuery.value = "";
  triggerGraphUpdate();
}

function handleClickOutside(event: MouseEvent) {
  if (
    isOpen.value &&
    rootEl.value &&
    !rootEl.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
    searchQuery.value = "";
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
  max-height: 200px;
  background: #252525;
  border: 1px solid #444;
  border-radius: 3px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.search-input {
  width: 100%;
  background: #1e1e1e;
  border: none;
  border-bottom: 1px solid #444;
  color: #fff;
  padding: 6px 8px;
  font-size: 11px;
  outline: none;
  border-radius: 3px 3px 0 0;
}

.search-input:focus {
  background: #151515;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  max-height: 170px;
}

.options-list::-webkit-scrollbar {
  width: 6px;
}
.options-list::-webkit-scrollbar-track {
  background: #222;
}
.options-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.options-list li {
  padding: 5px 8px;
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

.no-results {
  color: #666;
  text-align: center;
  font-style: italic;
  cursor: default;
}
.no-results:hover {
  background: transparent;
  color: #666;
}
</style>
