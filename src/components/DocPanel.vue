<template>
  <div class="doc-panel">
    <iframe src="https://plotly.com/javascript/" frameborder="0" class="doc-iframe"></iframe>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.doc-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.doc-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
