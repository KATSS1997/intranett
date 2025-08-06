export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Erro ao remover:', error);
    }
  }
};

export const cacheStorage = storage;
export const settingsStorage = storage;
export const storageMonitor = {
  watch: () => {},
  unwatch: () => {}
};