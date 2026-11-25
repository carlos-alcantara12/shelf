"""Banco de perguntas pronto para uso: níveis, limites por eixo e validação de respostas."""

from functools import cache

from . import questions as source
from .axes import ALL_AXES

LEVELS = (1, 2, 3)
LEVEL_SIZES = {1: 10, 2: 20, 3: 40}
SCALE_RANGE = (1, 5)


class DiagnosticError(Exception):
    """Erro de validação das respostas; `detail` segue o formato dos erros da API."""

    def __init__(self, detail):
        super().__init__(str(detail))
        self.detail = detail


def level_for(number):
    return 1 if number <= 10 else 2 if number <= 20 else 3


def _axis_effects(effects):
    """Soma dos pesos por eixo de uma lista de efeitos."""
    totals = {}
    for effect in effects:
        if "axis" in effect:
            totals[effect["axis"]] = totals.get(effect["axis"], 0) + effect["weight"]
    return totals


def _axis_max(question):
    """Maior contribuição possível de uma pergunta para cada eixo que ela toca."""
    if question["type"] == "scale":
        return {axis: abs(weight) for axis, weight in _axis_effects(question["effects"]).items()}
    limits = {}
    for option in question.get("options", []):
        for axis, weight in _axis_effects(option["effects"]).items():
            limits[axis] = max(limits.get(axis, 0), abs(weight))
    return limits


@cache
def get_bank():
    questions = []
    for raw in source.QUESTIONS:
        number = raw["number"]
        question = {
            **raw,
            "id": f"q{number:02d}",
            "block": (number - 1) // 10 + 1,
            "level": level_for(number),
            "optional": raw.get("optional", False),
        }
        question["axis_max"] = _axis_max(question)
        label, icon, color = source.TOPICS[number]
        question["topic"] = {"label": label, "icon": icon, "color": color}
        if number in source.EXPLAIN:
            question["explain"] = source.EXPLAIN[number]
        questions.append(question)
    return {
        "version": source.BANK_VERSION,
        "questions": questions,
        "by_id": {question["id"]: question for question in questions},
    }


def questions_for_level(level):
    return [question for question in get_bank()["questions"] if question["level"] <= level]


def public_question(question):
    """Versão enviada ao frontend: sem pesos nem efeitos."""
    data = {
        "id": question["id"],
        "number": question["number"],
        "block": question["block"],
        "level": question["level"],
        "type": question["type"],
        "text": question["text"],
        "optional": question["optional"],
        "topic": question["topic"],
    }
    if question.get("explain"):
        data["explain"] = question["explain"]
    if question.get("hint"):
        data["hint"] = question["hint"]
    if question["type"] in ("single", "checklist", "pick3"):
        data["options"] = [{"id": option["id"], "label": option["label"]} for option in question["options"]]
    if question.get("max_choices"):
        data["max_choices"] = question["max_choices"]
    if question["type"] in ("checklist", "pick3"):
        data["min_choices"] = question.get("min_choices", 0)
    if question["type"] == "scale":
        data["scale"] = {"min": SCALE_RANGE[0], "max": SCALE_RANGE[1], "labels": source.SCALE_LABELS}
    if question["type"] == "text":
        data["max_items"] = question["max_items"]
        data["max_length"] = question["max_length"]
    return data


def public_bank(level):
    questions = questions_for_level(level)
    blocks = {}
    for question in questions:
        blocks.setdefault(question["block"], []).append(public_question(question))
    return {
        "version": source.BANK_VERSION,
        "level": level,
        "total": len(questions),
        "blocks": [
            {"number": number, "title": source.BLOCKS[number], "questions": items}
            for number, items in sorted(blocks.items())
        ],
    }


def _clean_value(question, value):
    """Valida e normaliza a resposta de uma pergunta."""
    kind = question["type"]
    if kind == "single":
        valid = {option["id"] for option in question["options"]}
        if not isinstance(value, str) or value not in valid:
            raise ValueError("Escolha uma das opções disponíveis.")
        return value
    if kind in ("checklist", "pick3"):
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise ValueError("Envie uma lista com as opções escolhidas.")
        valid = {option["id"] for option in question["options"]}
        if any(item not in valid for item in value):
            raise ValueError("Há opções que não existem nesta pergunta.")
        if len(set(value)) != len(value):
            raise ValueError("Não repita opções.")
        limit = question.get("max_choices")
        if limit and len(value) > limit:
            raise ValueError(f"Escolha no máximo {limit} opções.")
        minimum = question.get("min_choices", 0)
        if len(value) < minimum:
            raise ValueError(f"Escolha ao menos {minimum} opção ou pule a pergunta.")
        return list(value)
    if kind == "scale":
        low, high = SCALE_RANGE
        if isinstance(value, bool) or not isinstance(value, int) or not low <= value <= high:
            raise ValueError(f"Informe um número inteiro de {low} a {high}.")
        return value
    if kind == "text":
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise ValueError("Envie uma lista de textos.")
        items = [item.strip() for item in value if item.strip()]
        if len(items) > question["max_items"]:
            raise ValueError(f"Informe no máximo {question['max_items']} títulos.")
        if any(len(item) > question["max_length"] for item in items):
            raise ValueError(f"Cada título pode ter no máximo {question['max_length']} caracteres.")
        return items
    raise ValueError("Tipo de pergunta desconhecido.")  # pragma: no cover


def clean_answers(answers, level=None):
    """Valida o conjunto de respostas e devolve só as respondidas (sem os valores nulos)."""
    if level is not None and level not in LEVELS:
        raise DiagnosticError({"level": "Use 1, 2 ou 3."})
    if not isinstance(answers, dict):
        raise DiagnosticError({"answers": "Envie as respostas como um objeto {pergunta: resposta}."})
    bank = get_bank()["by_id"]
    errors = {}
    cleaned = {}
    for question_id, value in answers.items():
        question = bank.get(question_id)
        if question is None:
            errors[str(question_id)] = "Pergunta desconhecida."
            continue
        if level is not None and question["level"] > level:
            errors[question_id] = f"Esta pergunta não faz parte do nível {level}."
            continue
        if value is None:
            continue
        try:
            cleaned[question_id] = _clean_value(question, value)
        except ValueError as error:
            errors[question_id] = str(error)
    if errors:
        raise DiagnosticError({"answers": errors})
    return cleaned


def validate_bank():
    """Confere a integridade do banco; devolve a lista de problemas (vazia se estiver tudo certo)."""
    problems = []
    bank = get_bank()
    numbers = [question["number"] for question in bank["questions"]]
    if numbers != list(range(1, 41)):
        problems.append("As perguntas devem estar numeradas de 1 a 40, em ordem.")
    for question in bank["questions"]:
        where = question["id"]
        topic = question["topic"]
        if topic["icon"] not in source.TOPIC_ICONS:
            problems.append(f"{where}: ícone de tema desconhecido {topic['icon']}.")
        if topic["color"] not in source.TOPIC_COLORS:
            problems.append(f"{where}: cor de tema desconhecida {topic['color']}.")
        if question["type"] == "scale" and "explain" not in question:
            problems.append(f"{where}: pergunta de escala sem texto \"Entenda\".")
        if question["type"] == "text":
            continue
        if question["type"] == "scale":
            if not question["effects"]:
                problems.append(f"{where}: pergunta de escala sem efeitos.")
            groups = [question["effects"]]
        else:
            ids = [option["id"] for option in question["options"]]
            if len(ids) != len(set(ids)):
                problems.append(f"{where}: ids de opção repetidos.")
            groups = [option["effects"] for option in question["options"]]
        for effects in groups:
            for effect in effects:
                if "axis" in effect:
                    if effect["axis"] not in ALL_AXES:
                        problems.append(f"{where}: eixo desconhecido {effect['axis']}.")
                    if not -2 <= effect["weight"] <= 2:
                        problems.append(f"{where}: peso fora de -2..2.")
    return problems
