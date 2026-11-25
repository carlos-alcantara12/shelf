/** "Do mesmo gênero": três obras do mesmo gênero dos resultados, em uma faixa abaixo da grade. */
export default function Suggestions({ books, loading, addedBooks, busyId, onWish }) {
  return (
    <section className="cat-card-panel" aria-labelledby="cat-suggestions-title">
      <h2 id="cat-suggestions-title" className="cat-panel__title">Do mesmo gênero</h2>
      <ul className="cat-suggestions">
        {books.map((book) => (
          <li key={book.id} className="cat-suggestion">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt=""
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                  event.currentTarget.nextElementSibling.hidden = false;
                }}
              />
            ) : null}
            <span className="cat-suggestion__placeholder" aria-hidden="true" hidden={Boolean(book.cover_url)} />
            <div>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
            </div>
            <button
              type="button"
              disabled={busyId !== null || Boolean(addedBooks[book.id])}
              onClick={() => onWish(book, "WANT_TO_READ")}
              aria-label={addedBooks[book.id] ? `${book.title} já está na sua biblioteca` : `Adicionar ${book.title} à lista de desejos`}
            >
              {addedBooks[book.id] ? "✓" : "+"}
            </button>
          </li>
        ))}
      </ul>
      {loading && <p className="cat-muted" role="status">Buscando…</p>}
    </section>
  );
}
