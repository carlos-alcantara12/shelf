from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from Backend.diagnostic.axes import ALL_AXES, ARCHETYPES
from Backend.diagnostic.bank import (
    DiagnosticError,
    get_bank,
    public_bank,
    validate_bank,
)
from Backend.diagnostic.scoring import evaluate
from Backend.models import ReaderProfile

from .diagnostic_personas import PERSONAS

User = get_user_model()


def truncate(answers, limit):
    return {key: value for key, value in answers.items() if int(key[1:]) <= limit}


class QuestionBankTests(SimpleTestCase):
    def test_bank_is_consistent(self):
        self.assertEqual(validate_bank(), [])
        self.assertEqual(len(get_bank()["questions"]), 40)

    def test_levels_are_layers_of_a_single_bank(self):
        self.assertEqual([public_bank(level)["total"] for level in (1, 2, 3)], [10, 20, 40])
        level_one = {q["id"] for block in public_bank(1)["blocks"] for q in block["questions"]}
        level_two = {q["id"] for block in public_bank(2)["blocks"] for q in block["questions"]}
        self.assertLess(level_one, level_two)

    def test_every_axis_is_measured_and_has_two_sources(self):
        touched = {axis: 0 for axis in ALL_AXES}
        for question in get_bank()["questions"]:
            for axis in question["axis_max"]:
                touched[axis] += 1
        self.assertEqual([axis for axis, count in touched.items() if count == 0], [])
        thin = [axis for axis, count in touched.items() if count < 2]
        self.assertEqual(thin, [], f"Eixos com uma só pergunta de apoio: {thin}")

    def test_checklists_declare_a_minimum(self):
        by_id = get_bank()["by_id"]
        self.assertEqual(by_id["q01"]["min_choices"], 1)
        self.assertEqual(by_id["q08"]["min_choices"], 0)
        self.assertEqual(by_id["q38"]["min_choices"], 1)

    def test_every_archetype_has_a_description_and_a_tip(self):
        for archetype_id, data in ARCHETYPES.items():
            self.assertGreater(len(data["description"]), 60, archetype_id)
            self.assertGreater(len(data["reading_tip"]), 30, archetype_id)

    def test_every_question_has_a_topic_and_scale_questions_have_an_explanation(self):
        for question in get_bank()["questions"]:
            topic = question["topic"]
            self.assertTrue(topic["label"], question["id"])
            if question["type"] == "scale":
                explain = question["explain"]
                for part in ("agree", "disagree", "note"):
                    self.assertGreater(len(explain[part]), 20, f"{question['id']}: {part}")

    def test_every_archetype_uses_known_axes(self):
        for archetype_id, data in ARCHETYPES.items():
            for axis in data["centroid"]:
                self.assertIn(axis, ALL_AXES, f"{archetype_id}: eixo desconhecido {axis}")


class ScoringTests(SimpleTestCase):
    def test_no_answers_means_no_archetype_and_everything_unknown(self):
        result = evaluate({})
        self.assertIsNone(result["archetype"])
        self.assertEqual(result["answered"], 0)
        self.assertEqual(result["detail"], "basico")
        self.assertEqual(len(result["unknown_axes"]), len(ALL_AXES))

    def test_result_is_deterministic(self):
        answers = PERSONAS["explorador"]
        self.assertEqual(evaluate(answers), evaluate(dict(reversed(list(answers.items())))))

    def test_complete_personas_get_the_expected_archetype(self):
        for expected, answers in PERSONAS.items():
            with self.subTest(expected):
                result = evaluate(answers)
                self.assertEqual(result["archetype"]["id"], expected)
                self.assertTrue(result["complete"])

    def test_accuracy_grows_with_the_level(self):
        def hits(level, limit):
            return sum(
                evaluate(truncate(answers, limit), level)["archetype"]["id"] == expected
                for expected, answers in PERSONAS.items()
            )

        level1, level2, level3 = hits(1, 10), hits(2, 20), hits(3, 40)
        self.assertEqual(level3, len(PERSONAS))
        self.assertGreaterEqual(level2, level1)
        self.assertGreaterEqual(level1, len(PERSONAS) // 2)

    def test_detail_level_follows_the_number_of_answers(self):
        answers = PERSONAS["maratonista"]
        self.assertEqual(evaluate(truncate(answers, 10), 1)["detail"], "basico")
        self.assertEqual(evaluate(truncate(answers, 20), 2)["detail"], "intermediario")
        self.assertEqual(evaluate(answers, 3)["detail"], "completo")

    def test_partial_level_is_marked_incomplete(self):
        result = evaluate({"q01": ["g1"], "q02": "um"}, 1)
        self.assertFalse(result["complete"])
        self.assertEqual(result["answered"], 2)

    def test_skipped_answers_count_as_not_answered(self):
        with_skip = evaluate({"q01": ["g1"], "q02": None, "q04": None})
        without = evaluate({"q01": ["g1"]})
        self.assertEqual(with_skip, without)
        self.assertEqual(with_skip["answered"], 1)

    def test_scale_answers_map_to_the_axis(self):
        self.assertEqual(self._style_score({"q04": 5}, "S1"), 100)
        self.assertEqual(self._style_score({"q04": 3}, "S1"), 50)
        self.assertEqual(self._style_score({"q04": 1}, "S1"), 0)

    def test_genre_affinity_comes_from_the_checklist(self):
        result = evaluate({"q01": ["g1"]})
        scores = {item["code"]: item["score"] for item in result["genres"]}
        self.assertEqual(scores["G1"], 100)
        self.assertEqual(scores["G2"], 0)
        self.assertEqual([item["code"] for item in result["top_genres"]], ["G1"])

    def test_extras_are_collected(self):
        result = evaluate({
            "q08": ["finais_tristes", "terror"],
            "q09": "audio",
            "q17": ["amizade", "tecnologia"],
            "q32": "pt_en",
            "q40": ["  Dom Casmurro  ", ""],
        })
        self.assertEqual([item["id"] for item in result["restrictions"]], ["finais_tristes", "terror"])
        self.assertEqual(result["traits"]["format"], "audio")
        self.assertEqual(result["themes"], ["amizade", "tecnologia"])
        self.assertEqual(result["languages"], ["pt", "en"])
        self.assertEqual(result["known_books"], ["Dom Casmurro"])

    def test_conflicting_answers_lower_confidence_and_are_flagged(self):
        result = evaluate({"q01": ["g1"], "q20": "suspense"})
        self.assertIn("q20_q01", result["warnings"])
        scores = {item["code"]: item["score"] for item in result["genres"]}
        # G4: 2 de 4 pontos possíveis (50), reduzido a 70% por causa do conflito.
        self.assertEqual(scores["G4"], 35)

        consistent = evaluate({"q01": ["g4"], "q20": "suspense"})
        self.assertEqual(consistent["warnings"], [])

    def test_calm_words_against_fast_pace_are_flagged(self):
        result = evaluate({"q04": 5, "q38": ["poetico", "intimo"]})
        self.assertIn("q04_q38", result["warnings"])

    def test_dislike_of_challenge_against_loving_classics_is_flagged(self):
        result = evaluate({"q15": 1, "q39": "adoro"})
        self.assertIn("q15_q39", result["warnings"])

    def test_result_carries_description_and_tip(self):
        archetype = evaluate(PERSONAS["curador"])["archetype"]
        self.assertTrue(archetype["description"])
        self.assertTrue(archetype["reading_tip"])

    def test_visual_style_feeds_the_comics_genre(self):
        result = evaluate({"q16": "visual"})
        scores = {item["code"]: item["score"] for item in result["genres"]}
        self.assertEqual(scores["G12"], 100)

    def test_signature_needs_axes_with_two_sources(self):
        empty = evaluate({"q04": 5})["signature"]
        self.assertEqual(empty, {"strongest": None, "balanced": None, "tension": None})

    def test_signature_picks_strongest_and_balanced_traits(self):
        signature = evaluate(PERSONAS["maratonista"])["signature"]
        strongest, balanced = signature["strongest"], signature["balanced"]
        self.assertEqual(strongest["lean"], "high")
        self.assertGreaterEqual(strongest["strength"], 60)
        if balanced is not None:
            self.assertNotEqual(balanced["code"], strongest["code"])
            self.assertLessEqual(abs(balanced["score"] - 50), 15)

    def test_signature_detects_an_internal_tension(self):
        # Ritmo calmo (S1 baixo) com trama como centro (S2 alto).
        result = evaluate({"q03": "trama", "q04": 1, "q05": "reflexivo", "q19": 5})
        tension = result["signature"]["tension"]
        self.assertEqual(tension["title"], "Calma com suspense")
        self.assertEqual(tension["axes"], ["S1", "S2"])

    def test_signature_has_no_tension_when_traits_agree(self):
        result = evaluate({"q03": "trama", "q04": 5, "q05": "sombrio", "q19": 5})
        self.assertIsNone(result["signature"]["tension"])

    def test_close_archetypes_produce_a_secondary_trait(self):
        results = [evaluate(answers) for answers in PERSONAS.values()]
        self.assertTrue(any(result["secondary_archetype"] for result in results))
        for result in results:
            if result["secondary_archetype"]:
                self.assertNotEqual(result["secondary_archetype"]["id"], result["archetype"]["id"])

    def _style_score(self, answers, axis):
        result = evaluate(answers)
        return next(item["score"] for item in result["style"] if item["code"] == axis)


class AnswerValidationTests(SimpleTestCase):
    def assert_invalid(self, answers, level=None, key=None):
        with self.assertRaises(DiagnosticError) as context:
            evaluate(answers, level)
        if key is not None:
            self.assertIn(key, context.exception.detail["answers"])

    def test_rejects_unknown_question(self):
        self.assert_invalid({"q99": 3}, key="q99")

    def test_rejects_unknown_option(self):
        self.assert_invalid({"q02": "muitos"}, key="q02")
        self.assert_invalid({"q01": ["g1", "inexistente"]}, key="q01")

    def test_rejects_too_many_choices(self):
        self.assert_invalid({"q01": ["g1", "g2", "g3", "g4", "g5", "g6"]}, key="q01")
        self.assert_invalid({"q38": ["leve", "poetico", "intimo", "epico"]}, key="q38")

    def test_rejects_checklist_below_the_minimum(self):
        self.assert_invalid({"q01": []}, key="q01")
        self.assert_invalid({"q38": []}, key="q38")
        # q08: lista vazia vale ("nada a evitar").
        self.assertEqual(evaluate({"q08": []})["restrictions"], [])

    def test_rejects_repeated_options(self):
        self.assert_invalid({"q01": ["g1", "g1"]}, key="q01")

    def test_rejects_invalid_scale_values(self):
        for value in (0, 6, "3", 2.5, True):
            with self.subTest(value=value):
                self.assert_invalid({"q04": value}, key="q04")

    def test_rejects_questions_beyond_the_level(self):
        self.assert_invalid({"q15": 4}, level=1, key="q15")
        self.assert_invalid({"q25": "um_mes"}, level=2, key="q25")

    def test_rejects_invalid_level(self):
        with self.assertRaises(DiagnosticError):
            evaluate({}, 4)

    def test_rejects_non_object_answers(self):
        with self.assertRaises(DiagnosticError):
            evaluate([1, 2, 3])

    def test_text_answer_limits(self):
        self.assert_invalid({"q40": ["a", "b", "c", "d"]}, key="q40")
        self.assert_invalid({"q40": ["x" * 201]}, key="q40")
        self.assert_invalid({"q40": "Dom Casmurro"}, key="q40")

    def test_reports_every_error_at_once(self):
        with self.assertRaises(DiagnosticError) as context:
            evaluate({"q02": "x", "q04": 9, "q99": 1})
        self.assertEqual(set(context.exception.detail["answers"]), {"q02", "q04", "q99"})


class DiagnosticPublicAPITests(APITestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_questions_are_public_and_split_by_level(self):
        for level, total in ((1, 10), (2, 20), (3, 40)):
            response = self.client.get(reverse("diagnostic-questions"), {"level": level})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["total"], total)
            self.assertEqual(sum(len(block["questions"]) for block in response.data["blocks"]), total)

    def test_default_level_is_the_complete_bank(self):
        response = self.client.get(reverse("diagnostic-questions"))
        self.assertEqual(response.data["total"], 40)

    def test_invalid_level_is_rejected(self):
        for value in ("0", "4", "abc"):
            response = self.client.get(reverse("diagnostic-questions"), {"level": value})
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, value)

    def test_questions_never_leak_scoring(self):
        response = self.client.get(reverse("diagnostic-questions"), {"level": 3})
        body = str(response.data)
        for forbidden in ("effects", "weight", "axis", "centroid"):
            self.assertNotIn(forbidden, body)

    def test_question_payload_shape(self):
        questions = {
            question["id"]: question
            for block in self.client.get(reverse("diagnostic-questions")).data["blocks"]
            for question in block["questions"]
        }
        self.assertEqual(questions["q01"]["type"], "checklist")
        self.assertEqual(questions["q01"]["max_choices"], 5)
        self.assertEqual(len(questions["q01"]["options"]), 12)
        self.assertEqual(questions["q01"]["min_choices"], 1)
        self.assertEqual(questions["q08"]["min_choices"], 0)
        self.assertEqual(questions["q04"]["scale"]["min"], 1)
        self.assertEqual(len(questions["q04"]["scale"]["labels"]), 5)
        self.assertTrue(questions["q40"]["optional"])
        self.assertEqual(questions["q04"]["topic"], {"label": "Ritmo", "icon": "gauge", "color": "S1"})
        self.assertEqual(set(questions["q04"]["explain"]), {"agree", "disagree", "note"})
        self.assertNotIn("explain", questions["q02"])

    def test_evaluate_works_without_an_account_and_stores_nothing(self):
        response = self.client.post(
            reverse("diagnostic-evaluate"),
            {"level": 3, "answers": PERSONAS["sentimental"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["archetype"]["id"], "sentimental")
        self.assertEqual(ReaderProfile.objects.count(), 0)

    def test_evaluate_ignores_an_invalid_token(self):
        response = self.client.post(
            reverse("diagnostic-evaluate"),
            {"answers": {"q02": "um"}},
            format="json",
            HTTP_AUTHORIZATION="Bearer token-invalido",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_evaluate_reports_invalid_answers(self):
        response = self.client.post(
            reverse("diagnostic-evaluate"),
            {"level": 1, "answers": {"q02": "muitos", "q15": 3}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(set(response.data["answers"]), {"q02", "q15"})

    def test_evaluate_rejects_invalid_level(self):
        response = self.client.post(reverse("diagnostic-evaluate"), {"level": 9, "answers": {}}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_evaluate_is_rate_limited(self):
        url = reverse("diagnostic-evaluate")
        codes = [self.client.post(url, {"answers": {}}, format="json").status_code for _ in range(31)]
        self.assertEqual(codes[:30], [status.HTTP_200_OK] * 30)
        self.assertEqual(codes[30], status.HTTP_429_TOO_MANY_REQUESTS)


class DiagnosticProfileAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("leitor", "leitor@example.com", "Safe-password-123")
        self.other = User.objects.create_user("outro", "outro@example.com", "Safe-password-456")
        self.url = reverse("diagnostic-profile")

    def tearDown(self):
        cache.clear()

    def test_profile_requires_authentication(self):
        for method in ("get", "put", "patch", "delete"):
            response = getattr(self.client, method)(self.url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, method)

    def test_no_profile_yet(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.patch(self.url, {"answers": {}}, format="json").status_code, 404)

    def test_save_replace_and_read_profile(self):
        self.client.force_authenticate(self.user)
        created = self.client.put(self.url, {"level": 3, "answers": PERSONAS["curador"]}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["result"]["archetype"]["id"], "curador")

        profile = ReaderProfile.objects.get(user=self.user)
        self.assertEqual(profile.archetype, "curador")
        self.assertEqual(profile.level, 3)
        self.assertTrue(profile.completed)
        self.assertEqual(profile.bank_version, get_bank()["version"])

        replaced = self.client.put(self.url, {"level": 3, "answers": PERSONAS["maratonista"]}, format="json")
        self.assertEqual(replaced.status_code, status.HTTP_200_OK)
        self.assertEqual(ReaderProfile.objects.filter(user=self.user).count(), 1)

        fetched = self.client.get(self.url)
        self.assertEqual(fetched.data["result"]["archetype"]["id"], "maratonista")
        self.assertEqual(fetched.data["answers"]["q04"], 5)

    def test_profile_can_be_saved_in_progress_and_deepened(self):
        self.client.force_authenticate(self.user)
        first = self.client.put(
            self.url, {"level": 1, "answers": truncate(PERSONAS["pragmatico"], 10)}, format="json"
        )
        self.assertEqual(first.data["level"], 1)
        self.assertTrue(first.data["completed"])

        deeper = self.client.patch(
            self.url, {"level": 3, "answers": {k: v for k, v in PERSONAS["pragmatico"].items() if int(k[1:]) > 10}},
            format="json",
        )
        self.assertEqual(deeper.status_code, status.HTTP_200_OK)
        self.assertEqual(deeper.data["level"], 3)
        self.assertEqual(deeper.data["result"]["detail"], "completo")
        self.assertEqual(deeper.data["result"]["archetype"]["id"], "pragmatico")
        self.assertEqual(len(deeper.data["answers"]), len({k: v for k, v in PERSONAS["pragmatico"].items() if v is not None}))

    def test_incomplete_profile_is_not_marked_completed(self):
        self.client.force_authenticate(self.user)
        response = self.client.put(self.url, {"level": 2, "answers": {"q01": ["g1"]}}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["completed"])

    def test_level_cannot_go_down_when_deepening(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.url, {"level": 2, "answers": truncate(PERSONAS["curador"], 20)}, format="json")
        response = self.client.patch(self.url, {"level": 1, "answers": {}}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_answers_do_not_change_the_profile(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.url, {"level": 3, "answers": PERSONAS["curador"]}, format="json")
        response = self.client.patch(self.url, {"answers": {"q02": "inexistente"}}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ReaderProfile.objects.get(user=self.user).archetype, "curador")

    def test_patch_can_skip_a_previous_answer(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.url, {"level": 1, "answers": {"q02": "um", "q04": 5}}, format="json")
        response = self.client.patch(self.url, {"answers": {"q04": None}}, format="json")
        self.assertNotIn("q04", response.data["answers"])
        self.assertIn("q02", response.data["answers"])

    def test_profiles_are_private(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.url, {"level": 3, "answers": PERSONAS["curador"]}, format="json")
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(self.url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(ReaderProfile.objects.filter(user=self.user).exists())

    def test_delete_removes_the_profile_and_is_idempotent(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.url, {"level": 3, "answers": PERSONAS["curador"]}, format="json")
        self.assertEqual(self.client.delete(self.url).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ReaderProfile.objects.filter(user=self.user).exists())
        self.assertEqual(self.client.delete(self.url).status_code, status.HTTP_204_NO_CONTENT)

    def test_profile_is_removed_with_the_account(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.url, {"level": 3, "answers": PERSONAS["curador"]}, format="json")
        self.user.delete()
        self.assertEqual(ReaderProfile.objects.count(), 0)
