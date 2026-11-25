export const FEATURED_GENRES = [
  { name: "Fantasia", art: "castle" },
  { name: "Ficção Científica", art: "planet" },
  { name: "Mistério", art: "lantern" },
  { name: "Biografia", art: "bust" },
  { name: "Romance", art: "flower" },
];

export const MORE_GENRES = [
  { name: "Aventura", art: "mountains" },
  { name: "Clássicos", art: "open-book" },
  { name: "Drama", art: "masks" },
  { name: "História", art: "column" },
  { name: "Poesia", art: "quill" },
];

export function GenreArtwork({ type }) {
  const shared = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 };
  const artwork = {
    castle: <><path d="M8 42V25l7-6 7 6v17M22 42V16l8-8 8 8v26M38 42V24l7-7 7 7v18M12 42V32h6v10M29 42V29h6v13M43 42V31h4v11" /><path d="M15 19v-6M30 8V3M45 17v-6M4 42h52" /></>,
    planet: <><circle cx="32" cy="25" r="12" /><ellipse cx="32" cy="25" rx="27" ry="9" transform="rotate(-18 32 25)" /><path d="M13 31c5 5 15 7 25 4" /></>,
    lantern: <><path d="M31 4v5M24 10h14l4 8H20zM22 19h18l-2 17H24zM26 36v5h10v-5M31 41v7M24 48h14M27 15h8" /><path d="M31 23v8M27 27h8" /></>,
    bust: <><circle cx="32" cy="15" r="8" /><path d="M25 15c2-2 4-5 5-8M24 26l-7 7v14h30V33l-7-7M24 28l8 7 8-7M27 34l5 13 5-13" /></>,
    flower: <><path d="M32 27v22M32 39c-6-7-12-4-12 0s7 5 12 0ZM32 44c6-7 12-4 12 0s-7 5-12 0Z" /><circle cx="32" cy="13" r="5" /><circle cx="22" cy="18" r="5" /><circle cx="42" cy="18" r="5" /><circle cx="25" cy="28" r="5" /><circle cx="39" cy="28" r="5" /><circle cx="32" cy="21" r="4" /></>,
    mountains: <><path d="m5 44 17-25 10 14 7-10 20 21H5Z" /><path d="m16 44 6-9 6 9m5-9 5-7 7 10M42 8v13m0-13 9 4-9 4M10 49h45" /></>,
    "open-book": <><path d="M5 15c9-3 18-1 27 5v26c-9-6-18-8-27-5V15Zm54 0c-9-3-18-1-27 5v26c9-6 18-8 27-5V15Z" /><path d="M11 22c5-1 10 0 15 3M11 29c5-1 10 0 15 3m27-10c-5-1-10 0-15 3m15 4c-5-1-10 0-15 3" /></>,
    masks: <><path d="M8 13c8-5 18-5 24 0v13c0 12-8 20-16 20S8 38 8 26V13Zm24 0c8-5 18-5 24 0v13c0 12-8 20-16 20-4 0-7-2-10-5" /><path d="M15 25h5m-5 0 2 4m18-4h5m-5 0-2 4M14 36c3 3 7 3 10 0m15 0c3 3 7 3 10 0" /></>,
    column: <><path d="M9 16h46L32 7 9 16Zm4 3h38m-34 0v25m9-25v25m12-25v25m9-25v25M9 47h46m-50 5h54" /><path d="M27 28h10m-10 6h10" /></>,
    quill: <><path d="M15 46c4-16 12-29 32-39 2 20-8 34-25 39-4 1-7 1-7 0Z" /><path d="m15 47 23-27m-13 12 10 1m-4-9 9 1M10 51h30" /><path d="M46 7c3 2 5 5 6 9" /></>,
  };

  return <svg className="cat-genre__art" viewBox="0 0 64 56" aria-hidden="true" {...shared}>{artwork[type]}</svg>;
}

