import json

with open(r'C:\Users\User\.gemini\antigravity\brain\661ca915-c395-4be9-a753-27beb65c3a1f\.system_generated\logs\transcript.jsonl', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        idx = data.get('step_index')
        if idx in [1418, 1419, 1420]:
            print(f"Step {idx}: Type={data.get('type')}, Source={data.get('source')}")
            print("  Keys:", list(data.keys()))
            if data.get('media'):
                print("  Media:", data.get('media'))
            print("  Content snippet:", str(data.get('content'))[:200])

