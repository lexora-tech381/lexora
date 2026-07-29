"""FastAPI server for the cryptographic AI Humanizer."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from humanizer import CryptographicHumanizer

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

load_dotenv(BASE_DIR / ".env")
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("humanizer.api")

app = FastAPI(
    title="Cryptographic AI Humanizer",
    description=(
        "Multi-step pivot translation, stylistic fracture, and adversarial "
        "burstiness verification."
    ),
    version="2.0.0",
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def console_log(message: str) -> None:
    logger.info(message)
    print(message, flush=True)


humanizer = CryptographicHumanizer(log_fn=console_log)


class HumanizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    intensity: str = Field(default="medium")


class TracePass(BaseModel):
    pass_number: int
    temperature: float
    top_p: float
    burstiness_score: float
    lexical_penalty: float
    token_entropy: float
    alternation_ok: bool
    mathematical_loss: float
    message: str
    passed: bool


class HumanizeResponse(BaseModel):
    humanized_text: str
    burstiness_score: float
    ai_risk_score: float
    token_entropy: float
    attempts: int
    passed: bool
    mathematical_loss: float
    trace: List[TracePass]


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
        "engine": "cryptographic_v2",
        "model": humanizer.model,
        "pivot_language": humanizer.pivot_language,
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

    console_log("=" * 72)
    console_log(f"[api] /api/humanize received | chars={len(text)} | intensity={intensity}")

    try:
        result: Dict[str, Any] = humanizer.bypass_loop(text=text, intensity=intensity)
    except ValueError as exc:
        console_log(f"[api] validation error: {exc}")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        console_log(f"[api] upstream error: {exc}")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        console_log(f"[api] unexpected failure: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Unable to humanize text. Please try again.",
        ) from exc

    trace_models: List[TracePass] = []
    for item in result.get("trace", []):
        trace_models.append(
            TracePass(
                pass_number=int(item["pass"]),
                temperature=float(item["temperature"]),
                top_p=float(item["top_p"]),
                burstiness_score=float(item["burstiness_score"]),
                lexical_penalty=float(item["lexical_penalty"]),
                token_entropy=float(item["token_entropy"]),
                alternation_ok=bool(item["alternation_ok"]),
                mathematical_loss=float(item["mathematical_loss"]),
                message=str(item["message"]),
                passed=bool(item["passed"]),
            )
        )
        console_log(
            "[api][trace] pass={pass_no} loss={loss} burstiness={burst} "
            "penalty={penalty} passed={passed}".format(
                pass_no=item["pass"],
                loss=item["mathematical_loss"],
                burst=item["burstiness_score"],
                penalty=item["lexical_penalty"],
                passed=item["passed"],
            )
        )

    console_log(
        "[api] complete | attempts={attempts} final_loss={loss} burstiness={burst}".format(
            attempts=result["attempts"],
            loss=result["mathematical_loss"],
            burst=result["burstiness_score"],
        )
    )
    console_log("=" * 72)

    return HumanizeResponse(
        humanized_text=result["humanized_text"],
        burstiness_score=float(result["burstiness_score"]),
        ai_risk_score=float(result["ai_risk_score"]),
        token_entropy=float(result["token_entropy"]),
        attempts=int(result["attempts"]),
        passed=bool(result["passed"]),
        mathematical_loss=float(result["mathematical_loss"]),
        trace=trace_models,
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
