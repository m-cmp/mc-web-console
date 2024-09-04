import { defineStore } from 'pinia';

export const useAuthenticationStore = defineStore('authentication', {
  state: () => ({
    accessToken: null,
    refreshToken: null,
    login: false,
  }),
  actions: {
    onLogin() {
      this.login = true;
    },
    onLogout() {
      this.login = false;
    },
  },
});
