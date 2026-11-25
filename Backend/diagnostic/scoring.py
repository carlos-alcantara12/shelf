"""Cálculo do perfil de leitor a partir das respostas (Docs/perfil-de-leitor.md, seção 6).

Determinístico: as mesmas respostas sempre geram o mesmo resultado.
"""

from . import questions as source
from .axes import (
    AFFINITY_AXES,
    ALL_AXES,
    ARCHETYPES,
    AXIS_LABELS,
    GENRES,
    HABITS,
    MOTIVATIONS,
    RESTRICTIONS,
    STYLE,
    TENSIONS,
)
from .bank import clean_answers, get_bank, level_for, questions_for_level

# Conflitos entre respostas que se cruzam reduzem a confiança dos eixos envolvidos.
LOW_CONFIDENCE_FACTOR = 0.7
ARCHETYPE_TIE_MARGIN = 0.05
MIN_AXES_FOR_ARCHETYPE = 2
# Nível de detalhe: parcela de eixos com 2 ou mais perguntas de apoio.
DETAIL_BASIC_BELOW = 0.6
DETAIL_INTERMEDIATE_BELOW = 0.8
WELL_KNOWN_EVIDENCE = 2

_CALM_WORDS = {"poetico", "profundo", "intimo"}
_FAST_WORDS = {"envolvente", "surpreendente", "epico"}


def _selected(value):
    return value if isinstance(value, list) else [value]


def _consistency(cleaned):
    """Devolve (códigos de aviso, eixos de baixa confiança)."""
    warnings, low = [], set()
    q01, q20 = cleaned.get("q01"), cleaned.get("q20")
    if q01 is not None and q20 is not None:
        genre = source.Q20_GENRES[q20]
        if genre not in q01:
            warnings.append("q20_q01")
            low.add(genre.upper())
    q04, q38 = cleaned.get("q04"), cleaned.get("q38")
    if q04 is not None and q38:
        calm, fast = len(_CALM_WORDS & set(q38)), len(_FAST_WORDS & set(q38))
        if (q04 >= 4 and calm >= 2) or (q04 <= 2 and fast >= 2):
            warnings.append("q04_q38")
            low.add("S1")
    q15, q39 = cleaned.get("q15"), cleaned.get("q39")
    if q15 is not None and q39 is not None and q15 <= 2 and q39 == "adoro":
        warnings.append("q15_q39")
        low.add("S4")
    return warnings, low


def _score_axes(cleaned):
    """Soma efeitos e devolve (brutos, máximos, evidências, extras)."""
    bank = get_bank()["by_id"]
    raw, limit, evidence = {}, {}, {}
    restrictions, languages, traits, themes, known_books = [], None, {}, [], []

    for question_id, value in cleaned.items():
        question = bank[question_id]
        if question["type"] == "text":
            known_books = list(value)
            continue

        totals = {}
        if question["type"] == "scale":
            factor = (value - 3) / 2
            for effect in question["effects"]:
                totals[effect["axis"]] = totals.get(effect["axis"], 0) + effect["weight"] * factor
        else:
            by_id = {option["id"]: option for option in question["options"]}
            for option_id in _selected(value):
                for effect in by_id[option_id]["effects"]:
                    if "axis" in effect:
                        totals[effect["axis"]] = totals.get(effect["axis"], 0) + effect["weight"]
                    elif "restriction" in effect and effect["restriction"] not in restrictions:
                        restrictions.append(effect["restriction"])
                    elif "language" in effect:
                        languages = list(effect["language"])
                    elif "trait" in effect:
                        key, trait_value = effect["trait"]
                        traits[key] = trait_value
                    elif "theme" in effect:
                        themes.append(effect["theme"])

        for axis, maximum in question["axis_max"].items():
            contribution = max(-maximum, min(maximum, totals.get(axis, 0)))
            raw[axis] = raw.get(axis, 0) + contribution
            limit[axis] = limit.get(axis, 0) + maximum
            evidence[axis] = evidence.get(axis, 0) + 1

    extras = {
        "restrictions": restrictions,
        "languages": languages or [],
        "traits": traits,
        "themes": themes,
        "known_books": known_books,
    }
    return raw, limit, evidence, extras


def _axis_value(axis, raw, limit, low_confidence):
    if limit.get(axis, 0) == 0:
        return None
    ratio = raw.get(axis, 0) / limit[axis]
    if axis in AFFINITY_AXES:
        score = 100 * max(0.0, ratio)
        if axis in low_confidence:
            score *= LOW_CONFIDENCE_FACTOR
    else:
        score = 50 + 50 * ratio
        if axis in low_confidence:
            score = 50 + (score - 50) * LOW_CONFIDENCE_FACTOR
    return int(round(score))


def _target(entry):
    """Alvo e peso de um eixo do centróide: `65` ou `(65, 2)`."""
    return entry if isinstance(entry, tuple) else (entry, 1)


def _rank_archetypes(scores):
    ranked = []
    for archetype_id, data in ARCHETYPES.items():
        known = [(scores[axis], *_target(entry)) for axis, entry in data["centroid"].items() if scores.get(axis) is not None]
        if len(known) < MIN_AXES_FOR_ARCHETYPE:
            continue
        distance = sum(weight * abs(score - target) for score, target, weight in known) / sum(
            weight for _score, _target_value, weight in known
        )
        ranked.append((round(1 - distance / 100, 4), archetype_id))
    ranked.sort(key=lambda item: (-item[0], item[1]))
    return ranked


def _archetype_payload(similarity, archetype_id):
    data = ARCHETYPES[archetype_id]
    return {
        "id": archetype_id,
        "label": data["label"],
        "summary": data["summary"],
        "description": data["description"],
        "reading_tip": data["reading_tip"],
        "similarity": similarity,
    }


def _detail_level(evidence):
    well_known = sum(1 for axis in ALL_AXES if evidence.get(axis, 0) >= WELL_KNOWN_EVIDENCE)
    share = well_known / len(ALL_AXES)
    if share < DETAIL_BASIC_BELOW:
        return "basico"
    if share < DETAIL_INTERMEDIATE_BELOW:
        return "intermediario"
    return "completo"


BALANCED_WITHIN = 15  # nota entre 35 e 65: traço equilibrado
HIGH_FROM, LOW_UNTIL = 65, 35


def _signature(scores, evidence):
    """Traço mais marcante, traço mais equilibrado e tensão interna (só com eixos bem apoiados)."""
    known = [axis for axis in sorted(set(STYLE) | set(HABITS)) if scores[axis] is not None and evidence.get(axis, 0) >= WELL_KNOWN_EVIDENCE]
    if not known:
        return {"strongest": None, "balanced": None, "tension": None}

    def entry(axis):
        table = STYLE if axis in STYLE else HABITS
        name, low, high = table[axis]
        score = scores[axis]
        lean = "high" if score >= 56 else "low" if score <= 44 else "balanced"
        return {
            "code": axis,
            "label": name,
            "score": score,
            "lean": lean,
            "pole": high if lean == "high" else low if lean == "low" else None,
            "strength": abs(score - 50) * 2,
        }

    strongest_axis = max(known, key=lambda axis: (abs(scores[axis] - 50), axis))
    balanced_axis = min(known, key=lambda axis: (abs(scores[axis] - 50), axis))
    balanced = None
    if balanced_axis != strongest_axis and abs(scores[balanced_axis] - 50) <= BALANCED_WITHIN:
        balanced = entry(balanced_axis)

    def matches(axis, side):
        if axis not in known:
            return False
        return scores[axis] >= HIGH_FROM if side == "high" else scores[axis] <= LOW_UNTIL

    tension = None
    for axis_a, side_a, axis_b, side_b, title, text in TENSIONS:
        if matches(axis_a, side_a) and matches(axis_b, side_b):
            tension = {"title": title, "text": text, "axes": [axis_a, axis_b]}
            break
    return {"strongest": entry(strongest_axis), "balanced": balanced, "tension": tension}


def evaluate(answers, level=None):
    """Valida as respostas e devolve o perfil calculado."""
    cleaned = clean_answers(answers, level)
    warnings, low_confidence = _consistency(cleaned)
    raw, limit, evidence, extras = _score_axes(cleaned)

    scores = {axis: _axis_value(axis, raw, limit, low_confidence) for axis in sorted(ALL_AXES)}
    inferred = max((level_for(int(question_id[1:])) for question_id in cleaned), default=1)
    effective_level = level or inferred
    required = [question for question in questions_for_level(effective_level) if not question["optional"]]
    complete = all(question["id"] in cleaned for question in required)

    ranked = _rank_archetypes(scores)
    archetype = secondary = None
    if ranked:
        archetype = _archetype_payload(*ranked[0])
        if len(ranked) > 1 and ranked[0][0] - ranked[1][0] < ARCHETYPE_TIE_MARGIN:
            secondary = _archetype_payload(*ranked[1])

    def axis_entry(axis):
        return {"code": axis, "label": AXIS_LABELS[axis], "score": scores[axis], "evidence": evidence.get(axis, 0)}

    genres = sorted(
        (axis_entry(code) for code in GENRES if scores[code] is not None),
        key=lambda item: (-item["score"], item["code"]),
    )

    def poles(table):
        return [
            {**axis_entry(code), "low": low, "high": high}
            for code, (_name, low, high) in table.items()
            if scores[code] is not None
        ]

    return {
        "bank_version": get_bank()["version"],
        "level": effective_level,
        "answered": len(cleaned),
        "complete": complete,
        "detail": _detail_level(evidence),
        "archetype": archetype,
        "secondary_archetype": secondary,
        "genres": genres,
        "top_genres": [item for item in genres if item["score"] > 0][:5],
        "style": poles(STYLE),
        "habits": poles(HABITS),
        "motivations": sorted(
            (axis_entry(code) for code in MOTIVATIONS if scores[code] is not None),
            key=lambda item: (-item["score"], item["code"]),
        ),
        "restrictions": [{"id": item, "label": RESTRICTIONS[item]} for item in extras["restrictions"]],
        "languages": extras["languages"],
        "traits": extras["traits"],
        "themes": extras["themes"],
        "known_books": extras["known_books"],
        "signature": _signature(scores, evidence),
        "unknown_axes": [axis_entry(axis) for axis in sorted(ALL_AXES) if evidence.get(axis, 0) == 0],
        "warnings": warnings,
    }
