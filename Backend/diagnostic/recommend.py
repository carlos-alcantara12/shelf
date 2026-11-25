"""Indicações de leitura a partir do resultado do diagnóstico.

Regras, sem inteligência artificial e deterministas:
1. exclui livros que acionam alguma restrição da pessoa e livros que ela já citou na Q40;
2. pontua cada livro pelo encaixe nos gêneros (peso 0,5), no estilo de leitura (0,35) e no tipo de leitor (bônus);
3. escolhe os 3 melhores, de gêneros diferentes quando possível;
4. escreve o motivo de cada indicação com os pontos de encaixe encontrados.
"""

import unicodedata

from .axes import GENRES, STYLE
from .catalog import BOOKS

WELL_KNOWN_EVIDENCE = 2
GENRE_WEIGHT = 0.5
STYLE_WEIGHT = 0.35
PRIMARY_BONUS = 0.15
SECONDARY_BONUS = 0.07


# Uma frase para cada polo de estilo; a primeira vale para quem está do lado baixo do eixo, a segunda para o alto.
POLE_REASONS = {
    "S1": ("O ritmo é calmo, do jeito que você prefere ler.", "O ritmo é rápido, como você gosta."),
    "S2": ("O foco está nas personagens, que é o que mais pesa na sua leitura.", "A trama puxa a história, e você prefere enredo a descrição."),
    "S3": ("O tom é leve, bom para quem não quer peso na leitura.", "O tom é sombrio, e você não foge de histórias pesadas."),
    "S4": ("A leitura flui sem exigir esforço, como você prefere.", "É uma leitura exigente, e você curte esse desafio."),
    "S5": ("Tem os pés no chão, com situações que poderiam acontecer.", "Se passa em um mundo imaginado, e você gosta de sair da realidade."),
    "S6": ("É curto: dá para terminar rápido.", "É uma história longa, para quem gosta de passar um tempo com o livro."),
}

TYPE_PHRASES = {
    "explorador": "descobertas fora do comum",
    "imersivo": "mundos grandes para morar por um tempo",
    "estudioso": "livros que ensinam e rendem anotações",
    "contemplativo": "escrita cuidada e ritmo calmo",
    "maratonista": "histórias que prendem até a última página",
    "sentimental": "personagens que mexem com a gente",
    "curador": "obras que merecem um lugar na estante",
    "pragmatico": "ideias que dá para aplicar no dia a dia",
}


def _normalize(text):
    decomposed = unicodedata.normalize("NFD", text or "")
    return "".join(char for char in decomposed if not unicodedata.combining(char)).casefold().strip()


def _genre_fit(book, genre_scores):
    """Média das afinidades da pessoa, ponderada pelos pesos do livro (0 a 1)."""
    total_weight = sum(book["genres"].values())
    if not total_weight:
        return 0.0, None
    fit = sum(genre_scores.get(code, 0) / 100 * weight for code, weight in book["genres"].items()) / total_weight
    main = max(book["genres"], key=lambda code: genre_scores.get(code, 0) * book["genres"][code])
    return fit, main


def _style_fit(book, style):
    """Quão perto o livro está do estilo da pessoa, só nos eixos em que ela tem evidência.

    Devolve (encaixe de 0 a 1, lista de eixos que mais combinam)."""
    weighted, weights, matches = 0.0, 0.0, []
    for code, user in style.items():
        if code not in book["style"]:
            continue
        lean = abs(user - 50) / 50
        weight = 0.25 + lean
        closeness = 1 - abs(user - book["style"][code]) / 100
        weighted += closeness * weight
        weights += weight
        if lean >= 0.3 and closeness >= 0.75:
            matches.append((closeness * lean, code))
    if not weights:
        return 0.5, []
    matches.sort(reverse=True)
    return weighted / weights, [code for _score, code in matches]


def _reasons(book, main_genre, genre_rank, matches, style, archetype_label, kind):
    reasons = []
    if main_genre:
        genre = GENRES[main_genre].lower()
        if genre_rank == 0:
            reasons.append(f"{genre.capitalize()} é o gênero que mais aparece no seu perfil.")
        elif genre_rank is not None and genre_rank < 3:
            reasons.append(f"Você marcou bastante interesse em {genre}.")
    for code in matches[:2]:
        low, high = POLE_REASONS[code]
        reasons.append(high if style[code] >= 50 else low)
    if kind and kind in TYPE_PHRASES:
        reasons.append(f"Leitores do tipo {archetype_label} costumam gostar de {TYPE_PHRASES[kind]}.")
    if not reasons and main_genre:
        reasons.append(f"É uma boa porta de entrada para {GENRES[main_genre].lower()}.")
    return reasons[:3]


def recommend(result, limit=3):
    """Escolhe até `limit` livros do catálogo para o perfil de `result` (saída de `evaluate`)."""
    if not result.get("archetype"):
        return []

    genre_scores = {item["code"]: item["score"] for item in result["genres"]}
    style = {
        item["code"]: item["score"]
        for item in result["style"]
        if item["evidence"] >= WELL_KNOWN_EVIDENCE
    }
    restricted = {item["id"] for item in result["restrictions"]}
    known = {_normalize(title) for title in result.get("known_books", [])}
    genre_order = [item["code"] for item in result["genres"] if item["score"] > 0]
    primary = result["archetype"]["id"]
    primary_label = result["archetype"]["label"]
    secondary_label = (result.get("secondary_archetype") or {}).get("label", "")
    secondary = (result.get("secondary_archetype") or {}).get("id")

    scored = []
    for book in BOOKS:
        if restricted & set(book["flags"]):
            continue
        if _normalize(book["title"]) in known:
            continue
        genre_fit, main_genre = _genre_fit(book, genre_scores)
        if genre_fit < 0.08:
            continue
        style_fit, matches = _style_fit(book, style)
        bonus = PRIMARY_BONUS if primary in book["types"] else SECONDARY_BONUS if secondary in book["types"] else 0
        score = GENRE_WEIGHT * genre_fit + STYLE_WEIGHT * style_fit + bonus
        kind = primary if primary in book["types"] else secondary if secondary in book["types"] else None
        scored.append((score, book, main_genre, genre_fit, matches, kind))

    scored.sort(key=lambda row: (-row[0], row[1]["id"]))

    # Com poucas vagas, cada gênero entra uma vez só (visão mais ampla); se faltar livro, relaxa a regra.
    max_per_genre = 1 if limit <= 3 else 2
    chosen, per_genre = [], {}
    for row in scored:
        main = row[2]
        if per_genre.get(main, 0) >= max_per_genre:
            continue
        per_genre[main] = per_genre.get(main, 0) + 1
        chosen.append(row)
        if len(chosen) == limit:
            break
    if len(chosen) < limit:
        chosen.extend([row for row in scored if row not in chosen][: limit - len(chosen)])

    items = []
    for _score, book, main_genre, genre_fit, matches, kind in chosen:
        items.append(
            {
                "id": book["id"],
                "title": book["title"],
                "author": book["author"],
                "year": book["year"],
                "blurb": book["blurb"],
                "genre": GENRES[main_genre] if main_genre else "",
                "reasons": _reasons(
                    book,
                    main_genre,
                    genre_order.index(main_genre) if main_genre in genre_order else None,
                    matches,
                    style,
                    primary_label if kind == primary else secondary_label,
                    kind,
                ),
                "traits": [STYLE[code][2 if style[code] >= 50 else 1] for code in matches[:3]],
            }
        )
    return items
