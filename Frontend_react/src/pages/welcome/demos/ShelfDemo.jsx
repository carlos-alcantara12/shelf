import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, useInView } from "./useInView";

const BOOKS = [
  { title: "Moonlight", color: "#98543f", height: 150 },
  { title: "Wander", color: "#59694f", height: 132 },
  { title: "Quiet Chapters", color: "#d99a3d", height: 164, wide: true },
  { title: "In Bloom", color: "#6f4e37", height: 140 },
  { title: "Stillness", color: "#a8725a", height: 156 },
  { title: "Grow", color: "#3f4a3c", height: 128 },
];

// Livros que saem da estante, um de cada vez, mostrando a categoria de cada um.
const PULLS = [
  { index: 2, label: "Lendo agora", dot: "var(--color-amber-500)" },
  { index: 4, label: "Já lido", dot: "var(--color-sage-600)" },
  { index: 0, label: "Quero ler", dot: "var(--color-terracotta-400)" },
];

export default function ShelfDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.set(".shelf-chip", { autoAlpha: 0, y: 6, xPercent: -50 });
      gsap.set(".shelf-book", { transformOrigin: "50% 100%" });
      if (!inView) return;

      const timeline = gsap.timeline({ repeat: -1, delay: 0.5 });
      PULLS.forEach(({ index }) => {
        const book = `.shelf-book[data-index="${index}"]`;
        const chip = `${book} .shelf-chip`;
        timeline
          .to(book, { y: -30, rotation: -3, duration: 0.7, ease: "power3.out" })
          .to(chip, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, "<0.2")
          .to({}, { duration: 1.3 })
          .to(chip, { autoAlpha: 0, y: 6, duration: 0.25 })
          .to(book, { y: 0, rotation: 0, duration: 0.6, ease: "power2.inOut" }, "<")
          .to({}, { duration: 0.35 });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [inView]);

  return (
    <div className="feature-demo feature-demo--shelf" ref={rootRef}>
      <div className="demo-stage" aria-hidden="true">
        <div className="shelf-stage">
          <div className="shelf-books">
            {BOOKS.map((book, index) => {
              const pull = PULLS.find((item) => item.index === index);
              return (
                <span
                  key={book.title}
                  className={`shelf-book${book.wide ? " shelf-book--wide" : ""}`}
                  data-index={index}
                  style={{ "--c": book.color, "--h": book.height }}
                >
                  <span className="shelf-book__title">{book.title}</span>
                  {pull && (
                    <span className="shelf-chip" style={{ "--dot": pull.dot }}>
                      {pull.label}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <div className="shelf-plank" />
        </div>
      </div>
    </div>
  );
}
