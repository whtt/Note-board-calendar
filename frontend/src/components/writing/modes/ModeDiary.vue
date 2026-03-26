<template>
  <div class="h-full">
    <BasePaper
      v-model="content"
      :cursor-pos="cursorPosition"
      :initial-view-mode="props.initialContent ? 'preview' : 'edit'"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BasePaper from '../BasePaper.vue'

const props = defineProps({
  initialContent: { type: String, default: '' }
})
const emit = defineEmits(['update:content'])

const content      = ref('')
const cursorPosition = ref(0)

watch(
  () => props.initialContent,
  (newVal) => {
    if (newVal) {
      content.value        = newVal
      cursorPosition.value = newVal.length
    } else {
      // 自动生成当日日期标题
      const today   = new Date()
      const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
      const weekMap = ['日', '一', '二', '三', '四', '五', '六']
      const week    = `星期${weekMap[today.getDay()]}`

      const template =
`# 📔 ${dateStr} · ${week}

## 今日三省

## 见闻录

## 所思所感

`
      content.value        = template
      // 光标落在"今日三省"标题后的空行，直接开写
      cursorPosition.value = template.indexOf('## 今日三省\n\n') + '## 今日三省\n\n'.length
    }
  },
  { immediate: true }
)

watch(content, (val) => emit('update:content', val))
</script>