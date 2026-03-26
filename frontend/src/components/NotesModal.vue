<!-- src/components/NotesModal.vue -->
<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/20 backdrop-blur-sm animate-fade-in" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl w-[480px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
      <div class="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
        <h3 class="font-bold text-stone-700 flex items-center gap-2"><span>🔖</span> 灵感笔记卡片</h3>
        <button @click="$emit('close')" class="text-stone-400 hover:text-stone-600 bg-white w-7 h-7 rounded shadow-sm border border-stone-100">✕</button>
      </div>
      
      <div class="p-5 overflow-y-auto flex-1 bg-stone-50/50 space-y-4 custom-scrollbar">
        <div v-for="note in notes" :key="note.id" class="bg-white p-5 rounded-xl border border-stone-100 shadow-sm relative group hover:shadow-md transition-shadow">
          <p class="text-stone-700 text-sm leading-relaxed mb-4">{{ note.text }}</p>
          <div class="flex justify-between items-center text-xs text-stone-400">
            <span class="bg-stone-50 px-2 py-1 rounded border border-stone-100">{{ note.date }}</span>
            <span>—— {{ note.author }}《{{ note.source }}》</span>
          </div>
          <button @click="$emit('delete', note.id)" class="absolute top-2 right-2 text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">✕</button>
        </div>
        <div v-if="!notes.length" class="text-center text-stone-400 text-sm py-12">暂无收录的诗词卡片，去案头看看吧。</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ show: Boolean, notes: Array });
defineEmits(['close', 'delete']);
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
</style>
