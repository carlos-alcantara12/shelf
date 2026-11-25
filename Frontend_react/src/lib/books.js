export function statusLabel(status) {
  return {
    WANT_TO_READ: "Desejos",
    READING: "Lendo",
    READ: "Já lidos",
  }[status] || status;
}

export function normalizeCatalogMatch(value) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

export const SHELF_CAPACITY = 6;

export function groupIntoShelves(items, shelfSize = SHELF_CAPACITY) {
  const orderedItems = [...items].sort((left, right) => (
    (Number(left.shelf) || 0) - (Number(right.shelf) || 0)
    || (Number(left.position) || 0) - (Number(right.position) || 0)
  ));
  const shelves = [];
  for (let index = 0; index < orderedItems.length; index += shelfSize) {
    const shelf = orderedItems.slice(index, index + shelfSize);
    shelf.shelfIndex = shelves.length;
    shelves.push(shelf);
  }
  if (shelves.at(-1)?.length >= shelfSize) {
    const emptyShelf = [];
    emptyShelf.shelfIndex = shelves.at(-1).shelfIndex + 1;
    shelves.push(emptyShelf);
  }
  return shelves;
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function spineEmblem(title = "") {
  const name = title.toLocaleLowerCase();
  if (name.includes("1984")) return "◉";
  if (name.includes("assassin")) return "◆";
  if (name.includes("prince") || name.includes("caspian")) return "♜";
  if (name.includes("chair")) return "♧";
  if (name.includes("mundo") || name.includes("narnia")) return "✥";
  return "✦";
}

export function shelfDisplayTitle(title = "") {
  return title.split(/\s+(?:[-–—:]|\|)\s+/)[0].trim() || title;
}

export function externalBookImportPayload(book) {
  const provider = book.provider || "google_books";
  const payload = { provider, source_id: book.source_id };
  if (provider === "open_library") {
    payload.metadata = {
      title: book.title,
      author: book.author,
      synopsis: book.synopsis,
      genre: book.genre,
      total_pages: book.total_pages,
      cover_url: book.cover_url,
    };
  }
  return payload;
}

/**
 * Endereço da melhor versão de uma capa. Capas já salvas na estante podem estar em tamanho pequeno:
 * no Open Library troca -S/-M por -L; no Google Books pede zoom maior e tira a dobra de página.
 * Se a versão melhor falhar, o componente `BookCover` volta para o endereço original.
 */
export function hdCover(url) {
  if (!url) return url;
  try {
    if (url.includes("covers.openlibrary.org")) return url.replace(/-(S|M)\.jpg/, "-L.jpg");
    if (url.includes("books.google.")) {
      const address = new URL(url);
      address.searchParams.set("zoom", "3");
      address.searchParams.delete("edge");
      return address.toString();
    }
  } catch {
    return url;
  }
  return url;
}

/** Gênero legível: tira prefixos técnicos (series:harry_potter) e põe a primeira letra em maiúscula. */
export function cleanGenre(genre) {
  const text = String(genre || "").replace(/^[a-z]+:/i, "").replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

