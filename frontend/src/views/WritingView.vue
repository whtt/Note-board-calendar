<template>
  <!-- 灵感书斋：全屏沉浸模式 -->
  <div class="w-full h-full bg-[#F9F9F6] text-[#2C2C2C] flex flex-col font-serif selection:bg-[#E0E5DF]">
    
    <!-- ===== 顶部极简导航栏 ===== -->
    <header class="flex justify-between items-center px-6 py-4 border-b border-stone-200/80 flex-shrink-0">
      <div class="flex items-center space-x-3">
        
        <!-- 退出书斋 -->
        <button 
          @click="closeWriting" 
          class="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded hover:bg-stone-100" 
          title="返回仪表盘"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </button>

        <!-- 存档面板开关 -->
        <button
          @click="showPanel = !showPanel"
          :class="[
            'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-all border',
            showPanel 
              ? 'bg-stone-800 text-white border-stone-700' 
              : 'text-stone-500 border-stone-200 hover:bg-stone-100'
          ]"
          title="切换存档面板"
        >
          <span>📚</span>
          <span>存档</span>
          <span class="text-[10px] opacity-70">({{ props.notes.length }})</span>
        </button>

        <!-- 分隔线 -->
        <div class="w-px h-5 bg-stone-200"></div>

        <!-- 体裁切换器 -->
        <div class="flex space-x-1 bg-white/50 p-1 rounded-md shadow-sm border border-stone-100">
          <button 
            v-for="mode in modes" 
            :key="mode.id"
            @click="switchMode(mode.id)"
            :class="[
              'px-3 py-1 text-xs rounded transition-all', 
              currentMode === mode.id 
                ? 'bg-stone-800 text-[#F9F9F6] shadow' 
                : 'text-stone-500 hover:bg-stone-200/50'
            ]"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
      
      <!-- 封笔落锁 -->
      <button 
        @click="saveDraft" 
        class="px-4 py-2 bg-stone-800 text-[#F9F9F6] text-xs tracking-widest rounded shadow-md hover:bg-stone-700 transition-colors"
      >
        封笔落锁 · Ctrl+S
      </button>
    </header>

    <!-- ===== 主体：侧边存档 + 书写区 ===== -->
    <div class="flex flex-1 min-h-0 overflow-hidden">

      <!-- 左侧存档面板（可收起） -->
      <transition name="panel-slide">
        <aside 
          v-if="showPanel"
          class="w-56 border-r border-stone-200 flex flex-col bg-white/50 flex-shrink-0 overflow-hidden"
        >
          <!-- 面板头部 -->
          <div class="px-4 py-3 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
            <span class="text-xs font-semibold text-stone-500 tracking-wider uppercase">书斋存档</span>
            <button 
              @click="handleCreateNew"
              class="text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100 px-2 py-0.5 rounded transition-colors"
            >
              + 新篇
            </button>
          </div>

          <!-- 笔记列表 -->
          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <!-- 空状态 -->
            <div v-if="!props.notes || props.notes.length === 0" class="p-5 text-center">
              <p class="text-2xl mb-2">📭</p>
              <p class="text-xs text-stone-400">尚无存档</p>
              <p class="text-xs text-stone-300 mt-1">落笔封锁后自动归档</p>
            </div>

            <!-- 笔记条目 -->
            <div
              v-for="note in props.notes"
              :key="note.id"
              @click="handleLoadNote(note)"
              :class="[
                'p-3 cursor-pointer border-b border-stone-100/60 transition-all',
                currentNoteId === note.id
                  ? 'bg-stone-800/5 border-l-[3px] border-l-stone-700 pl-[9px]'
                  : 'hover:bg-stone-100/60 border-l-[3px] border-l-transparent'
              ]"
            >
              <!-- 图标 + 标题 -->
              <div class="flex items-center gap-1.5 mb-1">
                <span class="text-xs flex-shrink-0">{{ getModeIcon(note.type) }}</span>
                <p class="text-xs font-semibold text-stone-700 truncate">
                  {{ note.title || '无题雅记' }}
                </p>
              </div>
              <!-- 正文预览 -->
              <p class="text-[11px] text-stone-400 truncate leading-relaxed">
                {{ getPreview(note.content) }}
              </p>
              <!-- 日期 -->
              <p class="text-[10px] text-stone-300 mt-1">{{ note.date }}</p>
            </div>
          </div>
        </aside>
      </transition>

      <!-- 右侧书写区 -->
      <main class="flex-1 min-w-0 overflow-hidden flex flex-col">
        <div class="flex-1 px-10 pt-6 pb-10 max-w-3xl mx-auto w-full overflow-hidden">
          <keep-alive>
            <component 
              :is="currentModeComponent" 
              :initial-content="existingContent"
              :key="editorKey"
              @update:content="handleContentUpdate"
              v-bind="poetryProps"
            />
          </keep-alive>
        </div>
      </main>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// ===== 导入所有体裁组件 =====
import ModeProse       from '../components/writing/modes/ModeProse.vue'
import ModeDiary       from '../components/writing/modes/ModeDiary.vue'
import ModePoetryQuote from '../components/writing/modes/ModePoetryQuote.vue'
import ModePoem        from '../components/writing/modes/ModePoem.vue'
import ModeKnowledge   from '../components/writing/modes/ModeKnowledge.vue'

// ===== Props：接收全量笔记数据 =====
const props = defineProps({
  notes: { type: Array, default: () => [] }
})

// ===== 事件 =====
const emit = defineEmits(['back', 'update-notes'])

// ===== 体裁字典 =====
const modes = [
  { id: 'prose',    label: '🍃 散文',  component: ModeProse },
  { id: 'diary',    label: '📔 雅记',  component: ModeDiary },
  { id: 'poetry',   label: '📜 引思',  component: ModePoetryQuote },
  { id: 'poem',     label: '🖋️ 诗赋',  component: ModePoem },
  { id: 'knowledge',label: '🧠 知识',  component: ModeKnowledge },
]

// ===== 响应式状态 =====
const currentMode    = ref('prose')
const currentContent = ref('')
const poetryProps    = ref({})
const existingContent= ref('')      // 向子组件传递的旧内容
const currentNoteId  = ref(null)    // 当前编辑的笔记 ID（null = 新建）
const showPanel      = ref(true)    // 存档面板是否展开

// ===== 计算属性 =====
// editorKey 变化 → keep-alive 创建全新组件实例 → watch(immediate) 重新触发 → 内容正确加载
const editorKey = computed(() =>
  currentNoteId.value
    ? `edit-${currentNoteId.value}-${currentMode.value}`
    : `new-${currentMode.value}-fresh`
)

const currentModeComponent = computed(() => {
  const target = modes.find(m => m.id === currentMode.value)
  return target ? target.component : ModeProse
})

// ===== 辅助函数 =====
const getModeIcon = (type) => {
  const map = { prose: '🍃', diary: '📔', poetry: '📜', poem: '🖋️', knowledge: '🧠', quote: '📌' }
  return map[type] || '📝'
}

const getPreview = (content) => {
  if (!content) return '（空白）'
  const clean = content.replace(/[#>\n*`\-=]/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.substring(0, 36) || '（空白）'
}

// ===== 核心操作函数 =====

// 切换体裁
const switchMode = (modeId) => {
  currentMode.value = modeId
}

// 接收子组件内容更新
const handleContentUpdate = (newText) => {
  currentContent.value = newText
}

// 返回仪表盘
const closeWriting = () => {
  emit('back')
}

// 【内部】加载一篇已有笔记
const handleLoadNote = (note) => {
  currentNoteId.value  = note.id
  currentMode.value    = note.type || 'prose'
  existingContent.value= note.content || ''
  currentContent.value = note.content || ''   // 同步给保存逻辑
  poetryProps.value    = {}
}

// 【内部】新建一篇空白笔记
const handleCreateNew = () => {
  currentNoteId.value  = null
  existingContent.value= ''
  currentContent.value = ''
  poetryProps.value    = {}
  currentMode.value    = 'prose'
}

// 封笔落锁（保存）
const saveDraft = () => {
  if (!currentContent.value?.trim()) {
    console.warn('【书斋】墨迹未干，暂无内容可存。')
    closeWriting()
    return
  }

  // 自动从正文第一行提取标题
  const lines = currentContent.value.split('\n').filter(l => l.trim())
  const title = lines.length > 0
    ? lines[0].replace(/^[#>\s*`\-]*/g, '').substring(0, 20) || '无题雅记'
    : '无题雅记'

  const noteData = {
    id:        currentNoteId.value || 'note_' + Date.now(),
    type:      currentMode.value,
    title,
    content:   currentContent.value,
    timestamp: new Date().toISOString()
  }

  emit('update-notes', noteData)
  closeWriting()
}

// ===== 暴露给 App.vue 的遥控器接口 =====

// 场景A：从诗词卡片"抒发灵感"进入
const initFromPoetry = (quoteText, quoteAuthor) => {
  currentNoteId.value  = null
  existingContent.value= ''
  currentContent.value = ''
  poetryProps.value    = { quoteText, quoteAuthor }
  currentMode.value    = 'poetry'
}

// 场景B：直接新建
const initNew = (mode = 'prose') => {
  currentNoteId.value  = null
  existingContent.value= ''
  currentContent.value = ''
  poetryProps.value    = {}
  currentMode.value    = mode
}

// 场景C：从外部打开已有笔记
const openNote = (note) => {
  handleLoadNote(note)
}

defineExpose({ initFromPoetry, initNew, openNote })

// ===== Ctrl+S / Cmd+S 快捷键 =====
const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveDraft()
  }
}
onMounted(()        => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(()  => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
/* 存档面板滑入/滑出动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: width 0.25s ease, opacity 0.2s ease;
  overflow: hidden;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  width: 0 !important;
  opacity: 0;
}

/* 笔记列表细滚动条 */
.custom-scrollbar::-webkit-scrollbar        { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track  { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb  { background: #d6d3d1; border-radius: 2px; }
</style>