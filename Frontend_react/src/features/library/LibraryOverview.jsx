/** Painel lateral: progresso da coleção inteira e a leitura em andamento. */
export default function LibraryOverview({ counts, currentReading, onOpen }) {
  const total = counts.all;
  const percent = total ? Math.round((counts.READ / total) * 100) : 0;
  const pagesRead = Number(currentReading?.pages_read) || 0;
  const pagesTotal = Number(currentReading?.book.total_pages) || 0;
  const readingPercent = pagesTotal ? Math.min(100, Math.round((pagesRead / pagesTotal) * 100)) : 0;

  return (
    <aside className="lib-aside" aria-label="Resumo da biblioteca">
      <section className="lib-card" aria-labelledby="lib-progress-title">
        <h2 id="lib-progress-title" className="lib-card__title">Seu progresso</h2>
        <p className="lib-stat">
          <strong>{counts.READ}</strong>
          <span>de {total} {total === 1 ? "livro lido" : "livros lidos"}</span>
        </p>
        <div className="lib-meter" role="progressbar" aria-label="Livros lidos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <i style={{ width: `${percent}%` }} />
        </div>
        <ul className="lib-facts">
          <li><span>Lendo agora</span><strong>{counts.READING}</strong></li>
          <li><span>Já lidos</span><strong>{counts.READ}</strong></li>
          <li><span>Lista de desejos</span><strong>{counts.WANT_TO_READ}</strong></li>
        </ul>
      </section>

      <section className="lib-card" aria-labelledby="lib-current-title">
        <h2 id="lib-current-title" className="lib-card__title">Leitura atual</h2>
        {currentReading ? (
          <>
            <button type="button" className="lib-current" onClick={() => onOpen(currentReading)}>
              {currentReading.book.cover_url ? (
                <img src={currentReading.book.cover_url} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />
              ) : (
                <span className="lib-current__cover" aria-hidden="true">{currentReading.book.title.slice(0, 1)}</span>
              )}
              <span className="lib-current__text">
                <strong>{currentReading.book.title}</strong>
                <small>{currentReading.book.author}</small>
              </span>
            </button>
            <div className="lib-meter" role="progressbar" aria-label={`Progresso em ${currentReading.book.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={readingPercent}>
              <i style={{ width: `${readingPercent}%` }} />
            </div>
            <p className="lib-current__pages">
              {pagesTotal ? `${pagesRead} de ${pagesTotal} páginas` : "Páginas não informadas"}
              <strong>{readingPercent}%</strong>
            </p>
            <button type="button" className="lib-link" onClick={() => onOpen(currentReading)}>Continuar leitura →</button>
          </>
        ) : (
          <p className="lib-muted">Nenhuma leitura em andamento. Abra um livro da lista de desejos e escolha “Começar a ler agora”.</p>
        )}
      </section>
    </aside>
  );
}
