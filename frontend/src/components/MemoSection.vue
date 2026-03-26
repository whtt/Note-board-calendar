<!-- src/components/MemoSection.vue -->
<template>
  <div class="flex flex-col flex-1 h-full animate-fade-in">
    <div class="flex justify-between items-end mb-4 border-b border-stone-200 pb-2">
      <h3 class="text-xl font-bold text-stone-700 tracking-wider">案头雅记</h3>
      <span class="text-sm text-stone-400 font-medium">{{ selectedDate }}</span>
    </div>

    <!-- 任务列表渲染区 -->
    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <div 
        v-for="task in currentTasks" :key="task.id"
        class="bg-white rounded-xl p-4 shadow-sm border border-stone-100 transition-all hover:shadow-md border-l-4 group flex items-start justify-between gap-3"
        :class="[task.completed ? 'opacity-60 grayscale' : '', colorClasses[task.color || 'teal'].border]"
      >
        <div class="flex items-start gap-3 flex-1">
          <button 
            @click="$emit('toggle-complete', task.id)"
            class="mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0"
            :class="task.completed ? colorClasses[task.color || 'teal'].bg + ' border-transparent text-white' : 'border-stone-300 hover:border-stone-400'"
          >
            <span v-if="task.completed" class="text-xs">✓</span>
          </button>
          
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-stone-700" :class="{ 'line-through': task.completed }">{{ task.title }}</span>
              <span v-if="task.type === 'daily'" class="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500">每日 {{ task.timeRange }}</span>
              <span v-if="task.type === 'multi'" class="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500">{{ task.startDate }} 至 {{ task.endDate }}</span>
            </div>
            <div v-if="task.subTasks && task.subTasks.length > 0" class="mt-2 space-y-1 pl-2 border-l-2 border-stone-100">
              <div v-for="sub in task.subTasks" :key="sub.id" class="flex items-center gap-2">
                <button 
                  @click="$emit('toggle-sub', task.id, sub.id)"
                  class="w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors"
                  :class="sub.completed ? 'bg-stone-400 border-stone-400 text-white' : 'border-stone-300'"
                ><span v-if="sub.completed" class="text-[8px]">✓</span></button>
                <span class="text-xs text-stone-500" :class="{ 'line-through': sub.completed }">{{ sub.title }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- NEW: 悬浮工具栏 (调色盘 + 删除) -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0">
          <div class="flex gap-1 mr-2 bg-stone-50 p-1 rounded-full border border-stone-200 shadow-inner">
            <button 
              v-for="(cls, colorKey) in colorClasses" :key="colorKey"
              @click="$emit('change-color', task.id, colorKey)"
              class="w-3 h-3 rounded-full hover:scale-125 transition-transform"
              :class="cls.bg"
              :title="'换色: ' + colorKey"
            ></button>
          </div>
          <button @click="$emit('delete', task.id)" class="text-stone-300 hover:text-rose-500 transition-colors p-1" title="删除">✕</button>
        </div>
      </div>
      <div v-if="currentTasks.length === 0" class="text-center text-stone-400 text-sm mt-8">今日案头清空，宜读书喝茶。</div>
    </div>

    <!-- 新增任务面板 (原封不动) -->
    <div class="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
      <div class="flex items-center gap-4 mb-3 text-sm text-stone-500">
        <label class="flex items-center gap-1 cursor-pointer"><input type="radio" v-model="newTask.type" value="single" class="accent-teal-500"> 单日</label>
        <label class="flex items-center gap-1 cursor-pointer"><input type="radio" v-model="newTask.type" value="multi" class="accent-indigo-500"> 多日</label>
        <label class="flex items-center gap-1 cursor-pointer"><input type="radio" v-model="newTask.type" value="daily" class="accent-amber-500"> 每日</label>
      </div>
      <input v-model="newTask.title" @keyup.enter="submitTask" type="text" placeholder="+ 输入新任务 (回车确认)" class="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white mb-3">
      <div v-if="newTask.type === 'multi'" class="flex gap-2 mb-3">
        <input v-model="newTask.startDate" type="date" class="flex-1 text-xs border border-stone-200 rounded px-2 py-1 bg-stone-50 text-stone-500">
        <span class="text-stone-400">-</span>
        <input v-model="newTask.endDate" type="date" class="flex-1 text-xs border border-stone-200 rounded px-2 py-1 bg-stone-50 text-stone-500">
      </div>
      <div v-if="newTask.type === 'daily'" class="mb-3">
        <div class="flex gap-2">
          <input type="time" v-model="newTask.startTime" class="border rounded px-2" />
          <span>至</span>
          <input type="time" v-model="newTask.endTime" class="border rounded px-2" />
        </div>
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="flex gap-2">
          <button 
            v-for="(cls, colorKey) in colorClasses" :key="colorKey"
            @click="newTask.color = colorKey"
            class="w-5 h-5 rounded-full border-2 transition-transform shadow-sm"
            :class="[cls.bg, newTask.color === colorKey ? 'border-stone-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100']"
          ></button>
        </div>
        <button @click="submitTask" class="bg-stone-800 hover:bg-stone-900 text-white text-xs px-4 py-2 rounded-lg shadow-md">添加任务</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
const props = defineProps({ selectedDate: String, currentTasks: Array });
// 新增了 change-color
const emit = defineEmits(['add', 'delete', 'toggle-complete', 'toggle-sub', 'change-color']);

const colorClasses = {
  teal: { bg: 'bg-teal-400', border: 'border-l-teal-400' },
  indigo: { bg: 'bg-indigo-400', border: 'border-l-indigo-400' },
  rose: { bg: 'bg-rose-400', border: 'border-l-rose-400' },
  amber: { bg: 'bg-amber-400', border: 'border-l-amber-400' },
  sky: { bg: 'bg-sky-400', border: 'border-l-sky-400' }
};

const newTask = reactive({ title: '', type: 'single', startDate: '', endDate: '', timeRange: '', color: 'teal' });

const submitTask = () => {
  if (!newTask.title.trim()) return;
  const taskData = { title: newTask.title.trim(), type: newTask.type, color: newTask.color, date: props.selectedDate, subTasks: [] };
  if (newTask.type === 'multi') {
    taskData.startDate = newTask.startDate || props.selectedDate;
    taskData.endDate = newTask.endDate || props.selectedDate;
  } else if (newTask.type === 'daily') {
    taskData.startDate = props.selectedDate;
    taskData.timeRange = newTask.timeRange;
  }
  emit('add', taskData);
  newTask.title = '';
};
</script>
