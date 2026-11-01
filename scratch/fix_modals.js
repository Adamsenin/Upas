import fs from 'fs';

let ed = fs.readFileSync('guru/editor.html', 'utf8');
ed = ed.replace(/id="modalKamusEditor"[^>]*>[\r\n\s]*<div class="modal-dialog modal-dialog-centered"/, 'id="modalKamusEditor" tabindex="-1" aria-labelledby="labelKamusEditor" aria-hidden="true">\r\n    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"');
fs.writeFileSync('guru/editor.html', ed, 'utf8');

let km = fs.readFileSync('guru/kamus.html', 'utf8');
km = km.replace(/id="modalKamus"[^>]*>[\r\n\s]*<div class="modal-dialog modal-dialog-centered"/, 'id="modalKamus" tabindex="-1" aria-labelledby="modalKamusLabel" aria-hidden="true">\r\n    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"');
fs.writeFileSync('guru/kamus.html', km, 'utf8');

console.log('Scrollable modals applied to editor.html and kamus.html!');

