<template>
  <div class="data-grid-wrapper">
    <ag-grid-vue
      class="ag-theme-quartz-dark"
      style="width: 100%; height: 100%;"
      :rowData="rowData"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      @grid-ready="onGridReady"
      @cell-value-changed="onCellValueChanged"
    >
    </ag-grid-vue>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const props = defineProps<{
  data: any[];
}>();

const emit = defineEmits<{
  (e: 'update:data', value: any[]): void;
}>();

const rowData = ref<any[]>([]);
const columnDefs = ref<any[]>([]);
const defaultColDef = {
  flex: 1,
  minWidth: 100,
  filter: true,
  editable: true,
};

watch(() => props.data, (newData) => {
  if (newData && newData.length > 0) {
    rowData.value = [...newData];
    const keys = Object.keys(newData[0]);
    columnDefs.value = keys.map(key => ({ field: key }));
  } else {
    rowData.value = [];
    columnDefs.value = [];
  }
}, { immediate: true });

const onGridReady = (params: any) => {
  params.api.sizeColumnsToFit();
};

const onCellValueChanged = () => {
  // Emit updated data back to parent
  emit('update:data', rowData.value);
};
</script>

<style scoped>
.data-grid-wrapper {
  width: 100%;
  height: 100%;
}
</style>
