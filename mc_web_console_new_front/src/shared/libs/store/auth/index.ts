import { defineStore } from 'pinia';
import { IUserResponse } from '@/entities';

export type AuthorizationType = null | 'admin' | 'client';

type IAuthStore = Omit<IUserResponse, 'refresh_expires_in'> & {
  id: string;
  isLogin: boolean;
};

export const useAuthStore = defineStore('auth', {
  state: (): IAuthStore => ({
    id: '',
    access_token: '',
    refresh_token: '',
    role: '',
    isLogin: false,
  }),
  actions: {
    onLogin(loginData: Omit<IAuthStore, 'isLogin'>) {
      this.id = loginData.id;
      this.access_token = loginData.access_token;
      this.refresh_token = loginData.refresh_token;
      this.role = loginData.role;
      this.isLogin = true;
    },
    onLogout() {
      this.isLogin = false;
    },
  },
});
