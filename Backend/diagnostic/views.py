from rest_framework import permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from ..models import ReaderProfile
from . import covers
from .bank import LEVELS, DiagnosticError, clean_answers, public_bank
from .catalog import BOOKS_BY_ID
from .recommend import recommend
from .scoring import evaluate


def _parse_level(raw, default=None):
    if raw in (None, ""):
        return default
    try:
        level = int(raw)
    except (TypeError, ValueError) as error:
        raise ValidationError({"level": "Use 1, 2 ou 3."}) from error
    if level not in LEVELS:
        raise ValidationError({"level": "Use 1, 2 ou 3."})
    return level


def _evaluate(answers, level=None):
    try:
        return evaluate(answers, level)
    except DiagnosticError as error:
        raise ValidationError(error.detail) from error


class _PublicDiagnosticView(APIView):
    """Endpoints abertos (para quem ainda não tem conta): sem autenticação e com limite de uso."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "diagnostic"


class DiagnosticQuestionsView(_PublicDiagnosticView):
    """GET /api/diagnostic/questions/?level=1|2|3: perguntas do nível, em blocos de 10."""

    def get(self, request):
        level = _parse_level(request.query_params.get("level"), default=3)
        return Response(public_bank(level))


class DiagnosticEvaluateView(_PublicDiagnosticView):
    """POST /api/diagnostic/evaluate/: calcula o perfil sem gravar nada."""

    def post(self, request):
        level = _parse_level(request.data.get("level"))
        return Response(_evaluate(request.data.get("answers", {}), level))


class DiagnosticRecommendationsView(_PublicDiagnosticView):
    """POST /api/diagnostic/recommendations/: livros do catálogo curado que combinam com o perfil.

    Não busca capas (isso é lento): o frontend pede cada capa em `diagnostic/books/<id>/cover/`."""

    def post(self, request):
        level = _parse_level(request.data.get("level"))
        result = _evaluate(request.data.get("answers", {}), level)
        return Response({"archetype": result["archetype"], "items": recommend(result)})


class DiagnosticBookCoverView(_PublicDiagnosticView):
    """GET /api/diagnostic/books/<id>/cover/: capa e dados da obra no catálogo online (com cache)."""

    def get(self, request, book_id):
        book = BOOKS_BY_ID.get(book_id)
        if book is None:
            raise NotFound("Livro não encontrado.")
        return Response(covers.resolve(book))


class DiagnosticProfileView(APIView):
    """Perfil da pessoa autenticada: consultar, criar/substituir, aprofundar e apagar."""

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def _get_profile(request):
        return ReaderProfile.objects.filter(user=request.user).first()

    @staticmethod
    def _save(profile, user, level, answers):
        result = _evaluate(answers, level)
        profile = profile or ReaderProfile(user=user)
        profile.level = result["level"]
        profile.answers = clean_answers(answers, level)
        profile.result = result
        profile.archetype = (result["archetype"] or {}).get("id", "")
        profile.secondary_archetype = (result["secondary_archetype"] or {}).get("id", "")
        profile.bank_version = result["bank_version"]
        profile.completed = result["complete"]
        profile.save()
        return profile

    @staticmethod
    def _payload(profile):
        # Recalculado a cada consulta: melhorias no banco de perguntas valem para perfis antigos.
        result = evaluate(profile.answers, profile.level)
        return {
            "level": profile.level,
            "completed": profile.completed,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
            "answers": profile.answers,
            "result": result,
        }

    def get(self, request):
        profile = self._get_profile(request)
        if profile is None:
            return Response({"detail": "Você ainda não tem um perfil de leitor."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self._payload(profile))

    def put(self, request):
        """Cria ou substitui o perfil com o conjunto completo de respostas."""
        level = _parse_level(request.data.get("level"))
        existing = self._get_profile(request)
        profile = self._save(existing, request.user, level, request.data.get("answers", {}))
        code = status.HTTP_200_OK if existing else status.HTTP_201_CREATED
        return Response(self._payload(profile), status=code)

    def patch(self, request):
        """Aprofunda o perfil: junta novas respostas às existentes (e pode subir o nível)."""
        profile = self._get_profile(request)
        if profile is None:
            return Response({"detail": "Você ainda não tem um perfil de leitor."}, status=status.HTTP_404_NOT_FOUND)
        new_answers = request.data.get("answers", {})
        if not isinstance(new_answers, dict):
            raise ValidationError({"answers": "Envie as respostas como um objeto {pergunta: resposta}."})
        level = _parse_level(request.data.get("level"), default=profile.level)
        if level < profile.level:
            raise ValidationError({"level": "O nível não pode diminuir; refaça o perfil para recomeçar."})
        merged = {**profile.answers, **new_answers}
        profile = self._save(profile, request.user, level, merged)
        return Response(self._payload(profile))

    def delete(self, request):
        profile = self._get_profile(request)
        if profile is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        profile.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
