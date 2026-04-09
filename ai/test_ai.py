from ai.recommender import get_recommendations

result = get_recommendations(
    phase="luteal",
    condition="PCOS",
    symptoms=["bloating", "fatigue"],
    pain_score=3
)

print(result)