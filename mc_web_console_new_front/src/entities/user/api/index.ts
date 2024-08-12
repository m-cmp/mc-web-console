import { useAxiosPost } from '@/shared/libs/api/request.ts';
import { IUserResponse } from '@/entities/user/model/types.ts';

const LOGIN_URL = 'api/auth/login';

export function useGetLogin<T extends IUserResponse, D>(loginData: D) {
  const res = useAxiosPost<T, D>(LOGIN_URL, loginData, {});
  return res;
}

// export function useGetLogin<T extends IUserResponse, D = any>(
//     id: string,
//     password: string,
// ) {
//   const httpState = ref<IApiState<T>>({
//     loading: true,
//     success: false,
//     error: null,
//     data: null,
//   });
//
//   axiosPost<T, D>(LOGIN_URL, { id, password }, {}).then(res => {
//     try {
//       httpState.value.loading = false;
//       httpState.value.success = true;
//       httpState.value.data = res.data;
//     } catch (e) {
//       httpState.value.loading = false;
//       httpState.value.success = true;
//       httpState.value.error = e;
//     }
//   });
//
//   return httpState;
// }
