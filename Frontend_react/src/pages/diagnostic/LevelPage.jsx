import { useNavigate } from "react-router-dom";
import { Button, Heading } from "@/design-system";
import { answeredCount, LEVELS, levelInfo } from "@/lib/diagnostic";
import DiagnosticLayout from "./DiagnosticLayout";
import { useDraft } from "./useDraft";

/** Três pontinhos de "profundidade": quantos estão acesos indica o nível. */
function DepthDots({ depth }) {
  return (
    <span className="dg-depth" aria-hidden="true">
      {[1, 2, 3].map((dot) => (
        <i key={dot} className={dot <= depth ? "is-on" : ""} />
      ))}
    </span>
  );
}

/** Primeira tela do diagnóstico: a pessoa escolhe entre velocidade e precisão (10, 20 ou 40 perguntas). */
export default function LevelPage() {
  const navigate = useNavigate();
  const { draft, update, clear } = useDraft();
  const answered = answeredCount(draft);
  const total = draft ? levelInfo(draft.level).questions : 0;

  function start(level) {
    // As respostas já dadas são mantidas: subir de nível só pede o que falta.
    update({ level, step: null });
    navigate("/diagnostico/perguntas");
  }

  return (
    <DiagnosticLayout wide>
      <div className="dg-level">
        <p className="dg-eyebrow">Perfil de leitor</p>
        <Heading level={1} size="h1" className="dg-title">
          Você quer velocidade ou <span className="dg-title__accent">precisão?</span>
        </Heading>
        <p className="dg-lead">
          A versão rápida revela o seu perfil em poucos minutos. As outras aumentam a precisão. Você pode aprofundar
          depois, sem repetir nada.
        </p>

        {answered > 0 && (
          <div className="dg-resume" role="status">
            <p>
              <strong>Você tem um perfil em andamento</strong> ({answered} {answered === 1 ? "pergunta respondida" : "perguntas respondidas"}
              {total ? ` de ${total}` : ""}).
            </p>
            <div className="dg-resume__actions">
              <Button size="sm" onClick={() => start(draft.level)}>
                Continuar de onde parei
              </Button>
              <Button size="sm" variant="ghost" onClick={clear}>
                Recomeçar
              </Button>
            </div>
          </div>
        )}

        <ul className="dg-levels" aria-label="Escolha o tamanho do questionário">
          {LEVELS.map((item, index) => (
            <li key={item.level} className={`dg-level-card${item.recommended ? " is-recommended" : ""}`} style={{ "--i": index }}>
              <div className="dg-level-card__top">
                <span className="dg-level-card__eyebrow">{item.title}</span>
                {item.recommended && <span className="dg-badge">Recomendado</span>}
              </div>
              <p className="dg-level-card__count">
                <strong>{item.questions}</strong> perguntas
              </p>
              <p className="dg-level-card__tagline">{item.tagline}</p>
              <ul className="dg-level-card__gives">
                {item.gives.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="dg-level-card__meta">
                <span>{item.time}</span>
                <span className="dg-level-card__depth">
                  Profundidade <DepthDots depth={item.level} />
                </span>
              </p>
              <Button
                variant={item.recommended ? "secondary" : "primary"}
                onClick={() => start(item.level)}
                aria-label={`Começar o questionário ${item.title.toLowerCase()}, com ${item.questions} perguntas`}
              >
                Começar versão {item.title.toLowerCase()} →
              </Button>
            </li>
          ))}
        </ul>

        <p className="dg-note">
          Suas respostas ficam neste navegador até você criar a conta. Você pode apagar o perfil quando quiser, e
          todas as perguntas podem ser puladas.
        </p>
      </div>
    </DiagnosticLayout>
  );
}
