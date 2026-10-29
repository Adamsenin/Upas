with open('guru/editor.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
'''        <div class="col-6 col-md-2">
          <label for="kuis-kkm" class="form-label fw-bold">Nilai KKM</label>
          <input type="number" class="form-control border-2 border-dark" id="kuis-kkm" value="75" min="0" max="100">
        </div>
        <div class="col-6 col-md-2">
          <label for="kuis-durasi" class="form-label fw-bold">Durasi (menit)</label>
          <input type="number" class="form-control border-2 border-dark" id="kuis-durasi" value="15" min="1" max="180">
        </div>''',
'''        <div class="col-12 col-sm-6 col-md-2">
          <label for="kuis-kkm" class="form-label fw-bold">Nilai KKM</label>
          <input type="number" class="form-control border-2 border-dark" id="kuis-kkm" value="75" min="0" max="100">
        </div>
        <div class="col-12 col-sm-6 col-md-2">
          <label for="kuis-durasi" class="form-label fw-bold">Durasi (menit)</label>
          <input type="number" class="form-control border-2 border-dark" id="kuis-durasi" value="15" min="1" max="180">
        </div>'''
)

with open('guru/editor.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated guru/editor.html!')

