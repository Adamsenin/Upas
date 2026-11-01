import sys
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/audit_report_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 80)
print("RINGKASAN AUDIT RESPONSIVE MOBILE-FIRST PER HALAMAN")
print("=" * 80)

for page_name, viewports in data.items():
    print(f"\n[HALAMAN] {page_name}")
    hscroll_vps = []
    small_targets = {}
    small_fonts = set()
    overflow_details = []

    for vp_name, rep in viewports.items():
        if not rep:
            continue
        if rep.get('hasHScroll'):
            hscroll_vps.append(f"{vp_name} (docW={rep.get('docW')}px > w={rep.get('w')}px)")
            for el in rep.get('topOverflows', []):
                overflow_details.append(f"   - [{vp_name}] <{el['tag']}> id='{el['id']}' class='{el['className']}' (right={el['right']}px)")
        
        # small touches
        for st in rep.get('topSmallTouches', []):
            k = f"<{st['tag']} id='{st['id']}'> '{st['text']}' ({st['w']}x{st['h']}px)"
            small_targets[k] = small_targets.get(k, 0) + 1
        
        # small fonts
        for sf in rep.get('smallFontInputs', []):
            small_fonts.add(f"id='{sf['id']}' (font-size: {sf['fs']}px)")

    if hscroll_vps:
        print(f"  [X] SCROLL HORIZONTAL PADA: {', '.join(hscroll_vps)}")
        print("     Elemen penyebab overflow:")
        for od in overflow_details[:6]:
            print(f"  {od}")
    else:
        print("  [OK] Tidak ada horizontal scroll")

    if small_fonts:
        print(f"  [!] INPUT FONT SIZE < 16px (memicu auto zoom di iOS): {', '.join(list(small_fonts)[:4])}")

    if small_targets:
        print(f"  [!] TARGET SENTUH < 44-48px ({len(small_targets)} elemen ditemukan):")
        for st, count in list(small_targets.items())[:4]:
            print(f"     - {st}")
