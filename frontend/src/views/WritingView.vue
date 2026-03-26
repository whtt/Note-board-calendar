<!-- src/views/WritingView.vue -->
<template>
  <!-- 背景改为宣纸色 (淡米偏灰绿) -->
  <div class="flex flex-1 flex-col md:flex-row overflow-hidden min-h-0 bg-[#F7F8F6]">
    
    <!-- 左侧：笔记侧边栏 (轻微纸质感) -->
    <div class="w-full md:w-64 border-r border-[#EAECE6] bg-[#FCFCFA] flex flex-col flex-shrink-0">
      <div class="p-4 border-b border-[#EAECE6] flex items-center justify-between">
        <!-- 返回按钮改为水墨灰绿 -->
        <button @click="$emit('back')" class="text-[#7A8B81] hover:text-[#2C3631] transition-colors flex items-center text-sm font-medium">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          返回案头
        </button>
        <button @click="createNewNote" class="p-1.5 bg-[#F0F2ED] text-[#5A6B61] rounded-lg hover:bg-[#E3E7DE] transition-colors" title="新建雅记">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
      </div>

      <!-- 笔记列表 -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        <div 
          v-for="note in notes" :key="note.id"
          @click="selectNote(note)"
          :class="['p-3 rounded-xl cursor-pointer transition-all border', 
                   activeNote?.id === note.id ? 'bg-[#EEF1EB] border-[#DCE3D6] shadow-sm' : 'bg-transparent border-transparent hover:bg-[#F3F5F1] hover:border-[#EAECE6]']"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs">{{ getTypeIcon(note.type) }}</span>
            <span class="text-xs text-[#9AA59D] font-mono">{{ note.date }}</span>
          </div>
          <!-- 标题颜色加深为黛色 -->
          <div class="text-sm text-[#2C3631] font-medium truncate">{{ note.title || '无题' }}</div>
          <div class="text-xs text-[#7A8B81] truncate mt-1">{{ getPreview(note) }}</div>
        </div>
      </div>
    </div>

    <!-- 右侧：沉浸式编辑器 (Zen Mode) -->
    <div class="flex-1 flex flex-col relative h-full">
      <div v-if="activeNote" class="max-w-3xl w-full mx-auto p-8 md:p-12 flex flex-col h-full">
        
        <!-- 类型与元数据选择器 -->
        <div class="flex items-center gap-3 mb-6">
          <select v-model="activeNote.type" @change="autoSave" class="bg-transparent text-[#6B8E7B] text-sm font-medium focus:outline-none border-b border-dashed border-[#C5CCC6] pb-1 cursor-pointer">
            <option value="quote">🔖 摘录</option>
            <option value="diary">📔 日记</option>
            <option value="prose">🍃 随笔</option>
            <option value="poetry">🖋️ 诗赋</option>
            <option value="tech">💻 量子</option>
          </select>
          <span class="text-[#DCE3D6] text-sm">|</span>
          <span class="text-[#9AA59D] text-sm font-mono tracking-wide">{{ activeNote.date }}</span>
        </div>

        <!-- 标题输入 (墨色) -->
        <input 
          v-model="activeNote.title" 
          @input="autoSave"
          type="text" 
          placeholder="拟定题目..." 
          class="w-full text-3xl md:text-4xl font-bold text-[#1A231E] bg-transparent focus:outline-none mb-6 placeholder:text-[#C5CCC6]"
        />

        <!-- 正文输入区 (深灰绿，护眼纸张对比度) -->
        <textarea 
          v-model="activeNote.content"
          @input="autoSave"
          placeholder="落笔生花，心流无界..."
          class="flex-1 w-full text-base md:text-lg text-[#3A4B41] leading-relaxed bg-transparent focus:outline-none resize-none custom-scrollbar placeholder:text-[#B5BDB6]"
        ></textarea>

        <!-- 底部 AI 占位符 (水墨青) -->
        <div class="absolute bottom-6 right-8 opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-mono text-[#4C6B5A] cursor-pointer bg-[#E9EFEA] px-3 py-1.5 rounded-full border border-[#D0DCD3]">
          <span>✨</span> AI 丹青润色 (预留)
        </div>
      </div>

      <!-- 空白占位 (更古风的提示) -->
      <div v-else class="flex-1 flex flex-col items-center justify-center text-[#B5BDB6]">
        <span class="text-4xl mb-4 opacity-70">🍵</span>
        <p class="text-sm tracking-[0.2em] font-medium text-[#7A8B81]">清茶一盏，静待佳作</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  notes: Array,
  incomingDraft: Object
});

const emit = defineEmits(['back', 'update-notes']);

const activeNote = ref(null);

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
    ai_metadata: {}
  };
  
  emit('update-notes',[newNote, ...props.notes]);
  activeNote.value = newNote;
};

const selectNote = (note) => {
  activeNote.value = note;
};

let saveTimer = null;
const autoSave = () => {
  if(saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const updatedNotes = [...props.notes];
    const idx = updatedNotes.findIndex(n => n.id === activeNote.value.id);
    if(idx !== -1) {
      updatedNotes[idx] = { ...activeNote.value };
      emit('update-notes', updatedNotes);
    }
  }, 500);
};

const getTypeIcon = (type) => {
  const icons = { quote: '🔖', diary: '📔', prose: '🍃', poetry: '🖋️', tech: '💻' };
  return icons[type] || '📝';
};

const getPreview = (note) => {
  const content = note.content || note.text || '';
  return content.slice(0, 30) + (content.length > 30 ? '...' : '');
};
</script>

<style scoped>
/* 修改滚动条颜色以适配丹青主题 */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #DCE3D6; border-radius: 10px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #B5BDB6; }
</style>