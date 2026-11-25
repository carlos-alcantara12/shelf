import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "@/app/LibraryContext";
import { Button } from "@/design-system";
import BookCard from "@/features/catalog/BookCard";
import { FEATURED_GENRES, GenreArtwork, MORE_GENRES } from "@/features/catalog/genres";
import Suggestions from "@/features/catalog/Suggestions";
import { apiRequest } from "@/lib/api";
import { externalBookImportPayload, normalizeCatalogMatch } from "@/lib/books";
import "./catalog.css";

export default function CatalogPage() {
  const navigate = useNavigate();
  const { entries: libraryEntries, addEntry, showEntry } = useLibrary();
  const openInLibrary = (entry) => {
    showEntry(entry);
    navigate("/biblioteca");
  };
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [submittedGenre, setSubmittedGenre] = useState("");
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [rankingBasis, setRankingBasis] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addingBook, setAddingBook] = useState(null);
  const [addedBooks, setAddedBooks] = useState({});
  const [feedback, setFeedback] = useState({});
  const [similarBooks, setSimilarBooks] = useState([]);
  const [recommendationGenre, setRecommendationGenre] = useState("");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);

  useEffect(() => {
    const genreQuery = submittedGenre || results.find((book) => book.genre?.trim())?.genre?.trim() || "";
    setRecommendationGenre(genreQuery);
    if (!genreQuery || !results.length) {
      setSimilarBooks([]);
      setLoadingRecommendations(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoadingRecommendations(true);
    const delay = window.setTimeout(() => {
      const pageToRecommend = submittedGenre ? 2 : 1;
      apiRequest(`/books/discover/?genre=${encodeURIComponent(genreQuery)}&page=${pageToRecommend}`, { signal: controller.signal })
        .then((data) => {
          const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
          const currentBooks = new Set(results.map((book) => `${normalize(book.title)}|${normalize(book.author)}`));
          setSimilarBooks((data.results || []).filter((book) => !currentBooks.has(`${normalize(book.title)}|${normalize(book.author)}`)).slice(0, 3));
        })
        .catch((requestError) => {
          if (requestError.name !== "AbortError") setSimilarBooks([]);
        })
        .finally(() => setLoadingRecommendations(false));
    }, 1100);

    return () => {
      window.clearTimeout(delay);
      controller.abort();
    };
  }, [results, submittedGenre]);
  useEffect(() => {
    if (!submittedSearch && !submittedGenre) return undefined;
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (submittedSearch) params.set("search", submittedSearch);
    if (submittedGenre) params.set("genre", submittedGenre);
    if (submittedGenre) params.set("sort", "popular");
    setLoading(true);
    setError("");
    apiRequest(`/books/discover/?${params.toString()}`, { signal: controller.signal })
      .then((data) => {
        setResults(data.results || []);
        setTotalBooks(data.count || 0);
        setHasNext(Boolean(data.next));
        setHasPrevious(Boolean(data.previous));
        setRankingBasis(data.ranking_basis || "");
        setError(data.warning || "");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [page, submittedSearch, submittedGenre]);

  function submitSearch(event) {
    event.preventDefault();
    const nextSearch = search.trim();
    if (!nextSearch) {
      setError("Digite o título ou autor de uma obra, ou informe um gênero.");
      setResults([]);
      setTotalBooks(0);
      return;
    }
    setPage(1);
    setSubmittedSearch(nextSearch);
    setSubmittedGenre("");
  }

  function searchForSuggestion(value, type = "title") {
    const nextValue = value.trim();
    if (!nextValue) return;
    setError("");
    setPage(1);
    setSearch(type === "genre" ? "" : nextValue);
    setSubmittedSearch(type === "genre" ? "" : nextValue);
    setSubmittedGenre(type === "genre" ? nextValue : "");
  }

  async function addBook(book, requestedCategory) {
    const category = requestedCategory || "WANT_TO_READ";
    if (category === "READ" && !book.total_pages) {
      setFeedback((current) => ({ ...current, [book.id]: "Informe o total de páginas antes de marcar esta obra como lida." }));
      return;
    }
    setAddingBook(book.id);
    setFeedback((current) => ({ ...current, [book.id]: "" }));
    try {
      const catalogBook = book.is_external
        ? await apiRequest("/books/import/", {
          method: "POST",
          body: JSON.stringify(externalBookImportPayload(book)),
        })
        : book;
      const createdEntry = await apiRequest("/library/", {
        method: "POST",
        body: JSON.stringify({
          book_id: catalogBook.id,
          status: category,
          ...(category === "READ" ? { pages_read: book.total_pages } : {}),
        }),
      });
      setAddedBooks((current) => ({ ...current, [book.id]: true }));
      setFeedback((current) => ({ ...current, [book.id]: "Obra adicionada à sua biblioteca." }));
      addEntry(createdEntry);
      if (category === "READING") openInLibrary(createdEntry);
    } catch (requestError) {
      const message = String(requestError.message);
      if (/já est[aá] na sua biblioteca/i.test(message)) {
        setAddedBooks((current) => ({ ...current, [book.id]: true }));
        setFeedback((current) => ({ ...current, [book.id]: "Esta obra já está na sua biblioteca." }));
        if (category === "READING") {
          try {
            const data = await apiRequest(`/library/?search=${encodeURIComponent(book.title)}&page=1`);
            const existingEntry = (data.results || []).find((entry) => (
              normalizeCatalogMatch(entry.book.title) === normalizeCatalogMatch(book.title)
              && normalizeCatalogMatch(entry.book.author) === normalizeCatalogMatch(book.author)
            ));
            if (existingEntry) {
              const readingEntry = existingEntry.status === "WANT_TO_READ"
                ? await apiRequest(`/library/${existingEntry.id}/`, {
                  method: "PATCH",
                  body: JSON.stringify({ pages_read: existingEntry.pages_read || 0, status: "READING" }),
                })
                : existingEntry;
              openInLibrary(readingEntry);
            }
          } catch (lookupError) {
            setFeedback((current) => ({ ...current, [book.id]: lookupError.message }));
          }
        }
      } else {
        setFeedback((current) => ({ ...current, [book.id]: message }));
      }
    } finally {
      setAddingBook(null);
    }
  }

  async function startReading(book) {
    const existingEntry = libraryEntries.find((entry) => entry.book.id === book.id || (
      book.is_external
      && normalizeCatalogMatch(entry.book.title) === normalizeCatalogMatch(book.title)
      && normalizeCatalogMatch(entry.book.author) === normalizeCatalogMatch(book.author)
    ));
    if (!existingEntry) {
      await addBook(book, "READING");
      return;
    }
    if (existingEntry.status === "READING") {
      openInLibrary(existingEntry);
      return;
    }
    if (existingEntry.status !== "WANT_TO_READ") return;
    setAddingBook(book.id);
    setFeedback((current) => ({ ...current, [book.id]: "" }));
    try {
      const updatedEntry = await apiRequest(`/library/${existingEntry.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ pages_read: existingEntry.pages_read || 0, status: "READING" }),
      });
      openInLibrary(updatedEntry);
    } catch (requestError) {
      setFeedback((current) => ({ ...current, [book.id]: requestError.message }));
    } finally {
      setAddingBook(null);
    }
  }

  const genres = showAllGenres ? [...FEATURED_GENRES, ...MORE_GENRES] : FEATURED_GENRES;
  const searched = Boolean(submittedSearch || submittedGenre);

  return (
    <section id="library-content" className="cat" aria-labelledby="explore-title" aria-busy={loading}>
      <header className="cat-header">
        <h1 id="explore-title">Encontre sua próxima leitura</h1>
      </header>

      <form className="cat-search" onSubmit={submitSearch} aria-label="Buscar livros no catálogo">
        <label className="cat-search__field">
          <span className="cat-sr-only">Obra ou autor</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título, autor ou gênero" />
        </label>
        <Button type="submit" disabled={loading}>{loading ? "Buscando…" : "Buscar obras"}</Button>
      </form>

      <section className="cat-genres" aria-labelledby="explore-genres-title">
        <div className="cat-genres__head">
          <h2 id="explore-genres-title">Explore por gênero</h2>
          <button type="button" className="cat-link" aria-expanded={showAllGenres} onClick={() => setShowAllGenres((visible) => !visible)}>
            {showAllGenres ? "Mostrar principais" : "Ver todos os gêneros"}
          </button>
        </div>
        <div className="cat-genres__list">
          {genres.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`cat-genre${submittedGenre === item.name ? " is-active" : ""}`}
              aria-pressed={submittedGenre === item.name}
              onClick={() => searchForSuggestion(item.name, "genre")}
            >
              <GenreArtwork type={item.art} />
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <div className="cat-layout">
        <div className="cat-main">
          <div className="cat-results-head">
            <h2>Resultados</h2>
            {searched && !loading && (
              <span title={submittedGenre && rankingBasis ? `Ordenadas por ${rankingBasis}. Usa dados acumulados dos catálogos, não tendências em tempo real.` : undefined}>
                {totalBooks} {totalBooks === 1 ? "obra" : "obras"}
              </span>
            )}
          </div>
          {error && <p className="cat-error" role="alert">{error}</p>}

          {loading ? (
            <div className="cat-state" role="status"><span className="cat-spinner" aria-hidden="true" />Consultando o catálogo…</div>
          ) : results.length ? (
            <>
              <div className="cat-results" aria-live="polite">
                {results.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    libraryEntry={libraryEntries.find((entry) => entry.book.id === book.id)}
                    added={Boolean(addedBooks[book.id])}
                    feedback={feedback[book.id]}
                    busyId={addingBook}
                    onStart={startReading}
                    onWish={addBook}
                  />
                ))}
              </div>
              {(hasNext || hasPrevious) && (
                <nav className="cat-pager" aria-label="Páginas do catálogo">
                  <button type="button" className="cat-btn" disabled={!hasPrevious || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Anterior</button>
                  <span>Página {page}</span>
                  <button type="button" className="cat-btn" disabled={!hasNext || loading} onClick={() => setPage((value) => value + 1)}>Próxima →</button>
                </nav>
              )}
            </>
          ) : (
            <div className="cat-state cat-state--empty" aria-live="polite">
              <h2>{searched ? "Nenhuma obra encontrada" : "Busque um livro"}</h2>
              {searched && <p>Experimente outro título, autor ou gênero.</p>}
            </div>
          )}

          {results.length > 0 && recommendationGenre && (loadingRecommendations || similarBooks.length > 0) && (
            <aside className="cat-aside" aria-label="Sugestões de livros">
              <Suggestions books={similarBooks} loading={loadingRecommendations} addedBooks={addedBooks} busyId={addingBook} onWish={addBook} />
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
