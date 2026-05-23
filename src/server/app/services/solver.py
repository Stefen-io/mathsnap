import logging
import os
import time

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.schemas.solution import Solution

logger = logging.getLogger(__name__)

LANGUAGE_NAMES = {"vi": "Vietnamese", "en": "English"}

SYSTEM_PROMPT = """You are a math tutor. Solve the given math problem step by step.
Return a JSON object with a "steps" array. Each step must have:
  index (integer, starting at 1), title (short label), explanation (full explanation),
  formula (LaTeX string or null), isAnswer (boolean, true only for the final answer step).
Use {language} for all explanations."""

HUMAN_TEMPLATE = "Solve this math problem: {latex}"

_prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])

_solver_chain = None


def _build_chain():
    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        timeout=60,				# ← chờ tối đa 60 giây
        max_retries=1,		# ← retry 1 lần nếu lỗi
        temperature=0,
    ).with_structured_output(Solution, method="json_mode")
    return _prompt | llm


class _LazyChain:
    """Defers ChatOpenAI construction until the first ainvoke call so the
    module can be imported even when OPENAI_API_KEY is not yet in the env."""

    async def ainvoke(self, *args, **kwargs):
        global _solver_chain
        if _solver_chain is None:
            _solver_chain = _build_chain()
        t0 = time.monotonic()
        try:
            result = await _solver_chain.ainvoke(*args, **kwargs)
            logger.info("llm_ok latency=%.2fs steps=%d", time.monotonic() - t0, len(result.steps))
            return result
        except Exception:
            logger.warning("llm_error latency=%.2fs", time.monotonic() - t0)
            raise


solver_chain = _LazyChain()
