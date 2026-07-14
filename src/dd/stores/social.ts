import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Post, Match, LiveEntry, LiveRoom, MatchDetail } from '../types/mlife'

export const useSocialStore = defineStore('mlife:social', () => {
  const posts = ref<Post[]>([])
  const matches = ref<Match[]>([])
  const matchDetail = ref<MatchDetail | null>(null)
  const liveList = ref<LiveEntry[]>([])
  const liveRoom = ref<LiveRoom | null>(null)
  const selfie = ref<Post[]>([])
  const chatPosts = ref<Post[]>([])
  const resource = ref<Post[]>([])
  const goddess = ref<Post[]>([])

  function applySection(section: string, data: any[]) {
    switch (section) {
      case 'list:home': posts.value = data; break
      case 'list:match': matches.value = data; break
      case 'list:live': liveList.value = data; break
      case 'list:selfie': selfie.value = data; break
      case 'list:chat': chatPosts.value = data; break
      case 'list:resource': resource.value = data; break
      case 'list:goddess': goddess.value = data; break
    }
  }

  function applySingle(section: string, data: any) {
    switch (section) {
      case 'match_detail': matchDetail.value = data as MatchDetail; break
      case 'live_room': liveRoom.value = data as LiveRoom; break
    }
  }

  function serialize(): Record<string, any> {
    return {
      posts: posts.value,
      matches: matches.value,
      liveList: liveList.value,
      selfie: selfie.value,
      chat: chatPosts.value,
      resource: resource.value,
      goddess: goddess.value,
    }
  }

  return {
    posts, matches, matchDetail, liveList, liveRoom,
    selfie, chatPosts, resource, goddess,
    applySection, applySingle, serialize,
  }
})