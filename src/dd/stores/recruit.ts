import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Recruit, RecruitDetail } from '../types/mlife'

export const useRecruitStore = defineStore('mlife:recruit', () => {
  const list = ref<Recruit[]>([])
  const manage = ref<Recruit[]>([])
  const detail = ref<RecruitDetail | null>(null)
  const postResult = ref<{ result: string; message: string } | null>(null)

  function applyList(data: any[]) {
    list.value = data.map((d: any) => ({
      code: d.code || '',
      credit: d.credit || '',
      type: d.type || '',
      title: d.title || '',
      budget: d.budget || '',
      location: d.location,
      time: d.time,
      tags: d.tags || '',
      status: d.status || '招募中',
      applicants: Number(d.applicants) || 0,
    }))
  }

  function applyManage(data: any[]) {
    manage.value = data.map((d: any) => ({
      code: d.code || '',
      credit: d.credit || '',
      type: d.type || '',
      title: d.title || '',
      budget: d.budget || '',
      tags: d.tags || '',
      status: d.status || '招募中',
      applicants: Number(d.applicants) || 0,
    }))
  }

  function applyDetail(data: any) {
    detail.value = data as RecruitDetail
  }

  function applyPostResult(data: any) {
    postResult.value = {
      result: data.result || 'failed',
      message: data.message || '',
    }
  }

  function serialize(): Record<string, any> {
    return {
      list: list.value,
      manage: manage.value,
      detail: detail.value,
    }
  }

  return {
    list, manage, detail, postResult,
    applyList, applyManage, applyDetail, applyPostResult,
    serialize,
  }
})