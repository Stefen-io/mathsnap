import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from uuid import uuid4

DEVICE_ID = str(uuid4())
HEADERS = {"X-Device-ID": DEVICE_ID}
ITEM_ID = str(uuid4())


def _mock_item(is_bookmarked: bool) -> dict:
    return {
        "id": ITEM_ID,
        "device_id": DEVICE_ID,
        "latex": "x=1",
        "solution_steps": [],
        "language": "vi",
        "created_at": "2026-05-01T10:00:00+00:00",
        "is_bookmarked": is_bookmarked,
    }


@pytest.fixture
def client():
    from app.main import app
    with patch("app.main.LatexOCR") as MockOCR:
        MockOCR.return_value = MagicMock()
        with TestClient(app) as c:
            yield c


def test_patch_bookmark_explicit_true_sets_true(client):
    updated = _mock_item(True)
    with patch("app.services.supabase.get_supabase", new_callable=AsyncMock) as mock_db, \
         patch("app.services.supabase.get_history_item", new_callable=AsyncMock) as mock_get, \
         patch("app.services.supabase.set_bookmark", new_callable=AsyncMock) as mock_set:
        from app.schemas.history import HistoryItem
        mock_set.return_value = HistoryItem(**updated)
        mock_get.return_value = HistoryItem(**_mock_item(False))
        resp = client.patch(
            f"/api/history/{ITEM_ID}/bookmark",
            json={"isBookmarked": True},
            headers=HEADERS,
        )
    assert resp.status_code == 200
    assert resp.json()["isBookmarked"] is True


def test_patch_bookmark_idempotent(client):
    updated = _mock_item(True)
    with patch("app.services.supabase.get_supabase", new_callable=AsyncMock), \
         patch("app.services.supabase.get_history_item", new_callable=AsyncMock) as mock_get, \
         patch("app.services.supabase.set_bookmark", new_callable=AsyncMock) as mock_set:
        from app.schemas.history import HistoryItem
        mock_set.return_value = HistoryItem(**updated)
        mock_get.return_value = HistoryItem(**_mock_item(True))
        resp = client.patch(
            f"/api/history/{ITEM_ID}/bookmark",
            json={"isBookmarked": True},
            headers=HEADERS,
        )
    assert resp.status_code == 200
    assert resp.json()["isBookmarked"] is True


def test_patch_bookmark_missing_body_returns_400(client):
    resp = client.patch(
        f"/api/history/{ITEM_ID}/bookmark",
        headers=HEADERS,
        # no body
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "INVALID_REQUEST"
