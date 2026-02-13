<template>
  <div
    v-if="show"
    class="add-node-menu"
    :style="menuStyle"
    ref="menuRef"
    @mousedown.stop
    @wheel.stop
  >
    <!-- Search Bar -->
    <div class="search-container">
      <input
        ref="searchInput"
        v-model="searchQuery"
        placeholder="Search nodes..."
        @keydown.esc="close"
        @keydown.down.prevent="onArrowDown"
        @keydown.up.prevent="onArrowUp"
        @keydown.right.prevent="onArrowRight"
        @keydown.left.prevent="onArrowLeft"
        @keydown.enter="onEnter"
      />
    </div>

    <!-- Main List (Categories or Results) -->
    <div class="menu-content" ref="menuContentRef">
      <!-- Results View -->
      <template v-if="searchQuery">
        <div
          v-for="(type, index) in filteredNodes"
          :key="type"
          class="menu-item"
          :class="{ active: index === nodeIndex }"
          @click="selectNode(type)"
          @mouseenter="nodeIndex = index"
        >
          <div
            class="category-indicator"
            :style="{ backgroundColor: getNodeColor(type) }"
          ></div>
          <span class="node-label">{{ formatNodeType(type) }}</span>
        </div>
        <div v-if="filteredNodes.length === 0" class="no-results">
          No nodes found
        </div>
      </template>

      <!-- Category View -->
      <template v-else>
        <div
          v-for="(category, index) in NODE_CATEGORIES"
          :key="category.label"
          class="menu-item has-submenu"
          :class="{ active: !inSubmenu && index === categoryIndex }"
          :ref="(el) => setCategoryRef(el, index)"
          @mouseenter="handleMouseEnterCategory($event, category, index)"
          @mouseleave="handleMouseLeave"
        >
          <div
            class="category-indicator"
            :style="{ backgroundColor: category.color }"
          ></div>
          <span class="node-label">{{ category.label }}</span>
          <span class="chevron">›</span>
        </div>
      </template>
    </div>

    <div
      v-if="activeCategory"
      class="submenu shadow-premium"
      :style="submenuStyle"
      @mouseenter="handleMouseEnterSubmenu"
      @mouseleave="handleMouseLeave"
    >
      <div
        v-for="(type, index) in activeCategory.nodeTypes"
        :key="type"
        class="menu-item"
        :class="{ active: inSubmenu && index === nodeIndex }"
        @click="selectNode(type)"
        @mouseenter="
          inSubmenu = true;
          nodeIndex = index;
        "
      >
        <div
          class="category-indicator"
          :style="{ backgroundColor: activeCategory.color }"
        ></div>
        <span class="node-label">{{ formatNodeType(type) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { NODE_CATEGORIES, getNodeColor } from "./nodeEditorState";

interface NodeCategory {
  label: string;
  color: string;
  nodeTypes: string[];
}

const props = defineProps<{
  show: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", type: string): void;
}>();

const menuRef = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const searchResultRefs = ref<HTMLElement[]>([]);
const categoryRefs = ref<HTMLElement[]>([]);

const searchQuery = ref("");
const activeCategory = ref<NodeCategory | null>(null);
const submenuY = ref(0);
const closeTimer = ref<number | null>(null);

// Navigation State
const categoryIndex = ref(0);
const nodeIndex = ref(0);
const inSubmenu = ref(false);

const menuStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}));

const submenuStyle = computed(() => ({
  top: `${submenuY.value}px`,
  left: "100%",
  paddingLeft: "4px", // Gap buffer
  marginLeft: "-2px", // Overlap slightly to ensure mouse transition
}));

const allNodeTypes = computed(() => {
  return NODE_CATEGORIES.flatMap((c) => c.nodeTypes);
});

const filteredNodes = computed(() => {
  if (!searchQuery.value) return [];
  const q = searchQuery.value.toLowerCase();
  return (
    allNodeTypes.value?.filter(
      (type) =>
        formatNodeType(type).toLowerCase().includes(q) ||
        type.toLowerCase().includes(q)
    ) || []
  );
});

// Watch visibility to reset state
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      searchQuery.value = "";
      resetNavigation();
      if (closeTimer.value) {
        clearTimeout(closeTimer.value);
        closeTimer.value = null;
      }
      nextTick(() => {
        searchInput.value?.focus();
        // If categories exist, select first one
        if (NODE_CATEGORIES.length > 0) {
          syncActiveCategory();
        }
      });
    }
  }
);

// Watch search to reset indices
watch(searchQuery, () => {
  nodeIndex.value = 0;
  categoryIndex.value = 0;
  inSubmenu.value = false;
  activeCategory.value = null;
  if (closeTimer.value) {
    clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }
});

function resetNavigation() {
  categoryIndex.value = 0;
  nodeIndex.value = 0;
  inSubmenu.value = false;
  activeCategory.value = null;
}

function formatNodeType(type: string) {
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function setCategoryRef(el: any, index: number) {
  if (el) categoryRefs.value[index] = el as HTMLElement;
}

function setSearchResultRef(el: any, index: number) {
  if (el) searchResultRefs.value[index] = el as HTMLElement;
}

function updateSubmenuPosition() {
  const el = categoryRefs.value[categoryIndex.value];
  if (el && menuRef.value) {
    // Relative position
    const menuRect = menuRef.value.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    submenuY.value = itemRect.top - menuRect.top - 4; // Align with top padding diff

    // Auto scroll category into view
    el.scrollIntoView({ block: "nearest" });
  } else {
    // Fallback if refs aren't ready
    submenuY.value = categoryIndex.value * 35;
  }
}

function syncActiveCategory() {
  activeCategory.value = NODE_CATEGORIES[categoryIndex.value] as NodeCategory;
  updateSubmenuPosition();
}

// Mouse Handlers
function handleMouseEnterCategory(
  event: MouseEvent,
  category: any,
  index: number
) {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }

  categoryIndex.value = index;
  inSubmenu.value = false;
  setActiveCategory(event, category);
}

function handleMouseEnterSubmenu() {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }
  inSubmenu.value = true;
}

function handleMouseLeave() {
  closeTimer.value = window.setTimeout(() => {
    activeCategory.value = null;
    closeTimer.value = null;
    inSubmenu.value = false;
  }, 150);
}

function setActiveCategory(event: MouseEvent, category: any) {
  activeCategory.value = category;

  // Calculate Y position relative to main menu
  const target = event.currentTarget as HTMLElement;
  if (target && menuRef.value) {
    const menuRect = menuRef.value.getBoundingClientRect();
    const itemRect = target.getBoundingClientRect();
    submenuY.value = itemRect.top - menuRect.top - 4;
  }
}

function selectNode(type: string) {
  emit("select", type);
  close();
}

function close() {
  emit("close");
}

// Keyboard Navigation Handlers
function onArrowDown() {
  if (searchQuery.value) {
    // Search Results Navigation
    if (filteredNodes.value.length > 0) {
      nodeIndex.value = (nodeIndex.value + 1) % filteredNodes.value.length;
    }
  } else {
    // Category/Submenu Navigation
    if (inSubmenu.value) {
      const list = activeCategory.value?.nodeTypes || [];
      if (list.length > 0) {
        nodeIndex.value = (nodeIndex.value + 1) % list.length;
      }
    } else {
      categoryIndex.value = (categoryIndex.value + 1) % NODE_CATEGORIES.length;
      syncActiveCategory();
    }
  }
}

function onArrowUp() {
  if (searchQuery.value) {
    if (filteredNodes.value.length > 0) {
      nodeIndex.value =
        (nodeIndex.value - 1 + filteredNodes.value.length) %
        filteredNodes.value.length;
    }
  } else {
    if (inSubmenu.value) {
      const list = activeCategory.value?.nodeTypes || [];
      if (list.length > 0) {
        nodeIndex.value = (nodeIndex.value - 1 + list.length) % list.length;
      }
    } else {
      categoryIndex.value =
        (categoryIndex.value - 1 + NODE_CATEGORIES.length) %
        NODE_CATEGORIES.length;
      syncActiveCategory();
    }
  }
}

function onArrowRight() {
  if (!searchQuery.value && !inSubmenu.value) {
    inSubmenu.value = true;
    nodeIndex.value = 0;
    // ensure active category is set (should be from up/down/hover)
    if (!activeCategory.value) {
      syncActiveCategory();
    }
  }
}

function onArrowLeft() {
  if (!searchQuery.value && inSubmenu.value) {
    inSubmenu.value = false;
    // We keep activeCategory visible to allow quick return
  }
}

function onEnter() {
  // If searching
  if (searchQuery.value) {
    const selectedNode = filteredNodes.value[nodeIndex.value];
    if (selectedNode) selectNode(selectedNode);
    return;
  }

  // If in submenu
  if (inSubmenu.value) {
    const selectedType = activeCategory.value?.nodeTypes?.[nodeIndex.value];
    if (selectedType) selectNode(selectedType);
    return;
  }

  // If on category, enter it
  onArrowRight();
}

// Global click-away
function onGlobalClick(e: MouseEvent) {
  if (
    props.show &&
    menuRef.value &&
    !menuRef.value.contains(e.target as Node)
  ) {
    close();
  }
}

onMounted(() => {
  window.addEventListener("mousedown", onGlobalClick);
});

onUnmounted(() => {
  window.removeEventListener("mousedown", onGlobalClick);
});
</script>

<style scoped>
.add-node-menu {
  position: absolute;
  width: 200px;
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: visible;
  user-select: none;
  backdrop-filter: blur(10px);
}

.search-container {
  padding: 8px;
  border-bottom: 1px solid #3d3d3d;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  font-size: 14px;
  opacity: 0.5;
}

.search-container input {
  background: transparent;
  border: none;
  color: #fff;
  width: 100%;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}

.menu-content {
  padding: 4px 0;
  max-height: 400px;
  overflow-y: auto;
}

.menu-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #ccc;
  position: relative;
  transition: background 0.15s, color 0.15s;
}

.menu-item:hover,
.menu-item.active {
  background: #3d3d3d;
  color: #fff;
}

.category-indicator {
  width: 3px;
  height: 14px;
  border-radius: 2px;
}

.node-label {
  flex: 1;
}

.has-submenu .chevron {
  opacity: 0.5;
  font-size: 16px;
}

.submenu {
  position: absolute;
  width: 180px;
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 4px 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.shadow-premium {
  box-shadow: 8px 8px 30px rgba(0, 0, 0, 0.6);
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

/* Scrollbar */
.menu-content::-webkit-scrollbar {
  width: 6px;
}
.menu-content::-webkit-scrollbar-track {
  background: transparent;
}
.menu-content::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}
</style>

