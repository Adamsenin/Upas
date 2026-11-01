import json

with open(r'C:\Users\User\.gemini\antigravity\brain\661ca915-c395-4be9-a753-27beb65c3a1f\.system_generated\logs\transcript.jsonl', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        idx = data.get('step_index')
        if idx in range(1075, 1085):
            print(f"Step {idx}: Type={data.get('type')}, Source={data.get('source')}")
            if data.get('content'):
                print("  Content:", str(data.get('content'))[:180].replace('\n', ' '))

