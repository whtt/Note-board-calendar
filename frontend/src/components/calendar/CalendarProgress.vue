<!-- src/components/calendar/CalendarProgress.vue -->
<template>
  <div class="flex flex-col h-full animate-fade-in">
    <!-- 头部控件 -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-stone-700 tracking-widest">周期视图</h2>
      <div class="flex space-x-3 items-center">
        <button @click="shiftDays(-7)" class="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100">&#9664;</button>
        <span class="text-sm font-medium text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
          {{ timelineDays[0].date }} ~ {{ timelineDays[6].date }}
        </span>
        <button @click="shiftDays(7)" class="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100">&#9654;</button>
      </div>
    </div>

    <!-- 时间轴表头 (占满全宽) -->
    <div class="flex border-b border-stone-200 pb-3 mb-4">
      <div class="w-full grid grid-cols-7 text-center">
        <div 
          v-for="day in timelineDays" :key="day.date"
          @click="$emit('select', day.date)"
          class="flex flex-col items-center justify-center cursor-pointer group"
        >
          <span class="text-[10px] text-stone-400 mb-1 group-hover:text-indigo-500">{{ day.dayOfWeek }}</span>
          <span class="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                :class="day.isToday ? 'bg-indigo-500 text-white shadow-md' : (day.date === selectedDate ? 'bg-indigo-100 text-indigo-700' : 'text-stone-600 group-hover:bg-stone-100')">
            {{ day.dayNum }}
          </span>
        </div>
      </div>
    </div>

    <!-- 甘特图任务列表 -->
    <div class="flex-1 overflow-y-auto pr-2 space-y-4">
      <div v-for="task in timelineTasks" :key="task.id" class="flex items-center group relative w-full">
        <!-- 进度条轨道 (占满全宽) -->
        <div class="w-full h-8 relative rounded-lg bg-stone-50 border border-stone-100/80 overflow-hidden flex shadow-inner" :title="task.title">
          <!-- 垂直网格线辅助视觉，精确对应上方的7天 -->
          <div class="flex-1 border-r border-stone-200/50 h-full" v-for="n in 6" :key="n"></div>
          
          <!-- 彩色色带 -->
          <div 
            class="absolute top-1 bottom-1 rounded-md opacity-90 hover:opacity-100 transition-all shadow-sm flex items-center px-3 cursor-pointer overflow-hidden"
            :class="colorClasses[task.color] ? colorClasses[task.color].bg : ''"
            :style="[getTaskStyle(task), colorClasses[task.color] ? {} : { backgroundColor: task.color }]"
          >
            <span v-if="task.type === 'single'" class="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0"></span>
            <span v-else class="text-xs text-white/95 font-medium tracking-wide truncate w-full text-center drop-shadow-sm">
              {{ task.title }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="timelineTasks.length === 0" class="text-center text-stone-400 text-sm mt-12 flex flex-col items-center">
        <span class="text-3xl mb-2">🪹</span>
        此区间暂无挂载任务
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({ selectedDate: String, tasks: Array, todayStr: String });
defineEmits(['select']);

// 视图起始日期，跟随选中日期变化
const viewStartDate = ref(props.selectedDate);
watch(() => props.selectedDate, (newVal) => viewStartDate.value = newVal);

// 颜色字典 (仅提供 bg，与右侧边框联动)
const colorClasses = {
  teal: { bg: 'bg-teal-400' },
  indigo: { bg: 'bg-indigo-400' },
  rose: { bg: 'bg-rose-400' },
  amber: { bg: 'bg-amber-400' },
  sky: { bg: 'bg-sky-400' }
};

// 切换时间轴区间 (前后7天)
const shiftDays = (days) => {
  const d = new Date(viewStartDate.value);
  d.setDate(d.getDate() + days);
  viewStartDate.value = d.toISOString().split('T')[0];
};

// 计算当前甘特图的 7 天网格
const timelineDays = computed(() => {
  const days = [];
  const d = new Date(viewStartDate.value);
  const weekMap = ['日','一','二','三','四','五','六'];
  for(let i=0; i<7; i++) {
    const ds = d.toISOString().split('T')[0];
    days.push({
      date: ds,
      dayNum: d.getDate(),
      dayOfWeek: weekMap[d.getDay()],
      isToday: ds === props.todayStr
    });
    d.setDate(d.getDate() + 1);
  }
  return days;
});

// 筛选在这 7 天区间内活跃的任务
const timelineTasks = computed(() => {
  if (!timelineDays.value.length) return [];
  const startD = timelineDays.value[0].date;
  const endD = timelineDays.value[6].date;
  
  return props.tasks.filter(t => {
    if(t.type === 'single') return t.date >= startD && t.date <= endD;
    if(t.type === 'multi') return t.startDate <= endD && t.endDate >= startD;
    if(t.type === 'daily') return t.startDate <= endD;
    return false;
  });
});

// 纯数学映射：计算彩色进度条的 left 偏移量和 width 长度
const getTaskStyle = (task) => {
  const startD = timelineDays.value[0].date;
  const endD = timelineDays.value[6].date;

  let tStart = task.type === 'single' ? task.date : task.startDate;
  // daily 习惯默认无尽延展到当前屏幕的最右侧
  let tEnd = task.type === 'single' ? task.date : (task.type === 'multi' ? task.endDate : endD); 

  // 截断越界的部分，只渲染视野内的长度
  if (tStart < startD) tStart = startD;
  if (tEnd > endD) tEnd = endD;

  const sd = new Date(startD);
  const ts = new Date(tStart);
  const te = new Date(tEnd);

  const offsetDays = (ts - sd) / (1000*60*60*24);
  const durationDays = (te - ts) / (1000*60*60*24) + 1;

  return {
    left: `calc(${offsetDays} / 7 * 100%)`,
    width: `calc(${durationDays} / 7 * 100%)`
  };
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
/* 隐藏滚动条但保留滚动功能，让界面更极简 */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 4px; }
</style>
