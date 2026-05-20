import io
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from uuid import uuid4
from PIL import Image


VALID_UUID = str(uuid4())


def _jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


@pytest.fixture
def client():
    from app.main import app
    with patch("app.main.LatexOCR") as MockOCR:
        MockOCR.return_value = MagicMock()
        with TestClient(app) as c:
            yield c


def test_ocr_burst_limit_returns_429(client):
    with patch("app.rate_limit.check_burst", return_value=False):
        resp = client.post(
            "/api/ocr",
            files={"image": ("t.jpg", _jpeg_bytes(), "image/jpeg")},
            headers={"X-Device-ID": VALID_UUID},
        )
    assert resp.status_code == 429
    body = resp.json()
    assert body["code"] == "RATE_LIMITED"
    assert body["retryable"] is True


def test_ocr_daily_limit_returns_429(client):
    with patch("app.rate_limit.check_burst", return_value=True), \
         patch("app.services.supabase.get_supabase", new_callable=AsyncMock, return_value=MagicMock()), \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock, return_value=20):
        resp = client.post(
            "/api/ocr",
            files={"image": ("t.jpg", _jpeg_bytes(), "image/jpeg")},
            headers={"X-Device-ID": VALID_UUID},
        )
    assert resp.status_code == 429
    body = resp.json()
    assert body["code"] == "RATE_LIMITED"
    assert body["retryable"] is False


def test_ocr_burst_message_is_retryable(client):
    with patch("app.rate_limit.check_burst", return_value=False):
        resp = client.post(
            "/api/ocr",
            files={"image": ("t.jpg", _jpeg_bytes(), "image/jpeg")},
            headers={"X-Device-ID": VALID_UUID},
        )
    assert resp.status_code == 429
    assert resp.json()["retryable"] is True


def test_ocr_daily_message_is_not_retryable(client):
    with patch("app.rate_limit.check_burst", return_value=True), \
         patch("app.services.supabase.get_supabase", new_callable=AsyncMock, return_value=MagicMock()), \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock, return_value=20):
        resp = client.post(
            "/api/ocr",
            files={"image": ("t.jpg", _jpeg_bytes(), "image/jpeg")},
            headers={"X-Device-ID": VALID_UUID},
        )
    assert resp.status_code == 429
    assert resp.json()["retryable"] is False
