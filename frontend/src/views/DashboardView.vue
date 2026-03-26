<!-- src/views/DashboardView.vue -->
<template>
  <div class="flex flex-1 flex-col md:flex-row overflow-hidden min-h-0">
    <!-- 左侧：总览区 (日历 + 小组件) -->
    <div class="flex-[11] md:flex-[5] flex flex-col p-6 md:p-8 border-b md:border-b-0 md:border-r border-stone-200 overflow-y-auto custom-scrollbar relative">
      
      <!-- 上半部分：日历 -->
      <div class="mb-6 flex-shrink-0">
        <CalendarBoard 
          :selectedDate="selectedDate" 
          :tasks="tasks" 
          :todayStr="todayStr"
          @select="$emit('update:selectedDate', $event)" 
        />
      </div>

      <!-- 下半部分：模块中心、笔记、诗词 -->
      <div class="mt-auto space-y-4 flex-shrink-0">
        <div class="grid grid-cols-2 gap-4">
          <!-- 灵感笔记入口 (原先是弹窗，现在修改为进入书斋) -->
          <div @click="$emit('enter-writing')" class="flex items-center justify-between bg-stone-800 text-stone-100 p-3 rounded-xl border border-stone-700 shadow-md cursor-pointer hover:bg-stone-700 transition-colors group">
            <span class="text-sm font-medium flex items-center gap-2"><span>🖋️</span> 灵感书斋</span>
            <span class="text-xs bg-stone-600 text-stone-200 font-bold px-2 py-0.5 rounded-full">{{ notesCount }}</span>
          </div>
          <!-- 模块中心简版 -->
          <div class="flex items-center justify-center gap-3 bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
            <button class="text-lg hover:scale-110 transition-transform" title="量子词库">📚</button>
            <button class="text-lg hover:scale-110 transition-transform" title="知识图谱">🧠</button>
          </div>
        </div>
        <!-- 诗词卡片 (新增换一首和写随笔的预留) -->
        <PoetryCard @save="$emit('save-poetry', $event)" @write-essay="$emit('write-essay', $event)" />
      </div>
    </div>

    <!-- 右侧：专属雅记工作台 (Memo Board) -->
    <div class="flex-[13] md:flex-[7] bg-stone-50/50 flex flex-col h-full relative min-h-0">
      <MemoBoard 
        :selectedDate="selectedDate"
        :currentTasks="currentTasks"
        @add="$emit('add-task', $event)"
        @delete="$emit('delete-task', $event)"
        @toggle-complete="$emit('toggle-complete', $event)"
        @toggle-sub="$emit('toggle-sub', $event)"
        @change-color="$emit('change-color', $event)"
        @update="$emit('update-task', $event)"
        @import-tasks="$emit('import-tasks', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import CalendarBoard from '../components/CalendarBoard.vue';
import PoetryCard from '../components/PoetryCard.vue';
import MemoBoard from '../components/Memo/MemoBoard.vue';

defineProps({
  selectedDate: String,
  tasks: Array,
  currentTasks: Array,
  todayStr: String,
  notesCount: Number
});

defineEmits([
  'update:selectedDate', 
  'enter-writing', 
  'save-poetry', 
  'write-essay',
  'add-task', 'delete-task', 'toggle-complete', 'toggle-sub', 'change-color', 'update-task', 'import-tasks'
]);
</script>
