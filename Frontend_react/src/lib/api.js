// Cliente único da API: autenticação, renovação de token e tratamento de erros.
//
// Toda tela usa `apiRequest`; nenhuma precisa saber de token. Quando o token
// de acesso expira (401), ele é renovado uma única vez, mesmo que várias
// requisições falhem ao mesmo tempo, e a requisição original é repetida.
// Se a renovação falhar, a sessão é encerrada e `subscribeSession` avisa a
// aplicação, que leva a pessoa de volta para a tela de entrada.

import { readStoredValue, removeStoredValue, STORAGE_KEYS, writeStoredValue } from "./storage";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre novamente.";
const DISCOVERY_INTERVAL_MS = 1150;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------- Sessão ----------

const sessionListeners = new Set();

function notifySession() {
  sessionListeners.forEach((listener) => listener());
}

export function subscribeSession(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function getAccessToken() {
  return readStoredValue(STORAGE_KEYS.accessToken) || "";
}

export function getStoredUsername() {
  return readStoredValue(STORAGE_KEYS.username) || "";
}

export function saveSession({ access, refresh, username }) {
  writeStoredValue(STORAGE_KEYS.accessToken, access);
  writeStoredValue(STORAGE_KEYS.refreshToken, refresh);
  if (username) writeStoredValue(STORAGE_KEYS.username, username);
  notifySession();
}

export function clearSession() {
  removeStoredValue(STORAGE_KEYS.accessToken);
  removeStoredValue(STORAGE_KEYS.refreshToken);
  removeStoredValue(STORAGE_KEYS.username);
  notifySession();
}

let refreshInFlight = null;

function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refresh = readStoredValue(STORAGE_KEYS.refreshToken);
      if (!refresh) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);
      const refreshed = await response.json();
      writeStoredValue(STORAGE_KEYS.accessToken, refreshed.access);
      notifySession();
      return refreshed.access;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// ---------- Fila da busca externa (limite de 1 requisição por segundo) ----------

let discoveryQueue = Promise.resolve();
let lastDiscoveryAt = 0;

function abortError() {
  return new DOMException("A solicitação foi cancelada.", "AbortError");
}

function wait(delay, signal) {
  if (signal?.aborted) return Promise.reject(abortError());
  if (delay <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    function onAbort() {
      window.clearTimeout(timer);
      reject(abortError());
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delay);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function queueDiscoveryRequest(signal) {
  const scheduled = discoveryQueue
    .catch(() => {})
    .then(async () => {
      await wait(Math.max(0, DISCOVERY_INTERVAL_MS - (Date.now() - lastDiscoveryAt)), signal);
      if (signal?.aborted) throw abortError();
      lastDiscoveryAt = Date.now();
    });
  discoveryQueue = scheduled.catch(() => {});
  return scheduled;
}

const isDiscoveryPath = (path) => path.split("?")[0].endsWith("/books/discover/");

// ---------- Requisição autenticada ----------

function send(path, options, token) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

async function readBody(response, path) {
  const text = await response.text();
  if (!text) return response.status === 204 ? {} : null;
  try {
    return JSON.parse(text);
  } catch {
    // HTML com erro 5xx é a página de erro do próprio backend (por exemplo, migração pendente no banco);
    // HTML com outro status indica que o /api/ não está chegando ao Django.
    if (response.status >= 500) {
      throw new ApiError(
        `O servidor encontrou um erro ao processar o pedido (código ${response.status}). Tente de novo em instantes.` +
          (import.meta.env.DEV ? " Em desenvolvimento, veja o terminal do backend; se o código foi atualizado, rode: python manage.py migrate." : ""),
        response.status,
      );
    }
    throw new ApiError(
      `A API respondeu com HTML em ${API_BASE_URL}${path.split("?")[0]}. Verifique se o servidor encaminha /api/ para o backend Django.`,
      response.status,
    );
  }
}

function errorMessage(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  const first = data && typeof data === "object" ? Object.values(data).flat()[0] : null;
  if (typeof first === "string") return first;
  return `Não foi possível concluir esta ação (erro ${status}).`;
}

function retryDelayFor(response, data) {
  const header = Number(response.headers.get("Retry-After")) || 0;
  const match = String(data?.detail || "").match(/(?:em|in)\s+(\d+(?:[.,]\d+)?)\s+segundo/i);
  const fromMessage = match ? Number(match[1].replace(",", ".")) : 0;
  return Math.max(DISCOVERY_INTERVAL_MS, Math.max(header, fromMessage) * 1000 + 150);
}

/**
 * Faz uma requisição autenticada e devolve o JSON da resposta.
 * `options` aceita o mesmo que `fetch` (method, body como string JSON, signal).
 */
export async function apiRequest(path, options = {}) {
  const { signal } = options;
  const discovery = isDiscoveryPath(path);
  if (discovery) await queueDiscoveryRequest(signal);

  let response = await send(path, options, getAccessToken());
  if (response.status === 401) {
    let token;
    try {
      token = await refreshAccessToken();
    } catch (error) {
      clearSession();
      throw error;
    }
    response = await send(path, options, token);
  }

  let data = await readBody(response, path);
  if (response.status === 429 && discovery) {
    await wait(retryDelayFor(response, data), signal);
    response = await send(path, options, getAccessToken());
    data = await readBody(response, path);
  }

  if (!response.ok) throw new ApiError(errorMessage(data, response.status), response.status);
  if (data === null) {
    throw new ApiError("O servidor respondeu em um formato inesperado. Confira se o backend está funcionando.", response.status);
  }
  return data;
}

/**
 * Requisição sem autenticação, para os endpoints públicos (como o diagnóstico
 * de quem ainda não tem conta). Devolve o JSON da resposta.
 */
export async function publicRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: options.body ? { "Content-Type": "application/json" } : {},
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
  }
  const data = await readBody(response, path);
  if (response.status === 429) {
    throw new ApiError("Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.", 429);
  }
  if (!response.ok) throw new ApiError(errorMessage(data, response.status), response.status);
  if (data === null) {
    throw new ApiError("O servidor respondeu em um formato inesperado. Confira se o backend está funcionando.", response.status);
  }
  return data;
}

/** Percorre todas as páginas de uma lista paginada e devolve os itens juntos. */
export async function fetchAllPages(path, { signal } = {}) {
  const items = [];
  for (let page = 1; ; page += 1) {
    const data = await apiRequest(`${path}${path.includes("?") ? "&" : "?"}page=${page}`, { signal });
    items.push(...(data.results || []));
    if (!data.next) return items;
  }
}

// ---------- Autenticação (sem token) ----------

async function readAuthResponse(response) {
  const body = await response.text();
  if (!body.trim()) {
    throw new ApiError(
      response.ok
        ? "O servidor de autenticação retornou uma resposta vazia. Tente novamente."
        : `O servidor de autenticação retornou uma resposta vazia (HTTP ${response.status}).`,
      response.status,
    );
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new ApiError(
      `O servidor de autenticação respondeu em formato inválido (HTTP ${response.status}). Confira o backend e tente novamente.`,
      response.status,
    );
  }
}

async function postJson(path, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { response, data: await readAuthResponse(response) };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError("Não foi possível conectar ao servidor de autenticação. Verifique o backend e tente novamente.");
    }
    throw error;
  }
}

export async function registerAccount({ username, email, password }) {
  const { response, data } = await postJson("/auth/register/", { username, email, password });
  if (!response.ok) {
    const detail = data.detail || Object.values(data).flat()[0];
    throw new ApiError(typeof detail === "string" ? detail : "Não foi possível criar sua conta.", response.status);
  }
}

export async function requestTokens({ username, password }) {
  const { response, data } = await postJson("/auth/token/", { username, password });
  if (!response.ok) throw new ApiError(data.detail || "Usuário ou senha inválidos.", response.status);
  if (!data.access || !data.refresh) throw new ApiError("O servidor não devolveu os tokens de acesso. Tente novamente.", response.status);
  return data;
}
