export interface IApiState<T> {
  loading?: boolean;
  success?: boolean;
  error?: Error | null;
  data?: T | null;
}
