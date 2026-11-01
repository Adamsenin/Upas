import fs from 'fs';

let css = fs.readFileSync('assets/css/tema.css', 'utf8');

// Replace top @import
const oldImport = "@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800;900&display=swap');";
const newImport = `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Grandstander:wght@600;700;800;900&family=Atkinson+Hyperlegible:wght@400;700&family=Nunito:wght@600;700;800;900&display=swap');\r\n@import './token-nusantara.css';`;

if (css.includes(oldImport)) {
  css = css.replace(oldImport, newImport);
}

// Update :root variables
css = css.replace(/--kupas-forest-dark:\s*#0F3D2E;/g, '--kupas-forest-dark: var(--n-rimba, #1B3A2F);');
css = css.replace(/--kupas-cream-bg:\s*#FFF6E0;/g, '--kupas-cream-bg: var(--n-lontar, #FBF3E4);');
css = css.replace(/--kupas-cream-surface:\s*#FFFFFF;/g, '--kupas-cream-surface: var(--n-santan, #FFFDF7);');
css = css.replace(/--kupas-cream-alt:\s*#FBF0D3;/g, '--kupas-cream-alt: var(--n-lontar-gelap, #F1E4CB);');
css = css.replace(/--kupas-marigold:\s*#F59E0B;/g, '--kupas-marigold: var(--n-kunyit, #F2A541);');
css = css.replace(/--kupas-marigold-hover:\s*#D97706;/g, '--kupas-marigold-hover: var(--n-kunyit-tua, #C77F14);');
css = css.replace(/--kupas-marigold-light:\s*#FEF3C7;/g, '--kupas-marigold-light: var(--n-kunyit-muda, #FCE3B8);');
css = css.replace(/--kupas-coral:\s*#E11D48;/g, '--kupas-coral: var(--n-bata, #B3412E);');
css = css.replace(/--kupas-coral-soft:\s*#FFE4E6;/g, '--kupas-coral-soft: #FDE8E4;');
css = css.replace(/--kupas-water-blue:\s*#0284C7;/g, '--kupas-water-blue: var(--n-laut, #23708A);');
css = css.replace(/--kupas-water-hover:\s*#0369A1;/g, '--kupas-water-hover: var(--n-laut-tua, #17566B);');
css = css.replace(/--kupas-water-soft:\s*#E0F2FE;/g, '--kupas-water-soft: var(--n-laut-muda, #CFE6EC);');
css = css.replace(/--kupas-success:\s*#16A34A;/g, '--kupas-success: var(--n-pandan, #2E7D4F);');
css = css.replace(/--kupas-success-soft:\s*#DCFCE7;/g, '--kupas-success-soft: var(--n-pandan-muda, #CFE8D6);');
css = css.replace(/--kupas-danger:\s*#E11D48;/g, '--kupas-danger: var(--n-bata, #B3412E);');
css = css.replace(/--kupas-danger-soft:\s*#FFE4E6;/g, '--kupas-danger-soft: #FDE8E4;');

// Fonts
css = css.replace(/--font-heading:\s*'Fredoka', cursive, system-ui, -apple-system, sans-serif;/g, "--font-heading: 'Grandstander', 'Fredoka', cursive, system-ui, -apple-system, sans-serif;");
css = css.replace(/--font-body:\s*'Nunito', system-ui, -apple-system, sans-serif;/g, "--font-body: 'Atkinson Hyperlegible', 'Nunito', system-ui, -apple-system, sans-serif;");

// Borders & Shadows (Claymorphism)
css = css.replace(/--kupas-garis-tebal:\s*3\.5px solid var\(--kupas-forest-dark\);/g, '--kupas-garis-tebal: 2.5px solid var(--kupas-forest-dark);');
css = css.replace(/--kupas-garis-tipis:\s*2px solid var\(--kupas-forest-dark\);/g, '--kupas-garis-tipis: 1.5px solid var(--kupas-forest-dark);');
css = css.replace(/--kupas-bayangan-sm:\s*2\.5px 2\.5px 0px var\(--kupas-forest-dark\);/g, '--kupas-bayangan-sm: 0 3px 0 rgba(27, 58, 47, 0.16), 0 4px 10px rgba(27, 58, 47, 0.05);');
css = css.replace(/--kupas-bayangan:\s*4px 4px 0px var\(--kupas-forest-dark\), 0 8px 16px rgba\(15, 61, 46, 0\.08\);/g, '--kupas-bayangan: 0 6px 0 rgba(27, 58, 47, 0.12), 0 14px 28px rgba(27, 58, 47, 0.08), inset 0 2px 0 rgba(255, 255, 255, 0.85);');
css = css.replace(/--kupas-bayangan-lg:\s*6px 6px 0px var\(--kupas-forest-dark\), 0 14px 28px rgba\(15, 61, 46, 0\.12\);/g, '--kupas-bayangan-lg: 0 10px 0 rgba(27, 58, 47, 0.14), 0 22px 36px rgba(27, 58, 47, 0.10), inset 0 2px 0 rgba(255, 255, 255, 0.9);');
css = css.replace(/--kupas-bayangan-cta:\s*0 6px 0px #92400E, 0 12px 24px rgba\(245, 158, 11, 0\.35\);/g, '--kupas-bayangan-cta: 0 5px 0 var(--n-kunyit-tua, #C77F14), 0 10px 24px rgba(199, 127, 20, 0.32);');

fs.writeFileSync('assets/css/tema.css', css, 'utf8');
console.log('tema.css updated successfully!');

