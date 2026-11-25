import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { useLibrary } from "@/app/LibraryContext";
import ReaderCard from "@/components/ReaderCard";
import { Button } from "@/design-system";
import ProfileReport from "@/pages/diagnostic/ProfileReport";
import { apiRequest } from "@/lib/api";
import { clearDraft, fetchRecommendations } from "@/lib/diagnostic";
import { buildCard, RANK_STEPS, rankIndexFor } from "@/lib/readerCard";
import "@/pages/diagnostic/diagnostic.css";
import "./profile.css";

// TESTE: enquanto a patente não é validada com dados reais, o cartão mostra esta patente fixa.
// Os números do cartão (livros, horas, páginas) são sempre os reais. Para usar a patente calculada, troque por null.
const TEST_RANK = "diamante";

const sumBy = (items, key) => items.reduce((total, item) => total + (Number(item[key]) || 0), 0);

export default function ProfilePage() {
  const navigate = useNavigate();
  const { username } = useAuth();
  const { entries } = useLibrary();
  const [profile, setProfile] = useState({ status: "loading", data: null });
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState({ state: "idle", items: [] });

  useEffect(() => {
    let active = true;
    apiRequest("/diagnostic/profile/")
      .then((data) => active && setProfile({ status: "ready", data }))
      .catch((error) => active && setProfile({ status: error.status === 404 ? "none" : "error", data: null }));
    apiRequest("/reading-stats/")
      .then((data) => active && setStats(data))
      .catch(() => active && setStats({ monthly: [] }));
    return () => {
      active = false;
    };
  }, []);

  const answersKey = profile.data ? JSON.stringify(profile.data.answers) : "";
  useEffect(() => {
    if (!answersKey) return undefined;
    const controller = new AbortController();
    setBooks({ state: "loading", items: [] });
    fetchRecommendations({ answers: JSON.parse(answersKey) }, controller.signal)
      .then((data) => setBooks({ state: "ready", items: data.items }))
      .catch((error) => {
        if (error.name !== "AbortError") setBooks({ state: "error", items: [] });
      });
    return () => controller.abort();
  }, [answersKey]);

  const numbers = useMemo(() => {
    const monthly = stats?.monthly || [];
    return {
      books: entries.filter((entry) => entry.status === "READ").length,
      hours: Math.round(sumBy(monthly, "minutes") / 60),
      pages: sumBy(monthly, "pages"),
    };
  }, [entries, stats]);

  const card = buildCard(numbers, TEST_RANK);
  const realRank = RANK_STEPS[rankIndexFor(numbers)];
  const result = profile.data?.result;
  const archetype = result?.archetype;

  function retake() {
    clearDraft();
    navigate("/diagnostico");
  }

  return (
    <section id="library-content" className="pf" aria-labelledby="profile-title">
      <header className="pf-header">
        <span className="pf-avatar" aria-hidden="true">{(username || "?").slice(0, 1).toUpperCase()}</span>
        <div>
          <p className="pf-eyebrow">Seu perfil</p>
          <h1 id="profile-title">{username}</h1>
          <p className="pf-sub">{archetype ? `Leitor ${archetype.label}` : "Você ainda não fez o teste de perfil de leitor."}</p>
        </div>
      </header>

      <div className="pf-top">
        <div className="pf-card">
          <ReaderCard card={card} title={username} profile={archetype?.label} tag="Modo de teste" footer="Shelf · Cartão de leitor" />
          <p className="pf-note">
            Patente de teste: <strong>{card.name}</strong>. Pelos seus números reais, hoje você estaria no nível{" "}
            <strong>{realRank.name}</strong>.
          </p>
        </div>

        <div className="pf-side">
          <section className="pf-panel" aria-labelledby="pf-type-title">
            <h2 id="pf-type-title" className="pf-panel__title">Seu tipo de leitor</h2>
            {profile.status === "loading" && <p className="pf-muted" role="status">Carregando…</p>}
            {profile.status === "error" && <p className="pf-muted" role="alert">Não consegui carregar o seu perfil agora.</p>}
            {profile.status === "none" && (
              <>
                <p className="pf-muted">Faça o teste para descobrir o seu tipo de leitor e receber indicações de livros.</p>
                <Link className="ds-button ds-button--primary ds-button--md" to="/diagnostico">Descobrir meu perfil</Link>
              </>
            )}
            {archetype && (
              <>
                <p className="pf-type">{archetype.label}</p>
                {result.secondary_archetype && <p className="pf-type__secondary">com traços de {result.secondary_archetype.label}</p>}
                <p className="pf-muted">{archetype.summary}</p>
                {result.top_genres.length > 0 && (
                  <ul className="pf-chips" aria-label="Gêneros principais">
                    {result.top_genres.slice(0, 4).map((genre) => (
                      <li key={genre.code}>{genre.label}</li>
                    ))}
                  </ul>
                )}
                <div className="pf-actions">
                  <a className="ds-button ds-button--ghost ds-button--sm" href="#pf-report">Ver relatório completo</a>
                  <Button size="sm" variant="ghost" onClick={retake}>Refazer o teste</Button>
                </div>
              </>
            )}
          </section>

          <section className="pf-panel" aria-labelledby="pf-ranks-title">
            <h2 id="pf-ranks-title" className="pf-panel__title">Patentes</h2>
            <ol className="pf-ranks">
              {RANK_STEPS.map((step) => (
                <li key={step.id} className={`pf-rank pf-rank--${step.id}${step.id === card.id ? " is-current" : ""}`}>
                  <span className="pf-rank__dot" aria-hidden="true" />
                  <div>
                    <strong>{step.name}</strong>
                    <small>{step.need}</small>
                  </div>
                  {step.id === card.id && <em>Seu cartão</em>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {result?.archetype && (
        <div id="pf-report" className="dg dg--embedded">
          <ProfileReport result={result} books={books} hideHero />
        </div>
      )}
    </section>
  );
}
