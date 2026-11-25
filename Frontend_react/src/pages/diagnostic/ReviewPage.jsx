import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button, Heading } from "@/design-system";
import { fetchQuestions } from "@/lib/diagnostic";
import DiagnosticLayout from "./DiagnosticLayout";
import { useDraft } from "./useDraft";

/** Texto da resposta dada a uma pergunta, para a tela de revisão. */
function describe(question, value) {
  if (value === undefined) return { text: "Sem resposta", muted: true };
  if (value === null) return { text: "Pulada", muted: true };
  switch (question.type) {
    case "single":
      return { text: question.options.find((option) => option.id === value)?.label ?? "—" };
    case "checklist":
    case "pick3": {
      const labels = value.map((id) => question.options.find((option) => option.id === id)?.label).filter(Boolean);
      return labels.length ? { text: labels.join(", ") } : { text: "Nenhuma opção marcada", muted: true };
    }
    case "scale":
      return { text: `${question.scale.labels[value - 1]}` };
    case "text":
      return value.length ? { text: value.join("; ") } : { text: "Nenhum título informado", muted: true };
    default:
      return { text: "—", muted: true };
  }
}

/** Lista todas as perguntas do nível com a resposta dada e deixa alterar qualquer uma. */
export default function ReviewPage() {
  const navigate = useNavigate();
  const { draft, update } = useDraft();
  const [bank, setBank] = useState(null);
  const [error, setError] = useState("");
  const level = draft?.level;

  useEffect(() => {
    const controller = new AbortController();
    fetchQuestions(controller.signal)
      .then(setBank)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      });
    return () => controller.abort();
  }, []);

  const questions = useMemo(
    () => (bank && level ? bank.blocks.flatMap((block) => block.questions).filter((question) => question.level <= level) : []),
    [bank, level],
  );

  if (!draft) return <Navigate to="/diagnostico" replace />;

  function change(index) {
    update({ step: index, editing: true });
    navigate("/diagnostico/perguntas");
  }

  return (
    <DiagnosticLayout showSkip={false}>
      <div className="dg-review">
        <p className="dg-eyebrow">Revisão</p>
        <Heading level={1} size="h1" className="dg-title">Suas respostas</Heading>
        <p className="dg-lead">Altere o que quiser; depois de cada mudança você volta ao resultado, já atualizado.</p>

        {error && <p className="dg-error" role="alert">{error}</p>}
        {!bank && !error && <p className="dg-lead" role="status">Carregando…</p>}

        <ol className="dg-review__list">
          {questions.map((question, index) => {
            const answer = describe(question, draft.answers[question.id]);
            return (
              <li key={question.id} className="dg-review__item">
                <span className="dg-review__number">{String(index + 1).padStart(2, "0")}</span>
                <div className="dg-review__body">
                  <p className="dg-review__question">{question.text}</p>
                  <p className={`dg-review__answer${answer.muted ? " is-muted" : ""}`}>{answer.text}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => change(index)} aria-label={`Alterar a resposta da pergunta ${index + 1}`}>
                  Alterar
                </Button>
              </li>
            );
          })}
        </ol>

        <div className="dg-actions">
          <Link className="ds-button ds-button--primary ds-button--md" to="/diagnostico/resultado">
            Voltar ao resultado
          </Link>
        </div>
      </div>
    </DiagnosticLayout>
  );
}
