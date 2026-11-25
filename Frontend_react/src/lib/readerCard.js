// Patentes do cartão de leitor: a patente é a mais alta cujos dois requisitos (livros lidos e horas) foram atingidos.

export const RANK_STEPS = [
  { id: "bronze", name: "Bronze", books: 0, hours: 0, need: "Começando a jornada" },
  { id: "prata", name: "Prata", books: 10, hours: 50, need: "10 livros e 50 horas" },
  { id: "ouro", name: "Ouro", books: 30, hours: 150, need: "30 livros e 150 horas" },
  { id: "diamante", name: "Diamante", books: 60, hours: 300, need: "60 livros e 300 horas" },
];

const BADGE_RULES = [
  { test: (s) => s.books >= 1, label: "Primeiro livro" },
  { test: (s) => s.books >= 10, label: "10 livros" },
  { test: (s) => s.books >= 30, label: "30 livros" },
  { test: (s) => s.books >= 60, label: "60 livros" },
  { test: (s) => s.hours >= 50, label: "50 horas de leitura" },
  { test: (s) => s.hours >= 150, label: "150 horas de leitura" },
  { test: (s) => s.pages >= 5000, label: "5 mil páginas" },
];

export function rankIndexFor({ books, hours }) {
  let index = 0;
  RANK_STEPS.forEach((step, position) => {
    if (books >= step.books && hours >= step.hours) index = position;
  });
  return index;
}

/**
 * Monta os dados do cartão. `stats`: { books, hours, pages }.
 * `forcedRankId` mostra uma patente fixa (usado em testes); os números continuam sendo os reais.
 */
export function buildCard(stats, forcedRankId) {
  const forcedIndex = forcedRankId ? RANK_STEPS.findIndex((step) => step.id === forcedRankId) : -1;
  const index = forcedIndex >= 0 ? forcedIndex : rankIndexFor(stats);
  const rank = RANK_STEPS[index];
  const next = RANK_STEPS[index + 1];
  const reached = forcedIndex >= 0 && index > rankIndexFor(stats);
  const xp = !next || reached ? 100 : Math.max(0, Math.min(99, Math.round(100 * Math.min(stats.books / next.books, stats.hours / next.hours))));
  const badges = BADGE_RULES.filter((rule) => rule.test(stats)).map((rule) => rule.label).slice(-4);

  return {
    id: rank.id,
    name: rank.name,
    books: stats.books,
    hours: stats.hours,
    pages: stats.pages,
    xp,
    next: next && !reached ? next.name : null,
    badges: badges.length ? badges : ["Bem-vindo ao Shelf"],
  };
}
