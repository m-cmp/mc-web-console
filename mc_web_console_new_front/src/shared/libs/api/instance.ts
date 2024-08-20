import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/shared/libs/store/auth';
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

export const axiosInstance = createInstance();

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
        const resLogin = await axios.post(
          url + '/LoginRefresh',
          {
            request: {
              refresh_token: authStore.refresh_token,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${authStore.access_token}`,
            },
          },
        );
        auth.setUser({
          ...resLogin.data.responseData,
          id: authStore.id,
          role: authStore.role,
        });
        return axiosInstance(originalRequest);
      } catch (error) {
        alert('사용자 인증 만료');
        McmpRouter.getRouter()
          .push({ name: AUTH_ROUTE.LOGIN._NAME })
          .catch(() => {});
      }
    }
    return Promise.reject(error);
  },
);

