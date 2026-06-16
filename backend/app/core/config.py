"""Compatibility module for older imports.

The active backend configuration is in backend/app/config.py.
This file only re-exports that module so app.core.config cannot drift from the
same path constants and production checks.
"""

from ..config import (  # noqa: F401
    DATA_DIR,
    PARSED_QUIZZES_PATH,
    PROJECT_ROOT,
    RAW_QUESTIONS_DIR,
    SCRATCH_DIR,
    STATIC_SPA_DIR,
    Settings,
    cookie_kwargs,
    delete_cookie_kwargs,
    settings,
    validate_production_settings,
)
