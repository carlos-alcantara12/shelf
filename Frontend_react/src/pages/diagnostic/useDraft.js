import { useCallback, useState } from "react";
import { clearDraft, loadDraft, saveDraft } from "@/lib/diagnostic";

/** Rascunho do diagnóstico em estado do React, sempre espelhado no localStorage. */
export function useDraft() {
  const [draft, setDraft] = useState(loadDraft);

  /** `patch` é um objeto ou uma função `(rascunhoAtual) => objeto`. */
  const update = useCallback((patch) => {
    setDraft((current) => {
      const base = current || { level: 2, answers: {}, step: null };
      const next = { ...base, ...(typeof patch === "function" ? patch(base) : patch) };
      saveDraft(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    clearDraft();
    setDraft(null);
  }, []);

  return { draft, update, clear };
}
