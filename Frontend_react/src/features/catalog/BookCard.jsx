const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const decimal = (value) => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** Resultado do catálogo: capa, dados da obra e as duas ações (começar a ler / salvar nos desejos). */
export default function BookCard({ book, libraryEntry, added, feedback, busyId, onStart, onWish }) {
  const isFinished = libraryEntry?.status === "READ";
  const isReading = libraryEntry?.status === "READING";
  const isWishlisted = libraryEntry?.status === "WANT_TO_READ" || (added && !libraryEntry);
  const isBusy = busyId === book.id;
  const anyBusy = busyId !== null;

  return (
    <article className="cat-card">
      <div className="cat-card__cover">
        {book.cover_url && (
          <img
            src={book.cover_url}
            alt={`Capa de ${book.title}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true;
              event.currentTarget.nextElementSibling.hidden = false;
            }}
          />
        )}
        <div className="cat-card__fallback" hidden={Boolean(book.cover_url)} aria-hidden="true">
          <strong>{book.title}</strong>
          <span>{book.author}</span>
        </div>
      </div>
      <div className="cat-card__body">
        {book.genre && <p className="cat-card__eyebrow">{book.genre}</p>}
        <h2>{book.title}</h2>
        <p className="cat-card__author">{book.author}</p>
        <ul className="cat-card__facts" aria-label="Dados da obra">
          {book.average_rating != null && (
            <li className="is-rating" aria-label={`Avaliação média ${decimal(book.average_rating)} de 5`}>
              ★ {decimal(book.average_rating)}{book.ratings_count ? ` (${compact.format(book.ratings_count)})` : ""}
            </li>
          )}
          {book.total_pages > 0 && <li>{book.total_pages} páginas</li>}
        </ul>
        <div className="cat-card__actions">
          <button type="button" className="cat-btn cat-btn--primary" disabled={anyBusy || isFinished} onClick={() => onStart(book)}>
            {isBusy ? "Iniciando…" : isFinished ? "Leitura concluída" : isReading ? "Continuar lendo" : "Começar a ler"}
          </button>
          <button type="button" className="cat-btn" disabled={anyBusy || isFinished || isReading || isWishlisted} aria-label={isWishlisted ? `${book.title} já está nos desejos` : `Salvar ${book.title} nos desejos`} onClick={() => onWish(book, "WANT_TO_READ")}>
            {isWishlisted ? "Salvo ✓" : "+ Salvar"}
          </button>
        </div>
        {feedback && <p className={`cat-feedback${added ? " is-success" : ""}`} role="status">{feedback}</p>}
      </div>
    </article>
  );
}
