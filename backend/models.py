from datetime import date, datetime
from typing import Optional
from sqlmodel import SQLModel, Field
 
 
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    age: Optional[int] = None
    cycle_length: Optional[int] = None  # None means irregular
    condition: str = "none"  # "none", "pcos", "pcod", "endometriosis", "irregular"
    goal: str = "general_health"  # "fitness", "symptom_management", "general_health"
    last_period_date: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
 
 
class DailyLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    log_date: date
    energy: int  # 1-5
    pain_score: int  # 1-5
    sleep_quality: int  # 1-5
    flow_heaviness: Optional[int] = None  # 1-5, only during period days
    symptoms: str = ""  # comma-separated, e.g. "cramps,bloating,fatigue"
    mood: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
 