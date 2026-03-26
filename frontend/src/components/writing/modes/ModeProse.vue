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
      content.value        = '# \n\n'
      cursorPosition.value = 2
    }
  },
  { immediate: true }
)

watch(content, (val) => emit('update:content', val))
</script>