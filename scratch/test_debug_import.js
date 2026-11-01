const msg = "Could not find the 'kamus_id' column of 'soal' in the schema cache";
const match = msg.match(/Could not find the '([^']+)' column/);
console.log('Match result:', match);
if (match) {
  console.log('Column extracted:', match[1]);
}
