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
        <div class="search-icon">🔍</div>
        <input 
            ref="searchInput"
            v-model="searchQuery" 
            placeholder="Search nodes..." 
            @keydown.esc="close"
            @keydown.down.prevent="onArrowDown"
            @keydown.up.prevent="onArrowUp"
            @keydown.enter="onEnter"
        />
    </div>

    <!-- Main List (Categories or Results) -->
    <div class="menu-content">
        <!-- Results View -->
        <template v-if="searchQuery">
            <div 
                v-for="(type, index) in filteredNodes" 
                :key="type" 
                class="menu-item"
                :class="{ active: index === selectedIndex }"
                @click="selectNode(type)"
                @mouseenter="selectedIndex = index"
            >
                <div class="category-indicator" :style="{ backgroundColor: getNodeColor(type) }"></div>
                <span class="node-label">{{ formatNodeType(type) }}</span>
            </div>
            <div v-if="filteredNodes.length === 0" class="no-results">
                No nodes found
            </div>
        </template>

        <!-- Category View -->
        <template v-else>
            <div 
                v-for="category in NODE_CATEGORIES" 
                :key="category.label" 
                class="menu-item has-submenu"
                @mouseenter="handleMouseEnterCategory($event, category)"
                @mouseleave="handleMouseLeave"
            >
                <div class="category-indicator" :style="{ backgroundColor: category.color }"></div>
                <span class="node-label">{{ category.label }}</span>
                <span class="chevron">›</span>
            </div>
        </template>
    </div>

    <!-- Submenu (Folder contents) - Moved outside .menu-content to avoid clipping -->
    <div 
        v-if="activeCategory" 
        class="submenu shadow-premium"
        :style="submenuStyle"
        @mouseenter="handleMouseEnterSubmenu"
        @mouseleave="handleMouseLeave"
    >
        <div 
            v-for="type in activeCategory.nodeTypes" 
            :key="type" 
            class="menu-item"
            @click="selectNode(type)"
        >
                <div class="category-indicator" :style="{ backgroundColor: activeCategory.color }"></div>
                <span class="node-label">{{ formatNodeType(type) }}</span>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { NODE_CATEGORIES, getNodeColor } from './nodeEditorState';

const props = defineProps<{
    show: boolean;
    x: number;
    y: number;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'select', type: string): void;
}>();

const menuRef = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const activeCategory = ref<any | null>(null);
const submenuY = ref(0);
const selectedIndex = ref(0);
const closeTimer = ref<number | null>(null);

const menuStyle = computed(() => ({
    left: `${props.x}px`,
    top: `${props.y}px`
}));

const submenuStyle = computed(() => ({
    top: `${submenuY.value}px`,
    left: '100%',
    paddingLeft: '4px', // Gap buffer
    marginLeft: '-2px' // Overlap slightly to ensure mouse transition
}));

const allNodeTypes = computed(() => {
    return NODE_CATEGORIES.flatMap(c => c.nodeTypes);
});

const filteredNodes = computed(() => {
    if (!searchQuery.value) return [];
    const q = searchQuery.value.toLowerCase();
    return allNodeTypes.value?.filter(type => 
        formatNodeType(type).toLowerCase().includes(q) || type.toLowerCase().includes(q)
    ) || [];
});

watch(() => props.show, (newVal) => {
    if (newVal) {
        searchQuery.value = '';
        selectedIndex.value = 0;
        activeCategory.value = null;
        if (closeTimer.value) {
            clearTimeout(closeTimer.value);
            closeTimer.value = null;
        }
        nextTick(() => {
            searchInput.value?.focus();
        });
    }
});

watch(searchQuery, () => {
    selectedIndex.value = 0;
    activeCategory.value = null;
    if (closeTimer.value) {
        clearTimeout(closeTimer.value);
        closeTimer.value = null;
    }
});

function formatNodeType(type: string) {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function handleMouseEnterCategory(event: MouseEvent, category: any) {
    if (closeTimer.value) {
        clearTimeout(closeTimer.value);
        closeTimer.value = null;
    }
    setActiveCategory(event, category);
}

function handleMouseEnterSubmenu() {
    if (closeTimer.value) {
        clearTimeout(closeTimer.value);
        closeTimer.value = null;
    }
}

function handleMouseLeave() {
    closeTimer.value = window.setTimeout(() => {
        activeCategory.value = null;
        closeTimer.value = null;
    }, 150); // 150ms delay
}

function setActiveCategory(event: MouseEvent, category: any) {
    activeCategory.value = category;
    
    // Calculate Y position relative to main menu
    const target = event.currentTarget as HTMLElement;
    if (target && menuRef.value) {
        const menuRect = menuRef.value.getBoundingClientRect();
        const itemRect = target.getBoundingClientRect();
        submenuY.value = itemRect.top - menuRect.top - 4; // -4 to align with top padding
    }
}

function selectNode(type: string) {
    emit('select', type);
    close();
}

function close() {
    emit('close');
}

function onArrowDown() {
    if (filteredNodes.value.length > 0) {
        selectedIndex.value = (selectedIndex.value + 1) % filteredNodes.value.length;
    }
}

function onArrowUp() {
    if (filteredNodes.value.length > 0) {
        selectedIndex.value = (selectedIndex.value - 1 + filteredNodes.value.length) % filteredNodes.value.length;
    }
}

function onEnter() {
    const selectedNode = filteredNodes.value[selectedIndex.value];
    if (searchQuery.value && selectedNode) {
        selectNode(selectedNode);
    }
}

// Global click-away
function onGlobalClick(e: MouseEvent) {
    if (props.show && menuRef.value && !menuRef.value.contains(e.target as Node)) {
        close();
    }
}

onMounted(() => {
    window.addEventListener('mousedown', onGlobalClick);
});

onUnmounted(() => {
    window.removeEventListener('mousedown', onGlobalClick);
});
</script>

<style scoped>
.add-node-menu {
    position: absolute;
    width: 200px;
    background: #2b2b2b;
    border: 1px solid #444;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
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

.menu-item:hover, .menu-item.active {
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
    box-shadow: 8px 8px 30px rgba(0,0,0,0.6);
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
