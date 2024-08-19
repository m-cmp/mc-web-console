import { useLocalStorage } from '@/shared/libs/access-localstorage';
import { IUserResponse } from '@/entities';
import { useAuthStore } from '@/shared/libs/store/auth';

const LOGIN_AUTH = 'LOGIN_AUTH';

export function useAuth() {
  const sessionUser =
    useLocalStorage<
      Pick<IUserResponse, 'access_token' | 'role' | 'expires_in'>
    >(LOGIN_AUTH);

  const authStore = useAuthStore();

  function setUser(props: IUserResponse & { id: string }) {
    const userData = {
      id: props.id,
      role: props.role,
      access_token: props.access_token,
      expires_in: props.expires_in,
    };
    sessionUser.setItem(userData);
    authStore.onLogin(props);
  }

  function getUser(): Omit<
    IUserResponse,
    'expires_in' | 'refresh_expires_in'
  > & {
    id: string;
    role: string;
    isLogin: boolean;
  } {
    return authStore.$state;
  }

  return { sessionUser, setUser, getUser };
}
