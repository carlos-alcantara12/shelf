import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHandle } from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/api";
import PeekRating from "@/components/PeekRating";
import BookReadingPanel from "@/features/reading/BookReadingPanel";

const TABS = [
  ["read", "Leitura"],
  ["notes", "Anotações"],
  ["about", "Sobre"],
];

/**
 * Diálogo do livro. O cabeçalho mostra onde a pessoa parou (páginas, % e situação, editáveis e com
 * salvamento automático); as abas separam por intenção: Leitura (cronômetro e metas), Anotações
 * (notas da sessão e tarefas) e Sobre (sinopse, avaliação e retirar da estante).
 */
export default function BookDetailDialog({ entry, onClose, onEntryUpdated, onEntryRemoved, isClosing }) {
  const [pagesRead, setPagesRead] = useState(entry.pages_read);
  const [status, setStatus] = useState(entry.status);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);
  const [tab, setTab] = useState(entry.status === "READ" ? "about" : "read");
  const ratingTouchedRef = useRef(false);
  const savedTimerRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const book = entry.book;
  const totalPages = book.total_pages;
  const progress = totalPages ? Math.min(100, Math.round((pagesRead / totalPages) * 100)) : 0;
  const canRate = status === "READ" && totalPages && Number(pagesRead) === totalPages
    && entry.status === "READ" && entry.pages_read === totalPages;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [...(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ) || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  useEffect(() => () => window.clearTimeout(savedTimerRef.current), []);

  useEffect(() => {
    ratingTouchedRef.current = false;
  }, [book.id]);

  useEffect(() => {
    let active = true;
    apiRequest("/reviews/")
      .then((data) => {
        const reviews = Array.isArray(data) ? data : data.results || [];
        const found = reviews.find((item) => item.book?.id === book.id);
        if (active) {
          if (!ratingTouchedRef.current) {
            setReview(found || null);
            setRating(found?.rating || 0);
          }
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [book.id]);

  /** Salva páginas e situação. Se algo estiver inválido ou falhar, volta ao que estava salvo. */
  async function persist(nextPages, nextStatus) {
    const numericPages = Number(nextPages);
    const revert = () => {
      setPagesRead(entry.pages_read);
      setStatus(entry.status);
    };
    if (!Number.isInteger(numericPages) || numericPages < 0 || (totalPages && numericPages > totalPages)) {
      setError("Informe um número de páginas válido, dentro do total da obra.");
      revert();
      return;
    }
    if (nextStatus === "READ" && (!totalPages || numericPages !== totalPages)) {
      setError("Para marcar como lido, as páginas lidas devem ser iguais ao total.");
      revert();
      return;
    }
    if (numericPages === entry.pages_read && nextStatus === entry.status) {
      setError("");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await apiRequest(`/library/${entry.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ pages_read: numericPages, status: nextStatus }),
      });
      onEntryUpdated(updated);
      setPagesRead(updated.pages_read);
      setStatus(updated.status);
      setJustSaved(true);
      window.clearTimeout(savedTimerRef.current);
      savedTimerRef.current = window.setTimeout(() => setJustSaved(false), 2200);
    } catch (requestError) {
      setError(requestError.message);
      revert();
    } finally {
      setSaving(false);
    }
  }

  async function startReadingNow() {
    if (status !== "WANT_TO_READ" || saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await apiRequest(`/library/${entry.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ pages_read: Number(pagesRead) || 0, status: "READING" }),
      });
      onEntryUpdated(updated);
      setPagesRead(updated.pages_read);
      setStatus(updated.status);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveRating(nextRating) {
    if (status !== "READ" || !totalPages || Number(pagesRead) !== totalPages) {
      setError("Conclua a leitura para avaliar esta obra.");
      return;
    }
    ratingTouchedRef.current = true;
    setRating(nextRating);
    setSaving(true);
    setError("");
    try {
      const payload = { rating: nextRating };
      const saved = await apiRequest(review ? `/reviews/${review.id}/` : "/reviews/", {
        method: review ? "PATCH" : "POST",
        body: JSON.stringify(review ? payload : { ...payload, book_id: book.id }),
      });
      setReview(saved);
    } catch (requestError) {
      setError(requestError.message);
      setRating(review?.rating || 0);
    } finally {
      setSaving(false);
    }
  }

  async function removeEntryFromLibrary() {
    setRemoving(true);
    setError("");
    try {
      await apiRequest(`/library/${entry.id}/`, { method: "DELETE" });
      onEntryRemoved(entry.id);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRemoving(false);
    }
  }

  return createPortal((
    <div className={`book-dialog-backdrop${isClosing ? " is-closing" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Dialog className="book-dialog__root">
        <DialogContent ref={dialogRef} className={"book-dialog" + (isClosing ? " is-closing" : "")} role="dialog" aria-modal="true" aria-labelledby="book-dialog-title">
        <DialogClose as={Button} ref={closeButtonRef} variant="ghost" size="sm" className="book-dialog__close" type="button" onClick={onClose} aria-label="Fechar livro e voltar à estante">×</DialogClose>
        <div className="book-dialog__book-open">
          <div className="book-dialog__cover-page">
            {book.cover_url && !coverFailed ? <img src={book.cover_url} alt={`Capa de ${book.title}`} onError={() => setCoverFailed(true)} /> : <div className="book-dialog__cover-fallback">{book.title}</div>}
          </div>
          <div className="book-dialog__page-flips" aria-hidden="true">
            {[0, 1, 2].map((page) => <span key={page} style={{ "--page-index": page }} />)}
          </div>
          <Drawer className="book-dialog__drawer">
            <DrawerHandle />
            <DrawerContent className="book-dialog__drawer-content">
              <div className="book-dialog__content-page">
                <DialogHeader className="book-dialog__header">
                  <DialogTitle id="book-dialog-title">{book.title}</DialogTitle>
                  <DialogDescription className="book-dialog__author">{book.author}</DialogDescription>
                </DialogHeader>

                <div className="bd-progress">
                  <div className="bd-progress__row">
                    <label className="bd-field">
                      <span className="bd-pages">
                        <input
                          type="number"
                          min="0"
                          max={totalPages || undefined}
                          aria-label="Páginas lidas"
                          value={pagesRead}
                          disabled={saving}
                          onChange={(event) => setPagesRead(event.target.value)}
                          onBlur={() => persist(pagesRead, status)}
                          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                        />
                        <em>de {totalPages ?? "—"}</em>
                      </span>
                    </label>
                    <strong className="bd-percent" aria-label={`${progress}% lido`}>{totalPages > 0 ? `${progress}%` : "—"}</strong>
                  </div>
                  {totalPages > 0 && <Progress className="book-dialog__progress" value={progress} aria-label={`Progresso de leitura: ${progress}%`} />}
                  <p className="bd-saved" role="status">{saving ? "Salvando…" : justSaved ? "Salvo ✓" : ""}</p>
                </div>

                <div className="book-dialog__tabs" role="tablist" aria-label="Seções do livro">
                  {TABS.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      id={`book-tab-${id}`}
                      aria-selected={tab === id}
                      aria-controls={`book-panel-${id}`}
                      className={tab === id ? "is-active" : ""}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="book-dialog__tab-panel" role="tabpanel" id={`book-panel-${tab}`} aria-labelledby={`book-tab-${tab}`}>
                  {tab === "about" ? (
                    <>
                      <section className="book-dialog__synopsis-block" aria-labelledby="book-synopsis-title">
                        <h3 id="book-synopsis-title" className="bd-heading">Sobre a obra</h3>
                        <p className={`book-dialog__synopsis${book.synopsis ? "" : " is-empty"}`}>{book.synopsis || "O resumo desta edição ainda não foi cadastrado."}</p>
                      </section>
                      <section className="book-dialog__rating" aria-label="Avaliação">
                        <h3 className="bd-heading">Sua avaliação</h3>
                        <PeekRating
                          value={rating}
                          count={5}
                          shape="star"
                          labels={["Péssimo", "Ruim", "Regular", "Bom", "Excelente"]}
                          activeColor="#f5b400"
                          idleColor="#625b52"
                          tipColor="#17181d"
                          tipTextColor="#f4f1ea"
                          size={26}
                          lift={6}
                          magnify={1.15}
                          allowClear={false}
                          disabled={saving || !canRate}
                          ariaLabel={canRate ? "Avaliar de 1 a 5 estrelas" : "Avaliação disponível após concluir a leitura"}
                          className="book-dialog__peek-rating"
                          onChange={saveRating}
                        />
                        {!canRate && <small>Disponível depois que você marcar o livro como lido, com todas as páginas.</small>}
                      </section>
                      <div className="bd-footer">
                        {!confirmRemoval ? (
                          <button className="book-dialog__remove-trigger" type="button" disabled={saving || removing} onClick={() => setConfirmRemoval(true)}>
                            Retirar da estante
                          </button>
                        ) : (
                          <section className="book-dialog__remove-confirmation" role="group" aria-labelledby="book-remove-title" aria-describedby="book-remove-description">
                            <div>
                              <h4 id="book-remove-title">Retirar este livro da estante?</h4>
                              <p id="book-remove-description">O status, as páginas lidas e a avaliação serão removidos. A obra continuará no catálogo e poderá ser adicionada novamente.</p>
                            </div>
                            <div className="book-dialog__remove-actions">
                              <button className="book-dialog__remove-cancel" type="button" disabled={removing} autoFocus onClick={() => setConfirmRemoval(false)}>Cancelar</button>
                              <button className="book-dialog__remove-confirm" type="button" disabled={removing || saving} onClick={removeEntryFromLibrary}>{removing ? "Retirando…" : "Confirmar remoção"}</button>
                            </div>
                          </section>
                        )}
                      </div>
                    </>
                  ) : (
                    <BookReadingPanel book={book} view={tab} onSessionStarted={startReadingNow} />
                  )}
                </div>
                {error && <p className="book-dialog__error" role="alert">{error}</p>}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  ), document.body);
}
