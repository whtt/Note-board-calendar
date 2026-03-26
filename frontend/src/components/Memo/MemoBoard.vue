<template>
  <div class="flex flex-col h-full w-full">
    <!-- 固定头部 -->
    <div class="flex-shrink-0 px-8 py-6 flex justify-between items-end border-b border-stone-200/60 bg-white/50 backdrop-blur-sm z-10">
      <div>
        <h2 class="text-2xl font-bold text-stone-800 tracking-wide flex items-center gap-2">
          <span>案头雅记</span>
          <span class="text-sm font-normal text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">{{ currentTasks.length }} 项</span>
        </h2>
      </div>
      
      <!-- [修改处] 右侧增加导入按钮与日期同行 -->
      <div class="flex items-center gap-3">
        <button 
          @click="handleImport" 
          title="导入任务模板 (JSON)"
          class="text-stone-400 hover:text-amber-600 hover:bg-stone-100 p-1.5 rounded transition-all duration-300 flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
        </button>
        <div class="text-stone-400 font-medium tracking-wider">{{ selectedDate }}</div>
      </div>
    </div>

    <!-- 中间：独立滚动的任务列表 -->
    <div class="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
      <div v-if="currentTasks.length === 0" class="h-full flex flex-col items-center justify-center text-stone-300 space-y-3">
        <div class="text-4xl">🍵</div>
        <p class="text-sm tracking-widest">今日清闲，暂无雅记</p>
      </div>
      
      <div v-else class="space-y-4">
        <!-- 引入子组件渲染单条任务 -->
        <TaskItem 
          v-for="task in currentTasks" 
          :key="task.id" 
          :task="task" 
          :selectedDate="selectedDate"
          @delete="$emit('delete', task.id)"
          @toggle-complete="$emit('toggle-complete', task.id)"
          @toggle-sub="(subId) => $emit('toggle-sub', task.id, subId)"
          @change-color="(color) => $emit('change-color', task.id, color)"
          @update="(updatedTask) => $emit('update', updatedTask)"
        />
      </div>
    </div>

    <!-- 底部：固定的任务创建器 -->
    <div class="flex-shrink-0 bg-white border-t border-stone-200/80 p-6 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
      <TaskCreator 
        :selectedDate="selectedDate"
        @add="$emit('add', $event)" 
      />
    </div>
  </div>
</template>

<script setup>
import TaskItem from './TaskItem.vue';
import TaskCreator from './TaskCreator.vue';

defineProps(['selectedDate', 'currentTasks']);
// [修改处] defineEmits 增加 'import-tasks'
const emit = defineEmits(['add', 'delete', 'toggle-complete', 'toggle-sub', 'change-color', 'update', 'import-tasks']);

// [修改处] 呼出系统窗口读取文件并抛给父组件
const handleImport = async () => {
  if (!window.electronAPI) {
    alert('⚠️ 网页预览模式无法读取本地文件，请在桌面端运行。');
    return;
  }
  
  const result = await window.electronAPI.importJson();
  if (result.canceled) return;

  if (result.success && result.data) {
    emit('import-tasks', result.data);
  } else {
    alert(`❌ 导入失败:\n${result.error || '文件格式不正确'}`);
  }
};
</script>