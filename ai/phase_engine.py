def estimate_phase(cycle_day, symptoms, condition):

    # ✅ Regular cycle logic
    if condition == "None":
        if 1 <= cycle_day <= 5:
            return {"phase": "menstrual", "confidence": 0.9}
        elif 6 <= cycle_day <= 13:
            return {"phase": "follicular", "confidence": 0.9}
        elif 14 <= cycle_day <= 16:
            return {"phase": "ovulatory", "confidence": 0.9}
        else:
            return {"phase": "luteal", "confidence": 0.9}

    # 🔥 PCOS / Irregular logic (basic scoring)
    score = 0

    if "cramps" in symptoms:
        score += 1
    if "bloating" in symptoms:
        score += 1
    if "fatigue" in symptoms:
        score += 1
    if "mood swings" in symptoms:
        score += 1

    if score >= 3:
        return {"phase": "luteal", "confidence": 0.5}
    elif score == 2:
        return {"phase": "follicular", "confidence": 0.4}
    else:
        return {"phase": "ovulatory", "confidence": 0.3}