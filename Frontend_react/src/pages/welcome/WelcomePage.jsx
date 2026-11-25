import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import AnimatedContent from "@/components/AnimatedContent";
import SpiralBookCanvas from "@/components/SpiralBookCanvas";
import TextType from "@/components/TextType";
import { welcomeBookCovers } from "@/data/welcomeBookCovers";
import { Button } from "@/design-system";
import FeatureCarousel from "./FeatureCarousel";
import { featureSlides } from "./featureSlides";
import EvolutionShowcase from "./EvolutionShowcase";
import ProfileTeaser from "./ProfileTeaser";
import ReaderCardShowcase from "./ReaderCardShowcase";
import "./welcome.css";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function WelcomeScreen({ onNavigate, isAuthenticated }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const screenRef = useRef(null);
  const profileRef = useRef(null);
  const continueTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(continueTimerRef.current), []);

  useEffect(() => {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) return undefined;
    const previousColor = themeColor.content;
    themeColor.content = "#f5efe6";
    return () => {
      themeColor.content = previousColor;
    };
  }, []);

  // O cabeçalho ganha fundo quando a página sai do topo.
  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Quem já tem sessão vai direto à biblioteca; os demais escolhem entre entrar e criar conta (diagnóstico).
  function go(destination) {
    if (isLeaving) return;
    setIsLeaving(true);
    continueTimerRef.current = window.setTimeout(() => onNavigate(destination), prefersReducedMotion() ? 0 : 260);
  }
  const loginPath = isAuthenticated ? "/biblioteca" : "/entrar";
  const signupPath = isAuthenticated ? "/biblioteca" : "/diagnostico";

  // Luz que acompanha o ponteiro no fundo.
  useEffect(() => {
    const screen = screenRef.current;
    const supportsPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!screen || !supportsPointer.matches || prefersReducedMotion()) return undefined;

    function handlePointerMove(event) {
      const x = Math.max(0, Math.min(1, event.clientX / window.innerWidth));
      const y = Math.max(0, Math.min(1, event.clientY / window.innerHeight));
      screen.style.setProperty("--pointer-x", `${(x * 100).toFixed(1)}%`);
      screen.style.setProperty("--pointer-y", `${(y * 100).toFixed(1)}%`);
      screen.style.setProperty("--depth-shift-x", `${((0.5 - x) * 10).toFixed(1)}px`);
      screen.style.setProperty("--depth-shift-y", `${((0.5 - y) * 8).toFixed(1)}px`);
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  const ctaLabel = isAuthenticated ? "Abrir minha estante" : "Criar minha estante";

  return (
    <main
      ref={screenRef}
      className={`welcome-screen${isScrolled ? " is-scrolled" : ""}${isLeaving ? " is-leaving" : ""}`}
      aria-label="Shelf, sua biblioteca pessoal"
    >
      <header className="welcome-header">
        <div className="welcome-logo-mark" aria-label="Shelf" role="img">
          <svg viewBox="0 0 240 200" aria-hidden="true" focusable="false">
            <rect x="63" y="34" width="37" height="120" rx="6" />
            <rect x="105" y="23" width="42" height="131" rx="6" />
            <rect x="155" y="35" width="38" height="123" rx="6" transform="rotate(-17 174 96.5)" />
            <rect x="34" y="165" width="172" height="11" rx="1" />
          </svg>
        </div>
        <div className="welcome-header__actions">
          {isAuthenticated ? (
            <Button size="sm" onClick={() => go(loginPath)}>
              Abrir minha estante
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => go(loginPath)} aria-label="Entrar na sua conta">
                Entrar
              </Button>
              <Button size="sm" onClick={() => go(signupPath)}>
                Criar conta
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="welcome-grain" aria-hidden="true" />
      <div className="welcome-depth" aria-hidden="true" />
      <div className="welcome-book-drift" aria-hidden="true">
        <SpiralBookCanvas items={welcomeBookCovers} />
      </div>

      <section className="welcome-content" aria-label="Boas-vindas">
        <div className="welcome-hero">
          <div className="brand-lockup" aria-label="Shelf">
            <h1 className="brand-name" aria-label="Shelf">
              <TextType
                as="span"
                text="Shelf"
                typingSpeed={135}
                initialDelay={450}
                loop={false}
                showCursor
                cursorStyle="bar"
                cursorGlide
                cursorColor="#93a7ff"
                typeEffect="fade"
                className="brand-name__typed"
              />
            </h1>
          </div>
          <AnimatedContent trigger="mount" distance={16} duration={0.8} delay={1.1}>
            <p className="welcome-hero__tagline">Sua estante, do seu jeito</p>
            <p className="welcome-hero__sub">Cadastre seus livros, marque as páginas que leu e encontre o que ler depois.</p>
            <Button size="lg" onClick={() => go(signupPath)}>
              {ctaLabel}
            </Button>
          </AnimatedContent>
        </div>
        <button
          className="welcome-scroll-button"
          type="button"
          aria-label="Ver apresentação do Shelf"
          onClick={() =>
            document
              .getElementById("welcome-features")
              ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" })
          }
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 4v15m-6-6 6 6 6-6" />
          </svg>
        </button>
      </section>

      <section
        id="welcome-features"
        className="welcome-section welcome-section--paper welcome-intro"
        aria-label="Apresentação"
      >
        <AnimatedContent distance={40} duration={0.8}>
          <section className="welcome-feature-showcase" aria-labelledby="welcome-feature-title">
            <h2 id="welcome-feature-title">O que dá para fazer no Shelf</h2>
            <FeatureCarousel slides={featureSlides} label="Recursos do Shelf" />
          </section>
        </AnimatedContent>
      </section>

      {/* O perfil é aberto a todos: quem já tem conta também faz o questionário e salva o resultado. */}
      <ProfileTeaser sectionRef={profileRef} onStart={() => go("/diagnostico")} />

      <EvolutionShowcase onStart={() => go(signupPath)} />

      <ReaderCardShowcase onStart={() => go(signupPath)} ctaLabel={ctaLabel} />

      <footer className="welcome-footer">
        <span>
          <strong>Shelf</strong>
          <span aria-hidden="true">·</span>
          Um capítulo de cada vez
        </span>
        <Button variant="ghost" size="sm" onClick={() => go(loginPath)}>
          {isAuthenticated ? "Abrir minha estante" : "Entrar"}
        </Button>
      </footer>
    </main>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  return (
    <WelcomeScreen
      isAuthenticated={isAuthenticated}
      onNavigate={navigate}
    />
  );
}
