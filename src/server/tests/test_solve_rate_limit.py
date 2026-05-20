import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from uuid import uuid4


VALID_UUID = str(uuid4())
SOLVE_HEADERS = {"X-Device-ID": VALID_UUID}


@pytest.fixture
def client():
    from app.main import app
    with patch("app.main.LatexOCR") as MockOCR:
        MockOCR.return_value = MagicMock()
        with TestClient(app) as c:
            yield c


def test_solve_burst_limit_returns_429(client):
    with patch("app.rate_limit.check_burst", return_value=False):
        resp = client.post(
            "/api/solve",
            json={"latex": "x=1"},
            headers=SOLVE_HEADERS,
        )
    assert resp.status_code == 429
    body = resp.json()
    assert body["code"] == "RATE_LIMITED"
    assert body["retryable"] is True


def test_solve_daily_limit_returns_429(client):
    with patch("app.rate_limit.check_burst", return_value=True), \
         patch("app.services.supabase.get_supabase", new_callable=AsyncMock, return_value=MagicMock()), \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock, return_value=20):
        resp = client.post(
            "/api/solve",
            json={"latex": "x=1"},
            headers=SOLVE_HEADERS,
        )
    assert resp.status_code == 429
    body = resp.json()
    assert body["code"] == "RATE_LIMITED"
    assert body["retryable"] is False


def test_solve_burst_check_runs_before_daily_check(client):
    """Burst check (no DB) must short-circuit before daily DB query."""
    with patch("app.rate_limit.check_burst", return_value=False) as mock_burst, \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock) as mock_daily:
        resp = client.post(
            "/api/solve",
            json={"latex": "x=1"},
            headers=SOLVE_HEADERS,
        )
    assert resp.status_code == 429
    mock_burst.assert_called_once()
    mock_daily.assert_not_called()


def test_solve_sanitizes_control_chars_before_llm(client):
    mock_solution = MagicMock()
    mock_solution.steps = []

    with patch("app.rate_limit.check_burst", return_value=True), \
         patch("app.services.supabase.get_supabase", new_callable=AsyncMock, return_value=MagicMock()), \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock, return_value=0), \
         patch("app.services.solver.solver_chain.ainvoke", new_callable=AsyncMock, return_value=mock_solution) as mock_invoke:

        client.post(
            "/api/solve",
            json={"latex": "x\x07=1"},   # \x07 is BEL, within \x00-\x1f range
            headers=SOLVE_HEADERS,
        )

    # The latex passed to the chain must have control chars stripped
    invoked_latex = mock_invoke.call_args[0][0]["latex"]
    assert "\x07" not in invoked_latex
    assert invoked_latex == "x=1"
