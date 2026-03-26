<!-- src/components/PoetryCard.vue -->
<template>
  <div class="bg-white rounded-xl p-4 shadow-sm border border-stone-100 relative group border-l-4 border-l-teal-500/70 mb-4 flex flex-col transition-shadow hover:shadow-md">
    
    <!-- 诗词正文区 (点击此处去品鉴) -->
    <div class="cursor-pointer hover:bg-stone-50/50 p-2 -mx-2 rounded transition-colors" @click="goToPoem" title="前往古诗文网品鉴全诗">
      <div class="text-stone-700 font-medium text-justify leading-relaxed tracking-wide" style="font-family: 'Kaiti', 'STKaiti', serif; font-size: 1.05rem;">
        {{ poetry.text }}
      </div>
      <div class="text-right text-xs text-stone-400 mt-3 font-medium">
        —— {{ poetry.author }}《{{ poetry.source }}》
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-stone-50">
      <!-- 换一首按钮 -->
      <button 
        @click.stop="fetchPoem" 
        class="text-stone-400 hover:text-teal-600 flex items-center gap-1.5 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-teal-50 font-medium"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        换一首
      </button>
      
      <!-- 动作按钮组 -->
      <div class="flex gap-1">
        <button 
          @click.stop="$emit('save', poetry)"
          class="text-stone-400 hover:text-amber-600 flex items-center gap-1.5 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-amber-50 font-medium"
          title="收录至灵感笔记"
        >
          🔖 收藏
        </button>
        <button 
          @click.stop="$emit('write-essay', poetry)"
          class="text-stone-400 hover:text-emerald-600 flex items-center gap-1.5 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-emerald-50 font-medium"
          title="以此写一篇随笔"
        >
          ✍️ 写随笔
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const poetry = ref({ text: '诗词加载中...', author: '', source: '' });

const fetchPoem = async () => {
  poetry.value.text = '翻阅古籍中...';
  poetry.value.author = '';
  poetry.value.source = '';
  try {
    const response = await fetch('https://v1.jinrishici.com/all.json');
    if (!response.ok) throw new Error('网络请求失败');
    const data = await response.json();
    poetry.value = { text: data.content, author: data.author, source: data.origin };
  } catch (error) {
    poetry.value = { text: '行到水穷处，坐看云起时。', author: '王维', source: '终南别业' };
  }
};

const goToPoem = () => {
  if (poetry.value.source) {
    const searchUrl = `https://so.gushiwen.cn/search.aspx?value=${encodeURIComponent(poetry.value.author + ' ' + poetry.value.source)}`;
    window.open(searchUrl, '_blank');
  }
};

onMounted(() => fetchPoem());
</script>