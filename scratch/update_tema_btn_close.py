with open('assets/css/tema.css', 'r', encoding='utf-8') as f:
    text = f.read()

rule = '''
.btn-close {
  min-width: 48px !important;
  min-height: 48px !important;
  padding: 12px !important;
}
'''

if '.btn-close' not in text:
    text += rule
    with open('assets/css/tema.css', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Added .btn-close rule to tema.css')
else:
    print('.btn-close already in tema.css')

