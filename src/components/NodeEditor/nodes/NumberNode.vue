<template>
  <BaseNode :node="node" :selected="selected" @connect-start="$emit('connect-start', $event)" @connect-end="$emit('connect-end', $event)" @socket-click="$emit('socket-click', $event)">
    <div class="number-input">
      <input type="number" v-model.number="node.data.value" @mousedown.stop @input="onUpdate" />
    </div>
  </BaseNode>
</template>

<script setup lang="ts">
import BaseNode from '../BaseNode.vue';
import type { NodeDefinition } from '../nodeEditorState';
import { triggerGraphUpdate } from '../nodeEditorState';

defineProps<{
  node: NodeDefinition;
  selected: boolean;
}>();

defineEmits(['connect-start', 'connect-end', 'socket-click']);

function onUpdate() {
    triggerGraphUpdate();
}
</script>

<style scoped>
.number-input {
  padding: 5px 0;
}
input {
  width: 100%;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 2px;
}
</style>
