with open('assets/css/komponen.css', 'r', encoding='utf-8') as f:
    text = f.read()

rules = '''
/* Aturan Responsif Mobile untuk Modal & Dasbor Guru */
#modalPengaturanGame .modal-dialog,
.modal-dialog {
  max-height: calc(100dvh - 32px);
  margin: 16px auto;
}

#modalPengaturanGame .modal-content,
.modal-content {
  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
}

#modalPengaturanGame .modal-body,
.modal-body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

#dasborTab {
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch !important;
  white-space: nowrap !important;
  padding-bottom: 0.5rem !important;
}

#dasborTab .nav-link {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
'''

if '#dasborTab' not in text:
    text += rules
    with open('assets/css/komponen.css', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Added modal and dasborTab rules to komponen.css!')
else:
    print('Rules already present.')

