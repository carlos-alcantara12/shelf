import { useEffect, useRef } from "react";

/** "Entenda": o que significa concordar, discordar e o que a pergunta mede. */
export default function ExplainDialog({ explain, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      className="dg-dialog"
      aria-labelledby="dg-explain-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <div className="dg-dialog__body">
        <header className="dg-dialog__header">
          <h2 id="dg-explain-title">Sobre esta pergunta</h2>
          <button type="button" className="dg-dialog__close" aria-label="Fechar" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <section className="dg-explain dg-explain--agree">
          <p className="dg-explain__label">Se você concorda</p>
          <p>{explain.agree}</p>
        </section>
        <section className="dg-explain dg-explain--disagree">
          <p className="dg-explain__label">Se você discorda</p>
          <p>{explain.disagree}</p>
        </section>
        <p className="dg-explain__note">
          <strong>Vale lembrar:</strong> {explain.note}
        </p>
      </div>
    </dialog>
  );
}
