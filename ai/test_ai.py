from ai.recommender import get_recommendations

result = get_recommendations(
    phase="luteal",
    condition="PCOS",
    symptoms=["headache", "cramps"],
    pain_score=7
)

print(result)