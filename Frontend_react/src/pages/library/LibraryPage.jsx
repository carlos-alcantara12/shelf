import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLibrary } from "@/app/LibraryContext";
import { Button } from "@/design-system";
import Bookshelf from "@/features/library/Bookshelf";
import LibraryOverview from "@/features/library/LibraryOverview";
import LibraryToolbar from "@/features/library/LibraryToolbar";
import { normalizeCatalogMatch } from "@/lib/books";
import "./library.css";

const NO_FILTERS = { search: "", status: "" };

function matches(entry, { search, status }) {
  if (status && entry.status !== status) return false;
  if (!search) return true;
  const haystack = normalizeCatalogMatch(`${entry.book.title} ${entry.book.author}`);
  return haystack.includes(normalizeCatalogMatch(search));
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const { entries, loading, loadError, reload, pulledBookId, openBook } = useLibrary();
  const [filters, setFilters] = useState(NO_FILTERS);

  const counts = useMemo(() => {
    const result = { all: entries.length, READING: 0, WANT_TO_READ: 0, READ: 0 };
    entries.forEach((entry) => {
      result[entry.status] = (result[entry.status] || 0) + 1;
    });
    return result;
  }, [entries]);

  const filtersActive = Boolean(filters.search || filters.status);
  const visible = useMemo(() => entries.filter((entry) => matches(entry, filters)), [entries, filters]);
  const currentReading = entries.find((entry) => entry.status === "READING");
  const updateFilters = (patch) => setFilters((current) => ({ ...current, ...patch }));

  let subtitle = "Você ainda não cadastrou nenhum livro.";
  if (entries.length) {
    subtitle = `${counts.all} ${counts.all === 1 ? "livro" : "livros"}`;
    if (counts.READING) subtitle += ` · ${counts.READING} ${counts.READING === 1 ? "em leitura" : "em leitura"}`;
  }

  return (
    <section id="library-content" className="lib" aria-labelledby="library-title" aria-busy={loading}>
      <header className="lib-header">
        <div>
          <h1 id="library-title">Minha biblioteca</h1>
          <p>{subtitle}</p>
        </div>
        <Button onClick={() => navigate("/catalogo")}>＋ Adicionar livro</Button>
      </header>

      <div className="lib-layout">
        <div className="lib-main">
          {entries.length > 0 && (
            <LibraryToolbar filters={filters} onChange={updateFilters} counts={counts} active={filtersActive} />
          )}

          {loadError ? (
            <div className="lib-state" role="alert">
              <h2>Não foi possível abrir a sua biblioteca</h2>
              <p>{loadError}</p>
              <Button onClick={() => reload()}>Tentar novamente</Button>
            </div>
          ) : loading && entries.length === 0 ? (
            <div className="lib-shelf lib-shelf--loading" role="status" aria-label="Carregando sua biblioteca">
              <div className="lib-row">
                <div className="lib-row__books">
                  {Array.from({ length: 6 }, (_, index) => (
                    <span className="lib-skeleton" key={index} style={{ "--spine-height": `${190 + (index % 3) * 18}px` }} />
                  ))}
                </div>
                <div className="lib-plank" aria-hidden="true" />
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="lib-state" aria-live="polite">
              <h2>Sua estante ainda está vazia</h2>
              <p>Adicione o primeiro livro pelo catálogo. Se quiser, faça também o teste de perfil de leitor.</p>
              <div className="lib-state__actions">
                <Button onClick={() => navigate("/catalogo")}>Explorar obras</Button>
                <Link className="ds-button ds-button--ghost ds-button--md" to="/diagnostico">Descobrir meu perfil</Link>
              </div>
            </div>
          ) : visible.length === 0 ? (
            <div className="lib-state" aria-live="polite">
              <h2>Nenhum livro corresponde aos filtros</h2>
              <p>Tente outra busca ou remova algum filtro.</p>
              <Button variant="ghost" onClick={() => setFilters(NO_FILTERS)}>Limpar filtros</Button>
            </div>
          ) : (
            <Bookshelf key={filters.status} entries={visible} canReorder={!filtersActive} reload={reload} openBook={openBook} pulledBookId={pulledBookId} />
          )}
        </div>

        <LibraryOverview counts={counts} currentReading={currentReading} onOpen={openBook} />
      </div>
    </section>
  );
}
