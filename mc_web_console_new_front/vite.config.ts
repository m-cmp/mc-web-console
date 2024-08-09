import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), viteCommonjs()],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm.js',
      find: '@',
      '@': path.resolve(__dirname, './src'),
    },
  },
});
