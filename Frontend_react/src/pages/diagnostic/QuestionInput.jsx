import { useState } from "react";

/** Desenha o campo de resposta de uma pergunta, conforme o tipo (single, checklist, pick3, scale ou text). */
export default function QuestionInput({ question, value, onChange }) {
  switch (question.type) {
    case "single":
      return <ChoiceList question={question} value={value} onChange={onChange} />;
    case "checklist":
    case "pick3":
      return <ChoiceList question={question} value={value} onChange={onChange} multiple />;
    case "scale":
      return <ScaleInput question={question} value={value} onChange={onChange} />;
    case "text":
      return <TextInputs question={question} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function ChoiceList({ question, value, onChange, multiple = false }) {
  const selected = multiple ? (Array.isArray(value) ? value : []) : value;
  const max = question.max_choices;
  const full = multiple && Boolean(max) && selected.length >= max;
  const grid = question.options.length > 5;

  function toggle(optionId) {
    if (!multiple) {
      onChange(optionId);
      return;
    }
    onChange(selected.includes(optionId) ? selected.filter((item) => item !== optionId) : [...selected, optionId]);
  }

  return (
    <fieldset className={`dg-options${grid ? " dg-options--grid" : ""}`}>
      <legend className="dg-sr-only">{question.text}</legend>
      {question.options.map((option, index) => {
        const checked = multiple ? selected.includes(option.id) : selected === option.id;
        const disabled = multiple && full && !checked;
        return (
          <label
            key={option.id}
            className={`dg-option${checked ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
            style={{ "--i": index }}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={question.id}
              value={option.id}
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(option.id)}
            />
            <span className={`dg-option__mark${multiple ? " is-square" : ""}`} aria-hidden="true" />
            <span className="dg-option__label">{option.label}</span>
          </label>
        );
      })}
      {multiple && max ? (
        <p className="dg-counter" aria-live="polite">
          {selected.length} de {max}
        </p>
      ) : null}
    </fieldset>
  );
}

const SCALE_ICONS = {
  agree: "M5 12.5l4.2 4.2L19 7",
  neutral: "M6 12h12",
  disagree: "M7 7l10 10M17 7 7 17",
};

/** Escala de 5 pontos em linhas largas: rótulo por extenso, ícone e faixa de cor (concordo, neutro, discordo). */
function ScaleInput({ question, value, onChange }) {
  const { max, labels } = question.scale;
  // Do "concordo totalmente" ao "discordo totalmente".
  const steps = Array.from({ length: max }, (_, index) => max - index);
  const toneOf = (step) => (step > (max + 1) / 2 ? "agree" : step === (max + 1) / 2 ? "neutral" : "disagree");

  return (
    <fieldset className="dg-scale">
      <legend className="dg-sr-only">{question.text}</legend>
      {steps.map((step, index) => {
        const tone = toneOf(step);
        return (
          <label
            key={step}
            className={`dg-answer dg-answer--${tone}${value === step ? " is-selected" : ""}`}
            style={{ "--i": index }}
          >
            <input type="radio" name={question.id} value={step} checked={value === step} onChange={() => onChange(step)} />
            <span className="dg-answer__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={SCALE_ICONS[tone]} />
              </svg>
            </span>
            <span className="dg-answer__label">{labels[step - 1]}</span>
            <span className="dg-answer__radio" aria-hidden="true" />
          </label>
        );
      })}
    </fieldset>
  );
}

function TextInputs({ question, value, onChange }) {
  // Os campos têm estado próprio para um título não "pular" de linha quando outro é apagado.
  const [slots, setSlots] = useState(() =>
    Array.from({ length: question.max_items }, (_, index) => (Array.isArray(value) ? value[index] : "") ?? ""),
  );

  function change(index, text) {
    const next = [...slots];
    next[index] = text;
    setSlots(next);
    onChange(next.filter((item) => item.trim() !== ""));
  }

  return (
    <div className="dg-text">
      {slots.map((text, index) => (
        <input
          key={index}
          type="text"
          className="dg-text__input"
          style={{ "--i": index }}
          maxLength={question.max_length}
          placeholder={`Livro ${index + 1}`}
          aria-label={`Livro ${index + 1}`}
          value={text}
          onChange={(event) => change(index, event.target.value)}
        />
      ))}
    </div>
  );
}
