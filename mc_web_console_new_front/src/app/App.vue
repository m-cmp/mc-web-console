<script setup lang="ts">
// import { PButton } from '@cloudforet-test/mirinae';

import {preAutoLogin} from "@/app/providers/router/auth.ts";

preAutoLogin();
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
