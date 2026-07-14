import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_FORMAT_TEMPLATES } from '../types/mlife'

export const useAppStore = defineStore('mlife:app', () => {
  const theme = ref<'light' | 'dark'>('light')
  const phoneOpen = ref(true)
  const ballPosition = ref({ x: typeof window !== 'undefined' ? window.innerWidth - 80 : 16, y: typeof window !== 'undefined' ? window.innerHeight - 120 : 100 })
  const formatTemplates = ref<Record<string, string>>({})
  const pageCache = ref<Map<string, { data: any; timestamp: number }>>(new Map())
  const toasts = ref<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }>>([])
  const isSending = ref(false)

  let toastIdCounter = 0

  function loadFromLocalStorage() {
    // 主题
    try {
      const savedTheme = localStorage.getItem('mlife_theme')
      if (savedTheme === 'dark' || savedTheme === 'light') theme.value = savedTheme
    } catch {}

    // 球位置
    try {
      const savedPos = localStorage.getItem('mlife_ball_pos')
      if (savedPos) ballPosition.value = JSON.parse(savedPos)
    } catch {}

    // 格式化模板
    formatTemplates.value = loadFormatTemplates()
  }

  function loadFormatTemplates(): Record<string, string> {
    const loaded: Record<string, string> = {}
    for (const key of Object.keys(DEFAULT_FORMAT_TEMPLATES)) {
      try {
        const stored = localStorage.getItem(`mlife_format_${key}`)
        if (stored) loaded[key] = stored
      } catch {}
    }
    return loaded
  }

  function getFormatTemplate(page: string): string {
    return formatTemplates.value[page] || DEFAULT_FORMAT_TEMPLATES[page] || ''
  }

  function saveFormatTemplate(page: string, content: string) {
    formatTemplates.value[page] = content
    try { localStorage.setItem(`mlife_format_${page}`, content) } catch {}
  }

  function resetFormatTemplate(page: string) {
    delete formatTemplates.value[page]
    try { localStorage.removeItem(`mlife_format_${page}`) } catch {}
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    try { localStorage.setItem('mlife_theme', theme.value) } catch {}
  }

  function togglePhone() {
    phoneOpen.value = !phoneOpen.value
  }

  function addToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    const id = ++toastIdCounter
    toasts.value.push({ id, message, type })
    setTimeout(() => { removeToast(id) }, 3600)
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    theme, phoneOpen, ballPosition, formatTemplates, pageCache, toasts, isSending,
    loadFromLocalStorage, getFormatTemplate, saveFormatTemplate, resetFormatTemplate,
    toggleTheme, togglePhone, addToast, removeToast,
  }
})