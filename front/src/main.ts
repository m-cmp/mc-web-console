import { McmpRouter } from '@/app/providers/router';
import MirinaeDesignSystem from '@cloudforet-test/mirinae';
import '@cloudforet-test/mirinae/css/style.css';
import '@cloudforet-test/mirinae/dist/style.css';
import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './app/App.vue';
import './app/style/style.pcss';

const pinia = createPinia();
Vue.use(PiniaVuePlugin);
Vue.use(MirinaeDesignSystem);
Vue.use(VueRouter);

new Vue({
  pinia,
  router: McmpRouter.getRouter(),
  render: h => h(App),
}).$mount('#app');
