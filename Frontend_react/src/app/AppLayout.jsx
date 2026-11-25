import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/app/AuthContext";
import { useLibrary, LibraryProvider } from "@/app/LibraryContext";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import BellToggle from "@/components/BellToggle";
import TextType from "@/components/TextType";
import SplitText from "@/components/SplitText";
import BookDetailDialog from "@/features/library/BookDetailDialog";
import "./paper-shell.css";

function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { username, signOut } = useAuth();
  const { openedEntry, isClosingBook, closeBook, updateEntry, removeEntry } = useLibrary();
  const [unreadCount, setUnreadCount] = useState(0);
  const activeView = ACTIVE_VIEWS[pathname] ?? "library";

  useEffect(() => {
    let active = true;
    apiRequest("/mailbox/")
      .then((data) => {
        if (active) setUnreadCount(Number(data.unread_count) || 0);
      })
      .catch(() => {
        // A tela de bibliotecas compartilhadas ainda mostra o correio se este contador falhar.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main id="library-main" className={`library-landing has-navigation ${PAPER_VIEWS.has(activeView) ? "library-landing--paper" : "library-landing--themed"}`}>
      <a className="skip-link" href="#library-content">Pular para o conteúdo</a>
    <header className="library-header">
      <button className="library-header__mark" type="button" onClick={() => navigate("/biblioteca")} aria-label="Ir para minha biblioteca">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5c2.6-.8 5-.3 7.5 1.2v12c-2.5-1.5-4.9-2-7.5-1.2zM19.5 5.5c-2.6-.8-5-.3-7.5 1.2v12c2.5-1.5 4.9-2 7.5-1.2z" /><path d="M12 6.7v12" /></svg>
      </button>
      <Link className="library-wordmark" to="/">
        <SplitText tag="span" text="Shelf." className="library-wordmark__split" effect="rise" splitType="chars" delay={45} duration={0.8} staggerFrom="start" trigger="load" textAlign="left" />
      </Link>
      <nav className="library-navigation" aria-label="Navegação principal" style={{ "--active-module-index": { library: 0, explore: 1, progress: 2, shared: 3 }[activeView] ?? 0 }}>
        <span className="library-navigation__indicator" aria-hidden="true" />
        <button aria-label="Minha biblioteca" aria-current={activeView === "library" ? "page" : undefined} className={activeView === "library" ? "is-active" : ""} type="button" onClick={() => navigate("/biblioteca")}><span aria-hidden="true" className="library-navigation__icon"><svg viewBox="0 0 24 24"><path d="M4.5 5.5c2.6-.8 5-.3 7.5 1.2v12c-2.5-1.5-4.9-2-7.5-1.2zM19.5 5.5c-2.6-.8-5-.3-7.5 1.2v12c2.5-1.5 4.9-2-7.5-1.2z" /><path d="M12 6.7v12" /></svg></span><TextType as="span" text="Minha biblioteca" typingSpeed={42} initialDelay={240} loop={false} typeEffect="fade" cursorStyle="bar" showCursor={false} className="library-navigation__text--long" /><TextType as="span" text="Biblioteca" typingSpeed={42} initialDelay={240} loop={false} typeEffect="fade" cursorStyle="bar" showCursor={false} className="library-navigation__text--short" aria-hidden="true" /></button>
        <button aria-label="Explorar obras" aria-current={activeView === "explore" ? "page" : undefined} className={activeView === "explore" ? "is-active" : ""} type="button" onClick={() => navigate("/catalogo")}><span aria-hidden="true" className="library-navigation__icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="m14.8 9.2-2 4.1-3.6 1.5 1.7-3.8z" /></svg></span><TextType as="span" text="Explorar obras" typingSpeed={42} initialDelay={430} loop={false} typeEffect="fade" cursorStyle="bar" showCursor={false} className="library-navigation__text--long" /><TextType as="span" text="Explorar" typingSpeed={42} initialDelay={430} loop={false} typeEffect="fade" cursorStyle="bar" showCursor={false} className="library-navigation__text--short" aria-hidden="true" /></button>
        <button aria-label="Progresso" aria-current={activeView === "progress" ? "page" : undefined} className={activeView === "progress" ? "is-active" : ""} type="button" onClick={() => navigate("/progresso")}><span aria-hidden="true" className="library-navigation__icon"><svg viewBox="0 0 24 24"><path d="M4 19h3V11H4zM10.5 19h3V7h-3zM17 19h3V4h-3z" /></svg></span><TextType as="span" text="Progresso" typingSpeed={42} initialDelay={620} loop={false} typeEffect="fade" cursorStyle="bar" showCursor={false} /></button>
        <button aria-label="Biblioteca compartilhada" aria-current={activeView === "shared" ? "page" : undefined} className={activeView === "shared" ? "is-active" : ""} type="button" onClick={() => navigate("/compartilhadas")}><span aria-hidden="true" className="library-navigation__icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.4-3.3 2.2-5 5.5-5s5.1 1.7 5.5 5M16 5.5a3 3 0 0 1 0 5.8m1 3c2.1.5 3.3 2 3.5 4.7" /></svg></span><TextType as="span" text="Compartilhada" typingSpeed={42} initialDelay={810} loop={false} typeEffect="fade" cursorStyle="bar" showCursor={false} className="library-navigation__text--long" /><TextType as="span" text="Juntos" typingSpeed={42} initialDelay={810} loop={false} typeEffect="fade" cursorStyle="bar" showCursor={false} className="library-navigation__text--short" aria-hidden="true" /></button>
      </nav>
      <div className="library-header__actions">
        <>
          <BellToggle
            className="library-header__icon-button library-header__notifications"
            label={unreadCount ? `${unreadCount} notificações não lidas` : "Notificações"}
            count={unreadCount}
            pressed={unreadCount > 0}
            badge
            waves
            color="#fff"
            background="transparent"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 8.5h17C20.5 16 18 16 18 9ZM10 21h4" /></svg>}
            onAction={() => navigate("/compartilhadas")}
          />
          <Link className="library-header__profile" to="/perfil" aria-label={username ? `Perfil de ${username}` : "Meu perfil"} aria-current={activeView === "profile" ? "page" : undefined}>
            <Avatar className="library-header__avatar" aria-hidden="true">
              <AvatarFallback>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.5-3.8 2.9-5.8 6.5-5.8s6 2 6.5 5.8" /></svg>
              </AvatarFallback>
            </Avatar>
          </Link>
        </>
        <button className="library-text-button" type="button" onClick={signOut}>sair</button>
      </div>
    </header>
      <Outlet context={{ setUnreadCount }} />
      {openedEntry && (
        <BookDetailDialog
          entry={openedEntry}
          isClosing={isClosingBook}
          onClose={closeBook}
          onEntryRemoved={removeEntry}
          onEntryUpdated={updateEntry}
        />
      )}
      <button className="back-to-welcome" type="button" onClick={() => navigate("/")}>voltar à abertura</button>
    </main>
  );
}

// Telas já no tema papel; as demais ainda usam o tema escuro.
const PAPER_VIEWS = new Set(["library", "explore", "progress", "profile"]);

const ACTIVE_VIEWS = {
  "/biblioteca": "library",
  "/catalogo": "explore",
  "/progresso": "progress",
  "/compartilhadas": "shared",
  "/perfil": "profile",
};

/** Moldura das telas logadas: exige sessão e fornece a biblioteca às telas filhas. */
export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/entrar" replace state={{ from: location }} />;
  return (
    <LibraryProvider>
      <AppShell />
    </LibraryProvider>
  );
}
