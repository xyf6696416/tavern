import { DEFAULT_FORMAT_TEMPLATES } from '../types/mlife'
import type { MlifeStore } from '../stores/mlife'

/**
 * 安全地按路径访问嵌套对象（替代 lodash _.get）
 */
function getValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return acc[part]
    return undefined
  }, obj)
}

/**
 * 渲染全部 store 状态为 ==mlife_data== 格式（注入给 AI）
 */
export function renderAllTemplates(state: Record<string, any>): string {
  const parts: string[] = []

  // [user] 账号
  if (state.user) {
    const t = DEFAULT_FORMAT_TEMPLATES.user
    if (t) parts.push(renderTemplate(t, state.user))
  }

  // 列表类型
  const listKeys: Record<string, string[]> = {
    'social.posts': ['home', 'posts'],
    'social.matches': ['match', 'matches'],
    'social.liveList': ['live', 'liveList'],
    'social.selfie': ['selfie', 'selfie'],
    'social.chat': ['chat', 'chat'],
    'social.resource': ['resource', 'resource'],
    'social.goddess': ['goddess', 'goddess'],
    'recruit.list': ['recruit', 'list'],
    'recruit.manage': ['recruitManage', 'manage'],
  }

  for (const [path, [templateKey, dataKey]] of Object.entries(listKeys)) {
    const data = getValue(state, path)
    if (data && data.length) {
      const t = DEFAULT_FORMAT_TEMPLATES[templateKey]
      if (t) parts.push(renderListTemplate(t, data))
    }
  }

  return parts.join('\n\n')
}

/**
 * 单条模板渲染：{变量} 替换
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = data[key]
    return val != null ? String(val) : ''
  })
}

/**
 * 列表模板渲染：多条目循环
 */
export function renderListTemplate(
  template: string,
  items: Record<string, any>[],
  sep: string = '\n--\n',
): string {
  if (!items?.length) return ''
  const body = template.replace(/^\[list:.*?\]\n/, '')
  return items.map(item => renderTemplate(body, item)).join(sep)
}

/**
 * 渲染指定页面的格式化数据（使用默认模板）
 */
export function renderPageData(page: string, data: Record<string, any>): string {
  const template = DEFAULT_FORMAT_TEMPLATES[page]
  if (!template) return ''
  if (template.startsWith('[list:')) {
    const items = Array.isArray(data) ? data : [data]
    return renderListTemplate(template, items)
  }
  return renderTemplate(template, data)
}