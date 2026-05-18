## Project Structure

```plaintext
root/
├── .venv/
├── app/
│   ├── main.py                ← Entry point FastAPI
│   ├── routers/
│   │   ├── ocr.py             ← POST /ocr
│   │   ├── solve.py           ← POST /solve
│   │   └── history.py         ← GET/POST/DELETE /history
│   ├── services/
│   │   ├── ocr_service.py     ← Logic pix2tex
│   └── schemas/
│       └── schemas.py         ← Pydantic data models
├── tests/
│   └── test_ocr.py            ← Test file for ocr.py
├── .env                       ← API keys (do not commit)
├── .env.example               ← Template for others
└── pyproject.toml           	 ← List of dependencies
└── uv.lock                    ← Lockfile
```

## Running the project

```bash
uv run uvicorn app.main:app --reload
```

Open [http://localhost:8000/health](http://localhost:8000/health) with your browser to see the result. If you see `{"status": "ok"}`, the project is running successfully.

Open [http://localhost:8000/docs](http://localhost:8000/docs) with your browser to see the API documentation.
