import json

with open(r'C:\Users\User\.gemini\antigravity\brain\661ca915-c395-4be9-a753-27beb65c3a1f\.system_generated\logs\transcript.jsonl', encoding='utf-8') as f:
    lines = f.readlines()
    for l in lines[-5:]:
        data = json.loads(l)
        print(f"Step {data.get('step_index')}, Type: {data.get('type')}, Source: {data.get('source')}")
        if data.get('content'):
            print("  Content snippet:", data.get('content')[:150].replace('\n', ' '))

