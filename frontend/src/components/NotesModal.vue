<!-- src/components/NotesModal.vue -->
<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/30 backdrop-blur-sm animate-fade-in" @click.self="$emit('close')">
    <div class="bg-[#FCFCFA] rounded-2xl w-[480px] max-h-[80vh] flex flex-col shadow-2xl border border-[#EAECE6] overflow-hidden">
      
      <!-- 顶部标题栏 -->
      <div class="p-4 border-b border-[#EAECE6] flex justify-between items-center bg-white shrink-0">
        <h3 class="font-bold text-[#2C3631] flex items-center gap-2"><span>🔖</span> 灵感雅记卡片</h3>
        <button @click="$emit('close')" class="text-stone-400 hover:text-rose-500 bg-stone-50 w-7 h-7 rounded shadow-sm border border-stone-100 flex items-center justify-center transition-colors">✕</button>
      </div>
      
      <!-- 🌟 桥梁：从卡片通往书斋 -->
      <div 
        @click="$emit('enter-writing')"
        class="bg-[#F2F6F3] p-3 border-b border-[#DCE3D6] flex justify-between items-center cursor-pointer hover:bg-[#E9EFEA] transition-colors shrink-0 group"
      >
        <span class="text-sm text-[#4C6B5A] font-medium flex items-center gap-2">
          <span>🍵</span> 想要挥洒更多灵感？
        </span>
        <span class="text-xs bg-white text-[#5A6B61] px-2.5 py-1 rounded shadow-sm group-hover:shadow border border-white group-hover:border-[#DCE3D6] transition-all">
          前往书斋写作 ➔
        </span>
      </div>
      
      <!-- 卡片列表区 -->
      <div class="p-5 overflow-y-auto flex-1 bg-[#FCFCFA] space-y-4 custom-scrollbar">
        <div v-for="note in notes" :key="note.id" class="bg-white p-4 rounded-xl border border-[#EAECE6] shadow-sm relative group hover:shadow-md transition-shadow">
          <!-- 标题 -->
          <div class="text-[#2C3631] font-bold text-sm mb-2 pr-6 truncate">{{ note.title || '无题雅记' }}</div>
          
          <!-- 内容提取 (过滤掉引用符号 >) -->
          <p class="text-[#5A6B61] text-sm leading-relaxed mb-4 whitespace-pre-wrap">{{ formatContent(note.content || note.text) }}</p>
          
          <!-- 底部元数据 -->
          <div class="flex justify-between items-center text-xs text-[#9AA59D]">
            <span class="bg-[#F7F8F6] px-2 py-1 rounded border border-[#EAECE6] font-mono">{{ note.date }}</span>
            <span class="bg-[#E9EFEA] text-[#4C6B5A] px-2 py-1 rounded">{{ getTypeLabel(note.type) }}</span>
          </div>
          
          <!-- 删除按钮 -->
          <button @click="$emit('delete', note.id)" class="absolute top-3 right-3 text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded" title="删除此卡片">✕</button>
        </div>
        
        <div v-if="!notes.length" class="text-center text-[#9AA59D] text-sm py-12 leading-relaxed">
          暂无收录的卡片。<br>在案头点击诗词下的“收藏”即可收录至此。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ show: Boolean, notes: Array });
defineEmits(['close', 'delete', 'enter-writing']);

// 格式化内容，去除 Markdown 的 "> " 符号，让卡片显示更干净
const formatContent = (content) => {
  if (!content) return '';
  return content.replace(/> /g, '').trim();
};

const getTypeLabel = (type) => {
  const labels = { quote: '摘录', prose: '随笔', diary: '日记', poetry: '诗赋', tech: '量子' };
  return labels[type] || '笔记';
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
</style>