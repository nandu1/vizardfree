"""
VizardFree – RQ Queue helper (synchronous, for enqueuing from async FastAPI).
"""

from rq import Queue
from redis import Redis
from config import get_settings
from functools import lru_cache

settings = get_settings()


@lru_cache(maxsize=8)
def get_queue(queue_name: str = "default") -> Queue:
    redis_conn = Redis.from_url(settings.REDIS_URL)
    return Queue(queue_name, connection=redis_conn)
