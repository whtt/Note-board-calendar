<template>
  <div class="h-full flex flex-col">
    
    <!-- 视图切换器 -->
    <div class="flex items-center justify-end mb-3 flex-shrink-0">
      <div class="flex bg-stone-100 rounded-lg p-0.5 gap-0.5">
        <button
          v-for="vm in viewModes" :key="vm.id"
          @click="switchView(vm.id)"
          :class="[
            'flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md transition-all',
            viewMode === vm.id
              ? 'bg-white shadow-sm text-stone-700 font-medium'
              : 'text-stone-400 hover:text-stone-600'
          ]"
        >
          <span>{{ vm.icon }}</span>
          <span>{{ vm.label }}</span>
        </button>
      </div>
    </div>

    <!-- 内容主体 -->
    <div class="flex-1 min-h-0 flex overflow-hidden">

      <!-- ① 编辑区：原始 Markdown（等宽字体，灰色，程序员视角） -->
      <div
        v-show="viewMode !== 'preview'"
        :class="viewMode === 'split'
          ? 'w-1/2 pr-5 border-r border-stone-200/80'
          : 'w-full'"
        class="h-full flex flex-col"
      >
        <textarea
          ref="textareaRef"
          v-model="model"
          class="flex-1 w-full bg-transparent resize-none outline-none
                 font-mono text-[13px] text-stone-400 leading-loose
                 placeholder-stone-300"
          placeholder="在此落笔... (Markdown 语法)"
          spellcheck="false"
        />
      </div>

      <!-- ② 预览区：渲染后的效果（优雅，无 # 符号） -->
      <div
        v-show="viewMode !== 'edit'"
        :class="viewMode === 'split' ? 'w-1/2 pl-6' : 'w-full'"
        class="h-full overflow-y-auto md-rendered"
        v-html="renderedHtml"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { marked } from 'marked'

// ── Props ──────────────────────────────────────────
const model = defineModel()   // 双向绑定原始 Markdown 文本

const props = defineProps({
  cursorPos:        { type: Number, default: 0 },
  // 由父组件决定初始视图：有旧内容→预览，新建→编辑
  initialViewMode:  { type: String, default: 'edit' }
})

// ── 状态 ───────────────────────────────────────────
const textareaRef = ref(null)
const viewMode    = ref(props.initialViewMode)  // 跟随父组件初始意图

const viewModes = [
  { id: 'edit',    icon: '✏️', label: '编辑' },
  { id: 'split',   icon: '◫',  label: '分栏' },
  { id: 'preview', icon: '✦',  label: '预览' },
]

// ── Markdown 渲染 ───────────────────────────────────
const renderedHtml = computed(() => {
  if (!model.value?.trim()) {
    return '<p class="md-placeholder">在此落笔...</p>'
  }
  try {
    // breaks: true → 单个换行也生效（中文写作友好）
    // gfm: true    → 支持表格、任务列表等 GitHub 扩展语法
    return marked.parse(model.value, { breaks: true, gfm: true })
  } catch {
    return `<pre>${model.value}</pre>`
  }
})

// ── 视图切换 ────────────────────────────────────────
const switchView = async (id) => {
  viewMode.value = id
  // 切到含编辑区的模式时，自动聚焦
  if (id !== 'preview') {
    await nextTick()
    textareaRef.value?.focus()
  }
}

// ── 光标定位（来自父组件的精准指令） ────────────────
watch(() => props.cursorPos, async (pos) => {
  if (pos >= 0 && textareaRef.value && viewMode.value !== 'preview') {
    await nextTick()
    textareaRef.value.focus()
    textareaRef.value.setSelectionRange(pos, pos)
  }
}, { immediate: true })

// 组件挂载后，霸道地抢夺光标！
onMounted(() => {
  if (viewMode.value !== 'preview') {
    // 延迟 100ms 确保 DOM 和动画彻底渲染完毕，然后强制聚焦
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 100)
  }
})
</script>

<style>
/*
  ⚠️ 不加 scoped！
  因为 v-html 渲染的内容是动态注入的，scoped 的 data-v-xxx 选择器无法匹配。
  用 .md-rendered 前缀做命名空间隔离，防止样式污染全局。
*/

/* ── 容器基础 ── */
.md-rendered {
  font-family: 'Georgia', 'Noto Serif SC', 'STSong', serif;
  font-size: 15px;
  line-height: 2;
  color: #2C2C2C;
  word-break: break-word;
}

/* ── 标题（# → 大字，无 # 符号） ── */
.md-rendered h1 {
  font-size: 1.6em;
  font-weight: 700;
  color: #111;
  margin: 0 0 0.7em;
  padding-bottom: 0.4em;
  border-bottom: 2px solid #E8E6DF;
  letter-spacing: 0.04em;
}
.md-rendered h2 {
  font-size: 1.05em;
  font-weight: 600;
  color: #1a1a1a;
  margin: 1.8em 0 0.5em;
  padding-left: 0.7em;
  border-left: 3px solid #9CAF88;  /* 书院绿左边框，文气十足 */
}
.md-rendered h3 {
  font-size: 0.95em;
  font-weight: 600;
  color: #3a3a3a;
  margin: 1.2em 0 0.3em;
}

/* ── 段落 ── */
.md-rendered p { margin: 0.5em 0; }

/* ── 引用块（> → 精致边框样式） ── */
.md-rendered blockquote {
  border-left: 3px solid #B5C4A8;
  margin: 1.2em 0;
  padding: 0.5em 1.2em;
  background: #F7FAF5;
  border-radius: 0 8px 8px 0;
  color: #6b7280;
  font-style: italic;
}
.md-rendered blockquote p { margin: 0; }

/* ── 行内代码（`code` → 淡紫色药丸） ── */
.md-rendered code {
  background: #F0EFF8;
  padding: 0.1em 0.45em;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.82em;
  color: #7155BF;
}

/* ── 代码块（```lang → 暗色终端风） ── */
.md-rendered pre {
  background: #1C1C28;
  color: #DCDCE8;
  padding: 1em 1.4em;
  border-radius: 10px;
  overflow-x: auto;
  margin: 1.2em 0;
}
.md-rendered pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.88em;
}

/* ── 列表 ── */
.md-rendered ul { list-style: disc; }
.md-rendered ol { list-style: decimal; }
.md-rendered ul,
.md-rendered ol { padding-left: 1.6em; margin: 0.5em 0; }
.md-rendered li { margin: 0.25em 0; }

/* ── 强调 ── */
.md-rendered strong { font-weight: 700; color: #111; }
.md-rendered em     { font-style: italic; color: #3D6B55; }

/* ── 分隔线 ── */
.md-rendered hr {
  border: none;
  border-top: 1px solid #E8E6DF;
  margin: 2em 0;
}

/* ── 表格 ── */
.md-rendered table { width: 100%; border-collapse: collapse; font-size: 0.9em; margin: 1em 0; }
.md-rendered th    { background: #F5F4F0; padding: 0.5em 0.9em; font-weight: 600; border: 1px solid #E8E6DF; }
.md-rendered td    { padding: 0.4em 0.9em; border: 1px solid #E8E6DF; }

/* ── 链接 ── */
.md-rendered a { color: #4C6B5A; text-decoration-style: dotted; }

/* ── 空状态占位文字 ── */
.md-rendered .md-placeholder { color: #C9C4BC; font-style: italic; }

/* ── 细滚动条 ── */
.md-rendered::-webkit-scrollbar       { width: 3px; }
.md-rendered::-webkit-scrollbar-track { background: transparent; }
.md-rendered::-webkit-scrollbar-thumb { background: #D6D3D1; border-radius: 2px; }
</style>