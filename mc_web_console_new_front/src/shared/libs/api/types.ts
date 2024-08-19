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
