import { useEffect, useRef, useState } from "react";
import { apiRequest, fetchAllPages } from "@/lib/api";
import { statusLabel, externalBookImportPayload } from "@/lib/books";
import { useAuth } from "@/app/AuthContext";
import { useOutletContext } from "react-router-dom";

export default function SharedLibrariesPage() {
  const { username } = useAuth();
  const { setUnreadCount: onUnreadChange } = useOutletContext();
  const [activeUsername, setActiveUsername] = useState(username || "");
  const [libraries, setLibraries] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [books, setBooks] = useState([]);
  const [reading, setReading] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [libraryName, setLibraryName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLibrary, setInviteLibrary] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [edits, setEdits] = useState({});
  const [letter, setLetter] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const letterDialogRef = useRef(null);
  const letterCloseRef = useRef(null);
  const letterReturnFocusRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchAllPages("/shared-libraries/"),
      fetchAllPages("/shared-invitations/"),
      fetchAllPages("/shared-removal-requests/"),
      fetchAllPages("/shared-books/"),
      fetchAllPages("/shared-reading/"),
      apiRequest("/auth/me/"),
    ]).then(([l, i, r, b, s, user]) => {
      if (!active) return;
      setLibraries(l); setInvitations(i); setRequests(r); setBooks(b); setReading(s);
      setActiveUsername(user.username || username || "");
      setSelectedId((current) => current && l.some((item) => item.id === current) ? current : l[0]?.id ?? null);
    }).catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const selected = libraries.find((item) => item.id === selectedId);
  const selectedBooks = books.filter((item) => item.shared_library.id === selectedId);
  const activeInvitation = letter?.kind === "invite" ? invitations.find((item) => item.id === letter.id) : null;
  const activeRequest = letter?.kind === "remove" ? requests.find((item) => item.id === letter.id) : null;
  const unread = invitations.filter((item) => item.recipient === activeUsername && item.status === "PENDING" && !item.opened_at).length
    + requests.filter((item) => item.recipient === activeUsername && item.status === "PENDING" && !item.opened_at).length;
  useEffect(() => { onUnreadChange(unread); }, [unread, onUnreadChange]);

  useEffect(() => {
    if (!letter) return undefined;
    const previousFocus = letterReturnFocusRef.current;
    letterCloseRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setLetter(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(letterDialogRef.current?.querySelectorAll(
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
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [letter]);

  const reload = () => setRefresh((value) => value + 1);

  async function act(path, options, message) {
    setBusy(true); setError(""); setNotice("");
    try { await apiRequest(path, options); if (message) setNotice(message); reload(); return true; }
    catch (e) { setError(e.message); return false; }
    finally { setBusy(false); }
  }

  async function createLibrary(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const created = await apiRequest("/shared-libraries/", { method: "POST", body: JSON.stringify({ name: libraryName.trim() }) });
      setLibraryName(""); setSelectedId(created.id); setNotice("Biblioteca compartilhada criada."); reload();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function sendInvite(event) {
    event.preventDefault();
    if (!inviteLibrary || !inviteName.trim()) return;
    if (await act("/shared-invitations/", { method: "POST", body: JSON.stringify({ shared_library_id: Number(inviteLibrary), recipient_username: inviteName.trim() }) }, "Convite enviado para o correio da outra pessoa.")) setInviteName("");
  }

  async function searchBooks(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true); setError("");
    try { const data = await apiRequest(`/books/discover/?search=${encodeURIComponent(query.trim())}`); setSearchResults(data.results || []); setError(data.warning || ""); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function openLetter(kind, item) {
    letterReturnFocusRef.current = document.activeElement;
    setLetter({ kind, id: item.id });
    if (item.opened_at) return;
    const path = kind === "invite" ? `/shared-invitations/${item.id}/open/` : `/shared-removal-requests/${item.id}/open/`;
    await act(path, { method: "POST" });
  }

  async function respond(action) {
    if (!letter) return;
    const resource = letter.kind === "invite" ? "shared-invitations" : "shared-removal-requests";
    const ok = await act(`/${resource}/${letter.id}/${action}/`, { method: "POST" }, {
      accept: "Convite aceito. A biblioteca já está disponível.", decline: "Convite recusado.",
      approve: "Pedido aprovado; a obra foi removida.", deny: "Pedido recusado; a obra permanece na estante.",
    }[action]);
    if (ok) setLetter(null);
  }

  async function addBook(book) {
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const catalogBook = book.is_external
        ? await apiRequest("/books/import/", {
          method: "POST",
          body: JSON.stringify(externalBookImportPayload(book)),
        })
        : book;
      await apiRequest("/shared-books/", {
        method: "POST",
        body: JSON.stringify({ shared_library_id: selected.id, book_id: catalogBook.id }),
      });
      setNotice(`“${book.title}” foi adicionado à estante.`);
      setSearchResults([]);
      reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveProgress(item) {
    const own = reading.find((state) => state.shared_library_id === selectedId && state.book_id === item.book.id);
    if (!own) return;
    const edit = edits[own.id] || { status: own.status, pages_read: own.pages_read };
    const pages = Number(edit.pages_read);
    if (!Number.isInteger(pages) || pages < 0 || (item.book.total_pages && pages > item.book.total_pages)) { setError("Informe um número de páginas válido."); return; }
    if (edit.status === "READ" && (!item.book.total_pages || pages !== item.book.total_pages)) { setError("Para marcar como lido, as páginas devem atingir o total da obra."); return; }
    await act(`/shared-reading/${own.id}/`, { method: "PATCH", body: JSON.stringify({ status: edit.status, pages_read: pages }) }, "Seu progresso foi atualizado.");
  }

  async function removeBook(item) {
    if (item.added_by === activeUsername) {
      await act(`/shared-books/${item.id}/`, { method: "DELETE" }, "Obra removida da estante compartilhada.");
    } else {
      await act("/shared-removal-requests/", { method: "POST", body: JSON.stringify({ shared_book_id: item.id }) }, "Pedido enviado; a obra só será removida com autorização.");
    }
  }

  return (
    <section id="library-content" className="shared-view explore-view" aria-labelledby="shared-title" aria-busy={loading}>
      <div className="explore-heading"><div><p className="library-kicker">leituras em companhia</p><h1 id="shared-title">Biblioteca compartilhada.</h1><p className="explore-intro">Monte uma estante com outra pessoa e acompanhem o progresso de cada um.</p></div><button className="shared-mailbox-button" type="button" onClick={() => document.getElementById("shared-mailbox")?.scrollIntoView({ behavior: "smooth" })}>Correio{unread > 0 && <span>{unread}</span>}</button></div>
      {error && <p className="library-error" role="alert">{error}</p>}{notice && <p className="shared-notice" role="status">{notice}</p>}
      <div className="shared-setup-grid">
        <form className="shared-form-card" onSubmit={createLibrary}><p className="library-kicker">um projeto a dois</p><h2>Criar uma estante</h2><label>Nome da biblioteca<input value={libraryName} maxLength={120} onChange={(event) => setLibraryName(event.target.value)} placeholder="Ex.: Leituras de domingo" /></label><button className="library-primary-button" disabled={busy || !libraryName.trim()}>criar biblioteca</button></form>
        <form className="shared-form-card" onSubmit={sendInvite}><p className="library-kicker">convide para entrar</p><h2>Enviar uma carta</h2><label>Estante<select required value={inviteLibrary} onChange={(event) => setInviteLibrary(event.target.value)}><option value="">Escolha uma biblioteca</option>{libraries.filter((item) => item.owner === activeUsername).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Nome de usuário<input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Ex.: ana_leitora" /></label><button className="library-primary-button" disabled={busy || !inviteLibrary || !inviteName.trim()}>enviar convite</button></form>
      </div>

      <section className="shared-mailbox" id="shared-mailbox" aria-labelledby="shared-mailbox-title"><div className="shared-section-heading"><div><p className="library-kicker">correio interno</p><h2 id="shared-mailbox-title">Cartas e notificações</h2></div><span>{unread ? `${unread} não lida${unread === 1 ? "" : "s"}` : "em dia"}</span></div>
        {loading ? <p className="library-feedback" role="status">buscando suas cartas…</p> : <div className="shared-letter-list">
          {invitations.map((item) => <button type="button" key={`i-${item.id}`} className={`shared-letter-teaser${!item.opened_at ? " is-unread" : ""}`} onClick={() => openLetter("invite", item)}><span className="shared-envelope" aria-hidden="true"><i /></span><span><strong>{item.recipient === activeUsername && item.status === "PENDING" ? "Convite recebido" : "Convite de biblioteca"}</strong><small>{item.shared_library.name} · {item.recipient === activeUsername ? `de ${item.sender}` : `para ${item.recipient}`}</small></span><em>{item.status === "PENDING" ? "pendente" : item.status === "ACCEPTED" ? "aceito" : "recusado"}</em></button>)}
          {requests.map((item) => <button type="button" key={`r-${item.id}`} className={`shared-letter-teaser${!item.opened_at ? " is-unread" : ""}`} onClick={() => openLetter("remove", item)}><span className="shared-envelope shared-envelope--notice" aria-hidden="true"><i /></span><span><strong>{item.recipient === activeUsername ? "Pedido de remoção" : "Seu pedido de remoção"}</strong><small>{item.book_title} · {item.shared_library_name || "biblioteca"}</small></span><em>{item.status === "PENDING" ? "pendente" : item.status === "APPROVED" ? "aprovado" : "recusado"}</em></button>)}
          {!invitations.length && !requests.length && <p className="shared-empty">Seu correio está vazio por enquanto.</p>}
        </div>}
      </section>

      <section className="shared-libraries" aria-labelledby="shared-libraries-title"><div className="shared-section-heading"><div><p className="library-kicker">estantes em conjunto</p><h2 id="shared-libraries-title">Suas bibliotecas</h2></div><span>{libraries.length} {libraries.length === 1 ? "estante" : "estantes"}</span></div>
        {libraries.length ? <div className="shared-library-tabs" role="tablist" aria-label="Bibliotecas compartilhadas">{libraries.map((item) => <button type="button" role="tab" aria-selected={selectedId === item.id} className={selectedId === item.id ? "is-active" : ""} key={item.id} onClick={() => setSelectedId(item.id)}><strong>{item.name}</strong><small>{item.members.join(" · ")}</small></button>)}</div> : <p className="shared-empty shared-empty--panel">Crie uma biblioteca ou aceite um convite para montar uma estante em conjunto.</p>}
        {selected && <div className="shared-shelf-panel"><div className="shared-section-heading"><div><p className="library-kicker">{selected.members.join(" · ")}</p><h3>{selected.name}</h3></div><span>{selectedBooks.length} {selectedBooks.length === 1 ? "livro" : "livros"}</span></div>
          <form className="shared-book-search" onSubmit={searchBooks}><label>Adicionar obra do catálogo<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por título ou autor" /></label><button className="library-primary-button" disabled={busy || !query.trim()}>buscar obras</button></form>
          {searchResults.length > 0 && <div className="shared-catalog-results">{searchResults.map((book) => { const already = books.some((item) => item.shared_library.id === selectedId && (item.book.id === book.id || (book.is_external && item.book.title.trim().toLocaleLowerCase() === book.title.trim().toLocaleLowerCase() && item.book.author.trim().toLocaleLowerCase() === book.author.trim().toLocaleLowerCase()))); return <article key={book.id}><span>{book.title} <small>— {book.author}{book.source ? ` · ${book.source}` : ""}</small></span><button type="button" disabled={busy || already} onClick={() => addBook(book)}>{already ? "na estante" : "+ adicionar"}</button></article>; })}</div>}
          {selectedBooks.length ? <div className="shared-book-grid">{selectedBooks.map((item) => {
            const own = reading.find((state) => state.shared_library_id === selectedId && state.book_id === item.book.id);
            const edit = own ? edits[own.id] || { status: own.status, pages_read: own.pages_read } : null;
            const pending = requests.some((request) => request.shared_book_id === item.id && request.status === "PENDING");
            return <article className="shared-book-card" key={item.id}>{item.book.cover_url && <img src={item.book.cover_url} alt={`Capa de ${item.book.title}`} onError={(event) => { event.currentTarget.hidden = true; }} />}<div className="shared-book-card__body"><p className="library-kicker">adicionado por {item.added_by}</p><h4>{item.book.title}</h4><p>{item.book.author}</p><ul>{item.reading_states.map((state) => <li key={state.id}><span>{state.username}</span><small>{statusLabel(state.status)} · {state.pages_read}{item.book.total_pages ? `/${item.book.total_pages}` : ""} páginas</small></li>)}</ul>
              {own && <form className="shared-progress-form" onSubmit={(event) => { event.preventDefault(); saveProgress(item); }}><label>Seu status<select value={edit.status} onChange={(event) => setEdits((current) => ({ ...current, [own.id]: { ...edit, status: event.target.value } }))}><option value="WANT_TO_READ">Desejos</option><option value="READING">Lendo</option><option value="READ">Já lidos</option></select></label><label>Páginas<input type="number" min="0" max={item.book.total_pages || undefined} value={edit.pages_read} onChange={(event) => setEdits((current) => ({ ...current, [own.id]: { ...edit, pages_read: event.target.value } }))} /></label><button type="submit" disabled={busy}>salvar meu progresso</button></form>}
              <button className="shared-remove-button" type="button" disabled={busy || (item.added_by !== activeUsername && pending)} onClick={() => removeBook(item)}>{item.added_by === activeUsername ? "remover da estante" : pending ? "aguardando autorização" : "pedir remoção da obra"}</button>
            </div></article>;
          })}</div> : <p className="shared-empty">Esta estante ainda não tem obras. Busque uma no catálogo para adicioná-la.</p>}
        </div>}
      </section>

      {(activeInvitation || activeRequest) && <div className="shared-letter-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLetter(null); }}><article ref={letterDialogRef} className="shared-letter-open" role="dialog" aria-modal="true" aria-labelledby="shared-letter-title"><button ref={letterCloseRef} className="shared-letter-close" type="button" onClick={() => setLetter(null)} aria-label="Fechar carta">×</button><div className="shared-letter-open__envelope" aria-hidden="true"><span /></div><div className="shared-letter-open__paper"><p className="library-kicker">uma carta para você</p>
        {activeInvitation ? <><h2 id="shared-letter-title">Convite para ler em conjunto</h2><p><strong>{activeInvitation.sender}</strong> convidou você para a biblioteca <strong>{activeInvitation.shared_library.name}</strong>.</p><p>Participantes: {activeInvitation.shared_library.members.join(" · ")}</p>{activeInvitation.recipient === activeUsername && activeInvitation.status === "PENDING" && <div className="shared-letter-actions"><button type="button" disabled={busy} onClick={() => respond("decline")}>recusar</button><button type="button" disabled={busy} onClick={() => respond("accept")}>aceitar convite</button></div>}{activeInvitation.status !== "PENDING" && <p>Este convite foi {activeInvitation.status === "ACCEPTED" ? "aceito" : "recusado"}.</p>}</> : activeRequest && <><h2 id="shared-letter-title">Pedido para remover uma obra</h2><p><strong>{activeRequest.requested_by}</strong> pediu autorização para remover <strong>{activeRequest.book_title}</strong> da biblioteca <strong>{activeRequest.shared_library_name}</strong>.</p>{activeRequest.recipient === activeUsername && activeRequest.status === "PENDING" && <div className="shared-letter-actions"><button type="button" disabled={busy} onClick={() => respond("deny")}>manter na estante</button><button type="button" disabled={busy} onClick={() => respond("approve")}>autorizar remoção</button></div>}{activeRequest.status !== "PENDING" && <p>Pedido {activeRequest.status === "APPROVED" ? "aprovado" : "recusado"}.</p>}</>}
      </div></article></div>}
    </section>
  );
}
