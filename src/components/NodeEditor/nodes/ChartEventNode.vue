<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)" @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="event-display">
      <div v-if="hasEvent" class="event-info">
        <div class="event-row">
          <span class="label">Point:</span>
          <span class="value">({{ eventData.x }}, {{ eventData.y }})</span>
        </div>
        <div class="event-row">
          <span class="label">Index:</span>
          <span class="value">{{ eventData.pointIndex }}</span>
        </div>
      </div>
      <div v-else class="no-event">
        Click chart...
      </div>
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';

const props = defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

// Get chart click data from App.vue via provide/inject
const lastChartClick = inject<any>('lastChartClick', { value: null });

const eventData = computed(() => lastChartClick.value || {});

const hasEvent = computed(() => {
  return lastChartClick.value !== null && lastChartClick.value !== undefined;
});
</script>

<style scoped>
.event-display {
  padding: 5px 0;
  min-height: 40px;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.label {
  color: #888;
}

.value {
  color: #00d2ff;
  font-family: monospace;
}

.no-event {
  color: #555;
  font-size: 10px;
  font-style: italic;
  text-align: center;
  padding: 10px 0;
}
</style>
