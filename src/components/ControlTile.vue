<template>
  <div class="control-tile" :class="{ editing: isEditing }">
    <div class="tile-header">
      <span class="tile-label" v-if="!isRenaming" @dblclick="startRenaming">{{
        tile.label
      }}</span>
      <input
        v-else
        ref="renameInput"
        v-model="tempLabel"
        @blur="finishRenaming"
        @keyup.enter="finishRenaming"
        class="rename-input"
        placeholder="Group Name"
      />

      <div v-if="isEditing" class="tile-actions">
        <!-- Layout Switcher -->
        <select
          v-model="tile.layout"
          class="layout-select"
          title="Change Layout"
        >
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
          <option value="grid2x2">Grid 2x2</option>
        </select>
        <button
          class="action-btn delete-btn"
          @click="$emit('remove-tile', tile.id)"
          title="Remove Tile"
        >
          ×
        </button>
      </div>
    </div>

    <div
      class="tile-body"
      :class="['layout-' + tile.layout]"
      @dragover.prevent
      @drop="onDrop"
    >
      <div v-if="tile.items.length === 0" class="empty-tile-placeholder">
        Drag controls here
      </div>

      <div
        v-for="(item, index) in tile.items"
        :key="item.id"
        class="control-wrapper"
        draggable="true"
        @dragstart="onDragStart($event, index)"
      >
        <div v-if="isEditing" class="control-overlay">
          <span class="drag-handle" title="Drag to move">::</span>
          <button
            class="action-btn remove-item-btn"
            @click="$emit('remove-item', tile.id, item.id)"
            title="Remove Control"
          >
            ×
          </button>
        </div>

        <slot name="control" :item="item"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { ControlTile } from "./NodeEditor/nodeEditorState";

const props = defineProps<{
  tile: ControlTile;
  isEditing: boolean;
}>();

const emit = defineEmits([
  "remove-tile",
  "remove-item",
  "update-tile",
  "drop-item",
]);

const isRenaming = ref(false);
const tempLabel = ref("");
const renameInput = ref<HTMLInputElement | null>(null);

function startRenaming() {
  if (!props.isEditing) return;
  tempLabel.value = props.tile.label;
  isRenaming.value = true;
  nextTick(() => renameInput.value?.focus());
}

function finishRenaming() {
  if (isRenaming.value) {
    if (tempLabel.value.trim()) {
      props.tile.label = tempLabel.value.trim();
    }
    isRenaming.value = false;
  }
}

function onDrop(event: DragEvent) {
  event.stopPropagation();
  emit("drop-item", event, props.tile.id);
}

function onDragStart(event: DragEvent, index: number) {
  if (!props.isEditing) {
    event.preventDefault();
    return;
  }

  event.stopPropagation();

  if (props.tile.items && props.tile.items[index]) {
    event.dataTransfer?.setData(
      "application/json",
      JSON.stringify({
        type: "move-item",
        tileId: props.tile.id,
        itemId: props.tile.items[index].id,
        index,
      })
    );
    event.dataTransfer!.effectAllowed = "move";
  }
}
</script>

<style scoped>
.control-tile {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  min-width: 240px;
  min-height: 120px;
}

.control-tile:hover {
  border-color: #444;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.control-tile.editing {
  border-color: #555;
  border-style: dashed;
  background: #252525;
}

.tile-header {
  background: #2c2c2c;
  padding: 8px 12px;
  border-bottom: 1px solid #333;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  font-size: 13px;
  color: #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
}

.tile-label {
  cursor: default;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}
.editing .tile-label {
  cursor: text;
  border-bottom: 1px dotted #777;
}
.editing .tile-label:hover {
  color: #fff;
  border-bottom-color: #aaa;
}

.rename-input {
  background: #111;
  border: 1px solid #007acc;
  color: #fff;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
  width: 140px;
  outline: none;
}

.tile-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.layout-select {
  background: #111;
  color: #ccc;
  border: 1px solid #444;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 4px;
  outline: none;
  cursor: pointer;
}
.layout-select:hover {
  border-color: #666;
  color: #fff;
}

.action-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s;
}
.action-btn:hover {
  color: #ff5555;
}

.tile-body {
  padding: 12px;
  flex: 1;
  display: flex;
  gap: 12px;
  position: relative;
  overflow-y: auto;
}

.empty-tile-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 13px;
  border: 1px dashed #444;
  border-radius: 6px;
  min-height: 60px;
  pointer-events: none;
  user-select: none;
}

.layout-vertical {
  flex-direction: column;
}

.layout-horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
}

.layout-grid2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: max-content;
  gap: 12px;
}

.control-wrapper {
  position: relative;
  background: #2a2a2a;
  border-radius: 6px;
  padding: 10px;
  transition: background 0.15s;
  min-width: 0;
}

.layout-horizontal .control-wrapper {
  flex: 1 1 180px;
  max-width: 100%;
}

.control-wrapper:hover {
  background: #333;
}

.control-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px;
  border-radius: 6px 6px 0 0;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: move;
  z-index: 10;
  pointer-events: auto;
}

.control-wrapper:hover .control-overlay {
  opacity: 1;
}

.drag-handle {
  color: #ccc;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: grab;
}
.drag-handle:active {
  cursor: grabbing;
}

.remove-item-btn {
  font-size: 14px;
  color: #ff6666;
}
</style>
