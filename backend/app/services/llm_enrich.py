import os
import json
import random
import re
from datetime import datetime

# We will try to import Groq and httpx but handle missing libraries gracefully
try:
    from groq import Groq
except ImportError:
    Groq = None

try:
    import httpx
except ImportError:
    httpx = None

import urllib.parse

def _determine_category(idea_name: str, text: str) -> str:
    category = "General"
    text_to_analyze = (idea_name + " " + text).lower()
    
    category_keywords = {
        "Technology": ["tech", "computer", "digital", "software", "network", "ai", "artificial", "blockchain", "crypto", "data", "robot", "internet", "machine", "virtual", "cyber", "development"],
        "Philosophy": ["philosophy", "philosophical", "ethics", "logic", "existential", "stoic", "morals", "belief", "thought", "mindset", "theory", "wisdom"],
        "Wellness": ["fitness", "health", "wellness", "diet", "mental", "meditation", "breathwork", "yoga", "exercise", "sleep", "mindfulness", "therapy"],
        "Aesthetics": ["style", "art", "music", "fashion", "aesthetic", "creative", "design", "interior", "look", "visual", "retro", "design"],
        "Social": ["social", "community", "culture", "people", "public", "movement", "activism", "society", "political", "civil"],
        "Environment": ["nature", "environment", "climate", "green", "sustainable", "eco", "renewable", "conservation", "earth", "recycling"],
        "Finance": ["money", "finance", "crypto", "investment", "market", "wealth", "saving", "stock", "economic", "budget", "business"],
        "Spirituality": ["spiritual", "god", "soul", "buddhism", "astrology", "belief", "zen", "sacred", "karma"]
    }
    
    for cat, keywords in category_keywords.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_to_analyze):
                return cat
    return category

def _get_wikipedia_summary(idea_name: str) -> dict:
    if not httpx:
        return None
        
    search_url = "https://en.wikipedia.org/w/api.php"
    search_params = {
        "action": "opensearch",
        "search": idea_name,
        "limit": 1,
        "namespace": 0,
        "format": "json"
    }
    
    headers = {
        "User-Agent": "InfluenceSimulator/2.4 (contact: user@example.com)"
    }
    
    try:
        r = httpx.get(search_url, params=search_params, headers=headers)
        if r.status_code != 200:
            return None
        
        data = r.json()
        if not data or len(data) < 2 or not data[1]:
            return None
        
        title = data[1][0]
        
        query_params = {
            "action": "query",
            "prop": "extracts|description",
            "exintro": True,
            "explaintext": True,
            "titles": title,
            "format": "json"
        }
        r_query = httpx.get(search_url, params=query_params, headers=headers)
        if r_query.status_code == 200:
            pages = r_query.json().get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                extract = page_data.get("extract", "")
                
                # Avoid disambiguation pages
                if "may refer to:" in extract.lower() or "refer to:" in extract.lower():
                    return None
                    
                return {
                    "title": page_data.get("title", title),
                    "description": page_data.get("description", "A modern cultural and intellectual concept."),
                    "extract": extract,
                }
    except Exception as e:
        print(f"Wikipedia search failed for {idea_name}: {e}")
    return None

def _generate_fallback_meta(idea_name: str, wiki_data: dict = None, current_state: str = None, revival_probability: float = None) -> dict:
    current_year = datetime.now().year
    
    # 1. Determine Category
    wiki_desc = wiki_data.get("description", "") if wiki_data else ""
    wiki_extract = wiki_data.get("extract", "") if wiki_data else ""
    category = _determine_category(idea_name, wiki_desc + " " + wiki_extract)
            
    # 2. Meaning & Description
    if wiki_data and wiki_data.get("extract"):
        extract = wiki_data["extract"]
        sentences = [s.strip() for s in re.split(r'\.\s+', extract) if s.strip()]
        if len(sentences) >= 2:
            meaning = sentences[0]
            if not meaning.endswith('.'):
                meaning += '.'
            description = " ".join(sentences[1:3])
            if not description.endswith('.'):
                description += '.'
        else:
            meaning = extract
            if not meaning.endswith('.'):
                meaning += '.'
            description = f"An analytical exploration of {idea_name} and its cultural impact."
    else:
        meaning = f"{idea_name} is a contemporary conceptual trend and practice gaining traction in modern discourse."
        description = f"It represents a shifting behavior or design pattern that influences how individuals engage with lifestyle, technology, and communities today."

    # 3. Origin Year
    origin_year = None
    if wiki_data and wiki_data.get("extract"):
        # Find 4-digit numbers starting with 17, 18, 19, or 20
        years = [int(y) for y in re.findall(r'\b(17\d\d|18\d\d|19\d\d|20\d\d)\b', wiki_data["extract"])]
        if years:
            origin_year = min(years)
            
    if not origin_year:
        # Generate a realistic origin year based on category
        random.seed(idea_name)  # deterministic based on name
        if category == "Technology":
            origin_year = random.randint(2012, 2021)
        elif category == "Philosophy":
            origin_year = random.randint(1980, 2005)
        elif category in ["Wellness", "Environment"]:
            origin_year = random.randint(2010, 2018)
        else:
            origin_year = random.randint(2014, 2022)
            
    # 4. Historical Context
    if wiki_data and wiki_data.get("extract"):
        historical_context = f"Initially emerging in public record, {idea_name} represents a key point of evolution. Wikipedia records describe it as: {wiki_data['extract'][:200]}..."
    else:
        historical_context = f"The rise of {idea_name} reflects changing patterns of modern lifestyle and social values. Starting as a niche idea discussed in online forums and local groups, it has gradually entered mainstream conversation as people seek fresh perspectives and solutions to current socio-economic challenges."

    # 5. Year Data (Timeline for chart) and Key Events (Milestones)
    states_list = ["Birth", "Growth", "Peak", "Decline", "Dormancy", "Revival"]
    if current_state in states_list:
        max_idx = states_list.index(current_state)
        active_states = states_list[:max_idx + 1]
    else:
        active_states = states_list

    num_points = max(5, len(active_states))

    if current_year - origin_year >= num_points - 1:
        years_to_plot = []
        for i in range(num_points):
            yr = origin_year + int(round(i * (current_year - origin_year) / (num_points - 1)))
            years_to_plot.append(yr)
    else:
        years_to_plot = list(range(current_year - num_points + 1, current_year + 1))

    year_data = []
    for i, yr in enumerate(years_to_plot):
        if len(years_to_plot) > 1:
            state_idx = int(i * (len(active_states) - 1) / (len(years_to_plot) - 1) + 0.5)
        else:
            state_idx = 0
        state = active_states[state_idx]
        
        # Determine score deterministically based on seed
        random.seed(f"{idea_name}-{yr}")
        if state == "Birth":
            score = random.randint(15, 30)
        elif state == "Growth":
            score = random.randint(35, 60)
        elif state == "Peak":
            score = random.randint(75, 95)
        elif state == "Decline":
            score = random.randint(45, 70)
        elif state == "Dormancy":
            score = random.randint(10, 30)
        else: # Revival
            score = random.randint(55, 85)

        # Anchor current year score to predicted revival_probability if provided
        if yr == current_year and revival_probability is not None:
            score = int(round(revival_probability))
            
        year_data.append({
            "year": yr,
            "state": state,
            "score": score
        })

    # Narrative templates for milestones matching states
    STATE_EVENT_TEMPLATES = {
        "Birth": "First major conceptual emergence and initial adoption of {idea_name}.",
        "Growth": "Widespread adoption begins as {idea_name} gains significant traction and community interest.",
        "Peak": "Mainstream peak; {idea_name} achieves peak cultural influence and commercial presence.",
        "Decline": "Interest begins to cool down as new alternatives start to replace {idea_name}.",
        "Dormancy": "{idea_name} enters a quiet phase, preserved mainly by enthusiast circles and legacy users.",
        "Revival": "A modern retro revival and renewed appreciation of {idea_name} in contemporary culture."
    }

    seen_states = set()
    key_events = []
    for entry in year_data:
        st = entry["state"]
        yr = entry["year"]
        if st not in seen_states:
            seen_states.add(st)
            template = STATE_EVENT_TEMPLATES.get(st, "Significant milestone for {idea_name}.")
            key_events.append({
                "year": yr,
                "event": template.format(idea_name=idea_name)
            })
    
    key_events = sorted(key_events, key=lambda x: x["year"])
    
    return {
        "category": category,
        "description": description,
        "meaning": meaning,
        "origin_year": origin_year,
        "historical_context": historical_context,
        "key_events": key_events,
        "year_data": year_data
    }

def enrich_idea_meta(idea_name: str, current_state: str = None, revival_probability: float = None) -> dict:
    idea_name = idea_name.strip()
    if not idea_name:
        return None

    # Step 1: Try Groq API first if key is present
    api_key = os.getenv("GROQ_API_KEY")
    if api_key and Groq:
        client = Groq(api_key=api_key)
        
        prompt = f"""
You are an expert cultural analyst and historian. Analyze the concept/idea: "{idea_name}".
Provide a JSON response with the following exact keys:
{{
  "category": "One of: Technology, Philosophy, Wellness, Lifestyle, Aesthetics, Social, Spirituality, Work, Culture, Environment, Health, Finance, Social Media, etc.",
  "description": "A 1-2 sentence high-level description of what this idea is and its cultural impact.",
  "meaning": "A 1-2 sentence specific definition of the idea.",
  "origin_year": 2020, // The approximate year this idea gained mainstream traction or was founded (integer)
  "historical_context": "2-3 sentences explaining the history and rise of this idea.",
  "key_events": [
    {{"year": 2020, "event": "A major milestone event for this idea"}},
    {{"year": 2021, "event": "Another milestone"}}
  ],
  "year_data": [
    {{"year": 2020, "state": "Birth", "score": 20}},
    {{"year": 2021, "state": "Growth", "score": 40}},
    {{"year": 2022, "state": "Peak", "score": 85}}
  ] // Generate a plausible timeline up to the current year with states (Birth, Growth, Peak, Decline, Dormancy, Revival) and scores (0-100). Minimum 5 items.
}}
Output ONLY valid JSON, nothing else.
"""
        models_to_try = [
            "llama-3.3-70b-versatile",
            "llama3-70b-8192",
            "llama-3.1-8b-instant"
        ]
        
        for model in models_to_try:
            try:
                completion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1000,
                    response_format={"type": "json_object"}
                )
                content = completion.choices[0].message.content
                return json.loads(content)
            except Exception as e:
                print(f"Groq API model {model} failed: {e}")
                
    # Step 2: If Groq failed, try Wikipedia search
    print(f"Attempting Wikipedia enrichment for {idea_name}...")
    wiki_data = _get_wikipedia_summary(idea_name)
    
    # Step 3: Run the smart fallback generator
    return _generate_fallback_meta(idea_name, wiki_data, current_state, revival_probability)
