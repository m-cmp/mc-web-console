import { AuthorizationType } from '../store/authorizationStore.ts';

export interface ILoginData {
  role: AuthorizationType;
  autoLogin: boolean;
}
