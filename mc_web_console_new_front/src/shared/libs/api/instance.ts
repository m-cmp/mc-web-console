import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/shared/libs/store/auth';
import { axiosPost } from '@/shared/libs';
import { IUserResponse } from '@/entities';
import { useAuth } from '@/features/auth/model/useAuth.ts';
import { McmpRouter } from '@/app/providers/router';
import { AUTH_ROUTE } from '@/pages/auth/auth.route.ts';
// const url = 'http://mcmpdemo.csesmzc.com:3000';
const url = import.meta.env.VITE_BACKEND_ENDPOINT;
const createInstance = () => {
  return axios.create({
    baseURL: `${url}`,
    // withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const axiosInstance = createInstance(); //http://localhost:3000/test

axiosInstance.interceptors.request.use(config => {
  const authStore = useAuthStore();
  const token = authStore.access_token;

  if (token) config.headers.Authorization = `Bearer ${authStore.access_token}`;

  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } =
      error.config || {};

    if (error.response?.status === 405 && !originalRequest._retry) {
      originalRequest._retry = true;

      const authStore = useAuthStore();
      const auth = useAuth();

      if (!authStore.refresh_token) {
        McmpRouter.getRouter()
          .push({ name: AUTH_ROUTE.LOGIN._NAME })
          .catch(() => {});
      }

      try {
        const resLogin = await axiosPost<IUserResponse>('LoginRefresh', {
          requestBody: {
            refresh_token: authStore.refresh_token,
          },
        });

        auth.setUser({
          ...resLogin.data,
          id: authStore.id,
          role: authStore.role,
        });

        return axiosInstance(originalRequest);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    if (originalRequest._retry) {
      McmpRouter.getRouter()
        .push({ name: AUTH_ROUTE.LOGIN._NAME })
        .catch(() => {});
    }
    return Promise.reject(error);
  },
);

/*
 * 1. 요청을 보냈지만 405 error
 * 2. 405시 refresh token을 헤더에 담아서 재발급 api에 전송
 * 3. 받아온 access token과 refresh token을 저장
 * 3. refresh token도 만료 되었을 경우에 로그인 로직으로
 * */
