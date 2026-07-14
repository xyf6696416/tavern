import { useUserStore } from './user'
import { useSocialStore } from './social'
import { useDmStore } from './dm'
import { useRecruitStore } from './recruit'
import { useAppStore } from './app'

export function useMlifeStore() {
  const user = useUserStore()
  const social = useSocialStore()
  const dm = useDmStore()
  const recruit = useRecruitStore()
  const app = useAppStore()
  return { user, social, dm, recruit, app }
}

export type MlifeStore = ReturnType<typeof useMlifeStore>

/**
 * 序列化全部 Pinia 状态（用于注入 AI）
 */
export function serializeAllState(): Record<string, any> {
  const user = useUserStore()
  const social = useSocialStore()
  const dm = useDmStore()
  const recruit = useRecruitStore()
  return {
    user: user.serialize(),
    social: social.serialize(),
    dm: dm.serialize(),
    recruit: recruit.serialize(),
  }
}