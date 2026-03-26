<!-- src/views/DashboardView.vue -->
<template>
  <div class="flex flex-1 flex-col md:flex-row overflow-hidden min-h-0 h-full">
    <!-- 左侧：总览区 (日历 + 小组件) -->
    <div class="flex-[11] md:flex-[5] flex flex-col p-6 md:p-8 border-b md:border-b-0 md:border-r border-stone-200 overflow-y-auto custom-scrollbar relative">
      
      <div class="mb-6 flex-shrink-0">
        <CalendarBoard 
          :selectedDate="selectedDate" 
          :tasks="tasks" 
          :todayStr="todayStr"
          @select="$emit('update:selectedDate', $event)" 
        />
      </div>

      <div class="mt-auto space-y-4 flex-shrink-0">
        <!-- 🌟 [重构] 完美契合你思路的并排双入口 -->
        <div class="grid grid-cols-2 gap-4">
          <!-- 左侧小框：原汁原味的淡雅绿，点击打开卡片弹窗 -->
          <div @click="showModal = true" class="flex items-center justify-between bg-[#F2F6F3] text-[#4C6B5A] p-3 rounded-xl border border-[#DCE3D6] shadow-sm cursor-pointer hover:bg-[#E9EFEA] transition-colors group">
            <span class="text-sm font-medium flex items-center gap-2"><span>🖋️</span> 灵感书斋</span>
            <span class="text-xs bg-white text-[#5A6B61] font-bold px-3 py-0.5 rounded-full border border-[#DCE3D6] shadow-sm">{{ notes.length }}</span>
          </div>

          <!-- 右侧小框：知识图谱 🧠 + 词库 📚 + ✍️ 开启书斋快捷入口 -->
          <div class="flex items-center justify-center gap-3 bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
            <button class="text-lg hover:scale-110 transition-transform" title="量子词库">📚</button>
            <button class="text-lg hover:scale-110 transition-transform" title="知识图谱">🧠</button>
            
            <!-- 竖线分隔符，让 UI 更有层次 -->
            <div class="w-px h-4 bg-stone-200 mx-1"></div>
            
            <!-- 🌟 直接进入书斋的子入口，乖乖待在知识图谱旁边 -->
            <button 
              @click="$emit('enter-writing')" 
              class="flex items-center gap-1 text-xs font-bold text-[#4C6B5A] bg-[#F2F6F3] hover:bg-[#E9EFEA] px-2 py-1 rounded border border-[#DCE3D6] hover:scale-105 transition-all shadow-sm" 
              title="直接进入灵感书斋沉浸写作"
            >
              ✍️ 书斋
            </button>
          </div>

        </div>
        <!-- 诗词卡片 -->
        <PoetryCard @save="$emit('save-poetry', $event)" @write-essay="$emit('write-essay', $event)" />
      </div>
    </div>

    <!-- 右侧：专属雅记工作台 -->
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

    <!-- 挂载卡片弹窗 -->
    <NotesModal 
      :show="showModal" 
      :notes="notes" 
      @close="showModal = false"
      @delete="$emit('delete-note', $event)"
      @enter-writing="goToWriting"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CalendarBoard from '../components/CalendarBoard.vue';
import PoetryCard from '../components/PoetryCard.vue';
import MemoBoard from '../components/Memo/MemoBoard.vue';
import NotesModal from '../components/NotesModal.vue';

defineProps({
  selectedDate: String,
  tasks: Array,
  currentTasks: Array,
  todayStr: String,
  notes: Array // 接收笔记数组传给弹窗
});

const emit = defineEmits([
  'update:selectedDate', 
  'enter-writing', 
  'save-poetry', 
  'write-essay',
  'add-task', 'delete-task', 'toggle-complete', 'toggle-sub', 'change-color', 'update-task', 'import-tasks',
  'delete-note'
]);

const showModal = ref(false);

// 接受组件传来的旧笔记参数
const goToWriting = (note) => {
  showModal.value = false;
  // 🌟 将 note 对象传给外层，告诉 App.vue 你要打开哪篇笔记
  emit('enter-writing', note); 
};
</script>
