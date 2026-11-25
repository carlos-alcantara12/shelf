import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "@/app/LibraryContext";
import { Button } from "@/design-system";
import BookPreviewDialog from "@/features/catalog/BookPreviewDialog";
import { FEATURED_GENRES, GenreArtwork, MORE_GENRES } from "@/features/catalog/genres";
import { apiRequest } from "@/lib/api";
import BookCover from "@/components/BookCover";
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
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [selected, setSelected] = useState(null);
  const [failedCovers, setFailedCovers] = useState({});

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

  function clearSearch() {
    setSearch("");
    setSubmittedSearch("");
    setSubmittedGenre("");
    setResults([]);
    setTotalBooks(0);
    setPage(1);
    setError("");
  }

  const genres = showAllGenres ? [...FEATURED_GENRES, ...MORE_GENRES] : FEATURED_GENRES;
  const searched = Boolean(submittedSearch || submittedGenre);

  return (
    <section id="library-content" className="cat" aria-labelledby="explore-title" aria-busy={loading}>
      <header className="cat-header">
        <p className="cat-eyebrow">Catálogo</p>
        <h1 id="explore-title">Encontre sua próxima leitura</h1>
        <p className="cat-lead">Busque por título, autor ou gênero. Clique em uma capa para ler o resumo e ver a nota do livro antes de começar.</p>
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
          <div>
            <h2 id="explore-genres-title">Explore por gênero</h2>
            <p>Escolha um gênero para ver as obras mais lidas dele.</p>
          </div>
          <button type="button" className="cat-link" aria-expanded={showAllGenres} onClick={() => setShowAllGenres((visible) => !visible)}>
            {showAllGenres ? "Mostrar principais" : "Ver todos os gêneros"}
          </button>
        </div>
        <ul className="cat-genres__grid">
          {genres.map((item, index) => (
            <li key={item.name} style={{ "--tone": item.tone, "--i": index }}>
              <button
                type="button"
                className={`cat-genre${submittedGenre === item.name ? " is-active" : ""}`}
                aria-pressed={submittedGenre === item.name}
                onClick={() => searchForSuggestion(item.name, "genre")}
              >
                <GenreArtwork type={item.art} />
                <span className="cat-genre__text">
                  <strong>{item.name}</strong>
                  <small>{item.blurb}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="cat-layout">
        <div className="cat-main">
          <div className="cat-results-head">
            <div>
              <h2>Resultados</h2>
              {searched && (
                <p className="cat-filter">
                  {submittedGenre ? <>Gênero: <strong>{submittedGenre}</strong></> : <>Busca: <strong>{submittedSearch}</strong></>}
                  <button type="button" onClick={clearSearch} aria-label="Limpar a busca">Limpar</button>
                </p>
              )}
            </div>
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
              <ul className="cat-covers" aria-live="polite" aria-label="Obras encontradas">
                {results.map((book, index) => (
                  <li key={book.id} style={{ "--i": index }}>
                    <button
                      type="button"
                      className="cat-cover"
                      title={`${book.title}, de ${book.author}`}
                      aria-label={`Ver detalhes de ${book.title}, de ${book.author}`}
                      aria-haspopup="dialog"
                      onClick={() => setSelected(book)}
                    >
                      {book.cover_url && !failedCovers[book.id] ? (
                        <BookCover url={book.cover_url} loading="lazy" onFail={() => setFailedCovers((current) => ({ ...current, [book.id]: true }))} />
                      ) : null}
                      <span className="cat-cover__fallback" hidden={Boolean(book.cover_url) && !failedCovers[book.id]} aria-hidden="true">
                        <strong>{book.title}</strong>
                        <small>{book.author}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
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

        </div>
      </div>
      {selected && (
        <BookPreviewDialog
          key={selected.id}
          book={selected}
          libraryEntry={libraryEntries.find((entry) => entry.book.id === selected.id)}
          added={Boolean(addedBooks[selected.id])}
          feedback={feedback[selected.id]}
          busyId={addingBook}
          onStart={startReading}
          onWish={addBook}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
