import axios from 'axios';
import { McmpRouter } from '@/app/providers/router';
import { AUTH_ROUTE } from '@/pages/auth/auth.route.ts';
import { IAxiosResponse } from '@/shared/libs';
import { IUserResponse } from '@/entities';
import { jwtDecode } from 'jwt-decode';
import LocalStorageConnector from '../access-localstorage/localStorageConnector.ts';

interface IJwtToken {
  access_token: string;
  refresh_token: string;
}

const url = import.meta.env.VITE_BACKEND_ENDPOINT;

export default class JwtTokenProvider {
  private static tokenProvider: JwtTokenProvider | null = null;
  private localstorage: LocalStorageConnector<IJwtToken>;
  private REFRESH_TOKEN_URL = 'LoginRefresh';
  private TOKEN_STORAGE = 'MCMP_TOEKN';

  private refresh_token = '';
  private access_token = '';

  constructor() {
    this.localstorage = new LocalStorageConnector<IJwtToken>(
      this.TOKEN_STORAGE,
    );
    console.log(this.localstorage);

    const storeValue = this.localstorage.getValue();
    if (storeValue) {
      this.access_token = storeValue.access_token;
      this.refresh_token = storeValue.refresh_token;
    }
  }

  static getProvider() {
    if (this.tokenProvider === null) {
      this.tokenProvider = new JwtTokenProvider();
    }

    return this.tokenProvider;
  }

  public getTokens(): IJwtToken {
    return {
      refresh_token: this.refresh_token,
      access_token: this.access_token,
    };
  }

  public setTokens(token: IJwtToken) {
    this.refresh_token = token.refresh_token;
    this.access_token = token.access_token;
    this.localstorage.setItem(token);
  }

  public removeToken() {
    this.localstorage.removeItem();
  }

  public async refreshTokens() {
    try {
      const refreshRes = await axios.post<IAxiosResponse<IUserResponse>>(
        url + `/${this.REFRESH_TOKEN_URL}`,
        {
          request: {
            refresh_token: this.refresh_token,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.access_token}`,
          },
        },
      );

      if (!refreshRes.data || !refreshRes.data.responseData) {
        throw new Error('Token refresh error');
      }
      return refreshRes;
    } catch (error) {
      alert('사용자 인증 만료');
      this.removeToken();
      McmpRouter.getRouter()
        .push({ name: AUTH_ROUTE.LOGIN._NAME })
        .catch(() => {});
      return Promise.reject(error);
    }
  }

  public parseAccessToken() {
    let decodedToken: any = {};
    try {
      decodedToken = jwtDecode(this.access_token);
    } catch (e) {
      console.log(e);
    }
    return decodedToken;
  }
}
