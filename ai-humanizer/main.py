"""FastAPI server for the human-thought humanizer pipeline."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from humanizer import HumanLogicHumanizer

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
    title="Human Logic Humanizer",
    description="Erratic human-thought rewriting with hard structural guards.",
    version="3.0.0",
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def console_log(message: str) -> None:
    logger.info(message)
    print(message, flush=True)


humanizer = HumanLogicHumanizer(log_fn=console_log)


class HumanizeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    intensity: str = Field(default="medium")


class TracePass(BaseModel):
    pass_number: int
    temperature: float
    top_p: float
    top_k: int
    structural_adjustments: int
    structural_entropy: float
    cliche_blocked: bool
    cliche_matches: List[str]
    burstiness_ok: bool
    mathematical_loss: float
    message: str
    passed: bool


class HumanizeResponse(BaseModel):
    humanized_text: str
    burstiness_score: float
    ai_risk_score: float
    structural_entropy: float
    attempts: int
    passed: bool
    mathematical_loss: float
    structural_adjustments: int
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
        "engine": "human_logic_v3",
        "model": humanizer.model,
        "provider": "openrouter" if "openrouter.ai" in humanizer.base_url else "openai",
    }


@app.post("/api/humanize")
async def humanize(payload: HumanizeRequest):
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
    console_log(f"[api] /api/humanize | chars={len(text)} | intensity={intensity}")

    try:
        result: Dict[str, Any] = humanizer.run_humanization_pipeline(
            text=text,
            intensity=intensity,
        )
    except ValueError as exc:
        console_log(f"[api] validation error: {exc}")
        return JSONResponse(status_code=400, content={"error": str(exc)})
    except RuntimeError as exc:
        console_log(f"[api] upstream error: {exc}")
        return JSONResponse(status_code=502, content={"error": str(exc)})
    except Exception as exc:  # noqa: BLE001
        console_log(f"[api] unexpected failure: {exc}")
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)},
        )

    trace_models: List[TracePass] = []
    for item in result.get("trace", []):
        trace_models.append(
            TracePass(
                pass_number=int(item["pass"]),
                temperature=float(item["temperature"]),
                top_p=float(item["top_p"]),
                top_k=int(item["top_k"]),
                structural_adjustments=int(item["structural_adjustments"]),
                structural_entropy=float(item["structural_entropy"]),
                cliche_blocked=bool(item["cliche_blocked"]),
                cliche_matches=list(item.get("cliche_matches") or []),
                burstiness_ok=bool(item["burstiness_ok"]),
                mathematical_loss=float(item["mathematical_loss"]),
                message=str(item["message"]),
                passed=bool(item["passed"]),
            )
        )
        console_log(
            "[api][trace] pass={pass_no} adjustments={adj} entropy={entropy} "
            "loss={loss} passed={passed}".format(
                pass_no=item["pass"],
                adj=item["structural_adjustments"],
                entropy=item["structural_entropy"],
                loss=item["mathematical_loss"],
                passed=item["passed"],
            )
        )

    console_log(
        "[api] complete | attempts={attempts} adjustments={adj} entropy={entropy}".format(
            attempts=result["attempts"],
            adj=result["structural_adjustments"],
            entropy=result["structural_entropy"],
        )
    )
    console_log("=" * 72)

    return HumanizeResponse(
        humanized_text=result["humanized_text"],
        burstiness_score=float(result["burstiness_score"]),
        ai_risk_score=float(result["ai_risk_score"]),
        structural_entropy=float(result["structural_entropy"]),
        attempts=int(result["attempts"]),
        passed=bool(result["passed"]),
        mathematical_loss=float(result["mathematical_loss"]),
        structural_adjustments=int(result["structural_adjustments"]),
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
