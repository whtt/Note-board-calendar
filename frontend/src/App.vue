<!-- src/App.vue (局部替换) -->
<template>
  <div class="min-h-screen bg-stone-100 text-stone-800 p-4 md:p-6 flex items-center justify-center font-sans">
    <div class="w-full max-w-[95vw] xl:max-w-7xl bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-stone-300/50 border border-stone-200 flex flex-col overflow-hidden h-[90vh] min-h-[750px] max-h-[1000px]">
      
      <!-- 🌟 [核心重构]：100% 解决白屏的 v-show 方案 -->
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
          @back="switchMode('dashboard')"
        />
      </div>

      <!-- 底层状态栏 (保持不变) -->
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

// 引入解耦后的两大视图
import DashboardView from './views/DashboardView.vue';
import WritingView from './views/WritingView.vue';

// ================= 全局路由与视图状态 =================
const currentMode = ref('dashboard'); // 'dashboard' | 'writing'
const draftNote = ref(null); // 用于从诗词卡片带过去的临时草稿

const switchMode = (mode) => {
  if (mode === 'dashboard') draftNote.value = null; // 清除草稿状态
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
// (这里保留你原来的 loadSafeData, Electron挂载, watch 监听等完整逻辑，省略部分任务系统相同的操作)
const tasks = ref([]); 
const savedNotes = ref([]);
const currentSavePath = ref('系统初始化中...');
// ================= [核心改革] 桌面端 Electron 本地档案馆 =================
let syncTimeout = null;
const changeLocation = async () => {
  if (window.electronAPI) {
    const result = await window.electronAPI.changeStoragePath();
    if (result.success) {
      currentSavePath.value = result.path;
      alert(`✅ 迁都成功！\n数据档案已成功迁移至：\n${result.path}`);
      await window.electronAPI.saveData('tasks', tasks.value);
      await window.electronAPI.saveData('notes', savedNotes.value);
    }
  } else {
    alert('⚠️ 当前为网页预览模式，无法修改本地目录，请在桌面端运行。');
  }
};
const loadSafeData = (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`读取 ${key} 失败，已重置为默认值`, error);
    return defaultValue;
  }
};

// ================= 统一的数据监听：触发【双写】 =================
watch([tasks, savedNotes], (newValues) => {
  // 💡 核心修复：将 Vue 的 Proxy 响应式对象“解包”为纯净的 JS 对象
  // 不做这一步，Electron 的 IPC 通道会拒绝传输或传过去变成空对象！
  const plainTasks = JSON.parse(JSON.stringify(newValues[0]));
  const plainNotes = JSON.parse(JSON.stringify(newValues[1]));
  
  // 1. 网页端缓存双写
  localStorage.setItem('quantumTasks_v3', JSON.stringify(plainTasks));
  localStorage.setItem('quantumNotes_v1', JSON.stringify(plainNotes));
  
  // 2. 桌面端物理双写
  if (window.electronAPI) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        // 传递纯净数据
        await window.electronAPI.saveData('tasks', plainTasks);
        await window.electronAPI.saveData('notes', plainNotes);
        console.log('💾 帝国档案已安全存入本地硬盘');
      } catch (error) {
        console.error('⚠️ 本地物理写入失败:', error);
      }
    }, 1000); // 1秒防抖，避免频繁写入烧硬盘
  }
}, { deep: true });

// ================= 初始化与数据加载 =================
onMounted(async () => {
  if (window.electronAPI) {
    try {
      // 1. 获取系统分配或用户选择的真实路径
      const path = await window.electronAPI.getStoragePath();
      currentSavePath.value = path;

      // 2. 加载数据
      const loadedTasks = await window.electronAPI.loadData('tasks');
      const loadedNotes = await window.electronAPI.loadData('notes');
      
      if (loadedTasks) tasks.value = loadedTasks;
      if (loadedNotes) savedNotes.value = loadedNotes;
      
      console.log('🌐 帝国档案馆数据加载完毕');
    } catch (error) {
      console.error('⚠️ 数据加载失败，降级使用缓存', error);
      currentSavePath.value = '存储异常，已降级为缓存模式';
    }
  } else {
    tasks.value = loadSafeData('quantumTasks_v3', []);
    savedNotes.value = loadSafeData('quantumNotes_v1', []);
    currentSavePath.value = '网页预览模式 (无本地硬盘读写权限)';
  }
});

// ================= 核心计算引擎 (恢复此承重墙) =================
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

// ================= 任务操作逻辑 (透传自 Dashboard) =================
const handleAddTask = (newTaskData) => {
  const task = { 
    ...newTaskData, 
    id: 'task_' + Date.now(),
    subTasks: newTaskData.subTasks ||[] 
  };
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
    const newTaskId = `task_imp_${timestamp}_${index}`;
    const newTask = {
      ...task,
      id: newTaskId,
      type: task.type || 'single',
      startDate: selectedDate.value, 
      endDate: task.type === 'multi' ? task.endDate : selectedDate.value,
      completed: false, 
      completedDates: [],
      subTasks: (task.subTasks ||[]).map((sub, subIndex) => ({
        ...sub,
        id: `sub_imp_${timestamp}_${index}_${subIndex}`,
        completed: false,
        completedDates:[]
      }))
    };
    tasks.value.push(newTask);
    count++;
  });

  if (window.electronAPI) {
    const plainTasks = JSON.parse(JSON.stringify(tasks.value));
    await window.electronAPI.saveData('tasks', plainTasks);
  }
  alert(`✅ 雅记导入成功！\n已将 ${count} 项模板添加至 ${selectedDate.value} 的案头。`);
};

// ================= 🌟 诗词与灵感书斋交互 =================

// 🌟 核心：获取 WritingView 的实例，用来调用里面的方法
const writingViewRef = ref(null);

// 1. 仅收藏诗词 (生成摘录类笔记，保持不变)
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
  alert('🔖 诗词已收录至灵感书斋。');
};

// 2. 写随笔 (调用书斋魔法：不再产生无用草稿，直接携诗词跳入书斋)
const handleWriteEssay = (poetry) => {
  if (writingViewRef.value) {
    writingViewRef.value.initFromPoetry(poetry.text, poetry.source || poetry.author);
  }
  switchMode('writing');
};

// 3. 从仪表盘/笔记列表 进入书斋
const handleEnterWriting = (note) => {
  if (writingViewRef.value) {
    if (note && note.id) {
      // 打开已有笔记
      writingViewRef.value.openNote(note);
    } else {
      // 纯粹新建
      writingViewRef.value.initNew('prose');
    }
  }
  switchMode('writing');
};

// 4. 接收书斋传来的【单篇】笔记更新
const handleUpdateNotes = (newNote) => {
  // 查找这篇笔记是否已存在
  const index = savedNotes.value.findIndex(n => n.id === newNote.id);
  
  if (index !== -1) {
    // 【编辑模式】：更新原数据
    savedNotes.value[index] = { ...savedNotes.value[index], ...newNote };
  } else {
    // 【新建模式】：自动提取第一行作为标题，插入头部
    const lines = newNote.content.split('\n').filter(l => l.trim() !== '');
    newNote.title = lines.length > 0 ? lines[0].replace(/^[#>\s]*/, '').substring(0, 15) : '无题雅记';
    newNote.date = selectedDate.value;
    savedNotes.value.unshift(newNote);
  }
};

// 5. 删除笔记 
const handleDeleteNote = (noteId) => {
  savedNotes.value = savedNotes.value.filter(n => n.id !== noteId);
};
</script>

<style>
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