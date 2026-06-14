from enum import Enum
from pydantic import BaseModel

class PerturbationType(str, Enum):
    LATENCY = "LATENCY"
    FAILURE = "FAILURE"
    CORRUPTION = "CORRUPTION"
    QUEUE_SLOWDOWN = "QUEUE_SLOWDOWN"

class Perturbation(BaseModel):
    target_node: str
    start_tick: int
    end_tick: int
    perturbation_type: PerturbationType
    magnitude: float
