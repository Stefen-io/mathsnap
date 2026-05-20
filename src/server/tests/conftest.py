import pytest
import app.rate_limit as rl


@pytest.fixture(autouse=True)
def reset_burst():
    """Clear in-memory burst state before and after every test."""
    rl._burst.clear()
    yield
    rl._burst.clear()
