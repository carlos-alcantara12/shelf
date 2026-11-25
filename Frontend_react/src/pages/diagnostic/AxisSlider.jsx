/** Posição da pessoa entre dois polos: preenche a partir do centro, na cor do eixo, e destaca o polo dominante. */
export default function AxisSlider({ axis, index = 0 }) {
  const lean = axis.score >= 56 ? "high" : axis.score <= 44 ? "low" : "mid";
  const percent = lean === "high" ? axis.score : lean === "low" ? 100 - axis.score : null;
  const summary = lean === "mid" ? "Equilibrado" : `${percent}% ${lean === "high" ? axis.high : axis.low}`;

  return (
    <li className="dg-axis" style={{ "--axis": `var(--axis-${axis.code})`, "--i": index }}>
      <div className="dg-axis__head">
        <span className="dg-axis__name">{axis.label}</span>
        <span className="dg-axis__value">{summary}</span>
      </div>
      <div
        className="dg-slider"
        role="img"
        aria-label={`${axis.label}: ${summary}, entre ${axis.low} e ${axis.high}`}
      >
        <i className="dg-slider__fill" style={{ left: `${Math.min(axis.score, 50)}%`, width: `${Math.abs(axis.score - 50)}%` }} />
        <i className="dg-slider__tick" />
        <i className="dg-slider__knob" style={{ "--value": `${axis.score}%` }} />
      </div>
      <div className="dg-poles">
        <span className={lean === "low" ? "is-active" : ""}>{axis.low}</span>
        <span className={lean === "high" ? "is-active" : ""}>{axis.high}</span>
      </div>
    </li>
  );
}
