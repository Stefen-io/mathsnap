from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from uuid import uuid4

HEADERS = {"X-Device-ID": str(uuid4())}
PNG = ("t.png", b"\x89PNG\r\n\x1a\n", "image/png")


@pytest.fixture
def client():
    from app.main import app
    with patch("app.main.LatexOCR") as MockOCR:
        MockOCR.return_value = MagicMock()
        with TestClient(app) as c:
            yield c


def test_unexpected_exception_returns_internal_error(client):
    # check_burst runs after MIME/size validation; force an unexpected failure there
    with patch("app.rate_limit.check_burst", side_effect=RuntimeError("boom")):
        resp = client.post("/api/ocr", files={"image": PNG}, headers=HEADERS)
    assert resp.status_code == 500
    assert resp.json()["code"] == "INTERNAL_ERROR"


def test_mapped_error_passes_through(client):
    # wrong MIME must stay INVALID_IMAGE, not be masked as INTERNAL_ERROR
    resp = client.post(
        "/api/ocr", files={"image": ("t.pdf", b"%PDF-1.4", "application/pdf")}, headers=HEADERS
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "INVALID_IMAGE"
