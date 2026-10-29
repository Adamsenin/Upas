with open('scratch/audit_responsive.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('cdp.send("Emulation.setDeviceMetricsOverride"', 'cdp.send_cmd("Emulation.setDeviceMetricsOverride"')

with open('scratch/audit_responsive.py', 'w', encoding='utf-8') as f:
    f.write(c)

print("PATCHED_SEND_CMD")

