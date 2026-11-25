import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CountUp from "@/components/CountUp";
import ReadingChart from "@/features/progress/ReadingChart";
import { apiRequest } from "@/lib/api";
import "./progress.css";

const PERIODS = [
  { id: "week", label: "Semana", unit: "dia", units: "dias", activeLabel: "Dias com leitura", ago: ["semana", "semanas"] },
  { id: "month", label: "Mês", unit: "dia", units: "dias", activeLabel: "Dias com leitura", ago: ["mês", "meses"] },
  { id: "year", label: "Ano", unit: "mês", units: "meses", activeLabel: "Meses com leitura", ago: ["ano", "anos"] },
];

const METRICS = [
  { id: "pages", label: "Páginas" },
  { id: "minutes", label: "Tempo" },
];

const hoursText = (minutes) => (minutes >= 60 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}` : `${minutes} min`);
const number = (value) => Number(value).toLocaleString("pt-BR");

export default function ProgressPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("week");
  const [metric, setMetric] = useState("pages");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiRequest(`/reading-stats/?period=${period}&offset=${offset}`)
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period, offset]);

  const config = PERIODS.find((item) => item.id === period);
  const buckets = data?.buckets || [];
  const totals = data?.totals || { pages: 0, minutes: 0, books: 0 };
  const activeUnits = buckets.filter((item) => item.pages > 0 || item.minutes > 0 || item.books > 0).length;
  const best = buckets.reduce((top, item) => (item.pages > (top?.pages ?? 0) ? item : top), null);
  const average = activeUnits ? Math.round(totals.pages / activeUnits) : 0;
  const empty = totals.pages === 0 && totals.minutes === 0 && totals.books === 0;

  const changePeriod = (next) => {
    setPeriod(next);
    setOffset(0);
  };

  const agoText = offset === 0 ? "período atual" : `${-offset} ${offset === -1 ? config.ago[0] : config.ago[1]} atrás`;

  const metrics = [
    { value: totals.pages, label: "Páginas lidas", render: <CountUp value={totals.pages} /> },
    { value: totals.minutes, label: "Tempo de leitura", render: <CountUp value={totals.minutes} format={hoursText} /> },
    { value: totals.books, label: "Livros concluídos", render: <CountUp value={totals.books} /> },
    { value: activeUnits, label: config.activeLabel, render: <><CountUp value={activeUnits} /><small> de {buckets.length}</small></> },
  ];

  return (
    <section id="library-content" className="prog" aria-labelledby="reading-progress-title" aria-busy={loading}>
      <header className="prog-header">
        <div>
          <p className="prog-eyebrow">Evolução</p>
          <h1 id="reading-progress-title">Seu progresso</h1>
          <p className="prog-muted">
            Para registrar uma leitura, abra um livro na{" "}
            <button type="button" className="prog-link" onClick={() => navigate("/biblioteca")}>estante</button>.
          </p>
        </div>
        <div className="prog-tabs" role="group" aria-label="Período">
          {PERIODS.map((item) => (
            <button type="button" key={item.id} className={period === item.id ? "is-active" : ""} aria-pressed={period === item.id} onClick={() => changePeriod(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="prog-error" role="alert">{error}</p>}

      {data ? (
        <div className={`prog-body${loading ? " is-loading" : ""}`}>
          <ul className="prog-metrics" aria-label="Resumo do período">
            {metrics.map((item, index) => (
              <li key={item.label} style={{ "--k": index }}>
                <strong>{item.render}</strong>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>

          <section className="prog-card" aria-labelledby="progress-evolution-title">
            <div className="prog-toolbar">
              <div className="prog-nav" role="group" aria-label="Navegar entre períodos">
                <button type="button" className="prog-nav__step" aria-label="Período anterior" disabled={loading || offset <= -600} onClick={() => setOffset((value) => value - 1)}>‹</button>
                <div className="prog-nav__title" aria-live="polite">
                  <h2 id="progress-evolution-title">{data.title}</h2>
                  <span>{agoText}</span>
                </div>
                <button type="button" className="prog-nav__step" aria-label="Próximo período" disabled={loading || offset >= 0} onClick={() => setOffset((value) => value + 1)}>›</button>
                {offset !== 0 && <button type="button" className="prog-link" onClick={() => setOffset(0)}>Voltar para hoje</button>}
              </div>
              <div className="prog-tabs prog-tabs--small" role="group" aria-label="O que mostrar no gráfico">
                {METRICS.map((item) => (
                  <button type="button" key={item.id} className={metric === item.id ? "is-active" : ""} aria-pressed={metric === item.id} onClick={() => setMetric(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="prog-legend">
              <span><i className="is-pages" />{metric === "pages" ? "Páginas lidas" : "Minutos de leitura"}</span>
              <span><i className="is-books" />Livros concluídos</span>
              <em>Cada série usa a sua própria escala.</em>
            </p>

            <ReadingChart key={`${data.title}-${metric}`} items={buckets} metric={metric} dense={buckets.length > 14} unitName={config.unit} />

            {empty ? (
              <p className="prog-note">As leituras aparecem aqui depois que você usa o cronômetro ou atualiza as páginas de um livro.</p>
            ) : (
              <ul className="prog-insights" aria-label="Destaques do período">
                {best && best.pages > 0 && (
                  <li>
                    <span>Melhor {config.unit}</span>
                    <strong>{best.label}</strong>
                    <small>{number(best.pages)} páginas</small>
                  </li>
                )}
                <li>
                  <span>Média por {config.unit} com leitura</span>
                  <strong>{number(average)} páginas</strong>
                  <small>{activeUnits} {activeUnits === 1 ? config.unit : config.units} com leitura</small>
                </li>
                <li>
                  <span>Constância</span>
                  <strong>{buckets.length ? Math.round((activeUnits / buckets.length) * 100) : 0}%</strong>
                  <small>{activeUnits} de {buckets.length} {config.units}</small>
                </li>
              </ul>
            )}
          </section>
        </div>
      ) : (
        !loading && !error && <p className="prog-muted">Não foi possível carregar seu progresso.</p>
      )}
      {loading && !data && <p className="prog-muted" role="status">Reunindo suas leituras…</p>}
    </section>
  );
}
