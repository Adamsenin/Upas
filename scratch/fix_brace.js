import fs from 'fs';

const kuisPath = 'assets/js/kuis.js';
let content = fs.readFileSync(kuisPath, 'utf8');

content = content.replace(
`    const res = await simpanSoalAdaptif(supabase, payload, kunciJawaban ?? soalData.kunci, kolomTersedia, soalId);
    if (res.error) throw res.error;
    soalId = soalId || res.data?.[0]?.id;
  }

    if (kunciJawaban !== undefined && kunciJawaban !== null && soalId) {`,
`    const res = await simpanSoalAdaptif(supabase, payload, kunciJawaban ?? soalData.kunci, kolomTersedia, soalId);
    if (res.error) throw res.error;
    soalId = soalId || res.data?.[0]?.id;

    if (kunciJawaban !== undefined && kunciJawaban !== null && soalId) {`
);

fs.writeFileSync(kuisPath, content, 'utf8');
console.log('Fixed extra brace in simpanSoal.');

