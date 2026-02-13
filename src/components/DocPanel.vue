<template>
  <div class="doc-panel">
    <div class="tabs">
      <button
        :class="['tab-btn', { active: currentTab === 'plotly' }]"
        @click="currentTab = 'plotly'"
      >
        Plotly Docs
      </button>
      <button
        :class="['tab-btn', { active: currentTab === 'guide' }]"
        @click="currentTab = 'guide'"
      >
        My Guide
      </button>
    </div>

    <div class="content-area">
      <iframe
        v-if="currentTab === 'plotly'"
        src="https://plotly.com/javascript/"
        frameborder="0"
        class="doc-iframe"
      ></iframe>

      <div v-else class="guide-container">
        <div class="guide-content" v-html="renderedGuide"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { marked } from "marked";

const currentTab = ref<"plotly" | "guide">("plotly");
const rawGuide = ref("");

const renderedGuide = computed(() => {
  // marked.parse can be sync or async. With the default options it returns a string (sync) or Promise<string> (async)
  // We force it to be treated as string here or handle the promise if it is one.
  // However, marked 4+ parses synchronously by default unless using async extensions.
  const result = marked.parse(rawGuide.value);
  return result as string;
});

onMounted(async () => {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/baconlover209/Nodeplot/refs/heads/main/GUIDE.md"
    );
    if (res.ok) {
      rawGuide.value = await res.text();
    } else {
      rawGuide.value =
        "# Error Loading Guide\n\nCould not fetch the guide from GitHub.";
    }
  } catch (e) {
    rawGuide.value = `# Error Loading Guide\n\n${e}`;
  }
});
</script>

<style scoped>
.doc-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  overflow: hidden;
}

.tabs {
  display: flex;
  background-color: #252526;
  border-bottom: 1px solid #3e3e42;
}

.tab-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  color: #969696;
  cursor: pointer;
  font-size: 13px;
  border-right: 1px solid #3e3e42;
  outline: none;
}

.tab-btn:hover {
  color: #e0e0e0;
  background-color: #2d2d30;
}

.tab-btn.active {
  color: #ffffff;
  background-color: #1e1e1e;
  border-top: 2px solid #007acc;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.doc-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  background-color: white;
}

.guide-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.guide-content {
  max-width: 800px;
  margin: 0 auto;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
}

/* Markdown Styles */
.guide-content :deep(h1),
.guide-content :deep(h2),
.guide-content :deep(h3) {
  color: #569cd6;
  border-bottom: 1px solid #3e3e42;
  padding-bottom: 0.3em;
  margin-top: 1.5em;
}

.guide-content :deep(h1) {
  font-size: 2em;
}
.guide-content :deep(h2) {
  font-size: 1.5em;
}
.guide-content :deep(h3) {
  font-size: 1.25em;
}

.guide-content :deep(p) {
  margin: 1em 0;
}

.guide-content :deep(a) {
  color: #3794ff;
  text-decoration: none;
}
.guide-content :deep(a:hover) {
  text-decoration: underline;
}

.guide-content :deep(ul),
.guide-content :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.guide-content :deep(li) {
  margin-bottom: 0.5em;
}

.guide-content :deep(code) {
  background-color: #2d2d2d;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: "Consolas", "Courier New", monospace;
  font-size: 0.9em;
  color: #ce9178;
}

.guide-content :deep(pre) {
  background-color: #1e1e1e;
  border: 1px solid #474747;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 1em 0;
}

.guide-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #d4d4d4;
  border: none;
}

.guide-content :deep(blockquote) {
  border-left: 4px solid #007acc;
  margin: 1em 0;
  padding-left: 1em;
  color: #858585;
}

.guide-content :deep(hr) {
  border: none;
  border-top: 1px solid #3e3e42;
  margin: 2em 0;
}
</style>
