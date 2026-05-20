import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import app.rate_limit as rl


# ── check_burst ──────────────────────────────────────────────────────────────

def test_burst_allows_up_to_limit():
    device = str(uuid4())
    for _ in range(5):
        assert rl.check_burst(device) is True


def test_burst_blocks_request_over_limit():
    device = str(uuid4())
    for _ in range(5):
        rl.check_burst(device)
    assert rl.check_burst(device) is False


def test_burst_different_devices_are_independent():
    a, b = str(uuid4()), str(uuid4())
    for _ in range(5):
        rl.check_burst(a)
    # device b has no prior requests, must be allowed
    assert rl.check_burst(b) is True


# ── sanitize_latex ───────────────────────────────────────────────────────────

def test_sanitize_strips_null_bytes():
    assert rl.sanitize_latex("x\x00=1") == "x=1"


def test_sanitize_strips_control_chars():
    assert rl.sanitize_latex("\x01hello\x07world\x1f") == "helloworld"


def test_sanitize_preserves_normal_latex():
    expr = r"\frac{1}{2} + \sqrt{x^2}"
    assert rl.sanitize_latex(expr) == expr


def test_sanitize_preserves_newline_like_chars_outside_range():
    # \x20 (space) is NOT stripped — range is \x00-\x1f only
    assert rl.sanitize_latex("x = 1 + 2") == "x = 1 + 2"


# ── count_daily ──────────────────────────────────────────────────────────────

async def test_count_daily_returns_count_from_db():
    mock_client = MagicMock()
    mock_execute = AsyncMock(return_value=MagicMock(count=7))
    (mock_client.table.return_value
                .select.return_value
                .eq.return_value
                .gte.return_value
                .lt.return_value
                .execute) = mock_execute

    result = await rl.count_daily(mock_client, uuid4())
    assert result == 7


async def test_count_daily_returns_0_when_count_is_none():
    mock_client = MagicMock()
    mock_execute = AsyncMock(return_value=MagicMock(count=None))
    (mock_client.table.return_value
                .select.return_value
                .eq.return_value
                .gte.return_value
                .lt.return_value
                .execute) = mock_execute

    result = await rl.count_daily(mock_client, uuid4())
    assert result == 0
