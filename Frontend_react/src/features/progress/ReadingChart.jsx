import { useMemo, useState } from "react";

const W = 1000;
const H = 350;
const PAD = { left: 46, right: 18, top: 30 };
const AREA_BOTTOM = 236;
const BARS_TOP = 268;
const BARS_BOTTOM = 306;

const format = (value) => Number(value).toLocaleString("pt-BR");
const durationText = (minutes) => (minutes >= 60 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}` : `${minutes} min`);

/** Curva suave (Catmull-Rom → Bézier) passando por todos os pontos, sem passar da linha de base nem do topo. */
function smoothPath(points, minY, maxY) {
  const clamp = (value) => Math.min(maxY, Math.max(minY, value));
  if (points.length < 2) return points.length ? `M ${points[0].x} ${points[0].y}` : "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6);
    path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

/**
 * Gráfico de evolução: a série escolhida (páginas ou tempo) vira uma curva com área, e os livros
 * concluídos aparecem em barras logo abaixo. Passar o mouse mostra os dados daquele ponto.
 * `metric`: "pages" | "minutes". `dense`: muitos pontos (mês), sem marcadores e com menos rótulos.
 */
export default function ReadingChart({ items, metric = "pages", dense = false, unitName = "dia" }) {
  const [hover, setHover] = useState(null);
  const count = items.length;
  const values = items.map((item) => item[metric]);
  const max = Math.max(...values, 0);
  const niceMax = max <= 0 ? 10 : max <= 10 ? 10 : Math.ceil(max / 10) * 10;
  const maxBooks = Math.max(1, ...items.map((item) => item.books));
  const step = count > 1 ? (W - PAD.left - PAD.right) / (count - 1) : 0;
  const empty = max === 0 && maxBooks === 1 && items.every((item) => item.books === 0);

  const points = useMemo(
    () => values.map((value, i) => ({ x: PAD.left + i * step, y: AREA_BOTTOM - (value / niceMax) * (AREA_BOTTOM - PAD.top) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, metric, niceMax, step],
  );

  if (!count) return null;

  const line = smoothPath(points, PAD.top, AREA_BOTTOM);
  const area = `${line} L ${points.at(-1).x} ${AREA_BOTTOM} L ${points[0].x} ${AREA_BOTTOM} Z`;
  const grid = [0, 0.5, 1].map((ratio) => ({ y: AREA_BOTTOM - ratio * (AREA_BOTTOM - PAD.top), value: Math.round(niceMax * ratio) }));
  const showDots = !dense && count <= 14;
  const barWidth = Math.max(5, Math.min(24, step * 0.5));
  const peak = max > 0 ? values.indexOf(max) : -1;
  const metricLabel = metric === "pages" ? "páginas" : "minutos";

  function onMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * W;
    setHover(Math.min(count - 1, Math.max(0, Math.round((x - PAD.left) / (step || 1)))));
  }

  const hovered = hover !== null ? points[hover] : null;
  const tipWidth = 150;
  const tipX = hovered ? Math.min(W - tipWidth - 6, Math.max(PAD.left, hovered.x - tipWidth / 2)) : 0;
  const tipY = hovered ? Math.max(4, hovered.y - 92) : 0;
  const labelEvery = dense ? 5 : 1;

  return (
    <svg
      className="prog-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Gráfico de ${metricLabel} por ${unitName}. ${items.map((item) => `${item.label}: ${item.pages} páginas, ${item.minutes} minutos, ${item.books} livros concluídos`).join("; ")}`}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="prog-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#98543f" stopOpacity="0.32" />
          <stop offset="1" stopColor="#98543f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {grid.map((row) => (
        <g key={row.y}>
          <line x1={PAD.left} x2={W - PAD.right} y1={row.y} y2={row.y} className="prog-gridline" />
          <text x={PAD.left - 10} y={row.y + 4} textAnchor="end" className="prog-tick">{format(row.value)}</text>
        </g>
      ))}

      <path d={area} className="prog-area" fill="url(#prog-area)" />
      <path d={line} className="prog-line" pathLength="1" />

      {showDots && points.map((point, i) => (
        <circle key={i} cx={point.x} cy={point.y} r={i === peak ? 6 : 4} className={`prog-dot${i === peak ? " is-peak" : ""}`} style={{ "--i": i }} />
      ))}
      {peak >= 0 && (
        <g className="prog-peak" style={{ "--i": count }}>
          <circle cx={points[peak].x} cy={points[peak].y} r="11" className="prog-peak__halo" />
          <text x={points[peak].x} y={Math.max(14, points[peak].y - 16)} textAnchor="middle" className="prog-peak__text">Pico</text>
        </g>
      )}

      <text x={PAD.left} y={BARS_TOP - 8} className="prog-tick">Livros concluídos</text>
      {items.map((item, i) => {
        const height = item.books ? Math.max(8, (item.books / maxBooks) * (BARS_BOTTOM - BARS_TOP)) : 3;
        return (
          <rect
            key={i}
            x={points[i].x - barWidth / 2}
            y={BARS_BOTTOM - height}
            width={barWidth}
            height={height}
            rx="3"
            className={`prog-bar${item.books ? " has-value" : ""}`}
            style={{ "--i": i }}
          />
        );
      })}

      {items.map((item, i) =>
        i % labelEvery === 0 || i === count - 1 ? (
          <text key={i} x={points[i].x} y={H - 14} textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"} className="prog-axis">{item.label}</text>
        ) : null,
      )}

      {empty && (
        <text x={W / 2} y={(PAD.top + AREA_BOTTOM) / 2} textAnchor="middle" className="prog-empty">Nada registrado neste período</text>
      )}

      {hovered && (
        <g className="prog-hover" pointerEvents="none">
          <line x1={hovered.x} x2={hovered.x} y1={PAD.top - 8} y2={BARS_BOTTOM} className="prog-hover__line" />
          <circle cx={hovered.x} cy={hovered.y} r="7" className="prog-hover__dot" />
          <g transform={`translate(${tipX}, ${tipY})`}>
            <rect width={tipWidth} height="74" rx="12" className="prog-tip" />
            <text x={tipWidth / 2} y="22" textAnchor="middle" className="prog-tip__label">{items[hover].label}</text>
            <text x={tipWidth / 2} y="43" textAnchor="middle" className="prog-tip__value">{format(items[hover].pages)} páginas</text>
            <text x={tipWidth / 2} y="61" textAnchor="middle" className="prog-tip__sub">{durationText(items[hover].minutes)} · {items[hover].books} {items[hover].books === 1 ? "livro" : "livros"}</text>
          </g>
        </g>
      )}
    </svg>
  );
}
