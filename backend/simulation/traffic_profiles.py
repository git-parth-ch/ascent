import math
import random
from typing import Optional

def get_traffic_for_tick(profile: str, tick: int, seed: Optional[int] = None) -> int:
    """
    Generates the number of synthetic requests for a given tick and traffic profile.
    Uses a localized Random generator initialized with a seed + tick offset to guarantee reproducibility.
    """
    if seed is not None:
        # local rng based on seed + tick so it is fully deterministic for a given run
        rng = random.Random(seed + tick)
    else:
        rng = random.Random()

    # Small random fluctuations (+/- 5%) to simulate realistic network jitter
    noise = rng.randint(-5, 5)

    if profile == "steady":
        base_load = 100
        val = base_load + noise
    elif profile == "burst":
        burst_load = 300 if 30 <= tick <= 40 else 0
        val = 100 + burst_load + noise
    elif profile == "spike":
        spike_load = 400 if tick == 35 else 0
        val = 50 + spike_load + noise
    elif profile == "diurnal":
        # diurnal: 50 + 100 * sin(tick/20)
        base = 75 + 100 * math.sin(tick / 10.0) # Using slightly adjusted constants for better visual graph
        val = int(base) + noise
    else:
        val = 100 + noise

    return max(0, val)
