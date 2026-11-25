// API do perfil de leitor e rascunho das respostas no navegador.
//
// Quem ainda não tem conta responde o questionário sem se cadastrar: as
// respostas ficam no localStorage até o cadastro, quando são enviadas ao servidor.

import { apiRequest, publicRequest } from "./api";
import { readStoredValue, removeStoredValue, writeStoredValue } from "./storage";

const DRAFT_KEY = "shelf:diagnostico";
const RESULT_KEY = "shelf:diagnostico-resultado";
const AUTO_ADVANCE_KEY = "shelf:diagnostico-autoavancar";
const DRAFT_VERSION = 2;
const DRAFT_TTL = 30 * 24 * 60 * 60 * 1000; // rascunhos expiram em 30 dias

/** Os três níveis são camadas do mesmo banco: 1 a 10, 1 a 20, 1 a 40. */
export const LEVELS = [
  {
    level: 1,
    title: "Rápido",
    questions: 10,
    time: "Aprox. 2 min",
    tagline: "Um retrato rápido do seu jeito de ler.",
    gives: ["Seu tipo de leitor", "Seus 3 gêneros principais", "O que você prefere evitar"],
  },
  {
    level: 2,
    title: "Intermediário",
    questions: 20,
    time: "Aprox. 5 min",
    tagline: "Mais precisão: ritmo, foco, tom e traços secundários.",
    gives: ["Tudo do Rápido, com traços secundários", "Seu ritmo, foco e tom preferidos", "Um perfil mais próximo de como você lê"],
    recommended: true,
  },
  {
    level: 3,
    title: "Completo",
    questions: 40,
    time: "Aprox. 10 min",
    tagline: "O mais detalhado: hábitos, motivações e traços finos.",
    gives: ["Tudo do Intermediário", "Seus hábitos e motivações", "Todos os eixos, com a maior precisão"],
  },
];

export const levelInfo = (level) => LEVELS.find((item) => item.level === level);

// ---------- Servidor ----------

export const fetchQuestions = (signal) => publicRequest("/diagnostic/questions/?level=3", { signal });

export const evaluateProfile = ({ level, answers }, signal) =>
  publicRequest("/diagnostic/evaluate/", { method: "POST", body: JSON.stringify({ level, answers }), signal });

/** Livros do catálogo curado que combinam com o perfil. As capas vêm depois, uma a uma (`fetchBookCover`). */
export const fetchRecommendations = ({ level, answers }, signal) =>
  publicRequest("/diagnostic/recommendations/", { method: "POST", body: JSON.stringify({ level, answers }), signal });

/** Capa e dados da obra no catálogo online: { cover_url, book }. `book` serve para salvar na estante. */
export const fetchBookCover = (bookId, signal) => publicRequest(`/diagnostic/books/${bookId}/cover/`, { signal });

export const saveProfile = ({ level, answers }) =>
  apiRequest("/diagnostic/profile/", { method: "PUT", body: JSON.stringify({ level, answers }) });

// ---------- Rascunho no navegador ----------

/**
 * Formato: { v, savedAt, level: 1|2|3, answers: { q01: ..., q02: null }, step: número|null, editing, bankVersion }.
 * `null` numa resposta significa "prefiro não responder"; ausente é "ainda não respondida".
 */
export function loadDraft() {
  const raw = readStoredValue(DRAFT_KEY);
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw);
    const valid =
      draft &&
      [1, 2, 3].includes(draft.level) &&
      draft.answers &&
      typeof draft.answers === "object" &&
      !Array.isArray(draft.answers);
    if (!valid) return null;
    if (draft.savedAt && Date.now() - draft.savedAt > DRAFT_TTL) {
      clearDraft();
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  writeStoredValue(DRAFT_KEY, JSON.stringify({ ...draft, v: DRAFT_VERSION, savedAt: Date.now() }));
}

export function clearDraft() {
  removeStoredValue(DRAFT_KEY);
  removeStoredValue(RESULT_KEY);
}

/** Quantas perguntas já foram respondidas ou puladas. */
export const answeredCount = (draft) => (draft ? Object.keys(draft.answers).length : 0);

// ---------- Último resultado (o relatório sobrevive a recarregar) ----------

const answersKey = (answers) => JSON.stringify(Object.keys(answers).sort().map((key) => [key, answers[key]]));

export function loadCachedResult(answers) {
  const raw = readStoredValue(RESULT_KEY);
  if (!raw) return null;
  try {
    const cached = JSON.parse(raw);
    const fresh = cached.savedAt && Date.now() - cached.savedAt <= DRAFT_TTL;
    return fresh && cached.key === answersKey(answers) ? cached.result : null;
  } catch {
    return null;
  }
}

export function saveCachedResult(answers, result) {
  writeStoredValue(RESULT_KEY, JSON.stringify({ key: answersKey(answers), result, savedAt: Date.now() }));
}

// ---------- Preferência: avançar ao responder ----------

export const getAutoAdvance = () => readStoredValue(AUTO_ADVANCE_KEY) !== "off";
export const setAutoAdvance = (enabled) => writeStoredValue(AUTO_ADVANCE_KEY, enabled ? "on" : "off");
