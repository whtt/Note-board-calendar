<!-- src/components/calendar/CalendarDot.vue -->
<template>
  <div class="flex flex-col h-full animate-fade-in">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-teal-700 tracking-widest">{{ currentYear }} 年 {{ currentMonth + 1 }} 月</h2>
      <div class="flex space-x-2">
        <button @click="changeMonth(-1)" class="p-2 rounded-lg text-stone-400 hover:text-teal-600 hover:bg-stone-100">&#9664;</button>
        <button @click="changeMonth(1)" class="p-2 rounded-lg text-stone-400 hover:text-teal-600 hover:bg-stone-100">&#9654;</button>
      </div>
    </div>
    
    <div class="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium text-stone-400">
      <div v-for="day in weekDays" :key="day">{{ day }}</div>
    </div>
    
    <div class="grid grid-cols-7 gap-2 flex-1">
      <div 
        v-for="(day, index) in calendarDays" :key="index"
        @click="day.date ? $emit('select', day.date) : null"
        class="aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative"
        :class="[
          day.date ? 'cursor-pointer hover:bg-stone-50 border border-transparent hover:border-stone-200' : '',
          day.isToday ? 'bg-teal-50 text-teal-700 font-bold border-teal-200 shadow-inner' : '',
          day.date === selectedDate && !day.isToday ? 'bg-stone-100 ring-1 ring-teal-400/50 text-teal-800 font-medium' : (day.isToday ? '' : 'text-stone-600'),
          !day.date ? 'opacity-0' : ''
        ]"
      >
        <span class="text-lg z-10">{{ day.day }}</span>
        
        <!-- 点阵进度：根据当天的任务总数和完成数渲染小圆点 -->
        <div v-if="day.date && getStats(day.date).total > 0" class="absolute bottom-2 left-0 right-0 flex justify-center flex-wrap gap-1 px-2">
          <div 
            v-for="i in Math.min(getStats(day.date).total, 6)" :key="i"
            class="w-1.5 h-1.5 rounded-full transition-colors"
            :class="i <= getStats(day.date).done ? 'bg-teal-500' : 'bg-stone-200 border border-stone-300'"
          ></div>
          <div v-if="getStats(day.date).total > 6" class="text-[8px] text-teal-600 leading-none flex items-center">+</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ selectedDate: String, tasks: Array, todayStr: String });
defineEmits(['select']);

const currentYear = ref(parseInt(props.selectedDate.split('-')[0]));
const currentMonth = ref(parseInt(props.selectedDate.split('-')[1]) - 1);
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const formatDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const calendarDays = computed(() => {
  const year = currentYear.value, month = currentMonth.value;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const arr = Array(firstDay).fill({ day: null, date: null });
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = formatDate(year, month, i);
    arr.push({ day: i, date: dStr, isToday: dStr === props.todayStr });
  }
  return arr;
});

const changeMonth = (d) => {
  let nm = currentMonth.value + d, ny = currentYear.value;
  if (nm > 11) { nm = 0; ny++; } else if (nm < 0) { nm = 11; ny--; }
  currentMonth.value = nm; currentYear.value = ny;
};

// 获取某天的任务统计
const getStats = (dateStr) => {
  const dayTasks = props.tasks.filter(t => {
    if (t.type === 'single') return t.date === dateStr || (!t.completed && t.date < dateStr && dateStr <= props.todayStr);
    if (t.type === 'multi') return dateStr >= t.startDate && dateStr <= t.endDate;
    if (t.type === 'daily') return dateStr >= t.startDate;
    return false;
  });
  const total = dayTasks.length;
  // 新逻辑：判断单日布尔值，或者周期任务的数组里是否包含这天
  const done = dayTasks.filter(t => {
    if (t.type === 'single') return t.completed;
    return t.completedDates && t.completedDates.includes(dateStr);
  }).length;
  
  return { total, done };
};

</script>
<style scoped> .animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } } </style>

