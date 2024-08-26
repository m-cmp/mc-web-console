import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import path from 'path';

// https://vitejs.dev/config/
export default ({ mode }: any) => {
  const env = loadEnv(mode, process.cwd(), '');
  return defineConfig({
    plugins: [vue(), viteCommonjs()],
    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm.js',
        find: '@',
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'https://api.onecloudcon.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '/api'),
        },
      },
    },
  });
};
