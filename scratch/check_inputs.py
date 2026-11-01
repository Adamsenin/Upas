import json

with open(r'C:\Users\User\.gemini\antigravity\brain\661ca915-c395-4be9-a753-27beb65c3a1f\.system_generated\logs\transcript.jsonl', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            step = data.get('step_index')
            content = data.get('content', '')[:100].replace('\n', ' ')
            media = data.get('media')
            print(f"Step {step}: {content} (media: {media})")

