<!-- src/App.vue (完整替换) -->
<template>
  <div class="min-h-screen bg-stone-100 text-stone-800 p-4 md:p-6 flex items-center justify-center font-sans relative">
    
    <!-- 🌟 [核心重构 1]：极其优雅的全局浮动通知 (Toast)，彻底替代原生 alert -->
    <transition name="toast-fade">
      <div v-if="toast.show" 
           class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full shadow-lg shadow-stone-200/50 border text-[13px] font-medium flex items-center gap-2 transition-all backdrop-blur-md"
           :class="toast.type === 'error' ? 'bg-red-50/90 text-red-600 border-red-200' : 'bg-teal-50/90 text-teal-700 border-teal-200'"
      >
        <span>{{ toast.message }}</span>
      </div>
    </transition>

    <div class="w-full max-w-[95vw] xl:max-w-7xl bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-300/50 border border-stone-200 flex flex-col overflow-hidden h-[90vh] min-h-[750px] max-h-[1000px]">
      
      <!-- 🌟 [核心重构 2]：100% 解决白屏的 v-show 方案 -->
      <div class="flex-1 overflow-hidden flex flex-col min-h-0 relative">
        <!-- 视图 A：案头仪表盘 -->
        <DashboardView 
          v-show="currentMode === 'dashboard'"
          class="absolute inset-0 z-10 bg-white"
          :selectedDate="selectedDate"
          :tasks="tasks"
          :currentTasks="currentTasks"
          :todayStr="todayStr"
          :notes="savedNotes"
          @update:selectedDate="selectedDate = $event"
          @enter-writing="handleEnterWriting"  
          @save-poetry="handleSavePoetry"
          @write-essay="handleWriteEssay"
          @add-task="handleAddTask"
          @delete-task="handleDeleteTask"
          @toggle-complete="handleToggleComplete"
          @toggle-sub="handleToggleSub"
          @change-color="handleChangeColor"
          @update-task="handleUpdateTask"
          @import-tasks="handleImportTasks"
          @delete-note="handleDeleteNote"
        />
        
        <!-- 视图 B：灵感书斋 -->
        <WritingView 
          ref="writingViewRef"
          v-show="currentMode === 'writing'"
          class="absolute inset-0 z-20"
          :notes="savedNotes"        
          @update-notes="handleUpdateNotes"
          @delete-note="handleDeleteNote" 
          @back="switchMode('dashboard')"
        />
      </div>

      <!-- 底层状态栏 -->
      <div class="h-9 shrink-0 border-t border-stone-200 bg-stone-100/80 flex items-center justify-between px-4 text-[11px] text-stone-500 font-medium z-30">
        <div class="flex items-center gap-2 truncate max-w-[60%]">
          <span class="text-teal-500 animate-pulse">●</span> 
          <span>{{ currentSavePath }}</span>
        </div>
        
        <div class="flex items-center gap-4">
          <span class="hidden md:inline-block opacity-60 tracking-wider font-mono">Quantum Desktop Workspace</span>
          <button @click="changeLocation" class="hover:text-teal-600 hover:bg-stone-200/80 px-2 py-1 rounded transition-colors border border-transparent hover:border-stone-300 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            更改存储目录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import DashboardView from './views/DashboardView.vue';
import WritingView from './views/WritingView.vue';

// ================= 全局 Toast 通知引擎 =================
const toast = ref({ show: false, message: '', type: 'success' });
let toastTimer = null;
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 3000); // 3秒后自动消失
};

// ================= 全局路由与视图状态 =================
const currentMode = ref('dashboard'); 
const draftNote = ref(null); 

const switchMode = (mode) => {
  if (mode === 'dashboard') draftNote.value = null; 
  currentMode.value = mode;
};

// ================= 时间处理 =================
const formatDate = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const todayStr = formatDate(new Date());
const selectedDate = ref(todayStr);

// ================= 数据初始化与持久化层 =================
const tasks = ref([]); 
const savedNotes = ref([]);
const currentSavePath = ref('系统初始化中...');
let syncTimeout = null;

const changeLocation = async () => {
  if (window.electronAPI) {
    const result = await window.electronAPI.changeStoragePath();
    if (result.success) {
      currentSavePath.value = result.path;
      // 💡 替换原生 alert
      showToast(`✅ 迁都成功！已迁移至：${result.path}`);
      await window.electronAPI.saveData('tasks', tasks.value);
      await window.electronAPI.saveData('notes', savedNotes.value);
    }
  } else {
    // 💡 替换原生 alert
    showToast('⚠️ 当前为网页预览模式，无法修改本地目录，请在桌面端运行。', 'error');
  }
};

const loadSafeData = (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

// ================= 统一的数据监听：触发【双写】 =================
watch([tasks, savedNotes], (newValues) => {
  const plainTasks = JSON.parse(JSON.stringify(newValues[0]));
  const plainNotes = JSON.parse(JSON.stringify(newValues[1]));
  
  localStorage.setItem('quantumTasks_v3', JSON.stringify(plainTasks));
  localStorage.setItem('quantumNotes_v1', JSON.stringify(plainNotes));
  
  if (window.electronAPI) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        await window.electronAPI.saveData('tasks', plainTasks);
        await window.electronAPI.saveData('notes', plainNotes);
      } catch (error) {
        console.error('⚠️ 本地物理写入失败:', error);
      }
    }, 1000);
  }
}, { deep: true });

onMounted(async () => {
  if (window.electronAPI) {
    try {
      const path = await window.electronAPI.getStoragePath();
      currentSavePath.value = path;
      const loadedTasks = await window.electronAPI.loadData('tasks');
      const loadedNotes = await window.electronAPI.loadData('notes');
      if (loadedTasks) tasks.value = loadedTasks;
      if (loadedNotes) savedNotes.value = loadedNotes;
    } catch (error) {
      currentSavePath.value = '存储异常，已降级为缓存模式';
    }
  } else {
    tasks.value = loadSafeData('quantumTasks_v3', []);
    savedNotes.value = loadSafeData('quantumNotes_v1', []);
    currentSavePath.value = '网页预览模式 (无本地硬盘读写权限)';
  }
});

// ================= 核心计算引擎 =================
const currentTasks = computed(() => {
  const date = selectedDate.value;
  return tasks.value
    .filter(t => {
      if (t.type === 'single') return t.date === date || (!t.completed && t.date < date && date <= todayStr);
      if (t.type === 'multi') return date >= t.startDate && date <= t.endDate;
      if (t.type === 'daily') return date >= t.startDate;
      return false;
    })
    .map(t => {
      const mappedTask = JSON.parse(JSON.stringify(t)); 
      if (t.type === 'daily' || t.type === 'multi') {
        mappedTask.completed = t.completedDates?.includes(date) || false;
        if (mappedTask.subTasks) {
          mappedTask.subTasks.forEach(sub => {
            sub.completed = sub.completedDates?.includes(date) || false;
          });
        }
      }
      return mappedTask;
    });
});

// ================= 任务操作逻辑 =================
const handleAddTask = (newTaskData) => {
  const task = { ...newTaskData, id: 'task_' + Date.now(), subTasks: newTaskData.subTasks ||[] };
  if (task.type === 'single') task.completed = false;
  else task.completedDates =[];
  tasks.value.push(task);
};

const handleDeleteTask = (taskId) => {
  tasks.value = tasks.value.filter(t => t.id !== taskId);
};

const handleToggleComplete = (taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;
  const date = selectedDate.value;
  if (task.type === 'single') {
    task.completed = !task.completed;
    if (task.completed && task.subTasks) task.subTasks.forEach(sub => sub.completed = true);
  } else {
    if (!task.completedDates) task.completedDates =[];
    const isDone = task.completedDates.includes(date);
    if (isDone) {
      task.completedDates = task.completedDates.filter(d => d !== date); 
    } else {
      task.completedDates.push(date); 
      if (task.subTasks) {
        task.subTasks.forEach(sub => {
          if (!sub.completedDates) sub.completedDates =[];
          if (!sub.completedDates.includes(date)) sub.completedDates.push(date);
        });
      }
    }
  }
};

const handleToggleSub = (taskId, subId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task || !task.subTasks) return;
  const date = selectedDate.value;
  const sub = task.subTasks.find(s => s.id === subId);
  if (task.type === 'single') {
    sub.completed = !sub.completed;
    task.completed = task.subTasks.every(s => s.completed);
  } else {
    if (!sub.completedDates) sub.completedDates =[];
    if (sub.completedDates.includes(date)) {
      sub.completedDates = sub.completedDates.filter(d => d !== date);
    } else {
      sub.completedDates.push(date);
    }
    const allDone = task.subTasks.every(s => s.completedDates?.includes(date));
    if (!task.completedDates) task.completedDates =[];
    if (allDone) {
      if (!task.completedDates.includes(date)) task.completedDates.push(date);
    } else {
      task.completedDates = task.completedDates.filter(d => d !== date);
    }
  }
};

const handleChangeColor = (taskId, newColor) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (task) { task.color = newColor; }
};

const handleUpdateTask = (updatedTask) => {
  const index = tasks.value.findIndex(t => t.id === updatedTask.id);
  if (index !== -1) { tasks.value[index] = updatedTask; }
};

const handleImportTasks = async (importedData) => { 
  const tasksToAdd = Array.isArray(importedData) ? importedData : [importedData];
  let count = 0;
  tasksToAdd.forEach((task, index) => {
    const timestamp = Date.now();
    const newTask = {
      ...task,
      id: `task_imp_${timestamp}_${index}`,
      type: task.type || 'single',
      startDate: selectedDate.value, 
      endDate: task.type === 'multi' ? task.endDate : selectedDate.value,
      completed: false, 
      completedDates: [],
      subTasks: (task.subTasks ||[]).map((sub, subIndex) => ({
        ...sub, id: `sub_imp_${timestamp}_${index}_${subIndex}`, completed: false, completedDates:[]
      }))
    };
    tasks.value.push(newTask);
    count++;
  });

  if (window.electronAPI) {
    const plainTasks = JSON.parse(JSON.stringify(tasks.value));
    await window.electronAPI.saveData('tasks', plainTasks);
  }
  // 💡 替换原生 alert
  showToast(`✅ 雅记导入成功！已添加 ${count} 项模板。`);
};

// ================= 🌟 诗词与灵感书斋交互 =================
const writingViewRef = ref(null);

const handleSavePoetry = (poetry) => {
  const newNote = {
    id: 'note_' + Date.now(),
    type: 'quote',
    title: `${poetry.author} 诗词摘录`,
    content: `> ${poetry.text}\n> —— ${poetry.source || poetry.author}\n\n`,
    date: selectedDate.value,
    ai_metadata: {}
  };
  savedNotes.value.unshift(newNote);
  // 💡 [致病根源已铲除]：替换为温和的 Toast
  showToast('🔖 诗词已收录至灵感书斋。');
};

const handleWriteEssay = (poetry) => {
  if (writingViewRef.value) {
    writingViewRef.value.initFromPoetry(poetry.text, poetry.source || poetry.author);
  }
  switchMode('writing');
};

const handleEnterWriting = (note) => {
  if (writingViewRef.value) {
    if (note && note.id) {
      writingViewRef.value.openNote(note);
    } else {
      writingViewRef.value.initNew('prose');
    }
  }
  switchMode('writing');
};

const handleUpdateNotes = (newNote) => {
  const index = savedNotes.value.findIndex(n => n.id === newNote.id);
  if (index !== -1) {
    savedNotes.value[index] = { ...savedNotes.value[index], ...newNote };
  } else {
    const lines = newNote.content.split('\n').filter(l => l.trim() !== '');
    newNote.title = lines.length > 0 ? lines[0].replace(/^[#>\s]*/, '').substring(0, 15) : '无题雅记';
    newNote.date = selectedDate.value;
    savedNotes.value.unshift(newNote);
  }
};

const handleDeleteNote = (noteId) => {
  savedNotes.value = savedNotes.value.filter(n => n.id !== noteId);
};
</script>

<style>
/* Toast 浮现动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

/* 视图切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px) scale(0.99);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.99);
}
</style>