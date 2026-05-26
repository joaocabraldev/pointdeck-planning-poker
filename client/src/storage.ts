class storage {
  static setItem = (key: string, value: unknown) =>
    localStorage.setItem(key, JSON.stringify(value));

  static getItem = <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  };

  static removeItem = (key: string) => localStorage.removeItem(key);

  static clear = () => localStorage.clear();
}

export { storage };
