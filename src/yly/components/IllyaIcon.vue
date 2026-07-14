<template>
  <svg
    class="illya-icon"
    :width="size"
    :height="size"
    :viewBox="viewBox"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- 魔法阵背景光晕（装饰用） -->
    <circle v-if="glow" cx="12" cy="12" r="11" :fill="`${color}18`" />

    <!-- ★ 四芒星 — 签名元素 -->
    <template v-if="name === 'star'">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" :fill="color" />
    </template>

    <!-- 小星星装饰 -->
    <template v-if="name === 'sparkle'">
      <path d="M12 4L13.5 10.5L20 12L13.5 13.5L12 20L10.5 13.5L4 12L10.5 10.5Z" :fill="color" opacity="0.8" />
    </template>

    <!-- 心形 -->
    <template v-if="name === 'heart'">
      <path d="M12 21C12 21 4 15 4 9C4 6 6 4 9 4C10.5 4 12 5 12 6.5C12 5 13.5 4 15 4C18 4 20 6 20 9C20 15 12 21 12 21Z" :fill="color" />
    </template>

    <!-- 魔力旋涡 / 魔法 -->
    <template v-if="name === 'magic'">
      <path d="M12 2L13.09 8.26L18 6L14.5 10.5L19 12L13.09 13.09L15 18L12 14L9 18L10.91 13.09L5 12L9.5 10.5L6 6L10.91 8.26L12 2Z" :fill="color" />
      <circle cx="12" cy="12" r="3" :fill="color" opacity="0.3" />
    </template>

    <!-- 疲劳（ droopy crescent） -->
    <template v-if="name === 'fatigue'">
      <path d="M17 12C17 7.5 14 3.5 10 2C5.5 3 2 7 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12H17Z" :fill="color" opacity="0.8" />
      <path d="M8 13H16" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
      <path d="M10 16H14" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
    </template>

    <!-- 欲望（心形火焰） -->
    <template v-if="name === 'desire'">
      <path d="M12 20C12 20 6 15 6 11C6 8.5 7.5 7 9 7C10 7 11 7.5 11.5 8.5C12 7.5 13 7 14 7C15.5 7 17 8.5 17 11C17 15 12 20 12 20Z" :fill="color" />
      <path d="M19 8L20 10L22 11L20 12L19 14L18 12L16 11L18 10Z" :fill="color" opacity="0.6" transform="translate(0,-1)" />
    </template>

    <!-- 意志（盾牌） -->
    <template v-if="name === 'will'">
      <path d="M12 2L3 6V11C3 16.5 7 21.5 12 23C17 21.5 21 16.5 21 11V6L12 2Z" :fill="color" opacity="0.8" />
      <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />
    </template>

    <!-- 理智（眼睛） -->
    <template v-if="name === 'sanity'">
      <circle cx="12" cy="12" r="9" :fill="color" opacity="0.15" />
      <circle cx="12" cy="12" r="6" :fill="color" opacity="0.3" />
      <circle cx="12" cy="12" r="3" :fill="color" />
      <circle cx="10" cy="10" r="1" fill="white" />
    </template>

    <!-- 魔杖 -->
    <template v-if="name === 'wand'">
      <path d="M8 16L18 6" stroke="white" stroke-width="2" stroke-linecap="round" />
      <path d="M12 4L14 6" stroke="white" stroke-width="1.5" />
      <path d="M6 18L8 20" stroke="white" stroke-width="1" />
      <circle cx="18" cy="6" r="3" :fill="color" />
      <path d="M18 3V9M15 6H21" stroke="white" stroke-width="1" />
    </template>

    <!-- 魔杖+星光（工具图标） -->
    <template v-if="name === 'tools'">
      <path d="M6 18L16 8" stroke="white" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="16" cy="8" r="3" :fill="color" />
      <path d="M8 16L6 18L8 20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M16 5V11M13 8H19" stroke="white" stroke-width="1" />
    </template>

    <!-- 选项（列表/菜单） -->
    <template v-if="name === 'options'">
      <circle cx="6" cy="6" r="2" :fill="color" />
      <circle cx="6" cy="12" r="2" :fill="color" />
      <circle cx="6" cy="18" r="2" :fill="color" />
      <path d="M11 6H20" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M11 12H20" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M11 18H20" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
    </template>

    <!-- 移动（指南针/方向） -->
    <template v-if="name === 'move'">
      <circle cx="12" cy="12" r="9" :stroke="color" stroke-width="1.5" opacity="0.4" />
      <path d="M12 3L14 9L12 7.5L10 9L12 3Z" :fill="color" />
      <path d="M12 21L10 15L12 16.5L14 15L12 21Z" :fill="color" />
      <path d="M3 12L9 14L7.5 12L9 10L3 12Z" :fill="color" />
      <path d="M21 12L15 10L16.5 12L15 14L21 12Z" :fill="color" />
    </template>

    <!-- 角色标识：伊莉雅（星+心组合） -->
    <template v-if="name === 'illya'">
      <path d="M12 4L14 9L19 11L14 13L12 18L10 13L5 11L10 9Z" :fill="color" />
      <circle cx="12" cy="11" r="3" fill="white" opacity="0.5" />
    </template>

    <!-- 角色标识：美游（月） -->
    <template v-if="name === 'miyu'">
      <path d="M16 4C10 4 5 8 5 14C5 20 10 24 16 24C13 22 11 18 11 14C11 10 13 6 16 4Z" :fill="color" />
      <circle cx="18" cy="8" r="1.5" fill="white" opacity="0.6" />
    </template>

    <!-- 角色标识：小黑（焰） -->
    <template v-if="name === 'kuro'">
      <path d="M12 2C12 2 8 6 8 10C8 12 10 14 12 14C14 14 16 12 16 10C16 6 12 2 12 2Z" :fill="color" />
      <path d="M10 14C10 14 9 16 10 18C10.5 19 12 19.5 12 19.5" :stroke="color" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
      <path d="M12 19.5C12 19.5 13 20 13.5 21" :stroke="color" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
    </template>

    <!-- 角色标识：士郎（盾） -->
    <template v-if="name === 'shirou'">
      <path d="M12 3L4 6.5V12C4 17 7.5 21.5 12 23C16.5 21.5 20 17 20 12V6.5L12 3Z" :fill="color" opacity="0.8" />
      <path d="M10 12L12 14L15 10" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <!-- 角色标识：user/轻音（音符） -->
    <template v-if="name === 'user'">
      <circle cx="8" cy="18" r="3" :fill="color" />
      <path d="M11 18V4L21 6V16" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="19" cy="16" r="3" :fill="color" />
      <path d="M11 8L21 10" :stroke="color" stroke-width="1.5" />
    </template>

    <!-- 保存 -->
    <template v-if="name === 'save'">
      <path d="M5 5H16L19 8V19C19 20 18 21 17 21H5C4 21 3 20 3 19V7C3 6 4 5 5 5Z" :stroke="color" stroke-width="1.5" fill="none" />
      <path d="M7 5V9H15V5" :fill="color" opacity="0.3" />
      <path d="M7 14H15V21H7V14Z" :fill="color" opacity="0.2" />
      <path d="M9 16H13" :stroke="color" stroke-width="1" stroke-linecap="round" />
    </template>

    <!-- 重置 -->
    <template v-if="name === 'reset'">
      <path d="M5 12C5 8 8 5 12 5C15 5 17.5 7 18.5 9.5" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M19 12C19 16 16 19 12 19C9 19 6.5 17 5.5 14.5" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M15 9H19V5" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M9 15H5V19" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <!-- 身体状态 -->
    <template v-if="name === 'body-status'">
      <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" :stroke="color" stroke-width="1.5" fill="none" />
      <path d="M8 12H10L11 8L13 16L14 12H16" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="12" cy="7" r="1.5" :fill="color" />
    </template>

    <!-- 故事记录 -->
    <template v-if="name === 'story'">
      <path d="M6 3H18C19 3 20 4 20 5V19C20 20 19 21 18 21H6C5 21 4 20 4 19V5C4 4 5 3 6 3Z" :stroke="color" stroke-width="1.5" fill="none" />
      <path d="M8 7H16" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M8 11H16" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M8 15H13" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M21 7L19 5" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="19" cy="9" r="2" :fill="color" opacity="0.4" />
    </template>

    <!-- 服装 -->
    <template v-if="name === 'outfit'">
      <path d="M7 4H17L20 8H17V20H7V8H4L7 4Z" :stroke="color" stroke-width="1.5" fill="none" stroke-linejoin="round" />
      <path d="M10 8V12" :stroke="color" stroke-width="1" stroke-linecap="round" />
      <path d="M14 8V12" :stroke="color" stroke-width="1" stroke-linecap="round" />
      <path d="M9 14C9 14 10.5 16 12 16C13.5 16 15 14 15 14" :stroke="color" stroke-width="1" stroke-linecap="round" fill="none" />
    </template>

    <!-- 表情 -->
    <template v-if="name === 'expression'">
      <circle cx="12" cy="12" r="9" :stroke="color" stroke-width="1.5" fill="none" />
      <circle cx="9" cy="10" r="1.5" :fill="color" />
      <circle cx="15" cy="10" r="1.5" :fill="color" />
      <path d="M8 15C8 15 9.5 18 12 18C14.5 18 16 15 16 15" :stroke="color" stroke-width="1.5" stroke-linecap="round" fill="none" />
    </template>

    <!-- 药依赖 pill -->
    <template v-if="name === 'drug'">
      <rect x="7" y="4" width="10" height="16" rx="5" :fill="color" opacity="0.7" />
      <rect x="7" y="4" width="10" height="8" rx="5" fill="white" opacity="0.4" />
      <line x1="10" y1="10" x2="10" y2="14" stroke="white" stroke-width="1" opacity="0.5" />
      <line x1="14" y1="10" x2="14" y2="14" stroke="white" stroke-width="1" opacity="0.5" />
    </template>

    <!-- 奴化 chain -->
    <template v-if="name === 'chain'">
      <path d="M8 12C8 8 10 5 14 5C16 5 17 6 17 8" :stroke="color" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M16 12C16 16 14 19 10 19C8 19 7 18 7 16" :stroke="color" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="12" cy="12" r="3" :fill="color" opacity="0.5" />
    </template>

    <!-- 堕落 broken-heart -->
    <template v-if="name === 'corrupt'">
      <path d="M12 19C12 19 6 14 6 10C6 8 7 6.5 9 6.5C10 6.5 11 7 12 8.5C13 7 14 6.5 15 6.5C17 6.5 18 8 18 10C18 14 12 19 12 19Z" :fill="color" opacity="0.6" />
      <path d="M11 8L9 11L12 11.5L10 14" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </template>

    <!-- 善恶 balance -->
    <template v-if="name === 'balance'">
      <path d="M4 8H20" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M12 8V18" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="6" cy="16" r="3" :fill="color" opacity="0.3" />
      <circle cx="18" cy="16" r="3" :fill="color" opacity="0.7" />
      <path d="M8 18C8 18 10 20 12 20C14 20 16 18 16 18" :stroke="color" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.5" />
    </template>

    <!-- 重新生成 -->
    <template v-if="name === 'regen'">
      <path d="M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12" :stroke="color" stroke-width="1.5" stroke-linecap="round" fill="none" />
      <path d="M12 8L16 12L12 16" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M16 12H8" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
    </template>

    <!-- 编辑 -->
    <template v-if="name === 'edit'">
      <path d="M16 3L21 8L9 20H4V15L16 3Z" :fill="color" opacity="0.3" />
      <path d="M16 3L21 8" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M4 20L9 15" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M14 5L19 10" :stroke="color" stroke-width="1" stroke-linecap="round" opacity="0.5" />
    </template>

    <!-- 关闭 x -->
    <template v-if="name === 'close'">
      <path d="M6 6L18 18" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <path d="M18 6L6 18" :stroke="color" stroke-width="2" stroke-linecap="round" />
    </template>

    <!-- 箭头 右 -->
    <template v-if="name === 'arrow-right'">
      <path d="M5 12H19" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M14 7L19 12L14 17" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </template>

    <!-- 箭头 上/下 -->
    <template v-if="name === 'arrow-up'">
      <path d="M12 5V19" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M7 10L12 5L17 10" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </template>
    <template v-if="name === 'arrow-down'">
      <path d="M12 19V5" :stroke="color" stroke-width="1.5" stroke-linecap="round" />
      <path d="M7 14L12 19L17 14" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </template>
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  size?: number
  color?: string
  glow?: boolean
}>(), {
  size: 24,
  color: '#C71585',
  glow: false,
})

const viewBox = '0 0 24 24'
</script>

<style scoped>
.illya-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>