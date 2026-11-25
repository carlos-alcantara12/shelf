const STAR = "M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8L12 3.2Z";

function Stars({ className = "" }) {
  return (
    <span className={`stars__row ${className}`} aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <svg key={index} viewBox="0 0 24 24" focusable="false">
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

/** Nota de 0 a 5 em estrelas, com preenchimento parcial (4,5 deixa a quinta estrela pela metade). Só leitura. */
export default function StarRating({ value, label }) {
  const clamped = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="stars" role="img" aria-label={label || `Nota ${clamped.toLocaleString("pt-BR")} de 5`}>
      <Stars className="stars__base" />
      <span className="stars__fill" style={{ width: `${(clamped / 5) * 100}%` }}>
        <Stars className="stars__on" />
      </span>
    </span>
  );
}
