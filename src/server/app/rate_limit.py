import os
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from time import monotonic
from uuid import UUID

from supabase._async.client import AsyncClient

DAILY_SOLVE_LIMIT = int(os.getenv("DAILY_SOLVE_LIMIT", "20"))
DAILY_OCR_LIMIT   = int(os.getenv("DAILY_OCR_LIMIT",   "20"))
BURST_LIMIT       = int(os.getenv("BURST_LIMIT_PER_MINUTE", "5"))
BURST_WINDOW      = 60.0  # seconds

_burst: dict[str, list[float]] = defaultdict(list)
_CONTROL_RE = re.compile(r"[\x00-\x1f]")


def check_burst(device_id: str) -> bool:
    """Return True if request is within burst limit, False if exceeded."""
    now    = monotonic()
    window = _burst[device_id]
    window[:] = [t for t in window if now - t < BURST_WINDOW]
    if len(window) >= BURST_LIMIT:
        return False
    window.append(now)
    return True


async def count_daily(client: AsyncClient, device_id: UUID) -> int:
    """Return number of history_items rows for device today (UTC)."""
    today    = datetime.now(timezone.utc).date()
    tomorrow = today + timedelta(days=1)
    response = await (
        client.table("history_items")
        .select("id", count="exact")
        .eq("device_id", str(device_id))
        .gte("created_at", today.isoformat())
        .lt("created_at", tomorrow.isoformat())
        .execute()
    )
    return response.count or 0


def sanitize_latex(latex: str) -> str:
    """Strip ASCII control characters (\\x00–\\x1f) from LaTeX string."""
    return _CONTROL_RE.sub("", latex)
