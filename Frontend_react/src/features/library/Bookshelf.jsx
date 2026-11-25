import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { coverColor, inkFor } from "@/lib/coverColor";
import { groupIntoShelves, shelfDisplayTitle, statusLabel } from "@/lib/books";
import { useShelfDrag } from "./useShelfDrag";

// Lombadas em tons quentes e foscos (sem azul), alinhadas à paleta do sistema.
const SPINE_COLORS = ["#98543f", "#59694f", "#b07a2a", "#7d4a6b", "#8a8a3c", "#7a2f3a", "#a05a2c", "#4a6b4f"];
const STATUS_MARK = { READ: "✓", READING: "◐", WANT_TO_READ: "+" };

const spineColor = (shelf, index) => SPINE_COLORS[(shelf * 3 + index) % SPINE_COLORS.length];
const spineHeight = (shelf, index) => 188 + ((shelf * 7 + index * 13) % 5) * 12;

/** Cor da lombada: a predominante da capa; enquanto não carrega (ou se não der para ler), uma cor da paleta. */
function useSpineColor(url, fallback) {
  const [color, setColor] = useState(null);
  useEffect(() => {
    let active = true;
    coverColor(url).then((value) => {
      if (active) setColor(value);
    });
    return () => {
      active = false;
    };
  }, [url]);
  return color || fallback;
}

function Spine({ entry, color: fallback, height, index, className = "", ...props }) {
  const color = useSpineColor(entry.book.cover_url, fallback);
  return (
    <button
      type="button"
      className={`lib-spine ${className}`.trim()}
      style={{ "--spine-color": color, "--spine-ink": inkFor(color), "--spine-height": `${height}px`, "--i": index }}
      aria-label={`${entry.book.title}, de ${entry.book.author}. ${statusLabel(entry.status)}.`}
      title={`${entry.book.title} — ${entry.book.author}`}
      {...props}
    >
      <span className="lib-spine__title">{shelfDisplayTitle(entry.book.title)}</span>
      <span className="lib-spine__status" aria-hidden="true">{STATUS_MARK[entry.status]}</span>
    </button>
  );
}

/** Estante limpa: prateleiras finas com lombadas; arrastar só funciona sem filtros ativos. */
const THROW_MS = 520;

export default function Bookshelf({ entries, canReorder, reload, openBook, pulledBookId, onRemove }) {
  const [request, setRequest] = useState(null); // livro solto numa lateral, esperando a confirmação
  const [thrown, setThrown] = useState(null); // livro já confirmado, saindo voando pela lateral
  const [removeError, setRemoveError] = useState("");
  const confirmRef = useRef(null);
  const shelf = useShelfDrag({ entries, enabled: canReorder && !thrown, reload, openBook, onRemoveRequest: setRequest });
  const { drag, overShelf, overPosition, swapTargetId, movingBookId, handlers, zone } = shelf;
  const dragId = drag?.entry.id ?? null;

  useEffect(() => {
    const dialog = confirmRef.current;
    if (request && dialog && !dialog.open) dialog.showModal();
  }, [request]);

  /** Confirmado: o livro voa para fora da estante e, ao fim da animação, é retirado da biblioteca. */
  async function confirmRemoval() {
    const current = request;
    confirmRef.current?.close();
    setRequest(null);
    setRemoveError("");
    setThrown(current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    await new Promise((resolve) => window.setTimeout(resolve, reduced ? 0 : THROW_MS));
    try {
      await onRemove(current.entry);
    } catch (error) {
      setRemoveError(error.message);
    } finally {
      setThrown(null);
    }
  }

  const hint = drag
    ? zone
      ? "Solte para retirar este livro da estante."
      : swapTargetId
      ? "Solte sobre o livro destacado para trocar os dois de lugar."
      : "Solte entre dois livros ou no fim da prateleira para inserir."
    : canReorder
      ? "Arraste um livro para reorganizar. Para retirá-lo da estante, jogue-o para fora pelas laterais."
      : "Limpe os filtros para reorganizar os livros.";

  return (
    <div className={`lib-shelf${drag ? " is-dragging" : ""}`} aria-label="Estante da sua biblioteca">
      {drag && (
        <>
          <span className={`lib-zone lib-zone--left${zone === "left" ? " is-active" : ""}`} aria-hidden="true"><b>Retirar</b></span>
          <span className={`lib-zone lib-zone--right${zone === "right" ? " is-active" : ""}`} aria-hidden="true"><b>Retirar</b></span>
        </>
      )}
      {groupIntoShelves(entries).map((row, rowIndex) => {
        const count = row.filter((entry) => entry.id !== dragId).length;
        let visibleIndex = 0;
        return (
          <section
            className={`lib-row${overShelf === row.shelfIndex ? " is-drop-target" : ""}`}
            key={row.shelfIndex}
            aria-label={`Prateleira ${rowIndex + 1}`}
            data-shelf-index={row.shelfIndex}
          >
            <div className="lib-row__books">
              {count === 0 && <span className="lib-row__empty">Arraste um livro para esta prateleira</span>}
              {overShelf === row.shelfIndex && overPosition === 0 && count === 0 && <span className="lib-marker" aria-hidden="true" />}
              {row.map((entry, index) => {
                const isSource = entry.id === dragId;
                const logical = isSource ? -1 : visibleIndex++;
                const color = spineColor(row.shelfIndex, index);
                const height = spineHeight(row.shelfIndex, index);
                const classes = [
                  pulledBookId === entry.id ? "is-pulled" : "",
                  isSource ? "is-source" : "",
                  thrown?.entry.id === entry.id ? "is-gone" : "",
                  movingBookId === entry.id ? "is-moving" : "",
                  swapTargetId === entry.id ? "is-swap-target" : "",
                  overShelf === row.shelfIndex && overPosition === logical ? "is-insert-target" : "",
                ].join(" ");
                return (
                  <div className="lib-slot" data-entry-id={entry.id} key={entry.id}>
                    <Spine
                      entry={entry}
                      color={color}
                      height={height}
                      index={index}
                      className={classes}
                      disabled={movingBookId === entry.id}
                      aria-haspopup="dialog"
                      onPointerDown={(event) => handlers.onPointerDown(event, entry, event.currentTarget.style.getPropertyValue("--spine-color") || color, height)}
                      onPointerMove={handlers.onPointerMove}
                      onPointerUp={handlers.onPointerUp}
                      onPointerCancel={handlers.onPointerCancel}
                      onClick={() => handlers.onClick(entry)}
                    />
                  </div>
                );
              })}
              {overShelf === row.shelfIndex && overPosition === count && count > 0 && <span className="lib-marker" aria-hidden="true" />}
            </div>
            <div className="lib-plank" aria-hidden="true" />
          </section>
        );
      })}
      {drag &&
        createPortal(
          <div
            className="lib-spine lib-spine--preview"
            aria-hidden="true"
            style={{ left: drag.x, top: drag.y, "--spine-color": drag.color, "--spine-height": `${drag.height}px` }}
          >
            <span className="lib-spine__title">{shelfDisplayTitle(drag.entry.book.title)}</span>
          </div>,
          document.body,
        )}
      {thrown &&
        createPortal(
          <div
            className={`lib-spine lib-spine--preview lib-spine--thrown lib-spine--thrown-${thrown.side}`}
            aria-hidden="true"
            style={{ left: thrown.x, top: thrown.y, "--spine-color": thrown.color, "--spine-ink": inkFor(thrown.color), "--spine-height": `${thrown.height}px` }}
          >
            <span className="lib-spine__title">{shelfDisplayTitle(thrown.entry.book.title)}</span>
          </div>,
          document.body,
        )}
      <dialog ref={confirmRef} className="lib-confirm" aria-labelledby="lib-confirm-title" onClose={() => setRequest(null)}>
        {request && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmRemoval();
            }}
          >
            <h2 id="lib-confirm-title">Retirar da estante?</h2>
            <p><strong>{request.entry.book.title}</strong> sai da sua estante. As páginas lidas e a avaliação deste livro serão apagadas, e a obra continua no catálogo.</p>
            <div className="lib-confirm__actions">
              <button type="button" className="lib-confirm__cancel" onClick={() => confirmRef.current?.close()}>Cancelar</button>
              <button type="submit" className="lib-confirm__ok" autoFocus>Retirar livro</button>
            </div>
          </form>
        )}
      </dialog>
      <p className="lib-hint" aria-live="polite">{hint}</p>
      {(shelf.error || removeError) && <p className="lib-error" role="alert">{shelf.error || removeError}</p>}
    </div>
  );
}
