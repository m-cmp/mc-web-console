export default class LocalStorageConnector<T> {
  private key: string;
  private storeValue: T | null = null;

  constructor(key: string) {
    this.key = key;
    try {
      const storeString = localStorage.getItem(key);
      if (storeString) {
        this.storeValue = JSON.parse(storeString) as T;
      }
    } catch (e) {
      console.warn(e);
      this.storeValue = null;
    }
  }

  public removeItem = () => {
    this.storeValue = null;
    localStorage.removeItem(this.key);
  };

  public setItem = (
    newValue: T,
    validator: ((value: T) => boolean) | null = null,
    transformer: ((value: T) => T) | null = null,
  ) => {
    if (validator && !validator(newValue)) {
      console.warn(`Validation failed for ${this.key}:`, newValue);
      return;
    }

    const transformedValue = transformer ? transformer(newValue) : newValue;
    this.storeValue = transformedValue;
    localStorage.setItem(this.key, JSON.stringify(transformedValue));
  };

  public getValue() {
    return this.storeValue;
  }
}
