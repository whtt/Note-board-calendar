<template>
  <div class="bg-stone-50 rounded-xl border border-stone-200 p-4 transition-all duration-300">
    <!-- 主输入框 -->
    <div class="flex items-center gap-3">
      <input 
        v-model="newTask.title" 
        @keyup.enter="submitTask"
        class="flex-1 bg-transparent border-none focus:ring-0 text-stone-700 placeholder-stone-400 font-medium outline-none"
        placeholder="在此输入新雅记... (回车保存)" 
      />

      <!-- 展开高级选项按钮 -->
      <button 
        @click="showAdvanced = !showAdvanced" 
        class="text-xs text-stone-400 hover:text-teal-600 transition-colors bg-white px-2 py-1 rounded shadow-sm border border-stone-200"
      >
        {{ showAdvanced ? '收起选项 ▴' : '详细设定 ▾' }}
      </button>
      <button 
        @click="submitTask"
        class="bg-stone-800 text-white p-2 rounded-lg shadow-md hover:bg-teal-700 hover:shadow-teal-900/20 transition-all focus:scale-95 flex-shrink-0"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </button>
    </div>

    <!-- 高级选项面板 (动画折叠) -->
    <div v-show="showAdvanced" class="mt-4 pt-4 border-t border-stone-200/60 space-y-4">
      
      <!-- 任务类型 & 动态时间/日期段 -->
      <div class="flex flex-wrap gap-4 items-center text-sm text-stone-600">
        <!-- 单选类型 -->
        <div class="flex gap-2 bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
          <label class="flex items-center px-2 py-0.5 rounded cursor-pointer transition-colors" :class="newTask.type === 'single' ? 'bg-teal-50 text-teal-600 font-bold' : 'hover:bg-stone-50'">
            <input type="radio" v-model="newTask.type" value="single" class="hidden"> 单日
          </label>
          <label class="flex items-center px-2 py-0.5 rounded cursor-pointer transition-colors" :class="newTask.type === 'multi' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-stone-50'">
            <input type="radio" v-model="newTask.type" value="multi" class="hidden"> 多日
          </label>
          <label class="flex items-center px-2 py-0.5 rounded cursor-pointer transition-colors" :class="newTask.type === 'daily' ? 'bg-amber-50 text-amber-600 font-bold' : 'hover:bg-stone-50'">
            <input type="radio" v-model="newTask.type" value="daily" class="hidden"> 每日
          </label>
        </div>

        <!-- 单日 / 每日：显示具体时间段 (Time) -->
        <div v-if="newTask.type === 'single' || newTask.type === 'daily'" class="flex items-center gap-2">
          <span class="text-xs font-bold text-stone-400">时间段:</span>
          <input type="time" v-model="newTask.startTime" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-teal-500 outline-none" />
          <span class="text-stone-400 text-xs">至</span>
          <input type="time" v-model="newTask.endTime" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-teal-500 outline-none" />
        </div>

        <!-- 多日：显示起止日期 (Date) -->
        <div v-if="newTask.type === 'multi'" class="flex items-center gap-2">
          <span class="text-xs font-bold text-stone-400">起止日期:</span>
          <input type="date" v-model="newTask.startDate" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
          <span class="text-stone-400 text-xs">至</span>
          <input type="date" v-model="newTask.endDate" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
        </div>

        <!-- 💡 新增：多日时间段（可选） -->
        <div v-if="newTask.type === 'multi'" class="flex items-center gap-2">
          <span class="text-xs font-bold text-stone-400">时间段:</span>
          <input type="time" v-model="newTask.startTime" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="开始" />
          <span class="text-stone-400 text-xs">至</span>
          <input type="time" v-model="newTask.endTime" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="结束" />
          <button @click="clearTimes" class="text-xs text-stone-400 hover:text-red-500">清除</button>
        </div>
      </div>

      <!-- 子任务设定 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-stone-500">子任务划分</span>
          <button @click="addSubTask" class="text-xs text-teal-600 hover:bg-teal-50 px-2 py-0.5 rounded transition-colors border border-transparent hover:border-teal-200">+ 添加步骤</button>
        </div>
        <div class="space-y-2">
          <div v-for="(sub, index) in newTask.subTasks" :key="index" class="flex gap-2 items-center">
            <span class="text-stone-300 text-xs">{{ index + 1 }}.</span>
            <input 
              v-model="sub.title" 
              class="flex-1 text-sm bg-white border border-stone-200 rounded px-3 py-1.5 outline-none focus:border-teal-400 transition-colors" 
              placeholder="输入子步骤内容..." 
            />
            <button @click="removeSubTask(index)" class="text-stone-400 hover:text-red-500 px-1 transition-colors">✕</button>
          </div>
        </div>
      </div>

      <!-- 颜色选择器 -->
      <div class="flex items-center gap-2 pt-2">
        <!-- 预设颜色 -->
        <button 
          v-for="color in colors" :key="color"
          @click="newTask.color = color"
          class="w-6 h-6 rounded-full border-2 transition-all transform hover:scale-110"
          :class="newTask.color === color ? 'border-stone-500 shadow-md scale-110' : 'border-transparent'"
          :style="{ backgroundColor: color }"
        ></button>
        
        <!-- 分割线 -->
        <div class="w-px h-4 bg-stone-300 mx-1"></div>
        
        <!-- 自定义颜色拾取器 (HTML5 原生，伪装成极客按钮) -->
        <div 
          class="relative w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden hover:scale-110 transition-transform cursor-pointer"
          :class="!colors.includes(newTask.color) ? 'border-stone-500 shadow-md scale-110' : 'border-stone-300'"
          title="自定义颜色"
        >
          <!-- 绝对定位放大 input，并设为透明度 0.01 保留点击事件但隐藏默认丑陋外观 -->
          <input type="color" v-model="newTask.color" class="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer opacity-0 z-10" />
          <!-- 背景色展示当前选择的自定义色 -->
          <div class="absolute inset-0" :style="{ backgroundColor: newTask.color }"></div>
          <!-- ➕号指示器 -->
          <span class="absolute z-0 text-[12px] font-bold mix-blend-difference text-white">+</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps(['selectedDate']);
const emit = defineEmits(['add']);

// 预设颜色
const colors = ['#14b8a6', '#8b5cf6', '#fb7185', '#fbbf24', '#38bdf8', '#a8a29e'];
const showAdvanced = ref(false);

// 获取当前时间到下一小时的默认时间段
const getDefaultTimeRange = () => {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  
  const nextHour = (now.getHours() + 1) % 24;
  const nextHourStr = nextHour.toString().padStart(2, '0');
  
  return {
    startTime: `${currentHour}:${currentMinute}`,
    endTime: `${nextHourStr}:${currentMinute}`
  };
};

const getInitialTask = () => {
  const defaultTimes = getDefaultTimeRange();
  return {
    title: '', 
    type: 'single',
    date: props.selectedDate,
    startDate: props.selectedDate,
    endDate: props.selectedDate,
    startTime: defaultTimes.startTime,
    endTime: defaultTimes.endTime,
    color: colors[0],
    subTasks: []
  };
};

const newTask = ref(getInitialTask());

// 清除时间段
const clearTimes = () => {
  newTask.value.startTime = '';
  newTask.value.endTime = '';
};

// 监听日期变化
watch(() => props.selectedDate, (newDate) => {
  newTask.value.date = newDate;
  newTask.value.startDate = newDate;
  newTask.value.endDate = newDate;
});

// 监听类型变化，重新设置默认时间段
watch(() => newTask.value.type, (newType) => {
  // 当切换为单日或每日时，设置默认时间段
  if (newType === 'single' || newType === 'daily') {
    const defaultTimes = getDefaultTimeRange();
    newTask.value.startTime = defaultTimes.startTime;
    newTask.value.endTime = defaultTimes.endTime;
  } 
  // 当切换为多日时，清除时间段（可选）
  else if (newType === 'multi') {
    newTask.value.startTime = '';
    newTask.value.endTime = '';
  }
});

const addSubTask = () => {
  newTask.value.subTasks.push({ id: Date.now() + Math.random(), title: '', completed: false });
};

const removeSubTask = (index) => {
  newTask.value.subTasks.splice(index, 1);
};

const submitTask = () => {
  if (!newTask.value.title.trim()) return;
  const cleanedSubTasks = newTask.value.subTasks.filter(s => s.title.trim());
  const payload = { ...newTask.value, subTasks: cleanedSubTasks.length > 0 ? cleanedSubTasks : null };
  emit('add', payload);
  newTask.value = getInitialTask();
};
</script>