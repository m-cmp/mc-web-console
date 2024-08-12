import { AuthorizationType } from '@/entities/user/store/authorizationStore.ts';

export interface ILoginData {
  role: AuthorizationType;
  autoLogin: boolean;
}
