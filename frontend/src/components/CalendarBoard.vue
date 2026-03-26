<!-- src/components/CalendarBoard.vue -->
<template>
  <div class="h-full flex flex-col relative">
    
    <!-- 顶部风格切换器 (传感器拨码开关) -->
    <div class="absolute -top-3 -right-3 flex space-x-1 bg-white p-1 rounded-lg border border-stone-200 shadow-sm z-20">
      <button 
        v-for="mode in modes" :key="mode.id"
        @click="currentMode = mode.id"
        class="px-3 py-1 text-xs font-medium rounded-md transition-all"
        :class="currentMode === mode.id ? 'bg-stone-800 text-white shadow' : 'text-stone-500 hover:bg-stone-100'"
      >
        {{ mode.name }}
      </button>
    </div>

    <!-- 动态渲染插槽 (执行器) -->
    <div class="flex-1 mt-4">
      <component 
        :is="activeComponent" 
        :selectedDate="selectedDate" 
        :tasks="tasks" 
        :todayStr="todayStr"
        @select="$emit('select', $event)" 
      />
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
// 导入我们刚才写的三个刀头模块
import CalendarDot from './calendar/CalendarDot.vue';
import CalendarProgress from './calendar/CalendarProgress.vue';
import CalendarWeek from './calendar/CalendarWeek.vue';

const props = defineProps({ selectedDate: String, tasks: Array, todayStr: String });
defineEmits(['select']);

const modes = [
  { id: 'dot', name: '点阵' },
  { id: 'progress', name: '进度' },
  { id: 'week', name: '课表' }
];

const currentMode = ref('dot');

const activeComponent = computed(() => {
  if (currentMode.value === 'dot') return CalendarDot;
  if (currentMode.value === 'progress') return CalendarProgress;
  if (currentMode.value === 'week') return CalendarWeek;
});
</script>
