import math
from typing import List

DEFAULT_K_FACTOR = 16  # K-factor for rating volatility


def calculate_expected_score(user_rating: float, question_difficulty: float) -> float:
    """
    Standard Elo expected score calculation.
    E = 1 / (1 + 10^((Difficulty - UserRating) / 400))
    """
    return 1.0 / (1.0 + math.pow(10.0, (question_difficulty - user_rating) / 400.0))


def calculate_elo_change(
    user_rating: int,
    correct_difficulties: List[int],
    wrong_difficulties: List[int],
    k_factor: int = DEFAULT_K_FACTOR
) -> int:
    """
    Calculates the net ELO shift for a quiz attempt.
    - Correct answers: actual = 1.0
    - Wrong/Skipped answers: actual = 0.0
    """
    net_delta = 0.0

    for diff in correct_difficulties:
        expected = calculate_expected_score(user_rating, float(diff))
        net_delta += k_factor * (1.0 - expected)

    for diff in wrong_difficulties:
        expected = calculate_expected_score(user_rating, float(diff))
        net_delta += k_factor * (0.0 - expected)

    # Return rounded integer change
    return int(round(net_delta))
