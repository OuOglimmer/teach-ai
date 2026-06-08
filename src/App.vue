<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  auth.init()
})
</script>

<template>
  <div v-if="auth.loading" class="h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="text-6xl mb-4">📚</div>
      <div class="text-lg text-gray-500">加载中...</div>
    </div>
  </div>
  <router-view v-else />
</template>
