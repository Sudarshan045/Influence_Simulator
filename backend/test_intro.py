import json
from app.services.llm_enrich import enrich_idea_meta

def test_enrich(idea, state, prob):
    print(f"\n=================== TESTING: {idea} ===================")
    res = enrich_idea_meta(idea, current_state=state, revival_probability=prob)
    print(json.dumps(res, indent=2))

test_enrich("Floppy disk", "Revival", 72.5)
test_enrich("Tamagotchi", "Revival", 68.0)
test_enrich("Stoicism", "Growth", 85.0)
