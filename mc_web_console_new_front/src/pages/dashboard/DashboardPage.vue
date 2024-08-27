<script setup lang="ts"></script>

<template>
  <div class="flex h-full">
    <aside class="left-side-bar">
      <p class="font-bold">left-side-bar</p>
      <button
        @click="$router.push({ name: `alibaba-dashboard` }).catch(() => {})"
      >
        Alibaba
      </button>
      <button @click="$router.push({ name: `aws-dashboard` })">AWS</button>
    </aside>
    <section class="dashboard-page-main">
      <h1>dashboard page</h1>
      <router-view />
    </section>
  </div>
</template>

<style scoped lang="postcss">
.left-side-bar {
  @apply h-full flex flex-col;
  width: 100px;
  border: 1px solid red;
  align-items: start;
}

.dashboard-page-main {
  @apply h-full;
  border: 1px solid green;
  flex: 1;
}
</style>
