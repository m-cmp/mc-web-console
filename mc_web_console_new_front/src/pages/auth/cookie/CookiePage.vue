<script setup lang="ts">
import { PButton } from '@cloudforet-test/mirinae';
import {axiosInstance} from "@/shared/libs";

const iframeURL = 'http://localhost:9090';

async function setServerCookie() {
  try {
    const res = await axiosInstance.get('/set-server-cookie');
    console.log(res.data);
  } catch (error) {
    console.log(error);
  }
}

async function setClientCookie() {
  document.cookie =
    'clientCookie=클라이언트에 대한 정보; path=/; max-age=3600; SameSite=None; Secure;';
  alert('Client cookie is set');
}

async function readCookies() {
  try {
    const res = await axiosInstance.get('/read-cookies');
    console.log('서버에서 받은 쿠키들');
    console.log(res.data);
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="flex-col h-full">
    <div class="btn-box">
      <p-button @click="setServerCookie()"> get server cookie</p-button>
      <p-button @click="setClientCookie()"> get client cookie</p-button>
      <p-button @click="readCookies()"> read cookies</p-button>
    </div>
    <section class="iframe-box h-full">
      <h2>Iframe Example</h2>
      <iframe class="w-4/6 h-5/6" :src="iframeURL" />
    </section>
  </div>
</template>

<style scoped lang="postcss">
.iframe-box {
  border: 1px solid blue;
}
</style>
