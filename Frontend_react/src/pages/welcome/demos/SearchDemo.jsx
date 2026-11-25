import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useInView } from "./useInView";

// Cada busca digita o termo e faz três capas aparecerem. Capas: [título, cor escura, cor clara].
const SEARCHES = [
  {
    query: "fantasia",
    covers: [
      ["A Torre de Vidro", "#7a3f2e", "#c47a5f"],
      ["Reino das Cinzas", "#34402f", "#6b7d5c"],
      ["O Último Dragão", "#a8672f", "#e0aa55"],
    ],
  },
  {
    query: "mistério",
    covers: [
      ["Noite na Biblioteca", "#3d3030", "#8a6a5c"],
      ["A Carta Perdida", "#6b4a35", "#c79a6d"],
      ["O Relógio Parado", "#2f3a35", "#6f8577"],
    ],
  },
  {
    query: "biografias",
    covers: [
      ["Uma Vida em Cartas", "#8a5a3c", "#d6a77d"],
      ["Memórias do Mar", "#46523f", "#8fa27c"],
      ["Caminhos de Papel", "#6e3b3b", "#c07f73"],
    ],
  },
];

/** Demonstra uma pesquisa: o termo é digitado e as obras encontradas surgem uma a uma. */
export default function SearchDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const [reduced] = useState(prefersReducedMotion);
  const [text, setText] = useState(reduced ? SEARCHES[0].query : "");
  const [shown, setShown] = useState(reduced ? { set: 0, leaving: false } : null);

  useEffect(() => {
    if (reduced) return undefined;
    if (!inView) {
      setText("");
      setShown(null);
      return undefined;
    }

    let cancelled = false;
    const wait = (ms) =>
      new Promise((resolve) => window.setTimeout(resolve, ms)).then(() => {
        if (cancelled) throw new Error("cancelled");
      });

    (async () => {
      try {
        await wait(450);
        for (let index = 0; ; index = (index + 1) % SEARCHES.length) {
          const { query } = SEARCHES[index];
          for (let size = 1; size <= query.length; size += 1) {
            setText(query.slice(0, size));
            await wait(80);
          }
          await wait(320);
          setShown({ set: index, leaving: false });
          await wait(3000);
          setShown({ set: index, leaving: true });
          await wait(380);
          setShown(null);
          for (let size = query.length - 1; size >= 0; size -= 1) {
            setText(query.slice(0, size));
            await wait(28);
          }
          await wait(380);
        }
      } catch {
        // Cancelado quando o card sai da tela.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inView, reduced]);

  const results = shown ? SEARCHES[shown.set] : null;

  return (
    <div className="feature-demo feature-demo--search" ref={rootRef}>
      <div className="demo-stage" aria-hidden="true">
        <div className="sd">
          <div className="sd-field">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <span className="sd-text">{text || <em>descobrir livros</em>}</span>
            <i className="sd-caret" />
          </div>
          <p className={`sd-count${results && !shown.leaving ? " is-visible" : ""}`}>3 obras encontradas</p>
          <div className="sd-results">
            {results?.covers.map(([title, dark, light], index) => (
              <span
                key={`${shown.set}-${title}`}
                className={`sd-cover${shown.leaving ? " is-leaving" : ""}`}
                style={{ "--i": index, "--dark": dark, "--light": light }}
              >
                <b>{title}</b>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
