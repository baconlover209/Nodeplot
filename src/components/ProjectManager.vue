<template>
  <div class="project-manager-overlay" @click.self="$emit('close')">
    <div class="project-manager">
      <div class="pm-header">
        <h3>Manage Projects:</h3>

        <div class="action-buttons">
          <button class="import-btn" @click="triggerImport">
            <div class="i-mdi-file-import"></div>
            Import Graph
          </button>

          <div class="example-section">
            <select @change="handleLoadExample" class="example-select" v-model="selectedExample">
              <option value="" disabled>Load Example Projects</option>
              <option value="scatter">Scatter Plot</option>
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="strip">Strip Plot</option>
              <option value="violin">Violin Plot</option>
              <option value="sunburst">Sunburst</option>
              <option value="features">Features Demo</option>
              <option value="map">Cities Map</option>
              <option value="usa_choropleth">USA States Map</option>
            </select>
          </div>
        </div>

        <button class="close-btn" @click="$emit('close')">
          <div class="i-mdi-close"></div>
        </button>
      </div>

      <input type="file" ref="fileInput" @change="handleImportFile" accept=".json" style="display: none" />

      <div class="pm-content">
        <div v-if="projects.length === 0" class="no-projects">
          <p>No saved projects yet</p>
          <p class="hint">Save your current work to get started</p>
        </div>

        <div v-else class="projects-grid">
          <div v-for="project in sortedProjects" :key="project.id" class="project-card"
            @click="loadProject(project.id)">
            <div class="project-thumbnail">
              <img v-if="project.thumbnail" :src="project.thumbnail" alt="Project preview" />
              <div v-else class="thumbnail-placeholder">
                <div class="i-mdi-chart-bar"></div>
              </div>
            </div>

            <div class="project-info">
              <div class="project-name" :title="project.name">
                {{ project.name }}
              </div>
              <div class="project-meta">
                <span class="project-date">{{
                  formatDate(project.savedAt)
                }}</span>
                <span class="project-nodes">{{ project.nodeCount }} nodes</span>
              </div>
            </div>

            <div class="project-actions" @click.stop>
              <button class="action-btn clone-btn" @click="cloneProject(project.id)" title="Clone project">
                <div class="i-mdi-content-copy"></div>
              </button>
              <button class="action-btn rename-btn" @click="startRename(project)" title="Rename project">
                <div class="i-mdi-pencil"></div>
              </button>
              <button class="action-btn delete-btn" @click="deleteProject(project.id)" title="Delete project">
                <div class="i-mdi-trash-can-outline"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rename Modal -->
    <div v-if="renamingProject" class="rename-modal" @click.self="cancelRename">
      <div class="rename-content">
        <h3>Rename Project</h3>
        <input v-model="renameValue" type="text" class="rename-input" @keyup.enter="confirmRename"
          @keyup.escape="cancelRename" ref="renameInput" />
        <div class="rename-actions">
          <button class="cancel-btn" @click="cancelRename">Cancel</button>
          <button class="confirm-btn" @click="confirmRename" :disabled="!renameValue.trim()">
            Rename
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";

interface Project {
  id: string;
  name: string;
  savedAt: number;
  graphData: string;
  thumbnail: string | null;
  nodeCount: number;
}

const emit = defineEmits<{
  close: [];
  load: [projectData: string, projectId: string];
  loadExample: [exampleName: string];
}>();

const props = defineProps<{
  currentThumbnail?: string;
}>();

const STORAGE_KEY = "datatool_projects";

const projects = ref<Project[]>([]);
const renamingProject = ref<Project | null>(null);
const renameValue = ref("");
const renameInput = ref<HTMLInputElement | null>(null);
const selectedExample = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

const sortedProjects = computed(() => {
  return [...projects.value].sort((a, b) => b.savedAt - a.savedAt);
});

onMounted(() => {
  loadProjects();
});

function loadProjects() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      projects.value = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load projects:", e);
    projects.value = [];
  }
}

function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.value));
  } catch (e) {
    console.error("Failed to save projects:", e);
    alert("Failed to save projects. Storage might be full.");
  }
}

function triggerImport() {
  fileInput.value?.click();
}

function handleImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result;
    if (typeof content === "string") {
      emit("load", content, ""); // Empty ID for imported files
      emit("close");
    }
  };
  reader.readAsText(file);

  // Reset input
  if (fileInput.value) fileInput.value.value = "";
}

function cloneProject(projectId: string) {
  const project = projects.value.find((p) => p.id === projectId);
  if (!project) return;

  const clonedProject: Project = {
    id: generateId(),
    name: `${project.name} (Copy)`,
    savedAt: Date.now(),
    graphData: project.graphData,
    thumbnail: project.thumbnail,
    nodeCount: project.nodeCount,
  };

  projects.value.push(clonedProject);
  saveProjects();
  showNotification("Project cloned successfully!");
}

function loadProject(projectId: string) {
  const project = projects.value.find((p) => p.id === projectId);
  if (!project) return;

  if (
    confirm(`Load project "${project.name}"? Current work will be replaced.`)
  ) {
    emit("load", project.graphData, project.id);
    emit("close");
  }
}

function deleteProject(projectId: string) {
  const project = projects.value.find((p) => p.id === projectId);
  if (!project) return;

  if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
    projects.value = projects.value.filter((p) => p.id !== projectId);
    saveProjects();
    showNotification("Project deleted");
  }
}

function startRename(project: Project) {
  renamingProject.value = project;
  renameValue.value = project.name;
  nextTick(() => {
    renameInput.value?.focus();
    renameInput.value?.select();
  });
}

function confirmRename() {
  if (!renamingProject.value || !renameValue.value.trim()) return;

  renamingProject.value.name = renameValue.value.trim();
  saveProjects();

  showNotification("Project renamed");
  cancelRename();
}

function cancelRename() {
  renamingProject.value = null;
  renameValue.value = "";
}

function generateId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function handleLoadExample() {
  if (!selectedExample.value) return;

  emit("loadExample", selectedExample.value);
  selectedExample.value = ""; // Reset selection
  emit("close");
}

function showNotification(message: string) {
  // Simple notification - could be enhanced with a toast system
  const notification = document.createElement("div");
  notification.className = "project-notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}
</script>

<style scoped>
.project-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.project-manager {
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pm-header {
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 20px;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.pm-header h3 {
  margin: 0;
  font-weight: 600;
  background: white;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccc;
  margin-left: auto;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 77, 77, 0.2);
  border-color: rgba(255, 77, 77, 0.4);
  color: #ff4d4d;
}

.pm-actions {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-buttons {
  display: flex;
  gap: 20px;
}

.import-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 18px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-size: 13px;
}

.import-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 210, 255, 0.3);
}

.example-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.example-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  white-space: nowrap;
}

.example-select {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-select:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(0, 210, 255, 0.3);
}

.example-select:focus {
  outline: none;
  border-color: #00d2ff;
  box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.1);
}

.example-select option {
  background: #131313;
  color: #fff;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn .icon {
  font-size: 16px;
}

.pm-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.no-projects {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.no-projects p {
  margin: 4px 0;
  font-size: 16px;
}

.no-projects .hint {
  font-size: 14px;
  opacity: 0.7;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.project-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.project-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 210, 255, 0.4);
}

.project-thumbnail {
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg,
      rgba(0, 210, 255, 0.1) 0%,
      rgba(58, 123, 213, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.project-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 48px;
  opacity: 0.3;
}

.project-info {
  padding: 16px;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.project-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.project-card:hover .project-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: #fff;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.rename-btn:hover {
  background: rgba(0, 210, 255, 0.3);
  border-color: #00d2ff;
}

.clone-btn:hover {
  background: rgba(3, 169, 244, 0.3);
  border-color: #03a9f4;
}

.delete-btn:hover {
  background: rgba(255, 77, 77, 0.3);
  border-color: #ff4d4d;
}

.rename-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.rename-content {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
}

.rename-content h3 {
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 18px;
}

.rename-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  margin-bottom: 16px;
}

.rename-input:focus {
  outline: none;
  border-color: #00d2ff;
  box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.1);
}

.rename-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.confirm-btn {
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  border: none;
  color: #fff;
}

.confirm-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(0, 210, 255, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:global(.project-notification) {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10002;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

:global(.project-notification.show) {
  opacity: 1;
  transform: translateY(0);
}
</style>
