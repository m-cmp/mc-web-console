import { defineStore } from 'pinia';
import { IUserResponse } from '@/entities';

export type AuthorizationType = null | 'admin' | 'client';

type IAuthStore = Pick<IUserResponse, 'role'> & {
  id: string;
  isLogin: boolean;
};

export const useAuthStore = defineStore('auth', {
  state: (): IAuthStore => ({
    id: '',
    role: '',
    isLogin: false,
  }),
  actions: {
    onLogin(loginData: Omit<IAuthStore, 'isLogin'>) {
      this.id = loginData.id;
      this.role = loginData.role;
      this.isLogin = true;
    },
    onLogout() {
      this.isLogin = false;
    },
  },
});
