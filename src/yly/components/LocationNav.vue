<template>
  <div class="loc">
    <div v-for="(area, areaId) in areas" :key="areaId" class="loc-group">
      <span class="loc-area-label">{{ area.icon }} {{ area.label }}</span>
      <div class="loc-facilities">
        <button v-for="fac in area.facilities" :key="fac.id" class="loc-btn" :title="`前往 ${area.label}·${fac.label}`" @click="$emit('move', areaId, fac.id)">
          <span class="loc-icon">{{ fac.icon }}</span>
          <span class="loc-fac-label">{{ fac.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Facility {
  id: string
  label: string
  icon: string
}

interface AreaGroup {
  label: string
  icon: string
  facilities: Facility[]
}

defineProps<{
  areas: Record<string, AreaGroup>
}>()

defineEmits<{
  move: [areaId: string, facilityId: string]
}>()
</script>

<style scoped>
.loc { display: flex; flex-direction: column; gap: 8px; }
.loc-group { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.loc-area-label { font-size: 11px; font-weight: 700; color: var(--c-illya); min-width: 80px; white-space: nowrap; }
.loc-facilities { display: flex; gap: 4px; flex-wrap: wrap; }
.loc-btn { display: flex; align-items: center; gap: 3px; padding: 4px 10px; border-radius: 14px; border: 1.5px solid var(--gold-dim); background: rgba(255,255,255,0.5); color: var(--text-body); font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.2s; white-space: nowrap; }
.loc-btn:hover { border-color: var(--c-illya); background: color-mix(in srgb, var(--c-illya) 8%, transparent); transform: translateY(-1px); }
.loc-icon { font-size: 13px; line-height: 1; }
.loc-fac-label { font-size: 11px; }
</style>