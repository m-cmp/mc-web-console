export interface IUser {
  id: string;
  password: string;
}

export interface IUserResponse {
  role: string;
  access_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  refresh_token?: string;
}
