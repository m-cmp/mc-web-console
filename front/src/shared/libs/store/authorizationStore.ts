import { defineStore } from 'pinia';

export type AuthorizationType = null | 'admin' | 'client';

export const useAuthorizationStore = defineStore('authorization', {
  state: (): { role: AuthorizationType } => ({
    role: null,
  }),
  actions: {
    setRole(role: AuthorizationType) {
      this.role = role;
    },
  },
});
