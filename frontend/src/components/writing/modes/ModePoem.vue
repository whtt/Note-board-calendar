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

const content        = ref('')
const cursorPosition = ref(0)

watch(
  () => props.initialContent,
  (newVal) => {
    if (newVal) {
      content.value        = newVal
      cursorPosition.value = newVal.length
    } else {
      const template =
`# 题目

　　

　　

　　

---

*落款 · 时地*
`
      content.value = template
      // 光标落在第一个全角空格后，直接起笔
      cursorPosition.value = template.indexOf('# 题目\n\n') + '# 题目\n\n'.length + 3
    }
  },
  { immediate: true }
)

watch(content, (val) => emit('update:content', val))
</script>