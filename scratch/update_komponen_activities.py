with open('assets/css/komponen.css', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update slider-suhu-kupas thumb
text = text.replace(
'''.slider-suhu-kupas::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 4px solid var(--kupas-forest-dark);
  box-shadow: var(--kupas-bayangan-sm);
  cursor: grab;
  transition: transform 0.1s ease;
}

.slider-suhu-kupas::-moz-range-thumb {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 4px solid var(--kupas-forest-dark);
  box-shadow: var(--kupas-bayangan-sm);
  cursor: grab;
}''',
'''.slider-suhu-kupas::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 4px solid var(--kupas-forest-dark);
  box-shadow: var(--kupas-bayangan-sm);
  cursor: grab;
  transition: transform 0.1s ease;
}

.slider-suhu-kupas::-moz-range-thumb {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 4px solid var(--kupas-forest-dark);
  box-shadow: var(--kupas-bayangan-sm);
  cursor: grab;
}'''
)

# 2. Update arena-radial-rantai on <480px
text = text.replace(
'''@media (max-width: 480px) {
  .arena-radial-rantai {
    max-width: 350px;
    min-height: 370px;
  }
  .radial-center-hub {
    width: 75px;
    height: 75px;
  }
  .radial-slot-drop {
    width: 76px;
    height: 94px;
    border-radius: var(--kupas-radius-md);
  }''',
'''@media (max-width: 480px) {
  .arena-radial-rantai {
    max-width: 100%;
    width: 100%;
    min-height: 320px;
  }
  .radial-center-hub {
    width: clamp(60px, 18vw, 75px);
    height: clamp(60px, 18vw, 75px);
  }
  .radial-slot-drop {
    width: clamp(62px, 19vw, 76px);
    height: clamp(78px, 24vw, 94px);
    border-radius: var(--kupas-radius-md);
  }'''
)

with open('assets/css/komponen.css', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated komponen.css for slider and radial arena!')

