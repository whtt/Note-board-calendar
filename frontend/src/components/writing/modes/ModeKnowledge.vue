<template>
  <div class="h-full">
    <BasePaper
      v-model="content"
      :cursor-pos="cursorPosition"
      :initial-view-mode="props.initialContent ? 'preview' : 'split'"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BasePaper from '../BasePaper.vue'

// 🌟 1. 声明接收父组件传来的旧内容
const props = defineProps({
  initialContent: { type: String, default: '' } 
})
const emit = defineEmits(['update:content'])
const content = ref('')
const cursorPosition = ref(0)

watch(
  () => props.initialContent,
  (newVal) => {
    if (newVal) {
      // 【续写模式】加载旧内容，光标置末尾
      content.value = newVal
      cursorPosition.value = newVal.length
    } else {
        // 知识库硬核模板
        const template = `# \n\n## 💡 核心要义\n\n\n## ⚙️ 推演与实现\n\`\`\`python\n\n\`\`\`\n\n## 🔗 溯源与链接\n- `
        content.value = template
        // 光标精准定位在 "# " 之后 (索引位置为 2)，方便直接输入标题！
        cursorPosition.value = 2
    }
  },
  { immediate: true } // 组件一挂载就立刻执行一次，等价于 onMounted + watch 的结合体
)

// 将内容同步给父组件
watch(content, (val) => emit('update:content', val))
</script>