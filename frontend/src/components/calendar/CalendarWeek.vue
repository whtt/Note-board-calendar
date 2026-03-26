<!-- src/components/calendar/CalendarWeek.vue -->
<template>
  <!-- 💡 改进 2: 锁死日历总高度为 420px，将上下半区彻底隔离开 -->
  <div class="flex flex-col h-[420px] 2xl:h-[480px] overflow-hidden animate-fade-in relative min-h-0">
    
    <!-- 头部区 (固定不滚动) -->
    <div class="flex justify-between items-center mb-4 flex-shrink-0">
      <h2 class="text-2xl font-bold text-amber-700 tracking-widest">接下来七天</h2>
      <span class="text-stone-400 text-sm font-medium bg-stone-100 px-2 py-1 rounded">Timetable Mode</span>
    </div>
    
    <!-- 课表主区域：现在它有了固定高度限制，内部滚动将完美触发 -->
    <div 
      class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-stone-50/30 rounded-xl border border-stone-200 shadow-inner min-h-0" 
      ref="scrollContainer"
    >
      <div class="grid grid-cols-7 gap-px bg-stone-200 h-max">
        
        <!-- 单个日期的列 -->
        <div 
          v-for="day in next7Days" :key="day.date" 
          class="flex flex-col bg-white relative transition-colors"
          :class="day.date === selectedDate ? 'bg-amber-50/30' : ''"
        >
          <!-- 💡 改进 3: 联合吸顶容器 (将日期与无时间任务打包，避免层叠冲突) -->
          <div class="sticky top-0 z-30 flex flex-col bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200">
            <!-- 粘性表头日期 -->
            <div 
              @click="$emit('select', day.date)"
              class="flex flex-col items-center py-2 cursor-pointer transition-all"
              :class="[
                day.isToday ? 'text-amber-800' : 'text-stone-500',
                day.date === selectedDate ? 'bg-amber-100/50 ring-inset ring-2 ring-amber-400/50' : ''
              ]"
            >
              <div class="text-xs font-bold">{{ day.dayOfWeek }}</div>
              <div class="text-lg font-black">{{ day.dayNum }}</div>
            </div>
            
            <!-- 无时间任务区 (也跟随在表头下方一起吸顶) -->
            <div 
              v-if="dayTasksMap[day.date].untimed.length > 0" 
              class="max-h-[80px] overflow-y-auto custom-scrollbar p-1 space-y-1 bg-stone-50/80 border-t border-stone-100/50"
            >
              <div 
                v-for="task in dayTasksMap[day.date].untimed" :key="task.id"
                class="text-[9px] px-1.5 py-1 rounded shadow-sm border-l-2 truncate transition-all opacity-90 font-medium"
                :class="isTaskDone(task, day.date) ? 'opacity-40 bg-stone-100 border-stone-300 line-through text-stone-400' : 'bg-white text-stone-700'"
                :style="!isTaskDone(task, day.date) ? { borderColor: task.color || '#14b8a6' } : {}"
                :title="task.title"
              >
                {{ task.title }}
              </div>
            </div>
          </div>

          <!-- 💡 改进 1: 绝对比例定位容器 (总高度 1152px，一小时48px) -->
          <div class="relative h-[1152px] w-full z-0">
            
            <!-- 背景 24 小时刻度线 -->
            <div class="absolute inset-0 pointer-events-none">
              <div 
                v-for="h in 24" :key="h" 
                class="h-[48px] border-t border-stone-100 w-full relative"
              >
                <span class="absolute -top-2.5 left-1 text-[9px] text-stone-300/80 font-bold bg-white px-0.5 rounded">
                  {{ h - 1 }}:00
                </span>
              </div>
            </div>

            <!-- 任务卡片精确挂载 -->
            <div 
              v-for="task in dayTasksMap[day.date].timed" :key="task.id"
              class="absolute left-1 right-1 rounded shadow-sm border-l-2 overflow-hidden pointer-events-auto transition-all hover:z-10 hover:shadow-md flex flex-col group cursor-pointer"
              :class="isTaskDone(task, day.date) ? 'opacity-40 bg-stone-100 border-stone-300' : 'bg-white z-10'"
              :style="[
                getTaskTimeStyle(task),
                !isTaskDone(task, day.date) ? { borderColor: task.color || '#14b8a6' } : {}
              ]"
              :title="`${task.startTime} - ${task.endTime}\n${task.title}`"
            >
              <!-- 顶部彩色点缀 -->
              <div class="h-1 w-full opacity-20" :style="{ backgroundColor: task.color || '#14b8a6' }"></div>
              <div class="px-1 py-0.5 flex-1 min-h-0">
                <div class="text-[8px] font-bold tracking-tighter opacity-80 leading-none mb-0.5" :style="{ color: task.color || '#14b8a6' }">
                  {{ task.startTime }}
                </div>
                <div class="text-[10px] leading-tight text-stone-700 line-clamp-2 font-medium" :class="{'line-through text-stone-400': isTaskDone(task, day.date)}">
                  {{ task.title }}
                </div>
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

const props = defineProps({ selectedDate: String, tasks: Array, todayStr: String });
defineEmits(['select']);

// 1. 生成 7 天日期数据
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const formatDate = (dateObj) => `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

const next7Days = computed(() => {
  const days = [];
  const todayObj = new Date(props.todayStr.replace(/-/g, '/')); 
  for (let i = 0; i < 7; i++) {
    const d = new Date(todayObj.getTime() + i * 24 * 60 * 60 * 1000);
    days.push({
      date: formatDate(d),
      dayOfWeek: weekDays[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0
    });
  }
  return days;
});

const isTaskDone = (task, dateStr) => {
  if (task.type === 'single') return task.completed;
  return task.completedDates && task.completedDates.includes(dateStr);
};

// 2. 任务解析引擎 (支持分离有时间/无时间任务)
const dayTasksMap = computed(() => {
  const map = {};
  
  next7Days.value.forEach(day => {
    map[day.date] = { untimed: [], timed: [] };
  });

  if (!props.tasks) return map;

  props.tasks.forEach(t => {
    const tDate = t.date || t.startDate || '';
    const eDate = t.endDate || t.date || '';
    const type = (t.type || 'single').toLowerCase();

    next7Days.value.forEach(day => {
      let isMatch = false;
      
      if (type === 'single') {
        isMatch = (tDate === day.date) || (!t.completed && tDate < day.date && day.date <= props.todayStr);
      } else if (type === 'multi') {
        isMatch = (day.date >= tDate && day.date <= eDate);
      } else if (type === 'daily') {
        isMatch = (day.date >= tDate);
      }

      if (isMatch) {
        let start = t.startTime;
        let end = t.endTime;

        // 兼容旧版格式，例如 "07:43 - 08:43"
        const rawTime = t.timeRange || t.time || ''; 
        if (!start && !end && typeof rawTime === 'string' && rawTime.includes('-')) {
          const parts = rawTime.split('-');
          if (parts.length === 2) {
            start = parts[0].trim();
            end = parts[1].trim();
          }
        }

        // 识别出有效时间，推入 timed 数组，交给绝对比例定位去排版
        if (typeof start === 'string' && start.includes(':')) {
          // 容错：如果没有结束时间，默认加 1 个小时的高度
          if (!end || !end.includes(':')) {
             const [h, m] = start.split(':').map(Number);
             end = `${String((h + 1) % 24).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
          }
          map[day.date].timed.push({ ...t, startTime: start, endTime: end });
        } else {
          // 没时间的，推入顶部的 untimed 堆叠区
          map[day.date].untimed.push(t);
        }
      }
    });
  });
  
  return map;
});

// 3. 核心：基于 24小时=1440分钟 的比例定位算子 (百分比机制，完美适配 1152px)
const getTaskTimeStyle = (task) => {
  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };

  const startMins = parseTime(task.startTime);
  let endMins = parseTime(task.endTime);
  
  // 跨夜/数据错乱防守机制
  if (endMins <= startMins) endMins = startMins + 30;

  const topPercent = (startMins / 1440) * 100;
  let heightPercent = ((endMins - startMins) / 1440) * 100;
  
  // 给卡片一个最小高度 (约3.5% = 50分钟，大概40px)，防止短时间任务文字挤压看不清
  if (heightPercent < 3.5) heightPercent = 3.5; 

  return {
    top: `${topPercent}%`,
    height: `${heightPercent}%`
  };
};

// 4. 智能滚动控制引擎
const scrollContainer = ref(null);

onMounted(() => {
  // 必须使用 nextTick，等待 Vue 渲染完带有 1152px 的 DOM 树
  nextTick(() => {
    if (!scrollContainer.value) return;

    let earliestMinute = 24 * 60; // 默认最晚时间

    // 扫描这 7 天内所有的任务，寻找最早起床/执行的时间
    for (const day of next7Days.value) {
      const tasks = dayTasksMap.value[day.date].timed;
      for (const t of tasks) {
        const [h, m] = t.startTime.split(':').map(Number);
        const mins = h * 60 + (m || 0);
        if (mins < earliestMinute) earliestMinute = mins;
      }
    }

    let scrollTargetMinutes = 7 * 60; // 【默认设定】如果没有任务，默认滑到早晨 7:00

    if (earliestMinute !== 24 * 60) {
      // 找到了任务！为了好看，我们让滑块停在任务开始前 30 分钟的地方（留白设计）
      scrollTargetMinutes = Math.max(0, earliestMinute - 30);
    }

    // 转换成像素：(目标分钟 / 总分钟) * 1152 像素总高度
    const scrollPixels = (scrollTargetMinutes / 1440) * 1152;

    // 执行平滑滚动
    scrollContainer.value.scrollTo({
      top: scrollPixels,
      behavior: 'smooth'
    });
  });
});
</script>

<style scoped>
/* 极简风滚动条定制 */
.custom-scrollbar::-webkit-scrollbar { 
  width: 4px; 
  height: 4px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: #d6d3d1; 
  border-radius: 4px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: #a8a29e; 
}

/* 入场微动画 */
.animate-fade-in { 
  animation: fadeIn 0.3s ease-out; 
}
@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(5px); } 
  to { opacity: 1; transform: translateY(0); } 
}

/* 防止粘性定位(Sticky)在某些情况下的层叠冲突 */
.sticky {
  will-change: transform;
}
</style>