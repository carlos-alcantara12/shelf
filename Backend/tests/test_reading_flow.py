from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from Backend.models import Book, LibraryEntry, ReadingActivity, ReadingSession, ReadingTask

User = get_user_model()


class ReadingFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="reader", email="r@example.com", password="Safe-password-123")
        self.other = User.objects.create_user(username="other", email="o@example.com", password="Safe-password-456")
        self.book = Book.objects.create(title="Dune", author="Frank Herbert", total_pages=412)
        self.outside = Book.objects.create(title="Emma", author="Jane Austen", total_pages=300)
        LibraryEntry.objects.create(user=self.user, book=self.book, status=LibraryEntry.Status.READING)
        self.client.force_authenticate(user=self.user)

    def test_session_is_tied_to_a_library_book(self):
        response = self.client.post("/api/reading-sessions/start/", {"book": self.book.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["active"]["book"], self.book.id)
        self.assertEqual(ReadingSession.objects.get().book, self.book)

    def test_session_rejects_book_outside_library(self):
        response = self.client.post("/api/reading-sessions/start/", {"book": self.outside.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(ReadingSession.objects.exists())

    def test_session_without_book_still_works(self):
        response = self.client.post("/api/reading-sessions/start/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data["active"]["book"])

    def test_tasks_are_filtered_by_book_and_validated(self):
        ok = self.client.post("/api/reading-tasks/", {"title": "Capítulo 3", "book": self.book.id}, format="json")
        self.assertEqual(ok.status_code, status.HTTP_201_CREATED)
        self.client.post("/api/reading-tasks/", {"title": "Geral"}, format="json")
        bad = self.client.post("/api/reading-tasks/", {"title": "x", "book": self.outside.id}, format="json")
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

        listed = self.client.get(f"/api/reading-tasks/?book={self.book.id}")
        titles = [item["title"] for item in (listed.data if isinstance(listed.data, list) else listed.data["results"])]
        self.assertEqual(titles, ["Capítulo 3"])
        self.assertEqual(ReadingTask.objects.filter(user=self.user).count(), 2)

    def test_period_stats_validate_input(self):
        self.assertEqual(self.client.get("/api/reading-stats/?period=day").status_code, 400)
        self.assertEqual(self.client.get("/api/reading-stats/?period=week&offset=1").status_code, 400)
        self.assertEqual(self.client.get("/api/reading-stats/?period=week&offset=abc").status_code, 400)

    def test_period_stats_shapes_and_totals(self):
        ReadingActivity.objects.create(user=self.user, book=self.book, pages_read=30)
        ReadingActivity.objects.create(user=self.other, book=self.book, pages_read=99)
        old = ReadingActivity.objects.create(user=self.user, book=self.book, pages_read=10)
        ReadingActivity.objects.filter(pk=old.pk).update(recorded_at=timezone.now() - timedelta(days=400))

        week = self.client.get("/api/reading-stats/?period=week").data
        self.assertEqual(len(week["buckets"]), 7)
        self.assertEqual(week["totals"]["pages"], 30)
        month = self.client.get("/api/reading-stats/?period=month").data
        self.assertEqual(month["totals"]["pages"], 30)
        self.assertGreaterEqual(len(month["buckets"]), 28)
        year = self.client.get("/api/reading-stats/?period=year").data
        self.assertEqual(len(year["buckets"]), 12)
        self.assertEqual(year["totals"]["pages"], 30)
        previous = self.client.get("/api/reading-stats/?period=year&offset=-1").data
        self.assertFalse(previous["is_current"])

    def test_legacy_stats_response_is_unchanged(self):
        data = self.client.get("/api/reading-stats/").data
        self.assertEqual(set(data), {"daily", "weekly", "monthly"})
