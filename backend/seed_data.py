"""
Seed script — populates CycleSync SQLite DB with two demo users and 8 weeks of logs.
Run from the repo root:
    python backend/seed_data.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
from datetime import date, timedelta
from sqlmodel import Session, SQLModel

from backend.database import engine
from backend.models import User, DailyLog


def create_tables():
    SQLModel.metadata.create_all(engine)


def date_range(start: date, days: int):
    return [start + timedelta(days=i) for i in range(days)]


def seed():
    create_tables()

    today = date.today()
    eight_weeks_ago = today - timedelta(weeks=8)

    with Session(engine) as session:
        # ── User 1: Ananya — PCOS, irregular cycle ─────────────────────────────
        ananya = User(
            name="Ananya",
            age=26,
            cycle_length=None,  # irregular
            condition="pcos",
            goal="symptom_management",
            last_period_date=today - timedelta(days=32),
        )
        session.add(ananya)
        session.flush()  # get ananya.id

        ananya_period_days = set(range(0, 5))    # days 0–4 of the 8-week window = period
        ananya_luteal_days = set(range(46, 56))  # simulated luteal window later

        for i, log_date in enumerate(date_range(eight_weeks_ago, 56)):
            is_period = i in ananya_period_days
            is_luteal = i in ananya_luteal_days

            if is_period:
                energy = random.randint(1, 2)
                pain_score = random.randint(3, 5)
                sleep_quality = random.randint(1, 3)
                flow_heaviness = random.randint(3, 5)
                symptoms = "cramps,bloating,fatigue,lower back pain"
                mood = random.choice(["low", "exhausted", "crampy"])
            elif is_luteal:
                energy = random.randint(2, 3)
                pain_score = random.randint(2, 4)
                sleep_quality = random.randint(2, 3)
                flow_heaviness = None
                symptoms = random.choice([
                    "bloating,mood_swings,fatigue",
                    "mood_swings,acne,food_cravings",
                    "bloating,fatigue,acne",
                    "food_cravings,mood_swings,breast_tenderness",
                ])
                mood = random.choice(["irritable", "anxious", "low", "emotional"])
            else:
                energy = random.randint(2, 4)
                pain_score = random.randint(1, 3)
                sleep_quality = random.randint(2, 4)
                flow_heaviness = None
                symptoms = random.choice([
                    "acne,fatigue",
                    "fatigue",
                    "bloating",
                    "acne",
                    "",
                    "fatigue,mood_swings",
                ])
                mood = random.choice(["okay", "neutral", "tired", "hopeful", None])

            log = DailyLog(
                user_id=ananya.id,
                log_date=log_date,
                energy=energy,
                pain_score=pain_score,
                sleep_quality=sleep_quality,
                flow_heaviness=flow_heaviness,
                symptoms=symptoms,
                mood=mood,
            )
            session.add(log)

        # ── User 2: Priya — No condition, regular 28-day cycle ─────────────────
        priya = User(
            name="Priya",
            age=29,
            cycle_length=28,
            condition="none",
            goal="fitness",
            last_period_date=today - timedelta(days=14),  # currently ovulatory
        )
        session.add(priya)
        session.flush()

        priya_period_days = set(range(0, 5))     # days 0–4 = last period
        priya_ovulatory_days = set(range(13, 17))  # mid-cycle high energy

        for i, log_date in enumerate(date_range(eight_weeks_ago, 56)):
            is_period = i in priya_period_days or (i in range(28, 33))  # two period windows
            is_ovulatory = i in priya_ovulatory_days or (i in range(41, 45))

            if is_period:
                energy = random.randint(2, 3)
                pain_score = random.randint(1, 2)
                sleep_quality = random.randint(3, 4)
                flow_heaviness = random.randint(2, 3)
                symptoms = random.choice([
                    "mild_cramps,bloating",
                    "mild_cramps",
                    "bloating",
                ])
                mood = random.choice(["okay", "tired", "mellow"])
            elif is_ovulatory:
                energy = random.randint(4, 5)
                pain_score = 1
                sleep_quality = random.randint(4, 5)
                flow_heaviness = None
                symptoms = random.choice(["", "mild mid-cycle pain"])
                mood = random.choice(["great", "energetic", "focused", "happy"])
            else:
                energy = random.randint(3, 5)
                pain_score = 1
                sleep_quality = random.randint(3, 5)
                flow_heaviness = None
                symptoms = random.choice(["", "", "bloating", "mild_cramps"])
                mood = random.choice(["good", "energetic", "motivated", None])

            log = DailyLog(
                user_id=priya.id,
                log_date=log_date,
                energy=energy,
                pain_score=pain_score,
                sleep_quality=sleep_quality,
                flow_heaviness=flow_heaviness,
                symptoms=symptoms,
                mood=mood,
            )
            session.add(log)

        session.commit()
        print("✅ Seed complete!")
        print(f"   Ananya (PCOS, irregular)  → user_id={ananya.id}")
        print(f"   Priya  (none, 28-day)     → user_id={priya.id}")


if __name__ == "__main__":
    seed()