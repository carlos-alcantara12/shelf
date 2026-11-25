import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchAllPages } from "@/lib/api";

// Estado da biblioteca pessoal compartilhado entre as telas logadas:
// a lista de livros e o livro aberto no diálogo de detalhes.

const LibraryContext = createContext(null);

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const withEntry = (list, entry) => [entry, ...list.filter((item) => item.id !== entry.id)];

export function LibraryProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [pulledBookId, setPulledBookId] = useState(null);
  const [openedEntry, setOpenedEntry] = useState(null);
  const [isClosingBook, setIsClosingBook] = useState(false);
  const transitionTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(transitionTimerRef.current), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    fetchAllPages("/library/", { signal: controller.signal })
      .then(setEntries)
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  const openBook = useCallback((entry) => {
    window.clearTimeout(transitionTimerRef.current);
    setIsClosingBook(false);
    setPulledBookId(entry.id);
    if (prefersReducedMotion()) {
      setOpenedEntry(entry);
      return;
    }
    transitionTimerRef.current = window.setTimeout(() => {
      setOpenedEntry(entry);
      transitionTimerRef.current = null;
    }, 180);
  }, []);

  const closeBook = useCallback(() => {
    window.clearTimeout(transitionTimerRef.current);
    const finish = () => {
      setOpenedEntry(null);
      setPulledBookId(null);
      setIsClosingBook(false);
      transitionTimerRef.current = null;
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    setIsClosingBook(true);
    transitionTimerRef.current = window.setTimeout(finish, 220);
  }, []);

  /** Livro recém-adicionado pelo catálogo: entra na lista e a biblioteca é recarregada. */
  const addEntry = useCallback(
    (entry) => {
      setEntries((current) => withEntry(current, entry));
      reload();
    },
    [reload],
  );

  /** Coloca o livro na lista e o abre no diálogo de detalhes. */
  const showEntry = useCallback(
    (entry) => {
      setEntries((current) => withEntry(current, entry));
      openBook(entry);
    },
    [openBook],
  );

  const updateEntry = useCallback((updated) => {
    setEntries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setOpenedEntry(updated);
  }, []);

  const removeEntry = useCallback((entryId) => {
    setEntries((current) => current.filter((item) => item.id !== entryId));
  }, []);

  const value = useMemo(
    () => ({
      entries,
      loading,
      loadError,
      reload,
      pulledBookId,
      openedEntry,
      isClosingBook,
      openBook,
      closeBook,
      addEntry,
      showEntry,
      updateEntry,
      removeEntry,
    }),
    [
      entries,
      loading,
      loadError,
      reload,
      pulledBookId,
      openedEntry,
      isClosingBook,
      openBook,
      closeBook,
      addEntry,
      showEntry,
      updateEntry,
      removeEntry,
    ],
  );
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary precisa estar dentro de <LibraryProvider>.");
  return context;
}
