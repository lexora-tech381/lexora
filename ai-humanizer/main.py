"""FastAPI server for the AI Humanizer application."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from humanizer import AIHumanizer

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

load_dotenv(BASE_DIR / ".env")
load_dotenv()

app = FastAPI(
    title="AI Humanizer",
    description="Rewrite AI-generated text with heuristic cleanup and adversarial LLM passes.",
    version="1.0.0",
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

humanizer = AIHumanizer()


class HumanizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    intensity: str = Field(default="medium")


class HumanizeResponse(BaseModel):
    humanized_text: str
    burstiness_score: float
    ai_risk_score: float


@app.get("/", response_class=HTMLResponse)
async def index() -> FileResponse:
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found.")
    return FileResponse(index_path)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model": humanizer.model,
        "provider": "openrouter" if "openrouter.ai" in humanizer.base_url else "openai",
    }


@app.post("/api/humanize", response_model=HumanizeResponse)
async def humanize(payload: HumanizeRequest) -> HumanizeResponse:
    text = payload.text.strip()
    intensity = (payload.intensity or "medium").strip().lower()

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    if len(text) > 12000:
        raise HTTPException(status_code=400, detail="Text is too long (max 12,000 characters).")

    if intensity not in {"low", "medium", "high"}:
        raise HTTPException(
            status_code=400,
            detail="Intensity must be one of: low, medium, high.",
        )

    try:
        result = humanizer.bypass_loop(text=text, intensity=intensity)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail="Unable to humanize text. Please try again.",
        ) from exc

    return HumanizeResponse(
        humanized_text=result["humanized_text"],
        burstiness_score=float(result["burstiness_score"]),
        ai_risk_score=float(result["ai_risk_score"]),
    )


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
