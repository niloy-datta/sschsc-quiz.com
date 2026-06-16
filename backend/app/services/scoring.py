from typing import List, Dict, Any, Tuple
from .answer_loader import load_answers
from .elo import calculate_elo_change


def score_submission(
    subject: str,
    quiz_id: str,
    submitted_answers: List[Dict[str, Any]],
    user_rating: int = 1200
) -> Dict[str, Any]:
    """
    Grades the quiz submission in O(n) time.
    Performs O(1) dictionary lookups for each question.
    """
    # Load private answers dictionary
    # subject: e.g. "physics-1st-paper", quiz_id: e.g. "chapter-04" or "dhaka-2023"
    # Wait, the frontend submits quizId like "chapter-04" or "dhaka-2023".
    answers_map = load_answers(subject, quiz_id)

    total_questions = len(submitted_answers)
    correct_count = 0
    wrong_count = 0
    skipped_count = 0

    explanations = {}
    correct_answer_indexes = {}
    correct_difficulties = []
    wrong_difficulties = []

    # Topic tracking: topic -> [correct_count, total_count]
    topic_stats: Dict[str, List[int]] = {}
    difficulty_stats: Dict[int, List[int]] = {}

    for item in submitted_answers:
        q_id = item.get("id")
        student_ans = item.get("ans")  # The string selected option

        ans_data = answers_map.get(q_id)
        if not ans_data:
            # Fallback/ignore invalid question IDs
            skipped_count += 1
            continue

        correct_ans = ans_data.get("answer") or ans_data.get("correctOption")
        correct_ans_idx = int(ans_data.get("answerIndex", 0) or 0)
        explanation = ans_data.get("explanation", "")
        difficulty = int(ans_data.get("difficulty") or 1200)
        topic = ans_data.get("topic") or "General"

        # Initialize stats
        if topic not in topic_stats:
            topic_stats[topic] = [0, 0]  # [correct, total]
        if difficulty not in difficulty_stats:
            difficulty_stats[difficulty] = [0, 0]

        topic_stats[topic][1] += 1
        difficulty_stats[difficulty][1] += 1

        explanations[q_id] = explanation
        correct_answer_indexes[q_id] = correct_ans_idx

        if not student_ans:
            skipped_count += 1
            wrong_difficulties.append(difficulty)
        elif str(student_ans).strip() == str(correct_ans).strip():
            correct_count += 1
            correct_difficulties.append(difficulty)
            topic_stats[topic][0] += 1
            difficulty_stats[difficulty][0] += 1
        else:
            wrong_count += 1
            wrong_difficulties.append(difficulty)

    # Compute stats
    accuracy = round((correct_count / total_questions * 100.0), 1) if total_questions > 0 else 0.0

    # Strong & Weak topics
    strong_topics = []
    weak_topics = []
    for topic, stats in topic_stats.items():
        t_correct, t_total = stats
        t_acc = (t_correct / t_total) * 100.0
        if t_acc >= 75.0:
            strong_topics.append(topic)
        elif t_acc < 60.0:
            weak_topics.append(topic)

    # ELO calculation
    elo_delta = calculate_elo_change(user_rating, correct_difficulties, wrong_difficulties)

    # Performance per difficulty
    difficulty_performance = {}
    for diff, stats in difficulty_stats.items():
        d_correct, d_total = stats
        difficulty_performance[str(diff)] = round((d_correct / d_total * 100.0), 1)

    return {
        "totalScore": correct_count,  # 1 point per correct answer
        "correctCount": correct_count,
        "wrongCount": wrong_count,
        "skippedCount": skipped_count,
        "accuracy": accuracy,
        "timePerQuestion": 0.0,  # calculated in route based on timeTaken
        "chapterPerformance": {subject: accuracy},
        "difficultyPerformance": difficulty_performance,
        "eloRatingChange": elo_delta,
        "weakTopics": weak_topics,
        "strongTopics": strong_topics,
        "explanations": explanations,
        "correctAnswerIndexes": correct_answer_indexes
    }

