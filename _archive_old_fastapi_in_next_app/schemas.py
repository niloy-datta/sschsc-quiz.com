from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
import enum

class RoleEnum(str, enum.Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"

class DifficultyEnum(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class QuizTypeEnum(str, enum.Enum):
    CHAPTER_WISE = "CHAPTER_WISE"
    SUBJECT_WISE = "SUBJECT_WISE"
    COMBINED_CHAPTER = "COMBINED_CHAPTER"
    MODEL_TEST = "MODEL_TEST"
    BOARD_QUESTION = "BOARD_QUESTION"
    SUGGESTION = "SUGGESTION"
    WEAK_CHAPTER = "WEAK_CHAPTER"

class UserBase(BaseModel):
    name: str
    email: str
    picture: Optional[str] = None
    role: RoleEnum = RoleEnum.STUDENT

class UserCreate(UserBase):
    password: Optional[str] = None
    googleId: Optional[str] = None

class UserResponse(UserBase):
    id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: str
    role: str

class AdminLoginRequest(BaseModel):
    password: str

class SubjectBase(BaseModel):
    name: str
    slug: str
    classLevelId: int

class SubjectResponse(SubjectBase):
    id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        orm_mode = True

class ChapterBase(BaseModel):
    name: str
    slug: str
    subjectId: int
    paperId: Optional[int] = None

class ChapterResponse(ChapterBase):
    id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        orm_mode = True

class QuestionBase(BaseModel):
    subjectId: int
    chapterId: Optional[int] = None
    paperId: Optional[int] = None
    topicId: Optional[int] = None
    questionText: str
    optionA: str
    optionB: str
    optionC: str
    optionD: str
    correctOption: str
    explanation: Optional[str] = None
    difficulty: DifficultyEnum = DifficultyEnum.MEDIUM
    boardId: Optional[int] = None
    source: Optional[str] = None
    boardName: Optional[str] = None
    year: Optional[int] = None
    setName: Optional[str] = None

class QuestionResponse(QuestionBase):
    id: int
    createdAt: datetime

    class Config:
        orm_mode = True

class ExamSubmitAnswer(BaseModel):
    questionId: str
    selectedOption: Optional[str] = None
    timeSpent: Optional[int] = None

class ExamSubmitRequest(BaseModel):
    examSlug: str
    examName: str
    backUrl: Optional[str] = None
    mode: str = "exam"
    answers: List[ExamSubmitAnswer]
    timeTaken: Optional[int] = None

class ExamAttemptResponse(BaseModel):
    id: int
    examSlug: str
    examName: str
    score: int
    totalQuestions: int
    correctAnswers: int
    wrongAnswers: int
    skippedAnswers: int
    percentage: float
    timeTaken: Optional[int] = None
    createdAt: datetime

    class Config:
        orm_mode = True
