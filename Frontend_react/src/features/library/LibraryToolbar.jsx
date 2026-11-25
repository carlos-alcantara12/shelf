const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "READING", label: "Lendo" },
  { value: "WANT_TO_READ", label: "Desejos" },
  { value: "READ", label: "Já lidos" },
];

/** Busca e abas de situação; tudo filtra na hora, sem botão de enviar. */
export default function LibraryToolbar({ filters, onChange, counts, active }) {
  return (
    <div className="lib-toolbar">
      <div className="lib-toolbar__fields">
        <label className="lib-field lib-field--search">
          <span className="lib-sr-only">Buscar por título ou autor</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <input
            type="search"
            value={filters.search}
            placeholder="Buscar por título ou autor"
            onChange={(event) => onChange({ search: event.target.value })}
          />
        </label>
        {active && (
          <button type="button" className="lib-clear" onClick={() => onChange({ search: "", status: "" })}>
            Limpar filtros
          </button>
        )}
      </div>
      <div className="lib-tabs" role="group" aria-label="Filtrar por situação">
        {STATUS_TABS.map((tab) => (
          <button
            type="button"
            key={tab.value || "all"}
            className={`lib-tab${filters.status === tab.value ? " is-active" : ""}`}
            aria-pressed={filters.status === tab.value}
            onClick={() => onChange({ status: tab.value })}
          >
            {tab.label}
            <span>{counts[tab.value || "all"]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
