import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { apiRequest } from "@/lib/api";
import { externalBookImportPayload } from "@/lib/books";
import { fetchBookCover } from "@/lib/diagnostic";

const FALLBACK_COLORS = ["#98543f", "#59694f", "#b07a2a", "#7d4a6b", "#8a8a3c", "#7a2f3a", "#a05a2c", "#4a6b4f"];
const colorFor = (id) => FALLBACK_COLORS[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % FALLBACK_COLORS.length];

/** Uma indicação: capa, o motivo de combinar com o perfil e a ação de salvar na estante. */
function BookCard({ item, index, isAuthenticated }) {
  const [cover, setCover] = useState({ status: "loading", url: "", book: null });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    // As capas vêm de um catálogo online que às vezes falha; escalona os pedidos e tenta de novo até 5 vezes.
    function load(attempt) {
      fetchBookCover(item.id, controller.signal)
        .then((data) => {
          if (data.book || attempt >= 4) setCover({ status: "done", url: data.cover_url || "", book: data.book });
          else timer = window.setTimeout(() => load(attempt + 1), 3000);
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          if (attempt >= 4) setCover({ status: "done", url: "", book: null });
          else timer = window.setTimeout(() => load(attempt + 1), 3000);
        });
    }
    timer = window.setTimeout(() => load(0), index * 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [item.id, index]);

  async function save() {
    if (!cover.book) return;
    setSaving(true);
    setMessage("");
    try {
      const catalogBook = cover.book.is_external === false
        ? cover.book
        : await apiRequest("/books/import/", { method: "POST", body: JSON.stringify(externalBookImportPayload({ ...cover.book, is_external: true })) });
      await apiRequest("/library/", { method: "POST", body: JSON.stringify({ book_id: catalogBook.id, status: "WANT_TO_READ" }) });
      setSaved(true);
    } catch (error) {
      if (/já est[aá] na sua biblioteca/i.test(String(error.message))) setSaved(true);
      else setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="dg-book" style={{ "--i": index, "--spine": colorFor(item.id) }}>
      <div className="dg-book__cover">
        {cover.url ? (
          <img src={cover.url} alt={`Capa de ${item.title}`} loading="lazy" onError={() => setCover((current) => ({ ...current, url: "" }))} />
        ) : (
          <div className={`dg-book__fallback${cover.status === "loading" ? " is-loading" : ""}`} aria-hidden="true">
            <strong>{item.title}</strong>
            <span>{item.author}</span>
          </div>
        )}
      </div>
      <div className="dg-book__body">
        <p className="dg-book__genre">{item.genre}</p>
        <h3>{item.title}</h3>
        <p className="dg-book__author">{item.author} · {item.year}</p>
        <p className="dg-book__blurb">{item.blurb}</p>
        <div className="dg-book__why">
          <p className="dg-book__why-title">Por que combina com você</p>
          <ul>
            {item.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        {item.traits.length > 0 && (
          <ul className="dg-chips dg-chips--small" aria-label="Características do livro">
            {item.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        )}
        <div className="dg-book__actions">
          {!isAuthenticated ? (
            <Link className="dg-book__save" to="/cadastro">Criar conta para salvar</Link>
          ) : cover.status !== "loading" && !cover.book ? (
            <Link className="dg-book__save" to="/catalogo">Procurar no catálogo</Link>
          ) : (
            <button type="button" className="dg-book__save" disabled={saving || saved || cover.status === "loading"} onClick={save}>
              {saved ? "Salvo nos desejos ✓" : saving ? "Salvando…" : cover.status === "loading" ? "Procurando…" : "+ Salvar nos desejos"}
            </button>
          )}
        </div>
        {message && <p className="dg-error" role="alert">{message}</p>}
      </div>
    </li>
  );
}

/** Seção "Livros para o seu perfil" do resultado. */
export default function Recommendations({ archetype, state, items }) {
  const { isAuthenticated } = useAuth();

  return (
    <section id="livros" className="dg-block" aria-labelledby="dg-books-title">
      <h2 id="dg-books-title" className="dg-block__title">Livros para o seu perfil</h2>
      <p className="dg-books__lead">
        Seu perfil é <strong>{archetype.label}</strong>. Escolhi estes livros pelo seu tipo de leitor, pelos gêneros
        que você mais marcou e pelo seu jeito de ler, e explico abaixo o que cada um tem a ver com você.
      </p>
      {state === "loading" && <p className="dg-note" role="status">Escolhendo os livros para você…</p>}
      {state === "error" && <p className="dg-note" role="alert">Não consegui montar as indicações agora. Tente recarregar a página.</p>}
      {items.length > 0 && (
        <ul className="dg-books">
          {items.map((item, index) => (
            <BookCard item={item} index={index} isAuthenticated={isAuthenticated} key={item.id} />
          ))}
        </ul>
      )}
    </section>
  );
}
