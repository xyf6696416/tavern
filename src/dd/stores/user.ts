import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('mlife:user', () => {
  const account = ref('')
  const balance = ref(0)
  const exp = ref('0/600')
  const level = ref('Lv1')
  const vip = ref('无')
  const signin = ref('未签')
  const signinStreak = ref(0)
  const likes = ref(0)
  const fans = ref(0)
  const following = ref(0)
  const matchToday = ref('0/3')
  const postToday = ref('0/8')
  const recruitActive = ref(0)
  const recruitApplied = ref(0)
  const unboxed = ref<string[]>([])

  function applyUpdates(data: Record<string, any>) {
    if (data.balance != null) balance.value = Number(data.balance)
    if (data.exp) exp.value = data.exp
    if (data.level) level.value = data.level
    if (data.vip) vip.value = data.vip
    if (data.signin) signin.value = data.signin
    if (data.signin_streak != null) signinStreak.value = Number(data.signin_streak)
    if (data.likes != null) likes.value = Number(data.likes)
    if (data.fans != null) fans.value = Number(data.fans)
    if (data.following != null) following.value = Number(data.following)
    if (data.matchToday) matchToday.value = data.matchToday
    if (data.postToday) postToday.value = data.postToday
    if (data.recruitActive != null) recruitActive.value = Number(data.recruitActive)
    if (data.recruitApplied != null) recruitApplied.value = Number(data.recruitApplied)
    if (data.unboxed) unboxed.value = data.unboxed.split(',').filter(Boolean)
  }

  function serialize(): Record<string, any> {
    return {
      account: `${account.value} | ${level.value} | ${vip.value} | M币: ${balance.value}`,
      balance: balance.value,
      exp: exp.value,
      level: level.value,
      vip: vip.value,
      signin: signin.value,
      signin_streak: signinStreak.value,
      likes: likes.value,
      fans: fans.value,
      following: following.value,
      match_today: matchToday.value,
      post_today: postToday.value,
      recruit_active: recruitActive.value,
      recruit_applied: recruitApplied.value,
      unboxed: unboxed.value.join(','),
    }
  }

  return {
    account, balance, exp, level, vip, signin, signinStreak,
    likes, fans, following, matchToday, postToday,
    recruitActive, recruitApplied, unboxed,
    applyUpdates, serialize,
  }
})