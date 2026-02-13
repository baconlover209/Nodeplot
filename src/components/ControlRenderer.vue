<template>
  <div v-if="control" class="control-renderer">
    <label class="control-label">{{ control.label }}</label>

    <!-- Slider -->
    <div v-if="control.type === 'slider'" class="control-widget slider-widget">
      <input
        type="range"
        :value="control.value"
        :min="control.min"
        :max="control.max"
        :step="control.step"
        class="slider-input"
        @mousedown.stop
        @input="onChange(($event.target as HTMLInputElement).value)"
      />
      <span class="control-value">{{ control.value }}</span>
    </div>

    <!-- Number -->
    <div
      v-else-if="control.type === 'number'"
      class="control-widget number-widget"
    >
      <input
        type="number"
        :value="control.value"
        :min="control.min"
        :max="control.max"
        :step="control.step"
        class="text-input"
        @mousedown.stop
        @input="onChange(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Checkbox -->
    <div
      v-else-if="control.type === 'checkbox'"
      class="control-widget checkbox-widget"
    >
      <label class="checkbox-wrapper">
        <input
          type="checkbox"
          :checked="control.value"
          @mousedown.stop
          @change="onChange(($event.target as HTMLInputElement).checked)"
        />
        <span class="checkmark"></span>
        <span class="checkbox-text">{{ control.value ? "On" : "Off" }}</span>
      </label>
    </div>

    <!-- Text -->
    <div v-else-if="control.type === 'text'" class="control-widget text-widget">
      <input
        type="text"
        :value="control.value"
        class="text-input"
        @mousedown.stop
        @input="onChange(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Color -->
    <div
      v-else-if="control.type === 'color'"
      class="control-widget color-widget"
    >
      <div class="color-preview" :style="{ backgroundColor: control.value }">
        <input
          type="color"
          :value="control.value"
          class="color-input"
          @mousedown.stop
          @input="onChange(($event.target as HTMLInputElement).value)"
        />
      </div>
      <span class="control-value color-code">{{ control.value }}</span>
    </div>

    <!-- Dropdown -->
    <div
      v-else-if="control.type === 'dropdown'"
      class="control-widget dropdown-widget"
    >
      <select
        :value="control.value"
        class="select-input"
        @mousedown.stop
        @change="onChange(($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="(option, idx) in control.options"
          :key="idx"
          :value="option"
        >
          {{ option }}
        </option>
      </select>
    </div>
  </div>
  <div v-else class="control-error">Control not found</div>
</template>

<script setup lang="ts">
const props = defineProps<{
  control: any;
}>();

const emit = defineEmits(["change"]);

function onChange(value: any) {
  let val = value;
  if (props.control.type === "number" || props.control.type === "slider") {
    val = parseFloat(value);
  }
  emit("change", val);
}
</script>

<style scoped>
.control-renderer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.control-label {
  font-size: 12px;
  font-weight: 500;
  color: #aeaeae;
  user-select: none;
  margin-bottom: 2px;
  letter-spacing: 0.3px;
}

.control-widget {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
}

.text-input,
.select-input {
  background: #111;
  border: 1px solid #444;
  color: #eee;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 13px;
  width: 100%;
  height: 100%;
  outline: none;
  transition: border-color 0.2s;
}

.text-input:focus,
.select-input:focus {
  border-color: #007acc;
}

.select-input {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%23888%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}
.select-input:hover {
  border-color: #555;
}

.slider-widget {
  display: flex;
  align-items: center;
}

.slider-input {
  flex: 1;
  cursor: pointer;
  height: 4px;
  appearance: none;
  background: #444;
  border-radius: 2px;
  outline: none;
}
.slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00d2ff;
  cursor: pointer;
  transition: transform 0.1s;
}
.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.control-value {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  color: #00d2ff;
  min-width: 40px;
  text-align: right;
  font-weight: bold;
}

.checkbox-widget {
  height: auto;
  min-height: 32px;
}
.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
  user-select: none;
}
.checkbox-wrapper input {
  display: none;
}
.checkmark {
  width: 18px;
  height: 18px;
  background: #111;
  border: 1px solid #444;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s;
}
.checkbox-wrapper input:checked + .checkmark {
  background: #007acc;
  border-color: #007acc;
}
.checkmark::after {
  content: "";
  position: absolute;
  left: 6px;
  top: 2px;
  width: 4px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  display: none;
}
.checkbox-wrapper input:checked + .checkmark::after {
  display: block;
}
.checkbox-text {
  font-size: 13px;
  color: #ccc;
}

.color-widget {
  justify-content: space-between;
}
.color-preview {
  width: 40px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #555;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.color-input {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 200%;
  height: 200%;
  opacity: 0;
  cursor: pointer;
}
.color-code {
  font-size: 11px;
  color: #888;
}

.control-error {
  color: #ff4444;
  font-size: 11px;
  padding: 8px;
  border: 1px dashed #ff4444;
  border-radius: 4px;
}
</style>
