import { createPortal } from "react-dom";
import { groupIntoShelves, shelfDisplayTitle, statusLabel } from "@/lib/books";
import { useShelfDrag } from "./useShelfDrag";

// Lombadas em tons quentes e foscos (sem azul), alinhadas à paleta do sistema.
const SPINE_COLORS = ["#98543f", "#59694f", "#b07a2a", "#7d4a6b", "#8a8a3c", "#7a2f3a", "#a05a2c", "#4a6b4f"];
const STATUS_MARK = { READ: "✓", READING: "◐", WANT_TO_READ: "+" };

const spineColor = (shelf, index) => SPINE_COLORS[(shelf * 3 + index) % SPINE_COLORS.length];
const spineHeight = (shelf, index) => 188 + ((shelf * 7 + index * 13) % 5) * 12;

function Spine({ entry, color, height, index, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`lib-spine ${className}`.trim()}
      style={{ "--spine-color": color, "--spine-height": `${height}px`, "--i": index }}
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
export default function Bookshelf({ entries, canReorder, reload, openBook, pulledBookId }) {
  const shelf = useShelfDrag({ entries, enabled: canReorder, reload, openBook });
  const { drag, overShelf, overPosition, swapTargetId, movingBookId, handlers } = shelf;
  const dragId = drag?.entry.id ?? null;

  const hint = drag
    ? swapTargetId
      ? "Solte sobre o livro destacado para trocar os dois de lugar."
      : "Solte entre dois livros ou no fim da prateleira para inserir."
    : canReorder
      ? "Arraste um livro para reorganizar: sobre o centro de outro para trocar, pelas laterais para inserir."
      : "Limpe os filtros para reorganizar os livros.";

  return (
    <div className="lib-shelf" aria-label="Estante da sua biblioteca">
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
                      onPointerDown={(event) => handlers.onPointerDown(event, entry, color, height)}
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
      <p className="lib-hint" aria-live="polite">{hint}</p>
      {shelf.error && <p className="lib-error" role="alert">{shelf.error}</p>}
    </div>
  );
}
