import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/design-system";
import {
  answeredCount,
  clearDraft,
  evaluateProfile,
  fetchRecommendations,
  levelInfo,
  loadCachedResult,
  saveCachedResult,
  saveProfile,
} from "@/lib/diagnostic";
import DiagnosticLayout from "./DiagnosticLayout";
import ProfileReport, { reportSections } from "./ProfileReport";
import SectionNav from "./SectionNav";
import { useDraft } from "./useDraft";

/** Resultado do perfil de leitor, com o convite para salvá-lo criando a conta. */
export default function ResultPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { draft, update, clear } = useDraft();
  const hasAnswers = answeredCount(draft) > 0;
  // O relatório já salvo aparece na hora; o servidor o atualiza em segundo plano.
  const cached = useMemo(() => (draft ? loadCachedResult(draft.answers) : null), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState(cached ? { status: "ready", result: cached, message: "" } : { status: "loading", result: null, message: "" });
  const [books, setBooks] = useState({ state: "idle", items: [] });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!draft || !hasAnswers) return undefined;
    const controller = new AbortController();
    evaluateProfile({ answers: draft.answers }, controller.signal)
      .then((result) => {
        saveCachedResult(draft.answers, result);
        setState({ status: "ready", result, message: "" });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState((current) => (current.result ? current : { status: "error", result: null, message: error.message }));
      });
    return () => controller.abort();
    // O resultado depende só das respostas e da tentativa; `draft` muda a cada passo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, hasAnswers]);

  const hasArchetype = Boolean(state.result?.archetype);
  const answersKey = draft ? JSON.stringify(draft.answers) : "";

  // As indicações dependem só das respostas; as capas chegam depois, uma a uma.
  useEffect(() => {
    if (!hasArchetype || !hasAnswers) return undefined;
    const controller = new AbortController();
    setBooks((current) => ({ state: "loading", items: current.items }));
    fetchRecommendations({ answers: JSON.parse(answersKey) }, controller.signal)
      .then((data) => setBooks({ state: "ready", items: data.items }))
      .catch((error) => {
        if (error.name !== "AbortError") setBooks({ state: "error", items: [] });
      });
    return () => controller.abort();
  }, [hasArchetype, hasAnswers, answersKey]);

  if (!draft || !hasAnswers) return <Navigate to="/diagnostico" replace />;

  const planned = levelInfo(draft.level).questions;
  const answered = answeredCount(draft);
  const result = state.result;
  const unfinished = answered < planned;
  const canDeepen = !unfinished && draft.level < 3;
  const nextLevel = levelInfo(draft.level + 1);
  const sections = result?.archetype ? reportSections(result, books.state !== "idle") : [];

  const completeAction = unfinished
    ? { label: `Continuar o questionário (${planned - answered} perguntas)`, onClick: continueQuestions }
    : canDeepen
      ? { label: `Responder mais ${nextLevel.questions - planned} perguntas`, onClick: deepen }
      : null;

  function continueQuestions() {
    update({ step: null });
    navigate("/diagnostico/perguntas");
  }

  function deepen() {
    update({ level: draft.level + 1, step: null });
    navigate("/diagnostico/perguntas");
  }

  function restart() {
    clear();
    navigate("/diagnostico");
  }

  async function saveToAccount() {
    setSaving(true);
    setSaveError("");
    try {
      await saveProfile({ answers: draft.answers });
      clearDraft();
      navigate("/perfil");
    } catch (error) {
      setSaveError(error.message);
      setSaving(false);
    }
  }

  return (
    <DiagnosticLayout showSkip={false} scrollProgress wide>
      {state.status === "loading" && (
        <div className="dg-panel" role="status" aria-live="polite">
          <p className="dg-lead">Montando o seu perfil de leitor…</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="dg-panel" role="alert">
          <h1 className="dg-hero__title dg-hero__title--small">Não foi possível montar o seu perfil</h1>
          <p className="dg-lead">{state.message}</p>
          <div className="dg-actions">
            <Button onClick={() => setAttempt((value) => value + 1)}>Tentar de novo</Button>
            <Button variant="ghost" onClick={restart}>Recomeçar</Button>
          </div>
        </div>
      )}

      {state.status === "ready" && result && (
        <div className="dg-result">
          <div className="dg-result__main">
            {result.archetype ? (
              <ProfileReport result={result} books={books} completeAction={completeAction} />
            ) : (
              <div className="dg-panel">
                <h1 className="dg-hero__title dg-hero__title--small">Responda mais um pouco</h1>
                <p className="dg-lead">Ainda não temos respostas suficientes para identificar o seu tipo de leitor.</p>
              </div>
            )}

            <section className="dg-cta" aria-label="Próximos passos">
              {isAuthenticated ? (
                <Button size="lg" onClick={saveToAccount} disabled={saving}>
                  {saving ? "Salvando…" : "Salvar no meu perfil"}
                </Button>
              ) : (
                <Link className="ds-button ds-button--primary ds-button--lg" to="/cadastro">
                  Salvar meu perfil e criar conta
                </Link>
              )}
              {unfinished && !(completeAction && result.unknown_axes.length > 0) && (
                <Button size="lg" variant="ghost" onClick={continueQuestions}>
                  Continuar o questionário ({planned - answered} restantes)
                </Button>
              )}
              {canDeepen && !(completeAction && result.unknown_axes.length > 0) && (
                <Button size="lg" variant="ghost" onClick={deepen}>
                  Responder mais {nextLevel.questions - planned} perguntas
                </Button>
              )}
              <Link className="dg-linkbutton" to="/diagnostico/revisar">
                Revisar minhas respostas
              </Link>
              <button type="button" className="dg-linkbutton" onClick={restart}>
                Refazer do começo
              </button>
              {saveError && <p className="dg-error" role="alert">{saveError}</p>}
              {!isAuthenticated && (
                <p className="dg-note">
                  Já tem conta? <Link to="/entrar">Entrar</Link>. Suas respostas só são enviadas ao servidor quando você
                  salva o perfil.
                </p>
              )}
            </section>
          </div>
          {sections.length > 1 && (
            <aside className="dg-result__aside">
              <SectionNav items={sections} />
            </aside>
          )}
        </div>
      )}
    </DiagnosticLayout>
  );
}
