<template>
  <div 
    class="group relative bg-white rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-all duration-300 overflow-hidden"
    :class="{ 'opacity-60': task.completed && !isEditing }"
  >
    <!-- 左侧颜色指示条 -->
    <div class="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300" :style="{ backgroundColor: task.color }"></div>
    
    <div class="pl-5 pr-4 py-4 flex items-start gap-4">
      <!-- 勾选框 -->
      <button 
        @click="$emit('toggle-complete')"
        class="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
        :style="{ 
          borderColor: task.color, 
          backgroundColor: task.completed ? task.color : 'transparent' 
        }"
      >
        <span v-if="task.completed" class="text-white text-xs font-bold">✓</span>
      </button>

      <!-- 任务内容区 -->
      <div class="flex-1 min-w-0">
        
        <!-- ====== 👁️ 默认显示模式 ====== -->
        <div v-if="!isEditing">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-stone-700 font-medium break-words leading-relaxed" :class="{'line-through text-stone-400': task.completed}">
                {{ task.title }}
              </p>
              
              <!-- 📅 时段 / 日期 动态展示区 -->
              <div class="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                <!-- 单日/每日 显示具体时间段 -->
                <span v-if="(task.type === 'single' || task.type === 'daily') && (task.startTime || task.endTime)" 
                      class="flex items-center gap-1 px-2 py-0.5 rounded border"
                      :style="{ backgroundColor: task.color + '1A', color: task.color, borderColor: task.color + '33' }">
                  🕒 {{ task.startTime || '未定' }} - {{ task.endTime || '未定' }}
                </span>
                <!-- 多日 显示日期跨度 -->
                <span v-if="task.type === 'multi' && (task.startDate || task.endDate)" 
                      class="flex items-center gap-1 px-2 py-0.5 rounded border"
                      :style="{ backgroundColor: task.color + '1A', color: task.color, borderColor: task.color + '33' }">
                  📅 {{ task.startDate }} 至 {{ task.endDate }}
                </span>
              </div>
            </div>
            
            <!-- 右侧类型标签 -->
            <div v-if="task.type !== 'single'" 
                 class="ml-3 text-[10px] px-2 py-1 rounded-md whitespace-nowrap border"
                 :style="{ backgroundColor: task.color + '1A', color: task.color, borderColor: task.color + '33' }">
              {{ task.type === 'multi' ? '多日' : '每日' }}
            </div>
          </div>

          <!-- 子任务展示 -->
          <div v-if="task.subTasks && task.subTasks.length > 0" class="mt-3 space-y-2 border-t border-stone-50 pt-3">
            <div v-for="sub in task.subTasks" :key="sub.id" class="flex items-center gap-2 hover:bg-stone-50 p-1.5 rounded-lg transition-colors group/sub">
              <button 
                @click="$emit('toggle-sub', sub.id)"
                class="w-3.5 h-3.5 rounded-sm border border-stone-300 flex items-center justify-center transition-colors"
                :class="{'bg-stone-400 border-stone-400': sub.completed || (sub.completedDates && sub.completedDates.includes(selectedDate))}"
              >
                <span v-if="sub.completed || (sub.completedDates && sub.completedDates.includes(selectedDate))" class="text-white text-[8px]">✓</span>
              </button>
              <span class="text-xs text-stone-500" :class="{'line-through text-stone-300': sub.completed || (sub.completedDates && sub.completedDates.includes(selectedDate))}">
                {{ sub.title }}
              </span>
            </div>
          </div>
        </div>

        <!-- ====== ✏️ 编辑模式 ====== -->
        <div v-else class="space-y-3 pr-2">
          <input v-model="editData.title" class="w-full text-sm font-medium border-b border-teal-300 outline-none pb-1 bg-transparent text-stone-700" placeholder="任务内容..." />

           <div class="flex flex-wrap gap-2 items-center text-xs text-stone-600">
            <div class="flex gap-1 bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
              <label class="flex items-center px-2 py-0.5 rounded cursor-pointer transition-colors" :class="editData.type === 'single' ? 'bg-teal-50 text-teal-600 font-bold' : 'hover:bg-stone-50'">
                <input type="radio" v-model="editData.type" value="single" class="hidden"> 单日
              </label>
              <label class="flex items-center px-2 py-0.5 rounded cursor-pointer transition-colors" :class="editData.type === 'multi' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-stone-50'">
                <input type="radio" v-model="editData.type" value="multi" class="hidden"> 多日
              </label>
              <label class="flex items-center px-2 py-0.5 rounded cursor-pointer transition-colors" :class="editData.type === 'daily' ? 'bg-amber-50 text-amber-600 font-bold' : 'hover:bg-stone-50'">
                <input type="radio" v-model="editData.type" value="daily" class="hidden"> 每日
              </label>
            </div>
          </div>

          <!-- 💡 新增：时间段/日期段编辑区域 -->
          <div class="flex flex-wrap gap-3 text-xs text-stone-600">
            <!-- 单日/每日：时间段编辑 -->
            <div v-if="editData.type === 'single' || editData.type === 'daily'" class="flex items-center gap-2">
              <span class="font-bold text-stone-500">时间段:</span>
              <input type="time" v-model="editData.startTime" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-teal-500 outline-none" />
              <span class="text-stone-400 text-xs">至</span>
              <input type="time" v-model="editData.endTime" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-teal-500 outline-none" />
              <button @click="clearTimes" class="text-xs text-stone-400 hover:text-red-500">清除</button>
            </div>

            <!-- 多日：日期段编辑 -->
            <div v-if="editData.type === 'multi'" class="flex items-center gap-2">
              <span class="font-bold text-stone-500">起止日期:</span>
              <input type="date" v-model="editData.startDate" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
              <span class="text-stone-400 text-xs">至</span>
              <input type="date" v-model="editData.endDate" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>

            <!-- 多日：时间段编辑（可选） -->
            <div v-if="editData.type === 'multi'" class="flex items-center gap-2">
              <span class="font-bold text-stone-500">时间段:</span>
              <input type="time" v-model="editData.startTime" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="开始" />
              <span class="text-stone-400 text-xs">至</span>
              <input type="time" v-model="editData.endTime" class="bg-white border border-stone-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="结束" />
              <button @click="clearTimes" class="text-xs text-stone-400 hover:text-red-500">清除</button>
            </div>
          </div>

          <!-- 💡 新增：颜色选择器 -->
          <div class="flex items-center gap-2 pt-1">
            <button 
              v-for="color in colors" :key="color"
              @click="editData.color = color"
              class="w-5 h-5 rounded-full border-2 transition-all transform hover:scale-110"
              :class="editData.color === color ? 'border-stone-500 shadow-md scale-110' : 'border-transparent'"
              :style="{ backgroundColor: color }"
            ></button>
            <!-- 自定义颜色拾取器 -->
            <div 
              class="relative w-5 h-5 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden hover:scale-110 transition-transform cursor-pointer"
              :class="!colors.includes(editData.color) ? 'border-stone-500 shadow-md scale-110' : 'border-stone-300'"
              title="自定义颜色"
            >
              <input type="color" v-model="editData.color" class="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer opacity-0 z-10" />
              <div class="absolute inset-0" :style="{ backgroundColor: editData.color }"></div>
              <span class="absolute z-0 text-[10px] font-bold mix-blend-difference text-white">+</span>
            </div>
          </div>

          <div class="space-y-2 mt-2">
            <div v-for="(sub, idx) in editData.subTasks" :key="idx" class="flex gap-2 items-center">
              <input v-model="sub.title" class="flex-1 text-xs border border-stone-200 rounded px-2 py-1 outline-none focus:border-teal-400" placeholder="子任务内容..."/>
              <button @click="editData.subTasks.splice(idx, 1)" class="text-red-400 hover:text-red-600 px-1">✕</button>
            </div>
            <!-- ⚠️ 修复：将 push 里的 text: '' 彻底改为 title: '' -->
            <button @click="editData.subTasks.push({ id: Date.now(), title: '', completed: false })" class="text-xs text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors">+ 新增子步骤</button>
          </div>
          
          <!-- 保存/取消按钮 -->
          <div class="flex justify-end gap-2 pt-2">
            <button @click="isEditing = false" class="text-xs text-stone-500 hover:text-stone-700 px-2 py-1">取消</button>
            <button @click="saveEdit" class="text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700 shadow-sm transition-colors">保存</button>
          </div>
        </div>

      </div>

      <!-- 右侧操作栏：编辑与删除 -->
      <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5">
        <button v-if="!isEditing" @click="startEdit" class="text-stone-300 hover:text-teal-500 p-1" title="编辑">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </button>
        <button @click="$emit('delete')" class="text-stone-300 hover:text-red-400 p-1" title="删除雅记">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 预设颜色
const colors = ['#14b8a6', '#8b5cf6', '#fb7185', '#fbbf24', '#38bdf8', '#a8a29e'];

const props = defineProps(['task', 'selectedDate']);
const emit = defineEmits(['toggle-complete', 'toggle-sub', 'delete', 'change-color', 'update']);

const isEditing = ref(false);
const editData = ref({ 
  title: '', 
  type: 'single',
  color: colors[0],
  startTime: '',
  endTime: '',
  startDate: props.selectedDate,
  endDate: props.selectedDate,
  subTasks: [] 
});

// 开启编辑模式
const startEdit = () => {
  // 深拷贝当前任务数据
  editData.value = {
    ...props.task,
    type: props.task.type || 'single',
    color: props.task.color || colors[0],
    startTime: props.task.startTime || '',
    endTime: props.task.endTime || '',
    startDate: props.task.startDate || props.selectedDate,
    endDate: props.task.endDate || props.selectedDate,
    subTasks: props.task.subTasks ? JSON.parse(JSON.stringify(props.task.subTasks)) : []
  };
  isEditing.value = true;
};

// 清除时间段
const clearTimes = () => {
  editData.value.startTime = '';
  editData.value.endTime = '';
};

// 保存编辑
const saveEdit = () => {
  if (!editData.value.title.trim()) return; 
  
  // 过滤掉空的子任务
  editData.value.subTasks = editData.value.subTasks.filter(s => s.title.trim());
  
  // 确保数据结构完整
  const updatedTask = {
    ...editData.value, // 使用展开运算符包含所有编辑数据
    // 保留原始任务的特殊字段
    completed: props.task.completed,
    completedDates: props.task.completedDates,
    // 对于单日任务，确保日期正确
    ...(editData.value.type === 'single' ? { 
      date: props.selectedDate 
    } : {})
  };
  
  // 触发更新事件
  console.log('更新任务:', updatedTask);
  emit('update', updatedTask);
  isEditing.value = false;
};
</script>