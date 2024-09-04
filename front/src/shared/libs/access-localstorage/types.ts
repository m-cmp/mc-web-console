import { AuthorizationType } from '@/shared/libs/store/auth';

export interface ILoginData {
  role: AuthorizationType;
  autoLogin: boolean;
}
