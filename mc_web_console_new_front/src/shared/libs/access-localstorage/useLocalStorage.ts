import { ref, watch, Ref } from 'vue';

export function useLocalStorage<T>(
  key: string,
  defaultValue?: T,
  validator: ((value: T) => boolean) | null = null,
  transformer: ((value: T) => T) | null = null,
): { data: Ref<T>; setItem: (value: T) => void; removeItem: () => void } {
  const storedValue = localStorage.getItem(key);
  const data: any = ref(
    storedValue ? (JSON.parse(storedValue) as T) : defaultValue,
  );

  const setItem = (newValue: T) => {
    if (validator && !validator(newValue)) {
      console.warn(`Validation failed for ${key}:`, newValue);
      return;
    }

    const transformedValue = transformer ? transformer(newValue) : newValue;
    data.value = transformedValue;
    localStorage.setItem(key, JSON.stringify(transformedValue));
  };

  const removeItem = () => {
    data.value = defaultValue; // 데이터 초기화
    localStorage.removeItem(key);
  };

  watch(data, (newValue, oldValue) => {
    if (newValue !== oldValue) {
      setItem(newValue);
    }
  });

  return { data, setItem, removeItem };
}
