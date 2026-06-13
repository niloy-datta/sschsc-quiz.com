from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserProfileModel(BaseModel):
    name: str
    email: EmailStr
    photoURL: Optional[str] = None
    elo: int = 1200
    totalAttempts: int = 0
    totalCorrect: int = 0
    totalWrong: int = 0
    accuracy: float = 0.0
    streak: int = 0
    createdAt: str
    updatedAt: str


class UserProgressModel(BaseModel):
    attempts: int = 0
    bestScore: int = 0
    accuracy: float = 0.0
    weakTopics: List[str] = []
    lastAttemptAt: str


class LeaderboardEntryModel(BaseModel):
    name: str
    elo: int
    accuracy: float
    totalAttempts: int
