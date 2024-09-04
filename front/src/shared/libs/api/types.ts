import { Ref } from 'vue';
import { AxiosRequestConfig } from 'axios';

export interface IApiState<T> {
  loading?: boolean;
  success?: boolean;
  error?: string | null;
  data?: T | null;
}

export interface IAxiosResponse<T> {
  responseData?: T;
  status?: {
    code: number;
    message: string;
  };
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface IUseAxiosWrapperReturnType<T, D> {
  isLoading: Ref<boolean>;
  status: Ref<AsyncStatus>;
  data: Ref<T | null>;
  error: Ref<Error | null>;
  errorMsg: Ref<string | null>;
  execute: (payload?: D, config?: AxiosRequestConfig) => Promise<void>;
  reset: () => void;
}
