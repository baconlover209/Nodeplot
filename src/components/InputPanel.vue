<template>
  <div class="input-panel">
    <div class="input-list">
      <div v-for="(input, index) in inputs" :key="index" class="input-item">
        <div class="input-header">
          <input 
            v-model="input.label" 
            placeholder="Variable Name" 
            class="variable-name-input"
            @change="emitUpdate"
          />
          <button @click="removeInput(index)" class="remove-btn">×</button>
        </div>
        
        <div class="input-body">
          <select v-model="input.type" class="type-select" @change="handleTypeChange(input)">
            <option value="number">Number</option>
            <option value="slider">Slider</option>
            <option value="checkbox">Checkbox</option>
            <option value="text">Text</option>
            <option value="color">Color</option>
            <option value="xy">XY Coordinate</option>
            <option value="button">Button (Trigger)</option>
          </select>

          <!-- Number Input -->
          <div v-if="input.type === 'number'" class="input-control">
            <input type="number" v-model.number="input.value" @input="emitUpdate" />
          </div>

          <!-- Slider Input -->
          <div v-if="input.type === 'slider'" class="input-control">
            <div class="slider-row">
              <input type="range" v-model.number="input.value" :min="input.min" :max="input.max" :step="input.step" @input="emitUpdate" />
              <span>{{ input.value }}</span>
            </div>
            <div class="slider-config">
              <input type="number" v-model.number="input.min" placeholder="Min" @change="emitUpdate" />
              <input type="number" v-model.number="input.max" placeholder="Max" @change="emitUpdate" />
              <input type="number" v-model.number="input.step" placeholder="Step" @change="emitUpdate" />
            </div>
          </div>

          <!-- Checkbox Input -->
          <div v-if="input.type === 'checkbox'" class="input-control">
            <label>
              <input type="checkbox" v-model="input.value" @change="emitUpdate" />
              {{ input.value ? 'True' : 'False' }}
            </label>
          </div>

          <!-- Text Input -->
          <div v-if="input.type === 'text'" class="input-control">
            <input type="text" v-model="input.value" @input="emitUpdate" />
          </div>

          <!-- Color Input -->
          <div v-if="input.type === 'color'" class="input-control">
            <input type="color" v-model="input.value" @input="emitUpdate" />
            <span>{{ input.value }}</span>
          </div>

          <!-- XY Input -->
          <div v-if="input.type === 'xy'" class="input-control xy-control">
            <input type="number" v-model.number="input.value.x" placeholder="X" @input="emitUpdate" />
            <input type="number" v-model.number="input.value.y" placeholder="Y" @input="emitUpdate" />
          </div>

          <!-- Button Input -->
          <div v-if="input.type === 'button'" class="input-control">
            <button @click="incrementButton(input)">Click to Trigger</button>
            <span>Count: {{ input.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <button @click="addInput" class="add-btn">+ Add Input</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface InputDefinition {
  type: 'number' | 'slider' | 'checkbox' | 'text' | 'color' | 'xy' | 'button';
  label: string;
  value: any;
  min?: number;
  max?: number;
  step?: number;
}

const props = defineProps<{
  modelValue: InputDefinition[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: InputDefinition[]): void;
  (e: 'change'): void;
}>();

const inputs = ref<InputDefinition[]>(JSON.parse(JSON.stringify(props.modelValue)));

const addInput = () => {
  inputs.value.push({
    type: 'slider',
    label: 'variable_' + (inputs.value.length + 1),
    value: 50,
    min: 0,
    max: 100,
    step: 1
  });
  emitUpdate();
};

const removeInput = (index: number) => {
  inputs.value.splice(index, 1);
  emitUpdate();
};

const handleTypeChange = (input: InputDefinition) => {
  // Reset default values based on type
  switch (input.type) {
    case 'number': input.value = 0; break;
    case 'slider': 
      input.value = 50; 
      input.min = 0; 
      input.max = 100; 
      input.step = 1; 
      break;
    case 'checkbox': input.value = false; break;
    case 'text': input.value = ''; break;
    case 'color': input.value = '#000000'; break;
    case 'xy': input.value = { x: 0, y: 0 }; break;
    case 'button': input.value = 0; break;
  }
  emitUpdate();
};

const incrementButton = (input: InputDefinition) => {
  input.value++;
  emitUpdate();
};

const emitUpdate = () => {
  emit('update:modelValue', inputs.value);
  emit('change');
};

watch(() => props.modelValue, (newValue) => {
  // Only update if length changed or deep content changed significantly
  // Simple check to avoid loop if we just emitted it
  if (JSON.stringify(newValue) !== JSON.stringify(inputs.value)) {
    inputs.value = JSON.parse(JSON.stringify(newValue));
  }
}, { deep: true });
</script>

<style scoped>
.input-panel {
  padding: 10px;
  overflow-y: auto;
  height: 100%;
}

.input-item {
  background-color: #333;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.variable-name-input {
  background-color: #1e1e1e;
  border: 1px solid #444;
  color: #fff;
  padding: 4px;
  border-radius: 2px;
  flex: 1;
  margin-right: 5px;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff5555;
  cursor: pointer;
  font-size: 16px;
  padding: 0 5px;
}

.input-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.type-select {
  background-color: #1e1e1e;
  color: #fff;
  border: 1px solid #444;
  padding: 4px;
  border-radius: 2px;
}

.input-control {
  margin-top: 5px;
}

.input-control input[type="text"],
.input-control input[type="number"] {
  background-color: #1e1e1e;
  border: 1px solid #444;
  color: #fff;
  padding: 4px;
  border-radius: 2px;
  width: 100%;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-row input {
  flex: 1;
}

.slider-config {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.slider-config input {
  width: 30%;
}

.xy-control {
  display: flex;
  gap: 5px;
}

.add-btn {
  width: 100%;
  padding: 8px;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.add-btn:hover {
  background-color: #0062a3;
}
</style>
