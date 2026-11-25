import { Link } from "react-router-dom";
import SpiralBookCanvas from "@/components/SpiralBookCanvas";
import SplitText from "@/components/SplitText";
import { welcomeBookCovers } from "@/data/welcomeBookCovers";
import "./login.css";

/** Molde das telas de entrada e de cadastro: fundo em espiral de capas, cabeçalho e cartão em duas colunas. */
export default function AuthLayout({ aside, asideLabel = "Uma mensagem sobre leitura", children }) {
  return (
    <main id="library-main" className="library-landing">
      <div className="login-spiral" aria-hidden="true">
        <SpiralBookCanvas items={welcomeBookCovers} />
      </div>
      <header className="library-header library-header--login">
        <Link className="library-wordmark" to="/">
          <SplitText tag="span" text="Shelf." className="library-wordmark__split" effect="rise" splitType="chars" delay={45} duration={0.8} staggerFrom="start" trigger="load" textAlign="left" />
        </Link>
        <div className="library-header__actions" />
      </header>
      <div className="login-layout">
        <aside className="login-story" aria-label={asideLabel}>
          {aside}
        </aside>
        {children}
      </div>
    </main>
  );
}
