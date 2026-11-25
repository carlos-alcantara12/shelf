import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedContent from "@/components/AnimatedContent";
import { Button, Container, Heading, Section } from "@/design-system";

// Dados de exemplo (ilustrativos): mostram como a evolução aparece para quem acompanha a leitura.
const MONTH_PAGES = Array.from({ length: 30 }, (_, i) => Math.round(24 + i * 1.1 + 13 * Math.sin(i * 0.95) + (i % 7 === 5 ? 22 : 0)));
const MONTH_BOOKS = Array.from({ length: 30 }, (_, i) => ([6, 13, 19, 27].includes(i) ? 1 : 0));

const PERIODS = {
  week: {
    label: "Semanal",
    heading: "Sua evolução esta semana",
    title: "Esta semana",
    unit: "dias",
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    pages: [18, 32, 25, 41, 30, 58, 46],
    books: [0, 0, 0, 1, 0, 0, 1],
  },
  month: {
    label: "Mensal",
    heading: "Sua evolução neste mês",
    title: "Últimos 30 dias",
    unit: "dias",
    labels: Array.from({ length: 30 }, (_, i) => (i % 5 === 0 || i === 29 ? String(i + 1) : "")),
    pages: MONTH_PAGES,
    books: MONTH_BOOKS,
  },
  year: {
    label: "Anual",
    heading: "Sua evolução neste ano",
    title: "Últimos 12 meses",
    unit: "meses",
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    pages: [180, 210, 260, 240, 330, 390, 420, 380, 470, 520, 560, 640],
    books: [1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 5, 5],
  },
};

const BENEFITS = [
  { title: "Veja seu ritmo", text: "Cada página registrada entra no gráfico, e você vê se está lendo mais ou menos que no mês passado." },
  { title: "Defina uma meta diária", text: "Escolha quantos minutos quer ler por dia e acompanhe quanto já cumpriu hoje." },
  { title: "Compare períodos", text: "Veja em quais semanas e meses você leu mais e quando o ritmo caiu." },
];

const W = 640;
const H = 330;
const PAD = { left: 16, right: 16, top: 24 };
const AREA_BOTTOM = 210;
const BARS_TOP = 236;
const BARS_BOTTOM = 276;

const sum = (values) => values.reduce((total, value) => total + value, 0);
const format = (value) => value.toLocaleString("pt-BR");

/** Curva suave (Catmull-Rom → Bézier) passando por todos os pontos. */
function smoothPath(points) {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

/** Número que sobe de 0 até o valor (e recomeça quando o valor muda, por exemplo ao trocar de período). */
function CountUp({ value, active, sign = false, suffix = "" }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return undefined;
    }
    setShown(0);
    let frame;
    const start = performance.now() + 250;
    const tick = (now) => {
      const progress = Math.min(1, Math.max(0, (now - start) / 1100));
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, value]);
  return `${sign && shown >= 0 ? "+" : ""}${shown.toLocaleString("pt-BR")}${suffix}`;
}

function useInView() {
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
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, seen];
}

function EvolutionChart({ data, seen, onFormed }) {
  const [hover, setHover] = useState(null);
  const count = data.pages.length;
  const max = Math.max(...data.pages);
  const niceMax = Math.ceil(max / 10) * 10 || 10;
  const maxBooks = Math.max(1, ...data.books);
  const step = (W - PAD.left - PAD.right) / (count - 1);

  const points = useMemo(
    () => data.pages.map((value, i) => ({ x: PAD.left + i * step, y: AREA_BOTTOM - (value / niceMax) * (AREA_BOTTOM - PAD.top) })),
    [data.pages, niceMax, step],
  );
  const line = smoothPath(points);
  const area = `${line} L ${points.at(-1).x} ${AREA_BOTTOM} L ${points[0].x} ${AREA_BOTTOM} Z`;
  const grid = [0, 0.5, 1].map((ratio) => ({ y: AREA_BOTTOM - ratio * (AREA_BOTTOM - PAD.top), value: Math.round(niceMax * ratio) }));
  const showDots = count <= 12;
  const barWidth = Math.min(22, step * 0.5);

  function onMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * W;
    setHover(Math.min(count - 1, Math.max(0, Math.round((x - PAD.left) / step))));
  }

  const hovered = hover !== null ? points[hover] : null;
  const tipX = hovered ? Math.min(W - 96, Math.max(8, hovered.x - 48)) : 0;

  return (
    <svg
      className={`we-chart${seen ? " is-seen" : ""}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Gráfico de páginas lidas: ${data.title}. Total de ${format(sum(data.pages))} páginas e ${sum(data.books)} livros concluídos.`}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
      onAnimationEnd={(event) => {
        // A linha é a última a terminar de se desenhar: é o sinal de que o gráfico está formado.
        if (event.target.classList?.contains("we-line")) onFormed();
      }}
    >
      <defs>
        <linearGradient id="we-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#98543f" stopOpacity="0.34" />
          <stop offset="1" stopColor="#98543f" stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((row) => (
        <g key={row.y}>
          <line x1={PAD.left} x2={W - PAD.right} y1={row.y} y2={row.y} className="we-gridline" />
          <text x={PAD.left} y={row.y - 6} className="we-grid-label">{row.value}</text>
        </g>
      ))}
      <path d={area} className="we-area" fill="url(#we-area)" />
      <path d={line} className="we-line" pathLength="1" />
      {showDots && points.map((point, i) => (
        <circle key={i} cx={point.x} cy={point.y} r={hover === i ? 6 : 4} className="we-dot" style={{ "--i": i }} />
      ))}
      <text x={PAD.left} y={BARS_TOP - 8} className="we-grid-label">Livros concluídos</text>
      {data.books.map((value, i) => {
        const height = value ? Math.max(8, (value / maxBooks) * (BARS_BOTTOM - BARS_TOP)) : 3;
        return (
          <rect
            key={i}
            x={points[i].x - barWidth / 2}
            y={BARS_BOTTOM - height}
            width={barWidth}
            height={height}
            rx="4"
            className={`we-bar${value ? " has-value" : ""}`}
            style={{ "--i": i }}
          />
        );
      })}
      {data.labels.map((label, i) => label && (
        <text key={i} x={points[i].x} y={H - 14} className="we-axis-label" textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"}>{label}</text>
      ))}
      {hovered && (
        <g className="we-hover" pointerEvents="none">
          <line x1={hovered.x} x2={hovered.x} y1={PAD.top - 6} y2={BARS_BOTTOM} className="we-hover-line" />
          <circle cx={hovered.x} cy={hovered.y} r="7" className="we-hover-dot" />
          <g transform={`translate(${tipX}, ${Math.max(0, hovered.y - 64)})`}>
            <rect width="96" height="46" rx="10" className="we-tip" />
            <text x="48" y="20" textAnchor="middle" className="we-tip-value">{format(data.pages[hover])} págs</text>
            <text x="48" y="36" textAnchor="middle" className="we-tip-label">{data.labels[hover] || `${data.unit === "dias" ? "Dia" : "Mês"} ${hover + 1}`}</text>
          </g>
        </g>
      )}
    </svg>
  );
}

const HOLD_MS = 1000; // pausa depois que o gráfico termina de se formar
const ORDER = ["week", "month", "year"];

export default function EvolutionShowcase({ onStart, sectionRef }) {
  const [period, setPeriod] = useState("week");
  const [paused, setPaused] = useState(false);
  const [chartRef, seen] = useInView();
  const data = PERIODS[period];

  const [formed, setFormed] = useState(false);
  const cardRef = useRef(null);

  function tiltCard(event) {
    const node = cardRef.current;
    if (!node || event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = node.getBoundingClientRect();
    node.style.setProperty("--tilt-x", `${((0.5 - (event.clientY - box.top) / box.height) * 3).toFixed(2)}deg`);
    node.style.setProperty("--tilt-y", `${(((event.clientX - box.left) / box.width - 0.5) * 4).toFixed(2)}deg`);
  }

  function resetTilt() {
    cardRef.current?.style.removeProperty("--tilt-x");
    cardRef.current?.style.removeProperty("--tilt-y");
  }

  // Quando o gráfico termina de se formar, espera 1 segundo e troca para o próximo período.
  useEffect(() => {
    if (!formed || paused) return undefined;
    const timer = window.setTimeout(() => {
      setFormed(false);
      setPeriod((current) => ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]);
    }, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [formed, paused]);

  function choosePeriod(id) {
    setFormed(false);
    setPeriod(id);
  }

  const totals = useMemo(() => {
    const pages = sum(data.pages);
    const books = sum(data.books);
    const third = Math.max(1, Math.floor(data.pages.length / 3));
    const first = sum(data.pages.slice(0, third));
    const last = sum(data.pages.slice(-third));
    const growth = first ? Math.round(((last - first) / first) * 100) : 0;
    const active = data.pages.filter((value) => value > 0).length;
    return { pages, books, growth, active };
  }, [data]);

  return (
    <Section ref={sectionRef} className="welcome-section welcome-evolution" aria-labelledby="welcome-evolution-title">
      <Container size="wide">
        <div className="we-head">
          <AnimatedContent distance={32} duration={0.8}>
            <Heading level={2} id="welcome-evolution-title" className={seen ? "is-seen" : ""}>
              Quem acompanha a leitura <span>evolui mais</span>
            </Heading>
          </AnimatedContent>
        </div>

        <div className={`we-grid${seen ? " is-seen" : ""}`}>
          <AnimatedContent distance={40} duration={0.9}>
            <article
              className="we-card"
              ref={(node) => {
                chartRef.current = node;
                cardRef.current = node;
              }}
              onPointerMove={tiltCard}
              onPointerLeave={resetTilt}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
            >
              <header className="we-card__top">
                <div>
                  <span className="we-pill" key={period}>{data.heading}</span>
                  <h3>{data.title}</h3>
                </div>
                <div className="we-tabs" role="group" aria-label="Período do gráfico">
                  {Object.entries(PERIODS).map(([id, item]) => (
                    <button type="button" key={id} className={period === id ? "is-active" : ""} aria-pressed={period === id} onClick={() => choosePeriod(id)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </header>

              <ul className="we-kpis">
                <li>
                  <strong><CountUp value={totals.pages} active={seen} /></strong>
                  <span>páginas lidas</span>
                </li>
                <li>
                  <strong><CountUp value={totals.books} active={seen} /></strong>
                  <span>{totals.books === 1 ? "livro concluído" : "livros concluídos"}</span>
                </li>
                <li>
                  <strong><CountUp value={totals.active} active={seen} /></strong>
                  <span>{data.unit} com leitura</span>
                </li>
                <li className={totals.growth >= 0 ? "is-up" : ""}>
                  <strong><CountUp value={totals.growth} active={seen} sign suffix="%" /></strong>
                  <span>vs. início do período</span>
                </li>
              </ul>

              <EvolutionChart key={period} data={data} seen={seen} onFormed={() => setFormed(true)} />
            </article>
          </AnimatedContent>

          <AnimatedContent distance={40} duration={0.9}>
            <div className="we-side">
              <ul className="we-benefits">
                {BENEFITS.map((benefit, index) => (
                  <li key={benefit.title} style={{ "--b": index }}>
                    <span aria-hidden="true">{index + 1}</span>
                    <div>
                      <strong>{benefit.title}</strong>
                      <p>{benefit.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="we-cta">
                <Button size="lg" onClick={onStart}>Começar a acompanhar →</Button>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </Container>
    </Section>
  );
}
