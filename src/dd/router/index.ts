import { createRouter, createMemoryHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'title', meta: { title: '魅途', isTitleScreen: true }, components: { default: () => import('../views/TitleScreen.vue'), title: () => import('../views/TitleScreen.vue') } },
  { path: '/create', name: 'create', meta: { title: '创建世界', isSubPage: true }, component: () => import('../views/CreationScreen.vue') },
  { path: '/home', name: 'home', meta: { title: '首页' }, component: () => import('../views/HomePage.vue') },
  { path: '/match', name: 'match', meta: { title: '邂逅' }, component: () => import('../views/MatchPage.vue') },
  { path: '/match/:id', name: 'matchDetail', meta: { title: '匹配详情', isSubPage: true }, component: () => import('../views/MatchDetail.vue') },
  { path: '/live', name: 'live', meta: { title: '直播' }, component: () => import('../views/LiveList.vue') },
  { path: '/live/:id', name: 'liveRoom', meta: { title: '直播间', isSubPage: true }, component: () => import('../views/LiveRoom.vue') },
  { path: '/dm', name: 'dm', meta: { title: '私信' }, component: () => import('../views/DmList.vue') },
  { path: '/dm/:id', name: 'dmChat', meta: { title: '聊天', isSubPage: true }, component: () => import('../views/DmChat.vue') },
  { path: '/profile', name: 'profile', meta: { title: '我的' }, component: () => import('../views/ProfilePage.vue') },
  { path: '/profile/selfie', name: 'selfie', meta: { title: '日常自拍', isSubPage: true }, component: () => import('../views/ProfileSelfie.vue') },
  { path: '/profile/chat', name: 'chat', meta: { title: '闲聊灌水', isSubPage: true }, component: () => import('../views/ProfileChat.vue') },
  { path: '/profile/resource', name: 'resource', meta: { title: '资源分享', isSubPage: true }, component: () => import('../views/ProfileResource.vue') },
  { path: '/profile/goddess', name: 'goddess', meta: { title: '女神夜话', isSubPage: true }, component: () => import('../views/ProfileGoddess.vue') },
  { path: '/recruit', name: 'recruit', meta: { title: '招募' }, component: () => import('../views/RecruitList.vue') },
  { path: '/recruit/:id', name: 'recruitDetail', meta: { title: '招募详情', isSubPage: true }, component: () => import('../views/RecruitDetail.vue') },
  { path: '/recruit/post', name: 'recruitPost', meta: { title: '发布招募', isSubPage: true }, component: () => import('../views/RecruitPost.vue') },
  { path: '/recruit/manage', name: 'recruitManage', meta: { title: '我的管理', isSubPage: true }, component: () => import('../views/RecruitManage.vue') },
  { path: '/settings', name: 'settings', meta: { title: '设置', isSubPage: true }, component: () => import('../views/settings/SettingsPage.vue') },
  { path: '/settings/format', name: 'formatTemplate', meta: { title: '格式模板', isSubPage: true }, component: () => import('../views/settings/FormatTemplateEditor.vue') },
]

export default createRouter({ history: createMemoryHistory(), routes })