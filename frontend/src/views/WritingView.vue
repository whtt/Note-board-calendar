<!-- src/views/WritingView.vue -->
<template>
  <div class="flex flex-1 flex-col md:flex-row overflow-hidden min-h-0 bg-[#FAFAFA]">
    
    <!-- 左侧：笔记侧边栏 (目录与时间轴) -->
    <div class="w-full md:w-64 border-r border-stone-200 bg-white flex flex-col flex-shrink-0">
      <div class="p-4 border-b border-stone-100 flex items-center justify-between">
        <button @click="$emit('back')" class="text-stone-400 hover:text-stone-700 transition-colors flex items-center text-sm font-medium">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          返回案头
        </button>
        <button @click="createNewNote" class="p-1.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors" title="新建">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
      </div>

      <!-- 笔记列表 -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        <div 
          v-for="note in notes" :key="note.id"
          @click="selectNote(note)"
          :class="['p-3 rounded-xl cursor-pointer transition-all border', 
                   activeNote?.id === note.id ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-stone-50 hover:border-stone-100']"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs">{{ getTypeIcon(note.type) }}</span>
            <span class="text-xs text-stone-400 font-mono">{{ note.date }}</span>
          </div>
          <div class="text-sm text-stone-700 font-medium truncate">{{ note.title || '无标题' }}</div>
          <div class="text-xs text-stone-400 truncate mt-1">{{ getPreview(note) }}</div>
        </div>
      </div>
    </div>

    <!-- 右侧：沉浸式编辑器 (Zen Mode) -->
    <div class="flex-1 flex flex-col relative h-full">
      <div v-if="activeNote" class="max-w-3xl w-full mx-auto p-8 md:p-12 flex flex-col h-full">
        
        <!-- 类型与元数据选择器 -->
        <div class="flex items-center gap-3 mb-6">
          <select v-model="activeNote.type" @change="autoSave" class="bg-transparent text-stone-500 text-sm font-medium focus:outline-none border-b border-dashed border-stone-300 pb-1 cursor-pointer">
            <option value="quote">🔖 摘录</option>
            <option value="diary">📔 日记</option>
            <option value="prose">🍃 散文</option>
            <option value="poetry">🖋️ 诗赋</option>
            <option value="tech">💻 量子随笔</option>
          </select>
          <span class="text-stone-300 text-sm">|</span>
          <span class="text-stone-400 text-sm font-mono">{{ activeNote.date }}</span>
        </div>

        <!-- 标题输入 -->
        <input 
          v-model="activeNote.title" 
          @input="autoSave"
          type="text" 
          placeholder="在此输入标题..." 
          class="w-full text-3xl md:text-4xl font-bold text-stone-800 bg-transparent focus:outline-none mb-6 placeholder:text-stone-200"
        />

        <!-- 正文输入区 -->
        <textarea 
          v-model="activeNote.content"
          @input="autoSave"
          placeholder="落笔生花，心流无界..."
          class="flex-1 w-full text-base md:text-lg text-stone-600 leading-relaxed bg-transparent focus:outline-none resize-none custom-scrollbar placeholder:text-stone-300"
        ></textarea>

        <!-- 底部 AI 占位符 -->
        <div class="absolute bottom-6 right-8 opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-mono text-teal-600 cursor-pointer bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100">
          <span>✨</span> AI 接口预留
        </div>
      </div>

      <!-- 空白占位 -->
      <div v-else class="flex-1 flex flex-col items-center justify-center text-stone-300">
        <span class="text-4xl mb-4">🍃</span>
        <p class="text-sm tracking-widest">选择或新建一篇雅记</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  notes: Array,
  incomingDraft: Object // 从诗词卡片带过来的草稿
});

const emit = defineEmits(['back', 'update-notes']);

const activeNote = ref(null);

// 初始化时，如果有带过来的草稿，直接激活
watch(() => props.incomingDraft, (newDraft) => {
  if (newDraft) {
    activeNote.value = newDraft;
  }
}, { immediate: true });

const createNewNote = () => {
  const newId = 'note_' + Date.now();
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  
  const newNote = {
    id: newId,
    type: 'prose',
    title: '',
    content: '',
    date: dateStr,
    ai_metadata: {} // AI预留字段
  };
  
  // 发送给App.vue更新数据
  emit('update-notes', [newNote, ...props.notes]);
  activeNote.value = newNote;
};

const selectNote = (note) => {
  activeNote.value = note;
};

// 自动保存逻辑（防抖）
let saveTimer = null;
const autoSave = () => {
  if(saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    // 找到当前笔记在数组中的索引并替换
    const updatedNotes = [...props.notes];
    const idx = updatedNotes.findIndex(n => n.id === activeNote.value.id);
    if(idx !== -1) {
      updatedNotes[idx] = { ...activeNote.value };
      emit('update-notes', updatedNotes);
    }
  }, 500); // 500ms 停止输入后保存
};

// 辅助函数：根据类型返回图标
const getTypeIcon = (type) => {
  const icons = { quote: '🔖', diary: '📔', prose: '🍃', poetry: '🖋️', tech: '💻' };
  return icons[type] || '📝';
};

// 辅助函数：生成列表预览文本
const getPreview = (note) => {
  // 如果是旧版的 text 结构，兼容显示
  const content = note.content || note.text || '';
  return content.slice(0, 30) + (content.length > 30 ? '...' : '');
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #d1d5db; }
</style>