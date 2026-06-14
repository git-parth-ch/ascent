from pydantic import BaseModel

class CascadeEvent(BaseModel):
    tick: int
    source_node: str
    affected_node: str
    failure_type: str
    impact_score: float
