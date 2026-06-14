import hashlib
import json
import os
import logging
from pathlib import Path

logger = logging.getLogger("ascent.llm_cache")

CACHE_DIR = Path("backend/cache/llm_responses")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

_memory_cache = {}

def get_cache_key(model: str, prompt: str) -> str:
    content = f"{model}:{prompt}"
    return hashlib.md5(content.encode()).hexdigest()

def get_cached(model: str, prompt: str):
    key = get_cache_key(model, prompt)
    if key in _memory_cache:
        logger.debug(f"[LLM CACHE] Memory hit: {key[:8]}")
        return _memory_cache[key]
    disk_path = CACHE_DIR / f"{key}.json"
    if disk_path.exists():
        try:
            data = json.loads(disk_path.read_text())
            _memory_cache[key] = data
            logger.debug(f"[LLM CACHE] Disk hit: {key[:8]}")
            return data
        except Exception:
            disk_path.unlink()
    return None

def set_cached(model: str, prompt: str, response: dict):
    key = get_cache_key(model, prompt)
    _memory_cache[key] = response
    disk_path = CACHE_DIR / f"{key}.json"
    try:
        disk_path.write_text(json.dumps(response))
        logger.debug(f"[LLM CACHE] Stored: {key[:8]}")
    except Exception as e:
        logger.warning(f"[LLM CACHE] Failed to write disk cache: {e}")

def clear_cache():
    _memory_cache.clear()
    for f in CACHE_DIR.glob("*.json"):
        f.unlink()
    logger.info("[LLM CACHE] Cache cleared")
