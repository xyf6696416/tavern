import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Contact, UnboxData } from '../types/mlife'

export const useDmStore = defineStore('mlife:dm', () => {
  const contacts = ref<Contact[]>([])
  const messagesMap = ref<Record<string, import('../types/mlife').Message[]>>({})
  const unboxCache = ref<Record<string, UnboxData>>({})
  const unboxedIds = ref<string[]>([])
  const badges = ref<Record<string, number>>({})

  function applyContacts(data: any[]) {
    contacts.value = data.map((d: any, i: number) => ({
      id: d.id || `contact_${i}`,
      nick: d.nick || '',
      level: d.level || 'Lv1',
      avatar: d.avatar || '',
      lastMsg: d.last_msg || '',
      lastTime: d.last_time || '',
      unread: Number(d.unread) || 0,
      messages: [],
    }))
  }

  function applyMessages(contactId: string, data: any[]) {
    messagesMap.value[contactId] = data.map((d: any) => ({
      role: d.role as 'outgoing' | 'incoming',
      time: d.time || '',
      type: (d.type as 'text' | 'voice' | 'image') || 'text',
      text: d.text || '',
      duration: d.duration,
      desc: d.desc,
    }))
    // 同步写入 Contact 对象
    const contact = contacts.value.find(c => c.id === contactId)
    if (contact) contact.messages = messagesMap.value[contactId]
  }

  function addMessage(contactId: string, msg: { role: 'outgoing' | 'incoming'; text: string }) {
    if (!messagesMap.value[contactId]) messagesMap.value[contactId] = []
    messagesMap.value[contactId].push({
      role: msg.role,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: msg.text,
    })
    // 同步写入 Contact 对象
    const contact = contacts.value.find(c => c.id === contactId)
    if (contact) contact.messages = messagesMap.value[contactId]
  }

  function applyUnbox(data: Record<string, any>): UnboxData | null {
    if (!data.id) return null
    const unbox: UnboxData = {
      id: data.id,
      nick: data.nick || '',
      age: Number(data.age) || 0,
      job: data.job || '',
      level: data.level || 'Lv1',
      occupation: data.occupation || '',
      measurements: data.measurements || '',
      height: data.height || '',
      figure: data.figure || '',
      drive: data.drive || '',
      tags: data.tags || '',
      sensitive: data.sensitive || '',
      preference: data.preference || '',
    }
    unboxCache.value[data.id] = unbox
    if (!unboxedIds.value.includes(data.id)) {
      unboxedIds.value.push(data.id)
    }
    return unbox
  }

  function applyBadges(data: Record<string, any>) {
    for (const [key, val] of Object.entries(data)) {
      badges.value[key] = Number(val) || 0
    }
  }

  function serialize(): Record<string, any> {
    return {
      contacts: contacts.value.map(c => ({
        id: c.id,
        nick: c.nick,
        level: c.level,
        last_msg: c.lastMsg,
        last_time: c.lastTime,
        unread: c.unread,
      })),
      unboxed: unboxedIds.value,
      badges: badges.value,
    }
  }

  return {
    contacts, messagesMap, unboxCache, unboxedIds, badges,
    applyContacts, applyMessages, addMessage, applyUnbox, applyBadges,
    serialize,
  }
})