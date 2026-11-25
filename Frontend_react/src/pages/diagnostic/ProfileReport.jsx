import TopicIcon from "@/components/TopicIcon";
import AxisSlider from "./AxisSlider";
import Recommendations from "./Recommendations";

const DETAIL_LABELS = {
  basico: "Perfil básico",
  intermediario: "Perfil intermediário",
  completo: "Perfil completo",
};

const WELL_KNOWN = 2;
const TOTAL_AXES = 30;

// Texto e ícone de cada motivação e de cada coisa que a pessoa prefere evitar.
const MOTIVATION_INFO = {
  M1: { icon: "compass", text: "Ler é a sua porta para outros mundos." },
  M2: { icon: "book", text: "Você lê para entender algo novo." },
  M3: { icon: "heart", text: "Você procura histórias que emocionam." },
  M4: { icon: "gauge", text: "Ler é o seu jeito de desacelerar." },
  M5: { icon: "target", text: "Você gosta de livros que exigem esforço." },
  M6: { icon: "people", text: "Ler é melhor quando dá para comentar com alguém." },
};

const AVOID_INFO = {
  violencia_explicita: "Sem cenas de violência gráfica.",
  romance_previsivel: "Sem romances em que o final é fácil de adivinhar.",
  finais_tristes: "Prefere histórias que não terminam em perda.",
  linguagem_antiga: "Evita textos com linguagem de séculos passados.",
  livros_longos: "Prefere livros que dá para terminar logo.",
  temas_pesados: "Evita assuntos muito duros, como luto e abuso.",
  terror: "Sem histórias de medo.",
};

/** Só mostramos o que tem apoio de pelo menos duas perguntas (evita falsa precisão). */
function view(result) {
  return {
    genres: result.top_genres.filter((item) => item.score > 0),
    style: result.style.filter((item) => item.evidence >= WELL_KNOWN),
    habits: result.habits.filter((item) => item.evidence >= WELL_KNOWN),
    motivations: result.motivations.filter((item) => item.evidence >= WELL_KNOWN && item.score > 0).slice(0, 4),
    signature: result.signature,
  };
}

/** Seções presentes no relatório, para o sumário lateral. */
export function reportSections(result, withBooks = false) {
  const { genres, style, habits, motivations, signature } = view(result);
  const sections = [{ id: "resumo", label: "Seu perfil" }];
  if (withBooks) sections.push({ id: "livros", label: "Livros para você" });
  if (genres.length) sections.push({ id: "generos", label: "Gêneros" });
  if (style.length) sections.push({ id: "estilo", label: "Seu jeito de ler" });
  if (signature?.strongest) sections.push({ id: "distincao", label: "O que te distingue" });
  if (motivations.length) sections.push({ id: "motivacoes", label: "O que te move" });
  if (habits.length) sections.push({ id: "habitos", label: "Seus hábitos" });
  if (result.restrictions.length) sections.push({ id: "evitar", label: "O que evitar" });
  if (result.unknown_axes.length) sections.push({ id: "lacunas", label: "Perfil completo?" });
  return sections;
}

/** Resumo curto: tipo de leitor, gêneros principais e nível de detalhe. */
export function ProfileSummary({ result }) {
  if (!result.archetype) return null;
  return (
    <div className="dg-summary">
      <p className="dg-eyebrow">{DETAIL_LABELS[result.detail]}</p>
      <p className="dg-summary__type">
        {result.archetype.label}
        {result.secondary_archetype ? <small> com traços de {result.secondary_archetype.label}</small> : null}
      </p>
      <p className="dg-summary__text">{result.archetype.summary}</p>
      {result.top_genres.length > 0 && (
        <ul className="dg-chips" aria-label="Gêneros principais">
          {result.top_genres.slice(0, 3).map((genre) => (
            <li key={genre.code}>{genre.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SignatureCard({ kicker, title, children, axisCode }) {
  return (
    <article className="dg-signature" style={axisCode ? { "--axis": `var(--axis-${axisCode})` } : undefined}>
      <p className="dg-signature__kicker">{kicker}</p>
      <h3 className="dg-signature__title">{title}</h3>
      <p className="dg-signature__text">{children}</p>
    </article>
  );
}

/** Anel com a porcentagem no centro. */
function Ring({ value }) {
  const radius = 34;
  const length = 2 * Math.PI * radius;
  return (
    <span className="dg-ring" role="img" aria-label={`${value} de 100`}>
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} className="dg-ring__track" />
        <circle cx="40" cy="40" r={radius} className="dg-ring__fill" strokeDasharray={length} style={{ "--len": length, "--off": length * (1 - value / 100) }} />
      </svg>
      <b>{value}</b>
    </span>
  );
}

/** Relatório completo do perfil de leitor. */
export default function ProfileReport({ result, books, completeAction, hideHero = false }) {
  const { archetype, secondary_archetype: secondary } = result;
  const { genres, style, habits, motivations, signature } = view(result);
  const unknown = result.unknown_axes;

  if (!archetype) return null;

  const { strongest, balanced, tension } = signature || {};
  const known = TOTAL_AXES - unknown.length;
  const completeness = Math.round((known / TOTAL_AXES) * 100);

  return (
    <div className="dg-report">
      {!hideHero && (
        <section id="resumo" className="dg-hero" aria-labelledby="dg-report-title">
          <span className="dg-pill">{DETAIL_LABELS[result.detail]}</span>
          <h1 id="dg-report-title" className="dg-hero__title">{archetype.label}</h1>
          {secondary ? <p className="dg-hero__secondary">com traços de {secondary.label}</p> : null}
          <blockquote className="dg-hero__lead">
            <span aria-hidden="true">“</span>
            {archetype.description}
          </blockquote>
          <p className="dg-hero__tip">
            <strong>Dica de leitura:</strong> {archetype.reading_tip}
          </p>
        </section>
      )}

      {books && books.state !== "idle" && <Recommendations archetype={archetype} state={books.state} items={books.items} />}

      {genres.length > 0 && (
        <section id="generos" className="dg-block" aria-labelledby="dg-genres-title">
          <h2 id="dg-genres-title" className="dg-block__title">Seus gêneros</h2>
          <ul className="dg-bars">
            {genres.map((genre, index) => (
              <li key={genre.code} style={{ "--i": index }}>
                <span className="dg-bars__label">{genre.label}</span>
                <span className="dg-bars__track">
                  <i style={{ "--value": `${genre.score}%` }} />
                </span>
                <span className="dg-bars__value">{genre.score}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {style.length > 0 && (
        <section id="estilo" className="dg-block" aria-labelledby="dg-style-title">
          <h2 id="dg-style-title" className="dg-block__title">Seu jeito de ler</h2>
          <ul className="dg-axes">
            {style.map((axis, index) => (
              <AxisSlider axis={axis} index={index} key={axis.code} />
            ))}
          </ul>
        </section>
      )}

      {strongest && (
        <section id="distincao" className="dg-block" aria-labelledby="dg-signature-title">
          <h2 id="dg-signature-title" className="dg-block__title">O que te distingue</h2>
          <div className="dg-signatures">
            <SignatureCard kicker="Seu traço mais marcante" title={strongest.pole ? `${strongest.label}: ${strongest.pole}` : strongest.label} axisCode={strongest.code}>
              {strongest.pole
                ? `É o traço mais forte do seu perfil: ${strongest.strength}% para o lado “${strongest.pole.toLowerCase()}”.`
                : "É o traço mais definido do seu perfil."}
            </SignatureCard>
            {balanced && (
              <SignatureCard kicker="Seu traço mais equilibrado" title={balanced.label} axisCode={balanced.code}>
                Aqui você fica no meio: lê bem dos dois jeitos.
              </SignatureCard>
            )}
            {tension && (
              <SignatureCard kicker="Sua tensão interna" title={tension.title}>
                {tension.text}
              </SignatureCard>
            )}
          </div>
        </section>
      )}

      {motivations.length > 0 && (
        <section id="motivacoes" className="dg-block" aria-labelledby="dg-moves-title">
          <h2 id="dg-moves-title" className="dg-block__title">O que te move</h2>
          <ul className="dg-moves">
            {motivations.map((item, index) => (
              <li key={item.code} className={index === 0 ? "is-top" : ""} style={{ "--i": index }}>
                <Ring value={item.score} />
                <div>
                  <span className="dg-moves__icon" aria-hidden="true"><TopicIcon name={MOTIVATION_INFO[item.code]?.icon || "star"} /></span>
                  <h3>{item.label}</h3>
                  <p>{MOTIVATION_INFO[item.code]?.text}</p>
                  {index === 0 && <em>Seu maior motivo para ler</em>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {habits.length > 0 && (
        <section id="habitos" className="dg-block" aria-labelledby="dg-habits-title">
          <h2 id="dg-habits-title" className="dg-block__title">Seus hábitos</h2>
          <ul className="dg-axes">
            {habits.map((axis, index) => (
              <AxisSlider axis={axis} index={index} key={axis.code} />
            ))}
          </ul>
        </section>
      )}

      {result.restrictions.length > 0 && (
        <section id="evitar" className="dg-block" aria-labelledby="dg-avoid-title">
          <h2 id="dg-avoid-title" className="dg-block__title">O que você prefere evitar</h2>
          <ul className="dg-avoid">
            {result.restrictions.map((item) => (
              <li key={item.id}>
                <span className="dg-avoid__icon" aria-hidden="true"><TopicIcon name="shield" /></span>
                <div>
                  <h3>{item.label}</h3>
                  <p>{AVOID_INFO[item.id] || "Fica de fora das indicações."}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="dg-avoid__note">Livros assim não entram nas suas indicações.</p>
        </section>
      )}

      {unknown.length > 0 && (
        <section id="lacunas" className="dg-complete" aria-labelledby="dg-unknown-title">
          <div className="dg-complete__head">
            <Ring value={completeness} />
            <div>
              <h2 id="dg-unknown-title" className="dg-block__title">Seu retrato está {completeness}% pronto</h2>
              <p>
                Já temos {known} de {TOTAL_AXES} características. Responder mais perguntas deixa o perfil e as indicações
                mais parecidos com você.
              </p>
            </div>
          </div>
          <div className="dg-meter" role="progressbar" aria-label="Perfil completo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completeness}>
            <i style={{ width: `${completeness}%` }} />
          </div>
          <p className="dg-complete__label">Ainda faltam:</p>
          <ul className="dg-chips dg-chips--muted">
            {unknown.slice(0, 8).map((item) => (
              <li key={item.code}>{item.label}</li>
            ))}
            {unknown.length > 8 && <li>+{unknown.length - 8}</li>}
          </ul>
          {completeAction && (
            <button type="button" className="dg-complete__action" onClick={completeAction.onClick}>
              {completeAction.label}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
