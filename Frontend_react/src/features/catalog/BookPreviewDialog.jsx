import { useEffect, useRef, useState } from "react";
import BookCover from "@/components/BookCover";
import { cleanGenre } from "@/lib/books";
import StarRating from "./StarRating";

const decimal = (value) => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

const MINUTES_PER_PAGE = 1.2; // estimativa: cerca de 250 palavras por página, lidas a ~200 palavras por minuto
const MORE_AFTER = 420; // resumos maiores que isso começam recolhidos

/** Separa a primeira frase (o "gancho" do resumo) do restante. */
function splitSummary(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return { lead: "", rest: "" };
  const match = clean.match(/^(.{40,260}?[.!?…])(\s|$)/);
  if (!match) return { lead: clean.length > 260 ? "" : clean, rest: clean.length > 260 ? clean : "" };
  return { lead: match[1], rest: clean.slice(match[1].length).trim() };
}

function readingTime(pages) {
  const minutes = Math.round(pages * MINUTES_PER_PAGE);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest >= 15 ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours} h`;
}

/**
 * Modal de uma obra do catálogo: capa, resumo e a nota média de 0 a 5 estrelas, tirada das avaliações
 * que o catálogo online traz. É aqui que a pessoa decide se vai ler (começar a ler ou salvar nos desejos).
 */
export default function BookPreviewDialog({ book, libraryEntry, added, feedback, busyId, onStart, onWish, onClose }) {
  const dialogRef = useRef(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const isFinished = libraryEntry?.status === "READ";
  const isReading = libraryEntry?.status === "READING";
  const isWishlisted = libraryEntry?.status === "WANT_TO_READ" || (added && !libraryEntry);
  const isBusy = busyId === book.id;
  const anyBusy = busyId !== null;
  const hasRating = book.average_rating != null;
  const { lead, rest } = splitSummary(book.synopsis || "");
  const isLong = rest.length > MORE_AFTER;
  const year = book.publication_year || book.publication_date?.slice(0, 4);
  const genre = cleanGenre(book.genre);
  const stats = [
    book.total_pages > 0 && { label: "Páginas", value: String(book.total_pages) },
    year && { label: "Publicação", value: String(year) },
    book.total_pages > 0 && { label: "Leitura estimada", value: `≈ ${readingTime(book.total_pages)}` },
  ].filter(Boolean);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      className="cat-modal"
      aria-labelledby="cat-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <div className="cat-modal__grid">
        <div className="cat-modal__cover">
          {book.cover_url && !coverFailed ? (
            <BookCover url={book.cover_url} alt={`Capa de ${book.title}`} onFail={() => setCoverFailed(true)} />
          ) : (
            <div className="cat-modal__fallback">
              <strong>{book.title}</strong>
              <span>{book.author}</span>
            </div>
          )}
        </div>

        <div className="cat-modal__body">
          <button type="button" className="cat-modal__close" aria-label="Fechar" onClick={close}>×</button>

          <header>
            {genre && <p className="cat-modal__genre">{genre}</p>}
            <h2 id="cat-modal-title">{book.title}</h2>
            <p className="cat-modal__author">{book.author}</p>
          </header>

          <div className="cat-modal__rating">
            {hasRating ? (
              <>
                <StarRating value={book.average_rating} label={`Nota média ${decimal(book.average_rating)} de 5 nas avaliações da web`} />
                <strong>{decimal(book.average_rating)}</strong>
                <span>de 5 · {book.ratings_count ? `${compact.format(book.ratings_count)} avaliações na web` : "avaliações na web"}</span>
              </>
            ) : (
              <>
                <StarRating value={0} label="Sem avaliações na web" />
                <span>Sem avaliações na web ainda</span>
              </>
            )}
          </div>

          {stats.length > 0 && (
            <ul className="cat-modal__stats" aria-label="Dados da obra">
              {stats.map((item) => (
                <li key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          )}

          <section className="cat-modal__summary" aria-labelledby="cat-modal-summary-title">
            <h3 id="cat-modal-summary-title">Sobre a obra</h3>
            {lead || rest ? (
              <>
                {lead && (
                  <blockquote className="cat-modal__lead">
                    <span aria-hidden="true">“</span>
                    {lead}
                  </blockquote>
                )}
                {rest && (
                  <>
                    <p className={`cat-modal__rest${isLong && !expanded ? " is-clamped" : ""}`}>{rest}</p>
                    {isLong && (
                      <button type="button" className="cat-link" aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
                        {expanded ? "Mostrar menos" : "Ler o resumo completo"}
                      </button>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="cat-modal__rest is-empty">O resumo desta edição ainda não foi cadastrado.</p>
            )}
          </section>

          <div className="cat-modal__footer">
            <div className="cat-modal__actions">
              <button type="button" className="cat-btn cat-btn--primary" disabled={anyBusy || isFinished} onClick={() => onStart(book)}>
                {isBusy ? "Iniciando…" : isFinished ? "Leitura concluída" : isReading ? "Continuar lendo" : "Começar a ler"}
              </button>
              <button
                type="button"
                className="cat-btn"
                disabled={anyBusy || isFinished || isReading || isWishlisted}
                onClick={() => onWish(book, "WANT_TO_READ")}
              >
                {isWishlisted ? "Salvo nos desejos ✓" : "+ Salvar nos desejos"}
              </button>
            </div>
            {feedback && <p className={`cat-feedback${added ? " is-success" : ""}`} role="status">{feedback}</p>}
            {book.external_url && (
              <p className="cat-modal__source">
                Fonte: {book.source || "Catálogo online"} · <a href={book.external_url} target="_blank" rel="noreferrer">ver registro</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
