<template>
  <div class="chart-wrapper" ref="wrapperRef">
    <div
      ref="chartContainer"
      class="chart-container"
      :style="visualStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import Plotly from "plotly.js-dist-min";

const props = defineProps<{
  data: any[];
  layout: any;
  isResizing?: boolean;
}>();

const emit = defineEmits(["click", "resize-complete"]);

const wrapperRef = ref<HTMLDivElement | null>(null);
const chartContainer = ref<HTMLDivElement | null>(null);
const renderedWidth = ref(0);
const renderedHeight = ref(0);
const internalWidth = ref(0);
const internalHeight = ref(0);
const visualWidth = ref(0);
const visualHeight = ref(0);
const targetWidth = ref(0);
const targetHeight = ref(0);

let resizeObserver: ResizeObserver | null = null;
let isResizingActive = false;
let pendingResize = false;
let animationFrameId: number | null = null;
let renderDebounceTimer: any = null;

const visualStyle = computed(() => {
  const baseW = renderedWidth.value || internalWidth.value;
  const baseH = renderedHeight.value || internalHeight.value;

  if (baseW === 0 || visualWidth.value === 0) return {};

  const scaleX = visualWidth.value / baseW;
  const scaleY = visualHeight.value / baseH;

  return {
    width: `${internalWidth.value}px`,
    height: `${internalHeight.value}px`,
    transform: `scale(${scaleX}, ${scaleY})`,
    transformOrigin: "top left",
    willChange: "transform",
    pointerEvents: (props.isResizing ? "none" : "auto") as any,
  };
});

const drawChart = () => {
  if (chartContainer.value) {
    Plotly.react(chartContainer.value, props.data, props.layout, {
      responsive: false,
    });
  }
};

const performPlotlyResize = async () => {
  if (!chartContainer.value || isResizingActive) {
    pendingResize = true;
    return;
  }

  isResizingActive = true;
  pendingResize = false;

  try {
    const snapshotW = visualWidth.value;
    const snapshotH = visualHeight.value;
    internalWidth.value = snapshotW;
    internalHeight.value = snapshotH;

    await new Promise((resolve) => requestAnimationFrame(resolve));
    await Plotly.Plots.resize(chartContainer.value);

    renderedWidth.value = snapshotW;
    renderedHeight.value = snapshotH;
  } catch (e) {
    console.error("Plotly resize error:", e);
  } finally {
    isResizingActive = false;
    if (pendingResize) {
      triggerDeferredRender();
    }
  }
};

const lerp = (start: number, end: number, factor: number) =>
  start + (end - start) * factor;

const animationLoop = () => {
  const isSettled =
    !props.isResizing &&
    Math.abs(visualWidth.value - targetWidth.value) < 0.1 &&
    Math.abs(visualHeight.value - targetHeight.value) < 0.1;

  if (isSettled) {
    visualWidth.value = targetWidth.value;
    visualHeight.value = targetHeight.value;
    triggerDeferredRender();
    animationFrameId = null;
    return;
  }

  const factor = 0.25;
  visualWidth.value = lerp(visualWidth.value, targetWidth.value, factor);
  visualHeight.value = lerp(visualHeight.value, targetHeight.value, factor);

  animationFrameId = requestAnimationFrame(animationLoop);
};

const triggerDeferredRender = () => {
  clearTimeout(renderDebounceTimer);
  renderDebounceTimer = setTimeout(() => {
    performPlotlyResize();
  }, 150);
};

onMounted(() => {
  drawChart();

  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      targetWidth.value = width;
      targetHeight.value = height;

      if (internalWidth.value === 0) {
        internalWidth.value = width;
        internalHeight.value = height;
        visualWidth.value = width;
        visualHeight.value = height;
        renderedWidth.value = width;
        renderedHeight.value = height;
        performPlotlyResize();
      }

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animationLoop);
      }

      triggerDeferredRender();
    });
    resizeObserver.observe(wrapperRef.value);

    (chartContainer.value as any).on("plotly_click", (data: any) => {
      emit("click", data);
    });
  }
});

watch(
  () => props.isResizing,
  (newVal) => {
    if (!newVal) {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animationLoop);
      }
      triggerDeferredRender();
    }
  }
);

watch(
  () => [props.data, props.layout],
  () => {
    drawChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  clearTimeout(renderDebounceTimer);
});

const getThumbnail = async (): Promise<string | null> => {
  if (!chartContainer.value) return null;
  try {
    return await Plotly.toImage(chartContainer.value, {
      format: "png",
      width: 400,
      height: 300,
    });
  } catch (e) {
    console.error("Failed to capture thumbnail:", e);
    return null;
  }
};

defineExpose({ getThumbnail });
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  contain: strict;
}

.chart-container {
  position: absolute;
  top: 0;
  left: 0;
  image-rendering: auto;
}
</style>
