import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import { groupIntoShelves, SHELF_CAPACITY } from "@/lib/books";

const DRAG_THRESHOLD = 8;
const CLICK_SUPPRESS_MS = 450;

/**
 * Arrastar e soltar livros na estante: soltar sobre o centro de outro livro troca os dois
 * de lugar; soltar entre livros (ou numa prateleira vazia) insere naquela posição.
 */
export function useShelfDrag({ entries, enabled, reload, openBook }) {
  const [movingBookId, setMovingBookId] = useState(null);
  const [drag, setDrag] = useState(null); // { entry, color, height, x, y }
  const [overShelf, setOverShelf] = useState(null);
  const [overPosition, setOverPosition] = useState(null);
  const [swapTargetId, setSwapTargetId] = useState(null);
  const [error, setError] = useState("");
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(suppressTimerRef.current), []);

  const request = useCallback(
    async (entry, path, body) => {
      setMovingBookId(entry.id);
      setError("");
      try {
        await apiRequest(`/library/${entry.id}/${path}/`, { method: "PATCH", body: JSON.stringify(body) });
        reload();
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setMovingBookId(null);
      }
    },
    [reload],
  );

  const bookAtPoint = (x, y, entry) => {
    const slot = document.elementFromPoint(x, y)?.closest("[data-entry-id]");
    if (!slot || slot.dataset.entryId === String(entry.id)) return null;
    const bounds = slot.getBoundingClientRect();
    const horizontal = (x - bounds.left) / bounds.width;
    if (horizontal < 0.25 || horizontal > 0.75) return null;
    const id = Number(slot.dataset.entryId);
    if (!entries.some((item) => item.id === id)) return null;
    return { id, shelf: Number(slot.closest("[data-shelf-index]")?.dataset.shelfIndex) };
  };

  const shelfLocationAtPoint = (x, y, entry) => {
    const row = document.elementFromPoint(x, y)?.closest("[data-shelf-index]");
    if (!row) return null;
    const shelf = Number(row.dataset.shelfIndex);
    if (!Number.isInteger(shelf)) return null;
    const slots = [...row.querySelectorAll("[data-entry-id]")].filter((slot) => slot.dataset.entryId !== String(entry.id));
    const position = slots.findIndex((slot) => {
      const box = slot.getBoundingClientRect();
      return x < box.left + box.width / 2;
    });
    return { shelf, position: position < 0 ? slots.length : position };
  };

  const canDropAt = (entry, shelf, position) => {
    if (shelf === null || shelf < 0 || position === null) return false;
    const currentShelf = Math.max(0, Number(entry.shelf) || 0);
    const target = groupIntoShelves(entries).find((item) => item.shelfIndex === shelf);
    if (!target) return false;
    const others = target.filter((item) => item.id !== entry.id);
    if (others.length >= SHELF_CAPACITY || position > others.length) return false;
    return shelf !== currentShelf || position !== Number(entry.position || 0);
  };

  const clearDrag = () => {
    dragRef.current = null;
    setDrag(null);
    setOverShelf(null);
    setOverPosition(null);
    setSwapTargetId(null);
  };

  const begin = (event, entry, color, height) => {
    if (!enabled || event.button !== 0 || movingBookId) return;
    dragRef.current = { entry, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, color, height, started: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const move = (event) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (!state.started && Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < DRAG_THRESHOLD) return;
    state.started = true;
    suppressClickRef.current = true;
    setDrag({ entry: state.entry, color: state.color, height: state.height, x: event.clientX, y: event.clientY });
    const swap = bookAtPoint(event.clientX, event.clientY, state.entry);
    if (swap) {
      setSwapTargetId(swap.id);
      setOverShelf(swap.shelf);
      setOverPosition(null);
      return;
    }
    const location = shelfLocationAtPoint(event.clientX, event.clientY, state.entry);
    const ok = location && canDropAt(state.entry, location.shelf, location.position);
    setSwapTargetId(null);
    setOverShelf(ok ? location.shelf : null);
    setOverPosition(ok ? location.position : null);
  };

  const finish = (event) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (state.started) {
      const swap = bookAtPoint(event.clientX, event.clientY, state.entry);
      const location = swap ? null : shelfLocationAtPoint(event.clientX, event.clientY, state.entry);
      if (swap) {
        void request(state.entry, "swap", { target_entry_id: swap.id });
      } else if (location && canDropAt(state.entry, location.shelf, location.position)) {
        void request(state.entry, "move", { shelf: location.shelf, position: location.position });
      }
      suppressTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
      }, CLICK_SUPPRESS_MS);
    }
    clearDrag();
  };

  const cancel = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    suppressClickRef.current = false;
    window.clearTimeout(suppressTimerRef.current);
    clearDrag();
  };

  const open = (entry) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      window.clearTimeout(suppressTimerRef.current);
      return;
    }
    openBook(entry);
  };

  return {
    movingBookId,
    drag,
    overShelf,
    overPosition,
    swapTargetId,
    error,
    handlers: { onPointerDown: begin, onPointerMove: move, onPointerUp: finish, onPointerCancel: cancel, onClick: open },
  };
}
