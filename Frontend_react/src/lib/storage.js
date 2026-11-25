// Acesso seguro ao localStorage: o navegador pode bloqueá-lo (modo privado, políticas).

export const STORAGE_KEYS = {
  accessToken: "mybooks:access-token",
  refreshToken: "mybooks:refresh-token",
  username: "mybooks:username",
};

export function readStoredValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A sessão ainda pode ser usada enquanto esta página permanecer aberta.
  }
}

export function removeStoredValue(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // O armazenamento pode estar bloqueado pelo navegador.
  }
}
