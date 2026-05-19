import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.schemas.solution import Solution

SYSTEM_PROMPT = """You are a math tutor. Solve the given math problem step by step.
Return your answer as structured JSON with a list of solution steps.
Each step must have: index (starting at 1), title (short label), explanation (full explanation),
formula (LaTeX string or null), is_answer (true only for the final answer step).
Use {language} for all explanations."""

HUMAN_TEMPLATE = "Solve this math problem: {latex}"

_prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])

_llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    timeout=14,
    max_retries=1,
    temperature=0,
).with_structured_output(Solution)

solver_chain = _prompt | _llm
