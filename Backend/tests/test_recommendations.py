from unittest.mock import patch

from django.core.cache import cache
from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from Backend.diagnostic.axes import ARCHETYPES, GENRES, RESTRICTIONS, STYLE
from Backend.diagnostic.catalog import BOOKS, BOOKS_BY_ID
from Backend.diagnostic.recommend import recommend
from Backend.diagnostic.scoring import evaluate

from .diagnostic_personas import PERSONAS


class CatalogTests(SimpleTestCase):
    def test_catalog_is_well_formed(self):
        ids = [book["id"] for book in BOOKS]
        self.assertEqual(len(ids), len(set(ids)), "ids repetidos")
        self.assertGreaterEqual(len(BOOKS), 50)
        for book in BOOKS:
            with self.subTest(book=book["id"]):
                self.assertTrue(book["title"] and book["author"] and book["query"])
                self.assertGreater(len(book["blurb"]), 40)
                self.assertTrue(set(book["genres"]) <= set(GENRES))
                self.assertTrue(all(0 < weight <= 1 for weight in book["genres"].values()))
                self.assertEqual(set(book["style"]), set(STYLE))
                self.assertTrue(all(0 <= value <= 100 for value in book["style"].values()))
                self.assertTrue(book["types"] and set(book["types"]) <= set(ARCHETYPES))
                self.assertTrue(set(book["flags"]) <= set(RESTRICTIONS))

    def test_every_genre_and_type_has_books(self):
        covered = {code for book in BOOKS for code in book["genres"]}
        self.assertEqual(covered, set(GENRES))
        types = {kind for book in BOOKS for kind in book["types"]}
        self.assertEqual(types, set(ARCHETYPES))


class RecommendTests(SimpleTestCase):
    def test_every_persona_gets_three_books_with_reasons(self):
        for name, answers in PERSONAS.items():
            with self.subTest(persona=name):
                items = recommend(evaluate(answers))
                self.assertEqual(len(items), 3)
                self.assertEqual(len({item["id"] for item in items}), 3)
                for item in items:
                    self.assertTrue(item["reasons"], item["id"])
                    self.assertTrue(item["blurb"])

    def test_is_deterministic(self):
        result = evaluate(PERSONAS["explorador"])
        self.assertEqual(recommend(result), recommend(result))

    def test_different_profiles_get_different_lists(self):
        lists = {name: tuple(item["id"] for item in recommend(evaluate(answers))) for name, answers in PERSONAS.items()}
        self.assertGreaterEqual(len(set(lists.values())), len(PERSONAS) - 1)

    def test_the_three_books_come_from_different_genres(self):
        for name, answers in PERSONAS.items():
            with self.subTest(persona=name):
                genres = [item["genre"] for item in recommend(evaluate(answers))]
                self.assertEqual(len(set(genres)), 3, genres)

    def test_a_longer_list_still_limits_each_genre(self):
        genres = [item["genre"] for item in recommend(evaluate(PERSONAS["explorador"]), limit=8)]
        self.assertLessEqual(max(genres.count(genre) for genre in set(genres)), 2)

    def test_restrictions_remove_flagged_books(self):
        result = evaluate(PERSONAS["maratonista"])
        result["restrictions"] = [{"id": flag, "label": RESTRICTIONS[flag]} for flag in RESTRICTIONS]
        for item in recommend(result, limit=20):
            self.assertEqual(BOOKS_BY_ID[item["id"]]["flags"], [], item["id"])

    def test_known_books_are_not_recommended_again(self):
        result = evaluate(PERSONAS["explorador"])
        first = recommend(result)[0]
        result["known_books"] = [first["title"].upper()]
        self.assertNotIn(first["id"], [item["id"] for item in recommend(result)])

    def test_without_an_archetype_there_is_nothing_to_recommend(self):
        self.assertEqual(recommend(evaluate({})), [])


class RecommendationEndpointTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_recommendations_are_public_and_need_no_network(self):
        response = self.client.post(
            reverse("diagnostic-recommendations"), {"answers": PERSONAS["curador"]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["items"]), 3)
        self.assertIn("reasons", response.data["items"][0])
        self.assertNotIn("cover_url", response.data["items"][0])

    def test_invalid_answers_are_rejected(self):
        response = self.client.post(reverse("diagnostic-recommendations"), {"answers": {"q02": "nada"}}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cover_endpoint_uses_the_online_catalog_and_caches(self):
        found = {"title": "O Hobbit", "author": "J.R.R. Tolkien", "cover_url": "https://example.com/hobbit.jpg", "provider": "open_library", "source_id": "OL1W"}
        url = reverse("diagnostic-book-cover", args=["o-hobbit"])
        with patch("Backend.diagnostic.covers.search_external_books", return_value=([found], 1)) as search:
            first = self.client.get(url)
            second = self.client.get(url)
        self.assertEqual(first.data["cover_url"], "https://example.com/hobbit.jpg")
        self.assertEqual(second.data, first.data)
        self.assertEqual(search.call_count, 1)

    def test_cover_endpoint_survives_catalog_failures(self):
        from Backend.external_books import ExternalBookCatalogError

        with patch("Backend.diagnostic.covers.search_external_books", side_effect=ExternalBookCatalogError("fora do ar")):
            response = self.client.get(reverse("diagnostic-book-cover", args=["o-hobbit"]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"cover_url": "", "book": None})

    def test_unknown_book_is_404(self):
        response = self.client.get(reverse("diagnostic-book-cover", args=["nao-existe"]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
