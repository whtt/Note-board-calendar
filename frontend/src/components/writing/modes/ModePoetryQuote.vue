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

const props = defineProps({
  initialContent: { type: String, default: '' },
  // 由 WritingView 通过 v-bind="poetryProps" 传入
  quoteText:      { type: String, default: '' },
  quoteAuthor:    { type: String, default: '' }
})
const emit = defineEmits(['update:content'])

const content        = ref('')
const cursorPosition = ref(0)

watch(
  () => props.initialContent,
  (newVal) => {
    if (newVal) {
      // 续写旧笔记
      content.value        = newVal
      cursorPosition.value = newVal.length
    } else {
      // 从诗词卡片带入引思草稿
      const quote  = props.quoteText  || '（此处引入诗句...）'
      const author = props.quoteAuthor || ''

      const template =
`> ${quote}
> —— ${author}

---

## 💭 偶感

`
      content.value        = template
      cursorPosition.value = template.length
    }
  },
  { immediate: true }
)

// quoteText 变化时（父组件异步写入时）也要重新初始化模板
watch(
  () => props.quoteText,
  () => {
    // 只在非续写场景下响应
    if (!props.initialContent) {
      const quote  = props.quoteText  || '（此处引入诗句...）'
      const author = props.quoteAuthor || ''
      const template =
`> ${quote}
> —— ${author}

---

## 💭 偶感

`
      content.value        = template
      cursorPosition.value = template.length
    }
  }
)

watch(content, (val) => emit('update:content', val))
</script>