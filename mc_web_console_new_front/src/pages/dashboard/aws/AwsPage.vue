<script setup lang="ts"></script>

<template>
  <div class="h-5/6">
    <h1>aws page</h1>
    <h1>Grid Test</h1>
    <div class="grid-container">
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
      <div class="grid-test-box">
        <div class="content-test" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.grid-container {
  @apply grid 2xl:grid-cols-7 lg:grid-cols-6 md:grid-cols-5 sm:grid-cols-4 !important;
  height: 100%;
  gap: 5px;
  border: 1px solid #69f6e2;
  padding: 20px;
  margin: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-test-box {
  border: 1px solid green;
  box-sizing: border-box;
  padding: 5px;
  overflow: hidden;
}

.content-test {
  border: 3px solid black;
  height: 100%;
}
</style>
