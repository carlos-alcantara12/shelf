"""Capas e dados das obras indicadas, buscados no catálogo online e guardados em cache."""

from django.core.cache import cache

from ..external_books import ExternalBookCatalogError, search_external_books
from .recommend import _normalize

CACHE_SECONDS = 60 * 60 * 24 * 7
MISS_SECONDS = 60 * 30  # obra sem resultado no catálogo
ERROR_SECONDS = 15  # catálogo fora do ar ou lento: tentar de novo logo


def _best_match(book, results):
    """Prefere a obra de mesmo título que tenha capa; sem isso, a primeira com capa."""
    wanted = _normalize(book["title"]).split(":")[0].strip()
    with_cover = [item for item in results if item.get("cover_url")]
    for item in with_cover:
        title = _normalize(item.get("title", ""))
        if wanted and (wanted in title or title in wanted):
            return item
    return with_cover[0] if with_cover else None


def resolve(book):
    """{"cover_url": str, "book": dict | None} para uma obra do catálogo curado."""
    key = f"mybooks:diagnostic:cover:{book['id']}"
    cached = cache.get(key)
    if cached is not None:
        return cached

    match = None
    try:
        # Título original com o autor; se não achar capa, o título em português com o autor e, por fim, só o título.
        for query in (book["query"], f"{book['title']} {book['author']}", book["title"]):
            results, _count = search_external_books(query)
            match = _best_match(book, results)
            if match:
                break
    except ExternalBookCatalogError:
        if not match:
            result = {"cover_url": "", "book": None}
            cache.set(key, result, timeout=ERROR_SECONDS)
            return result

    result = {"cover_url": match["cover_url"] if match else "", "book": match}
    cache.set(key, result, timeout=CACHE_SECONDS if match else MISS_SECONDS)
    return result
