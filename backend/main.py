import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from collections import Counter
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from backend.database import create_db_and_tables, get_session, engine
from backend.models import User, DailyLog
from ai.phase_engine import estimate_phase
from ai.recommender import get_recommendations

from pydantic import BaseModel

app = FastAPI(title="CycleSync API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# ─── Request schemas ───────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    age: Optional[int] = None
    cycle_length: Optional[int] = None
    condition: str = "none"
    goal: str = "general_health"
    last_period_date: Optional[date] = None


class DailyLogCreate(BaseModel):
    user_id: int
    log_date: date
    energy: int
    pain_score: int
    sleep_quality: int
    flow_heaviness: Optional[int] = None
    symptoms: str = ""
    mood: Optional[str] = None


class RecommendationRequest(BaseModel):
    user_id: int
    phase: str
    condition: str
    symptoms: List[str]
    pain_score: int


# ─── User routes ───────────────────────────────────────────────────────────────

@app.post("/users", response_model=dict, status_code=201)
def create_user(payload: UserCreate, session: Session = Depends(get_session)):
    user = User(**payload.dict())
    session.add(user)
    session.commit()
    session.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "age": user.age,
        "cycle_length": user.cycle_length,
        "condition": user.condition,
        "goal": user.goal,
        "last_period_date": str(user.last_period_date) if user.last_period_date else None,
        "created_at": str(user.created_at),
    }


@app.get("/users/{user_id}", response_model=dict)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return {
        "id": user.id,
        "name": user.name,
        "age": user.age,
        "cycle_length": user.cycle_length,
        "condition": user.condition,
        "goal": user.goal,
        "last_period_date": str(user.last_period_date) if user.last_period_date else None,
        "created_at": str(user.created_at),
    }


# ─── Log routes ────────────────────────────────────────────────────────────────

@app.post("/logs", response_model=dict, status_code=201)
def create_log(payload: DailyLogCreate, session: Session = Depends(get_session)):
    user = session.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {payload.user_id} not found")
    log = DailyLog(**payload.dict())
    session.add(log)
    session.commit()
    session.refresh(log)
    return {
        "id": log.id,
        "user_id": log.user_id,
        "log_date": str(log.log_date),
        "energy": log.energy,
        "pain_score": log.pain_score,
        "sleep_quality": log.sleep_quality,
        "flow_heaviness": log.flow_heaviness,
        "symptoms": log.symptoms,
        "mood": log.mood,
        "created_at": str(log.created_at),
    }


@app.get("/logs/{user_id}", response_model=list)
def get_logs(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    logs = session.exec(
        select(DailyLog)
        .where(DailyLog.user_id == user_id)
        .order_by(DailyLog.log_date.desc())
    ).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "log_date": str(log.log_date),
            "energy": log.energy,
            "pain_score": log.pain_score,
            "sleep_quality": log.sleep_quality,
            "flow_heaviness": log.flow_heaviness,
            "symptoms": log.symptoms,
            "mood": log.mood,
            "created_at": str(log.created_at),
        }
        for log in logs
    ]


@app.get("/logs/summary/{user_id}", response_model=dict)
def get_logs_summary(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    cutoff = date.today() - timedelta(days=90)
    logs = session.exec(
        select(DailyLog)
        .where(DailyLog.user_id == user_id)
        .where(DailyLog.log_date >= cutoff)
        .order_by(DailyLog.log_date.desc())
    ).all()

    if not logs:
        return {
            "user_id": user_id,
            "cycle_dates": [],
            "symptom_frequency": {},
            "average_pain": None,
            "average_energy": None,
            "total_logs": 0,
        }

    # Cycle dates = days where flow_heaviness was logged (period days)
    cycle_dates = [str(log.log_date) for log in logs if log.flow_heaviness is not None]

    # Symptom frequency
    all_symptoms = []
    for log in logs:
        if log.symptoms:
            all_symptoms.extend([s.strip() for s in log.symptoms.split(",") if s.strip()])
    symptom_frequency = dict(Counter(all_symptoms))

    avg_pain = round(sum(log.pain_score for log in logs) / len(logs), 2)
    avg_energy = round(sum(log.energy for log in logs) / len(logs), 2)

    return {
        "user_id": user_id,
        "cycle_dates": cycle_dates,
        "symptom_frequency": symptom_frequency,
        "average_pain": avg_pain,
        "average_energy": avg_energy,
        "total_logs": len(logs),
    }


# ─── Phase route ───────────────────────────────────────────────────────────────

@app.get("/phase/{user_id}", response_model=dict)
def get_phase(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    recent_log = session.exec(
        select(DailyLog)
        .where(DailyLog.user_id == user_id)
        .order_by(DailyLog.log_date.desc())
    ).first()

    recent_symptoms: List[str] = []
    if recent_log and recent_log.symptoms:
        recent_symptoms = [s.strip() for s in recent_log.symptoms.split(",") if s.strip()]

    result = estimate_phase(
        last_period_date=user.last_period_date,
        cycle_length=user.cycle_length,
        recent_symptoms=recent_symptoms,
        condition=user.condition,
    )
    return result


# ─── Recommendations route ─────────────────────────────────────────────────────

@app.post("/recommendations", response_model=dict)
def recommendations(payload: RecommendationRequest, session: Session = Depends(get_session)):
    user = session.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {payload.user_id} not found")

    result = get_recommendations(
        phase=payload.phase,
        condition=payload.condition,
        symptoms=payload.symptoms,
        pain_score=payload.pain_score,
    )
    return result