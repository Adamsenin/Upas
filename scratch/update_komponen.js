import fs from 'fs';

let css = fs.readFileSync('assets/css/komponen.css', 'utf8');

const replacement = `/* ==========================================================================
   17. PENGHALUSAN UI/UX PRO MAX - DASBOR GURU & TABEL DATA
   ========================================================================== */
#dasborTab {
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch !important;
  white-space: nowrap !important;
  background: var(--n-santan, #FFFDF7) !important;
  border: 2.5px solid var(--n-rimba, #1B3A2F) !important;
  border-radius: 20px !important;
  box-shadow: 0 6px 16px rgba(27, 58, 47, 0.08) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

#dasborTab .nav-link {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: 14px !important;
  border: 2px solid transparent !important;
  color: var(--n-rimba, #1B3A2F) !important;
  font-family: var(--font-heading) !important;
  font-weight: 700 !important;
  padding: 0.6rem 1.25rem !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  background: transparent;
}

#dasborTab .nav-link:hover:not(.active) {
  background: rgba(35, 112, 138, 0.08) !important;
  border-color: rgba(35, 112, 138, 0.25) !important;
  transform: translateY(-2px);
}

#dasborTab .nav-link.active {
  background: var(--n-rimba, #1B3A2F) !important;
  color: #FFFFFF !important;
  border: 2px solid var(--n-rimba, #1B3A2F) !important;
  box-shadow: 0 4px 10px rgba(27, 58, 47, 0.22) !important;
  transform: translateY(-2px);
}

#dasborTab .nav-link.active svg {
  stroke: #F2A541 !important;
}

/* Tabel Data Guru Bersih & Berkontras Tinggi */
.table-responsive {
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(27, 58, 47, 0.2);
  background: #FFFFFF;
}

.table {
  margin-bottom: 0;
  color: var(--n-rimba, #1B3A2F);
}

.table thead th {
  background-color: var(--n-lontar-gelap, #F1E4CB);
  color: var(--n-rimba, #1B3A2F);
  font-family: var(--font-heading);
  font-weight: 800;
  border-bottom: 2px solid var(--n-rimba, #1B3A2F);
  padding: 0.85rem 1rem;
}

.table tbody tr:hover {
  background-color: rgba(242, 165, 65, 0.08);
}

.table tbody td {
  padding: 0.85rem 1rem;
  vertical-align: middle;
}
`;

if (css.includes('#dasborTab {')) {
  css = css.replace(/#dasborTab \{[\s\S]*?white-space: nowrap;\s*\}/, replacement);
  fs.writeFileSync('assets/css/komponen.css', css, 'utf8');
  console.log('komponen.css updated successfully!');
} else {
  console.log('Target not found in komponen.css');
}

