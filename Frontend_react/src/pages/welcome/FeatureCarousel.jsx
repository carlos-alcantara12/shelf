import { useCallback, useEffect, useRef, useState } from "react";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Carrossel horizontal de recursos.
 * - O trilho sangra até a borda da tela e rola livremente (sem snap).
 * - As setas ficam sobre a mídia; "anterior" só aparece depois de rolar e
 *   "próximo" some no fim.
 * - Cada slide: { id, title, description, media }.
 */
export default function FeatureCarousel({ slides, label }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const start = track.scrollLeft <= 1;
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    setEdges((current) => (current.start === start && current.end === end ? current : { start, end }));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    updateEdges();
    track.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      track.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  function move(direction) {
    const track = trackRef.current;
    const card = track?.querySelector(".feature-carousel__slide");
    if (!track || !card) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  }

  return (
    <div className="feature-carousel">
      <div
        ref={trackRef}
        className="feature-carousel__track"
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className="feature-carousel__slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slides.length}`}
          >
            {slide.media}
            <h3>{slide.title}</h3>
            <p>{slide.description}</p>
          </article>
        ))}
      </div>

      <div className="feature-carousel__arrows">
        <button
          type="button"
          className={`feature-carousel__arrow${edges.start ? " is-hidden" : ""}`}
          aria-label="Recurso anterior"
          tabIndex={edges.start ? -1 : 0}
          onClick={() => move(-1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          className={`feature-carousel__arrow${edges.end ? " is-hidden" : ""}`}
          aria-label="Próximo recurso"
          tabIndex={edges.end ? -1 : 0}
          onClick={() => move(1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
