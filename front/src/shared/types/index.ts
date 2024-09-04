export interface IStringIdx<T = any> {
  [key: string]: T;
}

export type Union<T> = T[keyof T];
