import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import "./diagnostic.css";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Moldura das telas do diagnóstico: logo, barra de progresso segmentada (opcional),
 * atalho para pular e, no resultado, uma linha que acompanha a rolagem da página.
 */
export default function DiagnosticLayout({
  children,
  progress = null,
  segments = 1,
  progressLabel = "Progresso",
  showSkip = true,
  scrollProgress = false,
  wide = false,
}) {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    if (!scrollProgress) return undefined;
    const update = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      setScrolled(max > 0 ? clamp(root.scrollTop / max, 0, 1) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollProgress]);

  return (
    <div className="dg">
      <header className="dg-header">
        <Link to="/" className="dg-logo" aria-label="Shelf, voltar à abertura">
          <svg viewBox="0 0 240 200" aria-hidden="true" focusable="false">
            <rect x="63" y="34" width="37" height="120" rx="6" />
            <rect x="105" y="23" width="42" height="131" rx="6" />
            <rect x="155" y="35" width="38" height="123" rx="6" transform="rotate(-17 174 96.5)" />
            <rect x="34" y="165" width="172" height="11" rx="1" />
          </svg>
        </Link>
        {progress !== null ? (
          <div
            className="dg-progress"
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            {Array.from({ length: segments }, (_, index) => (
              <span className="dg-progress__segment" key={index}>
                <i style={{ transform: `scaleX(${clamp(progress * segments - index, 0, 1)})` }} />
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}
        {showSkip && !isAuthenticated ? (
          <Link className="dg-skip" to="/cadastro">
            Pular e criar conta
          </Link>
        ) : (
          <span />
        )}
        {scrollProgress && <span className="dg-scroll" aria-hidden="true" style={{ transform: `scaleX(${scrolled})` }} />}
      </header>
      <main className={`dg-main${wide ? " dg-main--wide" : ""}`}>{children}</main>
    </div>
  );
}
