const fs = require('fs');
const content = fs.readFileSync('C:/Users/STEEL LEGEND/.gemini/antigravity/brain/b617f35c-d6a0-4af3-aa76-707c4744d937/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = content.split('\n');
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.step_index >= 3550 && obj.step_index <= 3565) {
      console.log(obj.step_index, obj.source, obj.type, (obj.content || '').slice(0, 80), obj.media);
    }
  } catch(e){}
}

