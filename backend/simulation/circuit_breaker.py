import random
from typing import Literal

class CircuitBreaker:
    def __init__(
        self,
        threshold: float = 0.5,
        ticks_to_half_open: int = 10,
        probe_limit: int = 10
    ):
        self.state: Literal["CLOSED", "OPEN", "HALF-OPEN"] = "CLOSED"
        self.threshold = threshold
        self.ticks_to_half_open = ticks_to_half_open
        self.probe_limit = probe_limit

        self.consecutive_error_ticks = 0
        self.open_tick_count = 0
        self.half_open_requests_sent = 0
        self.half_open_success_count = 0

    def should_allow_request(self, rng: random.Random) -> bool:
        """
        Determines whether the request should be allowed or fast-failed.
        - CLOSED: Allow all requests.
        - OPEN: Reject all requests.
        - HALF-OPEN: Allow 10% of requests to probe recovery.
        """
        if self.state == "CLOSED":
            return True
        elif self.state == "OPEN":
            return False
        elif self.state == "HALF-OPEN":
            # Allow 10% of requests to pass through
            return rng.random() < 0.1
        return True

    def record_result(self, success: bool):
        """
        Records the outcome of a request that was allowed through.
        Used primarily in HALF-OPEN state to count probe successes/failures.
        """
        if self.state == "HALF-OPEN":
            self.half_open_requests_sent += 1
            if success:
                self.half_open_success_count += 1

            if self.half_open_requests_sent >= self.probe_limit:
                success_rate = self.half_open_success_count / self.half_open_requests_sent
                if success_rate >= 0.8:
                    self.state = "CLOSED"
                    self.consecutive_error_ticks = 0
                else:
                    self.state = "OPEN"
                    self.open_tick_count = 0
                # Reset probe counters
                self.half_open_requests_sent = 0
                self.half_open_success_count = 0

    def tick_update(self, tick_error_rate: float, total_tick_requests: int):
        """
        Updates the circuit breaker state at the end of each tick.
        - In CLOSED, increments error ticks if error rate > threshold. Transitions to OPEN on 5 consecutive.
        - In OPEN, tracks ticks elapsed. Transitions to HALF-OPEN after 10 ticks.
        """
        if self.state == "CLOSED":
            # Only count ticks where there was actual traffic to avoid false CB trips on 0 requests
            if total_tick_requests > 0:
                if tick_error_rate > self.threshold:
                    self.consecutive_error_ticks += 1
                    if self.consecutive_error_ticks >= 5:
                        self.state = "OPEN"
                        self.open_tick_count = 0
                        self.consecutive_error_ticks = 0
                else:
                    self.consecutive_error_ticks = 0
            else:
                self.consecutive_error_ticks = 0

        elif self.state == "OPEN":
            self.open_tick_count += 1
            if self.open_tick_count >= self.ticks_to_half_open:
                self.state = "HALF-OPEN"
                self.half_open_requests_sent = 0
                self.half_open_success_count = 0
