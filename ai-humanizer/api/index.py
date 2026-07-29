"""Vercel Python entrypoint for the FastAPI humanizer."""

from __future__ import annotations

import sys
from pathlib import Path

from fastapi import Request
from fastapi.responses import JSONResponse

# Ensure project root (ai-humanizer/) is importable on Vercel.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from main import app  # noqa: E402


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Never freeze the worker on unexpected failures."""
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
    )


# ASGI app exported for Vercel
# Core endpoint logic in main.py is already wrapped in try/except and returns JSON errors.
handler = app
