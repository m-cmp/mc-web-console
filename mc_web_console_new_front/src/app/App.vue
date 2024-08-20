<script setup lang="ts">
import { useAuth } from '@/features/auth/model/useAuth.ts';

const auth = useAuth();
auth.loadUser();
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style lang="postcss" scoped>
.test-class {
  @apply flex flex-row justify-center;
  border: 1px solid red;
}
</style>
