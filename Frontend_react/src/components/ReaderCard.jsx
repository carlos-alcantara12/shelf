import { useRef } from "react";
import "./ReaderCard.css";

const MAX = { books: 100, hours: 400, pages: 30000 };
const STATS = [
  { key: "books", label: "Livros lidos", unit: "" },
  { key: "hours", label: "Horas de leitura", unit: " h" },
  { key: "pages", label: "Páginas lidas", unit: "" },
];

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Cartão de leitor com brilho holográfico que acompanha o ponteiro.
 * `card`: { id, name, books, hours, pages, xp, next, badges }; `title`: nome no cartão; `profile`: tipo de leitor.
 */
export default function ReaderCard({ card, title, profile, tag = "Exemplo", footer = "Shelf · Cartão de leitor" }) {
  const ref = useRef(null);

  function onMove(event) {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    node.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    node.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    node.style.setProperty("--rx", `${((0.5 - y) * 14).toFixed(2)}deg`);
    node.style.setProperty("--ry", `${((x - 0.5) * 16).toFixed(2)}deg`);
  }

  function onLeave() {
    const node = ref.current;
    if (!node) return;
    ["--mx", "--my", "--rx", "--ry"].forEach((name) => node.style.removeProperty(name));
  }

  return (
    <div className="wr-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
      <article className={`wr-card wr-card--${card.id}`} ref={ref} key={card.id} aria-label={`Cartão de leitor nível ${card.name}`}>
        <span className="wr-card__foil" aria-hidden="true" />
        <header className="wr-card__top">
          <span className="wr-card__tag">{tag}</span>
          <span className="wr-card__level">Nível {card.name}</span>
        </header>
        <div className="wr-card__art" aria-hidden="true">
          <span className="wr-medal">
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 14c8-3 15-2 22 3v32c-7-5-14-6-22-3V14Zm44 0c-8-3-15-2-22 3v32c7-5 14-6 22-3V14Z" />
              <path d="M32 6l2.6 5.2 5.8.8-4.2 4 1 5.8L32 19l-5.2 2.8 1-5.8-4.2-4 5.8-.8L32 6Z" />
            </svg>
          </span>
        </div>
        <div className="wr-card__name">
          <h3>{title || `Leitor ${card.name}`}</h3>
          {profile && <p>Perfil: {profile}</p>}
        </div>
        <ul className="wr-stats">
          {STATS.map((stat) => (
            <li key={stat.key}>
              <div>
                <span>{stat.label}</span>
                <strong>{card[stat.key].toLocaleString("pt-BR")}{stat.unit}</strong>
              </div>
              <i><b style={{ width: `${Math.min(100, (card[stat.key] / MAX[stat.key]) * 100)}%` }} /></i>
            </li>
          ))}
        </ul>
        <div className="wr-xp">
          <div>
            <span>{card.next ? `Rumo ao ${card.next}` : "Patente máxima"}</span>
            <strong>{card.xp}%</strong>
          </div>
          <i><b style={{ width: `${card.xp}%` }} /></i>
        </div>
        <ul className="wr-badges" aria-label="Conquistas">
          {card.badges.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
        <footer className="wr-card__foot">
          <span>{footer}</span>
          <span>{card.pages.toLocaleString("pt-BR")} páginas</span>
        </footer>
      </article>
    </div>
  );
}
