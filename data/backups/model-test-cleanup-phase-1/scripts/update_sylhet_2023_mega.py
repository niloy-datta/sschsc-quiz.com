import json
import os

def recursive_update(data, updated_map, counter):
    if isinstance(data, dict):
        qid = data.get("id")
        if qid in updated_map:
            up_q = updated_map[qid]
            data["questionText"] = up_q["text"]
            if "options" in up_q and len(up_q["options"]) >= 4:
                data["optionA"] = up_q["options"][0]
                data["optionB"] = up_q["options"][1]
                data["optionC"] = up_q["options"][2]
                data["optionD"] = up_q["options"][3]
            if "image" in up_q:
                data["image"] = up_q["image"]
            counter[0] += 1
        for val in data.values():
            recursive_update(val, updated_map, counter)
    elif isinstance(data, list):
        for item in data:
            recursive_update(item, updated_map, counter)

def main():
    questions_path = r"c:\Users\Niloy Chandra\Documents\dev-quiz-dashboard\public\questions\physics\sylhet-2023.json"
    mega_path = r"c:\Users\Niloy Chandra\Documents\dev-quiz-dashboard\public\quiz-data\ssc\physics.json"
    
    if not os.path.exists(questions_path):
        print(f"Error: {questions_path} does not exist.")
        return
    if not os.path.exists(mega_path):
        print(f"Error: {mega_path} does not exist.")
        return
        
    with open(questions_path, "r", encoding="utf-8") as f:
        unicode_questions = json.load(f)
        
    with open(mega_path, "r", encoding="utf-8") as f:
        mega_data = json.load(f)
        
    # Create a map of updated questions by ID
    updated_map = {q["id"]: q for q in unicode_questions}
    
    counter = [0]
    recursive_update(mega_data, updated_map, counter)
                        
    with open(mega_path, "w", encoding="utf-8") as f:
        json.dump(mega_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully updated {counter[0]} question entries in {mega_path}.")

if __name__ == "__main__":
    main()

