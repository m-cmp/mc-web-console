import { IStringIdx } from '@/shared/types';
import { AxiosResponse } from 'axios';
import { ref, UnwrapRef } from 'vue';
import { IApiState } from '@/shared/libs/api/types.ts';
import { axiosInstance } from '@/shared/libs/api/instance.ts';

export function axiosGet<T>(url: string, params?: IStringIdx) {
  return axiosInstance.get<T>(`${url}`, {
    params,
  });
}

export function axiosPost<T, D = any>(
  url: string,
  data: D,
  params?: IStringIdx,
) {
  return axiosInstance.post<T>(`/${url}`, data, {
    params,
  });
}

export function useAjaxWrapper<T>(apiCall: () => Promise<AxiosResponse<T>>) {
  const httpState = ref<IApiState<T>>({
    loading: true,
    success: false,
    error: null,
    data: null,
  });

  const executeApiCall = async () => {
    try {
      const res = await apiCall();
      httpState.value.loading = false;
      httpState.value.success = true;
      httpState.value.data = res.data as UnwrapRef<T>;
    } catch (e: any) {
      httpState.value.loading = false;
      httpState.value.success = false;
      httpState.value.error = e.message || e.toString();
    }
  };

  executeApiCall();

  return httpState;
}

export function useAxiosGet<T>(url: string, params: IStringIdx = {}) {
  const res = useAjaxWrapper<T>(() => axiosGet<T>(url, params));
  return res.value;
}

export function useAxiosPost<T, D = any>(
  url: string,
  data: D,
  params: IStringIdx = {},
) {
  const res = useAjaxWrapper<T>(() => axiosPost<T, D>(url, data, params));
  return res.value;
}
