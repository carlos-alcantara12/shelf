import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import TopicIcon from "@/components/TopicIcon";
import { Button, Heading } from "@/design-system";
import { evaluateProfile, fetchQuestions, getAutoAdvance, setAutoAdvance } from "@/lib/diagnostic";
import DiagnosticLayout from "./DiagnosticLayout";
import ExplainDialog from "./ExplainDialog";
import { ProfileSummary } from "./ProfileReport";
import QuestionInput from "./QuestionInput";
import { useDraft } from "./useDraft";

const BLOCK_SIZE = 10;
const SEGMENT_SIZE = 5;
const MULTIPLE = ["checklist", "pick3", "text"];
const INSTANT = ["single", "scale"];
const AUTO_ADVANCE_DELAY = 280;

/** A pergunta já pode seguir? Perguntas de lista com mínimo 0 e de texto sempre podem. */
function isReady(question, value) {
  switch (question.type) {
    case "single":
      return typeof value === "string";
    case "scale":
      return Number.isInteger(value);
    case "checklist":
    case "pick3":
      return question.min_choices === 0 || (Array.isArray(value) && value.length >= question.min_choices);
    case "text":
      return true;
    default:
      return false;
  }
}

/** Uma pergunta por tela, em blocos de 10, com um resumo do perfil ao fim de cada bloco. */
export default function QuestionsPage() {
  const navigate = useNavigate();
  const { draft, update, clear } = useDraft();
  const [bank, setBank] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(null);
  const [checkpoint, setCheckpoint] = useState(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const [autoAdvance, setAutoAdvanceState] = useState(getAutoAdvance);
  const timerRef = useRef(null);
  const level = draft?.level;

  useEffect(() => {
    const controller = new AbortController();
    setLoadError("");
    fetchQuestions(controller.signal)
      .then(setBank)
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message);
      });
    return () => controller.abort();
  }, [attempt]);

  // Não deixa um avanço automático pendente "vazar" para outra pergunta.
  useEffect(() => () => window.clearTimeout(timerRef.current), [index]);

  const questions = useMemo(
    () =>
      bank && level
        ? bank.blocks
            .flatMap((block) => block.questions.map((question) => ({ ...question, blockTitle: block.title })))
            .filter((question) => question.level <= level)
        : [],
    [bank, level],
  );

  // Ao abrir: descarta rascunhos de outra versão do banco e retoma de onde a pessoa parou.
  useEffect(() => {
    if (!bank || !draft || index !== null) return;
    if (draft.bankVersion && draft.bankVersion !== bank.version) {
      clear();
      return;
    }
    const saved = Number.isInteger(draft.step) ? draft.step : questions.findIndex((item) => draft.answers[item.id] === undefined);
    update({ bankVersion: bank.version });
    setIndex(saved < 0 ? questions.length : Math.min(saved, questions.length));
  }, [bank, draft, index, questions, update, clear]);

  if (!draft) return <Navigate to="/diagnostico" replace />;
  if (index !== null && questions.length > 0 && index >= questions.length) {
    return <Navigate to="/diagnostico/resultado" replace />;
  }

  function goTo(next) {
    setIndex(next);
    update({ step: next });
  }

  function finishAnswer(answers) {
    window.clearTimeout(timerRef.current);
    // Vindo da revisão: depois de alterar a resposta, volta direto ao resultado.
    if (draft.editing) {
      update({ answers, editing: false, step: questions.length });
      navigate("/diagnostico/resultado");
      return;
    }
    const next = index + 1;
    update({ answers, step: next });
    if (next >= questions.length) {
      navigate("/diagnostico/resultado");
    } else if (next % BLOCK_SIZE === 0) {
      openCheckpoint(answers, next);
    } else {
      setIndex(next);
    }
  }

  function openCheckpoint(answers, next) {
    setCheckpoint({ status: "loading", next, result: null, message: "" });
    evaluateProfile({ level, answers })
      .then((result) => setCheckpoint({ status: "ready", next, result, message: "" }))
      .catch((error) => setCheckpoint({ status: "error", next, result: null, message: error.message }));
  }

  function continueAfterCheckpoint() {
    const next = checkpoint.next;
    setCheckpoint(null);
    goTo(next);
  }

  if (loadError) {
    return (
      <DiagnosticLayout progress={0} progressLabel="Progresso do questionário">
        <div className="dg-panel" role="alert">
          <Heading level={1} size="h2">Não foi possível carregar as perguntas</Heading>
          <p className="dg-lead">{loadError}</p>
          <Button onClick={() => setAttempt((value) => value + 1)}>Tentar de novo</Button>
        </div>
      </DiagnosticLayout>
    );
  }

  if (!bank || index === null) {
    return (
      <DiagnosticLayout progress={0} progressLabel="Progresso do questionário">
        <div className="dg-panel" role="status" aria-live="polite">
          <p className="dg-lead">Preparando as perguntas…</p>
        </div>
      </DiagnosticLayout>
    );
  }

  const segments = Math.max(1, Math.ceil(questions.length / SEGMENT_SIZE));

  if (checkpoint) {
    const block = Math.ceil(checkpoint.next / BLOCK_SIZE);
    const hasMore = checkpoint.next < questions.length;
    return (
      <DiagnosticLayout progress={checkpoint.next / questions.length} segments={segments} progressLabel="Progresso do questionário">
        <div className="dg-panel dg-checkpoint" key="checkpoint">
          <p className="dg-eyebrow">Bloco {block} concluído</p>
          <Heading level={1} size="h2">Seu perfil até agora</Heading>
          {checkpoint.status === "loading" && <p className="dg-lead" role="status">Montando o seu perfil…</p>}
          {checkpoint.status === "error" && <p className="dg-lead" role="alert">{checkpoint.message}</p>}
          {checkpoint.status === "ready" && <ProfileSummary result={checkpoint.result} />}
          <div className="dg-actions">
            {hasMore ? (
              <>
                <Button onClick={continueAfterCheckpoint}>Continuar ({questions.length - checkpoint.next} perguntas restantes)</Button>
                <Button variant="ghost" onClick={() => navigate("/diagnostico/resultado")}>Ver resultado agora</Button>
              </>
            ) : (
              <Button onClick={() => navigate("/diagnostico/resultado")}>Ver o resultado completo</Button>
            )}
          </div>
        </div>
      </DiagnosticLayout>
    );
  }

  const question = questions[index];
  const value = draft.answers[question.id];
  const ready = isReady(question, value);
  const instant = INSTANT.includes(question.type);
  const percent = Math.round((index / questions.length) * 100);

  function setAnswer(next) {
    update((current) => ({ answers: { ...current.answers, [question.id]: next } }));
  }

  function handleChange(next) {
    setAnswer(next);
    if (autoAdvance && instant) {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => finishAnswer({ ...draft.answers, [question.id]: next }), AUTO_ADVANCE_DELAY);
    }
  }

  function advance() {
    if (!ready) return;
    const final = value === undefined || value === null ? (MULTIPLE.includes(question.type) ? [] : value) : value;
    finishAnswer({ ...draft.answers, [question.id]: final });
  }

  function skip() {
    finishAnswer({ ...draft.answers, [question.id]: null });
  }

  function back() {
    window.clearTimeout(timerRef.current);
    if (draft.editing) {
      update({ editing: false });
      navigate("/diagnostico/revisar");
    } else if (index === 0) {
      navigate("/diagnostico");
    } else {
      goTo(index - 1);
    }
  }

  function toggleAutoAdvance(enabled) {
    setAutoAdvanceState(enabled);
    setAutoAdvance(enabled);
  }

  return (
    <DiagnosticLayout progress={index / questions.length} segments={segments} progressLabel="Progresso do questionário">
      <form
        className="dg-question"
        key={question.id}
        onSubmit={(event) => {
          event.preventDefault();
          advance();
        }}
      >
        <div className="dg-meta">
          <span>
            Pergunta <strong>{index + 1}</strong> de {questions.length} · {question.blockTitle}
          </span>
          <span>{percent}% concluído</span>
        </div>

        <article className="dg-card" data-number={String(index + 1).padStart(2, "0")}>
          <div className="dg-card__chips">
            <span className="dg-topic" style={{ "--axis": `var(--axis-${question.topic.color})` }}>
              <span className="dg-topic__icon"><TopicIcon name={question.topic.icon} /></span>
              {question.topic.label}
            </span>
            {question.explain && (
              <button type="button" className="dg-explain-chip" onClick={() => setExplainOpen(true)}>
                <TopicIcon name="compass" />
                Entenda
              </button>
            )}
          </div>
          <Heading level={1} size="h1" className="dg-question__text">
            {question.text}
          </Heading>
          {question.hint && <p className="dg-hint">{question.hint}</p>}
          <QuestionInput question={question} value={value} onChange={handleChange} />
        </article>

        <nav className="dg-nav" aria-label="Navegação do questionário">
          <Button type="button" variant="ghost" onClick={back}>
            ← Voltar
          </Button>
          {instant ? (
            <label className="dg-switch">
              <input type="checkbox" role="switch" checked={autoAdvance} onChange={(event) => toggleAutoAdvance(event.target.checked)} />
              <span className="dg-switch__track" aria-hidden="true" />
              Avançar ao responder
            </label>
          ) : (
            <span />
          )}
          <div className="dg-nav__right">
            <button type="button" className="dg-linkbutton" onClick={skip}>
              Prefiro não responder
            </button>
            <Button type="submit" disabled={!ready}>
              {draft.editing ? "Salvar resposta" : index + 1 === questions.length ? "Ver resultado" : "Continuar →"}
            </Button>
          </div>
        </nav>
      </form>
      {explainOpen && question.explain && <ExplainDialog explain={question.explain} onClose={() => setExplainOpen(false)} />}
    </DiagnosticLayout>
  );
}
