import { useAxiosPost } from '@/shared/libs/api/request.ts';
import { IAxiosResponse } from '@/shared/libs';

// const LOGIN_URL = 'api/auth/login';

const LOGIN_URL = 'auth/login';
const GET_USER_INFO = 'Getuserinfo';

interface RequestBodyWrapper<D> {
  request: D;
}

export function useGetLogin<T, D>(loginData: D | null) {
  const requestBodyWrapper: RequestBodyWrapper<D | null> = {
    request: loginData,
  };
  return useAxiosPost<IAxiosResponse<T>, RequestBodyWrapper<D | null>>(
    LOGIN_URL,
    requestBodyWrapper,
  );
}

export function useGetUserRole<T, D = any>() {
  return useAxiosPost<T, D | null>(GET_USER_INFO, null);
}
