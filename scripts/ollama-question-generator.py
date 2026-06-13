#!/usr/bin/env python3
"""
Ollama-powered MCQ Question Generator
Generates Bengali science MCQ questions with Easy/Medium/Hard difficulty levels
Uses local Ollama (deepseek-coder or llama3 or qwen2.5) model for AI generation
"""

import json
import random
import requests
import time
import os
from typing import List, Dict, Optional

# ─── Configuration ───────────────────────────────────────────────
OLLAMA_API = "http://localhost:11434/api/generate"
MODEL_NAME = "deepseek-coder:6.7b"  # try qwen2.5:7b if deepseek fails
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data", "hsc", "science", "physics", "1st-paper", "ai-generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Subject & Chapter Config ───────────────────────────────────
SUBJECTS = {
    "physics-1st-paper": {
        "name": "Physics 1st Paper",
        "bn_name": "পদার্থবিজ্ঞান ১ম পত্র",
        "chapters": [
            ("chapter-1", "ভৌতজগত ও পরিমাপ", "Physical World and Measurement"),
            ("chapter-2", "ভেক্টর", "Vectors"),
            ("chapter-3", "গতিবিদ্যা", "Dynamics"),
            ("chapter-4", "নিউটনিয়ান বলবিদ্যা", "Newtonian Mechanics"),
            ("chapter-5", "কাজ, শক্তি ও ক্ষমতা", "Work, Energy and Power"),
            ("chapter-6", "মহাকর্ষ ও অভিকর্ষ", "Gravitation and Gravity"),
            ("chapter-7", "স্থিতিস্থাপকতা", "Elasticity"),
            ("chapter-8", "তরঙ্গ ও শব্দ", "Waves and Sound"),
            ("chapter-9", "গোলীয় দর্পণ ও লেন্স", "Spherical Mirror and Lens"),
            ("chapter-10", "আলোর প্রতিফলন", "Reflection of Light"),
            ("chapter-11", "আলোর প্রতিসরণ", "Refraction of Light"),
        ]
    }
}

DIFFICULTY_PROMPTS = {
    "easy": "Generate an EASY-level MCQ. The question should be straightforward, testing basic recall and simple understanding.",
    "medium": "Generate a MEDIUM-level MCQ. The question should require some analysis or application of concepts.",
    "hard": "Generate a HARD-level MCQ. The question should require deep understanding, multi-step reasoning, or problem-solving.",
}

def call_ollama(prompt: str, max_retries: int = 3) -> Optional[str]:
    """Call Ollama API with retry logic"""
    for attempt in range(max_retries):
        try:
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.7,
                "max_tokens": 512,
            }
            resp = requests.post(OLLAMA_API, json=payload, timeout=60)
            if resp.status_code == 200:
                return resp.json().get("response", "")
            print(f"[Retry {attempt+1}] HTTP {resp.status_code}")
        except Exception as e:
            print(f"[Retry {attempt+1}] Error: {e}")
            time.sleep(2)
    return None

def generate_mcq(subject: str, chapter_slug: str, chapter_bn: str, chapter_en: str, difficulty: str) -> Optional[Dict]:
    """Generate a single MCQ using Ollama"""
    
    prompt = f"""You are a Bengali science MCQ generator for HSC level.

Subject: {subject} ({chapter_bn} / {chapter_en})
Difficulty: {difficulty.upper()}
{DIFFICULTY_PROMPTS[difficulty]}

IMPORTANT RULES:
1. Question MUST be in Bengali
2. Options (A/B/C/D) MUST be in Bengali
3. Provide the correct answer and explanation in Bengali
4. Question must be relevant to {chapter_bn}
5. Difficulty level MUST be {difficulty}

Output ONLY valid JSON in this exact format:
{{
  "question": "বাংলায় প্রশ্ন",
  "options": {{
    "A": "বিকল্প A",
    "B": "বিকল্প B",
    "C": "বিকল্প C",
    "D": "বিকল্প D"
  }},
  "correctIndex": 0,
  "explanation": "বাংলায় ব্যাখ্যা"
}}

(Note: correctIndex is 0 for A, 1 for B, 2 for C, 3 for D)
"""

    response = call_ollama(prompt)
    if not response:
        return None

    # Try to parse JSON from response
    try:
        # Find JSON block
        start = response.find("{")
        end = response.rfind("}") + 1
        if start >= 0 and end > start:
            json_str = response[start:end]
            data = json.loads(json_str)
            
            # Normalize keys
            options = data.get("options", {})
            if isinstance(options, dict):
                opt_list = [
                    options.get("A", options.get("a", "")),
                    options.get("B", options.get("b", "")),
                    options.get("C", options.get("c", "")),
                    options.get("D", options.get("d", "")),
                ]
            else:
                opt_list = ["", "", "", ""]

            return {
                "question": data.get("question", ""),
                "options": opt_list,
                "answerIndex": data.get("correctIndex", 0),
                "explanation": data.get("explanation", ""),
                "chapter": chapter_slug,
                "difficulty": difficulty,
                "subject": subject,
            }
    except (json.JSONDecodeError, Exception) as e:
        print(f"  [Parse Error] {e}")
        return None
    
    return None

def generate_and_save_batch(subject: str, chapter_slug: str, chapter_bn: str, chapter_en: str, count_per_difficulty: int = 5):
    """Generate MCQs for a chapter and save to file"""
    
    print(f"\n{'='*60}")
    print(f"Generating for: {chapter_bn} ({chapter_slug})")
    print(f"{'='*60}")
    
    all_questions = []
    
    for difficulty in ["easy", "medium", "hard"]:
        print(f"\n  [{difficulty.upper()}] Generating {count_per_difficulty} questions...")
        success_count = 0
        attempt = 0
        
        while success_count < count_per_difficulty and attempt < count_per_difficulty * 3:
            attempt += 1
            print(f"    Attempt {attempt}...", end=" ")
            
            q = generate_mcq(subject, chapter_slug, chapter_bn, chapter_en, difficulty)
            if q and q["question"] and any(q["options"]):
                q["id"] = len(all_questions) + 1
                all_questions.append(q)
                success_count += 1
                print(f"✅ (#{success_count})")
            else:
                print("❌")
            
            time.sleep(0.5)  # Rate limiting

    # Save to file
    if all_questions:
        filename = f"{chapter_slug}.json"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        output = {
            "subject": subject,
            "chapter": chapter_slug,
            "chapter_bn": chapter_bn,
            "chapter_en": chapter_en,
            "total": len(all_questions),
            "difficulty_distribution": {
                "easy": sum(1 for q in all_questions if q["difficulty"] == "easy"),
                "medium": sum(1 for q in all_questions if q["difficulty"] == "medium"),
                "hard": sum(1 for q in all_questions if q["difficulty"] == "hard"),
            },
            "questions": all_questions,
        }
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Saved {len(all_questions)} questions to {filepath}")
    
    return all_questions

def main():
    """Main entry point"""
    print("🧠 Ollama MCQ Question Generator")
    print(f"   Model: {MODEL_NAME}")
    print(f"   Output: {OUTPUT_DIR}")
    
    # Check Ollama availability
    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=5)
        if resp.status_code != 200:
            print("❌ Ollama is not running. Please start Ollama first.")
            return
        models = resp.json().get("models", [])
        available = [m["name"] for m in models]
        print(f"✅ Ollama is running. Available models: {available}")
        
        if not any(MODEL_NAME in m for m in available):
            print(f"⚠️  {MODEL_NAME} not found. Available: {available}")
            print(f"   Run: ollama pull {MODEL_NAME}")
            # Try first available model
            if available:
                global MODEL_NAME
                MODEL_NAME = available[0]
                print(f"   Using: {MODEL_NAME}")
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        print("   Make sure Ollama is installed and running (ollama serve)")
        return
    
    total_generated = 0
    
    # Generate for Physics 1st Paper
    for subject_key, subject_data in SUBJECTS.items():
        for chapter_slug, chapter_bn, chapter_en in subject_data["chapters"]:
            questions = generate_and_save_batch(
                subject=subject_key,
                chapter_slug=chapter_slug,
                chapter_bn=chapter_bn,
                chapter_en=chapter_en,
                count_per_difficulty=3  # 3 easy + 3 medium + 3 hard = 9 per chapter
            )
            total_generated += len(questions)
    
    print(f"\n{'='*60}")
    print(f"✅ Generation Complete!")
    print(f"   Total Questions Generated: {total_generated}")
    print(f"   Output Directory: {OUTPUT_DIR}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()