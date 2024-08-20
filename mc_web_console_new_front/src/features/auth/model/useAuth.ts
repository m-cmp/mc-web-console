import { useLocalStorage } from '@/shared/libs/access-localstorage';
import { IUserResponse } from '@/entities';
import { useAuthStore } from '@/shared/libs/store/auth';
import { jwtDecode } from 'jwt-decode';


const LOGIN_AUTH = 'LOGIN_AUTH';

export function useAuth() {
  const sessionUser = useLocalStorage<
    Pick<
      IUserResponse,
      'access_token' | 'refresh_token' | 'role' | 'expires_in'
    > & { id: string }
  >(LOGIN_AUTH);

  const authStore = useAuthStore();

  function pareseJWT(token: any) {
    let decodedToken: any = {};
    try {
      decodedToken = jwtDecode(token);
    } catch (e) {
      console.log(e);
    }
    return decodedToken;
  }

  function setUser(props: IUserResponse & { id: string }) {
    if (props.access_token) {
      const decodedToken = pareseJWT(props.access_token);
      props.role = decodedToken.realm_access.roles[0];
    }

    const userData = {
      id: props.id,
      role: props.role,
      access_token: props.access_token,
      refresh_token: props.refresh_token,
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

  function loadUser() {
    let role = '';

    if (sessionUser.data.value.access_token) {
      const decodedToken = pareseJWT(sessionUser.data.value.access_token);
      role = decodedToken.realm_access.roles[0];
    }
    const userData = {
      id: sessionUser.data.value.id,
      role: role,
      access_token: sessionUser.data.value.access_token,
      refresh_token: sessionUser.data.value.refresh_token,
      expires_in: sessionUser.data.value.expires_in,
    };

    authStore.onLogin(userData);
  }

  return { sessionUser, setUser, getUser, loadUser };
}
