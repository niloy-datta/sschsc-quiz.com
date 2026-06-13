from pydantic import BaseModel
from typing import List, Optional, Dict


class QuizAnswer(BaseModel):
    id: str
    ans: Optional[str] = None


class QuizSubmission(BaseModel):
    userId: str
    submissionId: str
    quizId: str
    subject: str
    answers: List[QuizAnswer]
    answerIndexes: List[int] = []
    examName: Optional[str] = None
    questionsPath: Optional[str] = None
    timeTaken: int
    mode: str


class QuizResultResponse(BaseModel):
    totalScore: int
    correctCount: int
    wrongCount: int
    skippedCount: int
    accuracy: float
    timePerQuestion: float
    chapterPerformance: Dict[str, float]
    difficultyPerformance: Dict[str, float]
    eloRatingChange: int
    weakTopics: List[str]
    strongTopics: List[str]
    explanations: Dict[str, str]
