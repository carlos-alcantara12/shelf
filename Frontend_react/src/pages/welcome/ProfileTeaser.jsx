import { useEffect, useRef, useState } from "react";
import AnimatedContent from "@/components/AnimatedContent";
import { Button, Container, Heading, Section } from "@/design-system";

// Exemplos ilustrativos (não são perfis de ninguém): mostram o que o questionário entrega.
// Os eixos e os polos são os mesmos do resultado real.
const EXAMPLES = [
  {
    name: "Explorador",
    line: "Lê para descobrir: muda de gênero, de época e de autor com facilidade.",
    axes: [
      { name: "Ritmo", low: "Contemplativo", high: "Acelerado", score: 74, color: "S1" },
      { name: "Foco", low: "Personagens", high: "Trama", score: 62, color: "S2" },
      { name: "Realidade", low: "Realista", high: "Imaginativo", score: 81, color: "S5" },
    ],
    genres: ["Fantasia", "Ficção científica", "Aventura"],
  },
  {
    name: "Contemplativo",
    line: "Lê devagar, com atenção a cada frase e a cada imagem.",
    axes: [
      { name: "Ritmo", low: "Contemplativo", high: "Acelerado", score: 22, color: "S1" },
      { name: "Foco", low: "Personagens", high: "Trama", score: 31, color: "S2" },
      { name: "Complexidade", low: "Acessível", high: "Desafiador", score: 70, color: "S4" },
    ],
    genres: ["Clássicos", "Poesia", "Romance"],
  },
  {
    name: "Maratonista",
    line: "Devora séries e histórias que não deixam parar.",
    axes: [
      { name: "Ritmo", low: "Contemplativo", high: "Acelerado", score: 90, color: "S1" },
      { name: "Tom", low: "Leve", high: "Sombrio", score: 66, color: "S3" },
      { name: "Foco", low: "Personagens", high: "Trama", score: 84, color: "S2" },
    ],
    genres: ["Mistério", "Terror", "Fantasia"],
  },
];

const STEPS = [
  { title: "Responda", text: "Perguntas simples sobre o que você gosta de ler." },
  { title: "Descubra", text: "Seu tipo de leitor, gêneros e jeito de ler." },
  { title: "Salve", text: "Crie a conta quando quiser e o perfil fica guardado nela." },
];

const ROTATE_MS = 2000;
const LEAVE_MS = 520;
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/** Marca quando o elemento entra na tela (uma vez), para disparar as animações de entrada. */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, seen];
}

/** Número que sobe de 0 até o valor quando o cartão fica na frente. */
function CountUp({ value, active, delay = 0 }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setShown(value);
      return undefined;
    }
    setShown(0);
    let frame;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / 900);
        setShown(Math.round(value * (1 - (1 - progress) ** 3)));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [active, value, delay]);
  return shown;
}

/** Baralho de cartões de exemplo: o da frente sai girando e os de trás avançam. */
function ExampleDeck() {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(null);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  function goTo(next) {
    if (next === active) return;
    window.clearTimeout(timerRef.current);
    setLeaving(active);
    setActive(next);
    timerRef.current = window.setTimeout(() => setLeaving(null), LEAVE_MS);
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const stackRef = useRef(null);
  const onPointerMove = (event) => {
    const node = stackRef.current;
    if (!node || event.pointerType === "touch" || prefersReducedMotion()) return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    node.style.setProperty("--tilt-x", `${(-y * 7).toFixed(2)}deg`);
    node.style.setProperty("--tilt-y", `${(x * 9).toFixed(2)}deg`);
  };
  const resetTilt = () => {
    stackRef.current?.style.removeProperty("--tilt-x");
    stackRef.current?.style.removeProperty("--tilt-y");
  };

  const dragStart = useRef(null);
  const step = (direction) => goTo((active + direction + EXAMPLES.length) % EXAMPLES.length);
  const onPointerDown = (event) => { if (!event.target.closest("button")) dragStart.current = event.clientX; };
  const onPointerUp = (event) => {
    if (dragStart.current === null) return;
    const delta = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
  };

  useEffect(() => {
    if (paused || prefersReducedMotion()) return undefined;
    const interval = window.setInterval(() => {
      setActive((current) => {
        const next = (current + 1) % EXAMPLES.length;
        setLeaving(current);
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setLeaving(null), LEAVE_MS);
        return next;
      });
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [paused]);

  return (
    <div
      className="wp-deck"
      tabIndex={0}
      role="group"
      aria-roledescription="carrossel"
      aria-label="Exemplos de resultado. Arraste para os lados ou use as setas para trocar o tipo de leitor"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={() => { dragStart.current = null; resetTilt(); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="wp-deck__stack" ref={stackRef} aria-live="off">
        {EXAMPLES.map((example, index) => {
          const position = (index - active + EXAMPLES.length) % EXAMPLES.length;
          return (
            <article
              className="wp-card"
              key={example.name}
              data-pos={leaving === index ? "out" : position}
              aria-hidden={position !== 0}
              aria-label={`Exemplo de resultado: ${example.name}`}
            >
              <span className="wp-card__pill">Seu perfil é:</span>
              <p className="wp-card__name">{example.name}</p>
              <p className="wp-card__line">{example.line}</p>
              <ul className="wp-axes">
                {example.axes.map((axis, axisIndex) => {
                  const lean = axis.score >= 56 ? "high" : axis.score <= 44 ? "low" : "mid";
                  return (
                    <li key={axis.name} style={{ "--axis": `var(--axis-${axis.color})`, "--i": axisIndex }}>
                      <div className="wp-axes__head">
                        <strong>{axis.name}</strong>
                        <span>
                          {lean === "mid" ? (
                            "Equilibrado"
                          ) : (
                            <>
                              <CountUp value={lean === "high" ? axis.score : 100 - axis.score} active={position === 0} delay={300 + axisIndex * 120} />
                              {`% ${lean === "high" ? axis.high : axis.low}`}
                            </>
                          )}
                        </span>
                      </div>
                      <i className="wp-axes__track">
                        <b style={{ left: `${Math.min(axis.score, 50)}%`, width: `${Math.abs(axis.score - 50)}%` }} />
                        <em style={{ left: `${axis.score}%` }} />
                      </i>
                      <div className="wp-axes__poles">
                        <span className={lean === "low" ? "is-active" : ""}>{axis.low}</span>
                        <span className={lean === "high" ? "is-active" : ""}>{axis.high}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <ul className="wp-card__genres" aria-label="Gêneros em destaque">
                {example.genres.map((genre, genreIndex) => (
                  <li key={genre} style={{ "--g": genreIndex }}>{genre}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfileTeaser({ onStart, sectionRef }) {
  const [panelRef, seen] = useInView(0.25);
  return (
    <Section ref={sectionRef} className="welcome-section welcome-profile" aria-labelledby="welcome-profile-title">
      <Container size="wide">
        <div className={`wp-panel${seen ? " is-seen" : ""}`} ref={panelRef}>
          <AnimatedContent className="wp-copy" distance={32} duration={0.8}>
            <Heading level={2} id="welcome-profile-title">
              Que tipo de <span>leitor</span> você é?
            </Heading>
            <p className="wp-lead">
              Responda a umas perguntas rápidas e veja seu tipo de leitor, os gêneros que mais combinam com você e o
              que você prefere evitar. Quanto mais você responde, mais preciso fica.
            </p>
            <ol className="wp-steps">
              {STEPS.map((step, index) => (
                <li key={step.title} style={{ "--s": index }}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="wp-cta">
              <Button size="lg" onClick={onStart}>Descobrir meu perfil</Button>
            </div>
          </AnimatedContent>
          <AnimatedContent distance={40} duration={0.9}>
            <ExampleDeck />
          </AnimatedContent>
        </div>
      </Container>
    </Section>
  );
}
