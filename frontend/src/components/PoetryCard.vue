<!-- src/components/PoetryCard.vue -->
<template>
  <div class="bg-white rounded-xl p-5 shadow-sm border border-stone-100 relative group border-l-4 border-l-teal-400 mb-4 cursor-pointer hover:shadow-md transition-shadow" @click="goToPoem">
    <div class="text-stone-700 font-medium mb-4 text-justify leading-relaxed">
      {{ poetry.text }}
    </div>
    <div class="text-right text-xs text-stone-400">
      —— {{ poetry.author }}《{{ poetry.source }}》
    </div>
    
    <!-- 悬浮可见的收藏书签 (.stop 防止点击书签时触发外层的跳转) -->
    <button 
      @click.stop="$emit('save', poetry)"
      class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-stone-50 text-stone-400 hover:text-amber-500 hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-amber-100"
      title="收录至灵感笔记"
    >
      🔖
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'; // 补全了 onMounted 引入

// 将变量名统一改为 poetry，字段改为 text / source，与 App.vue 的百宝箱保持一致
const poetry = ref({ text: '诗词加载中...', author: '', source: '' });

const fetchPoem = async () => {
  poetry.value.text = '翻阅古籍中...';
  try {
    const response = await fetch('https://v1.jinrishici.com/all.json');
    if (!response.ok) throw new Error('网络请求失败');
    const data = await response.json();
    poetry.value = { text: data.content, author: data.author, source: data.origin };
  } catch (error) {
    // 降级断网处理
    poetry.value = { text: '行到水穷处，坐看云起时。', author: '王维', source: '终南别业' };
  }
};

// 跳转到古诗文网进行精准搜索
const goToPoem = () => {
  if (poetry.value.source) {
    const searchUrl = `https://so.gushiwen.cn/search.aspx?value=${encodeURIComponent(poetry.value.author + ' ' + poetry.value.source)}`;
    window.open(searchUrl, '_blank');
  }
};

onMounted(() => fetchPoem());
</script>