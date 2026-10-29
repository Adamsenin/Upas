with open('scratch/run_test_acak_complete.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("document.getElementById('btn-mulai-duel-arena').click();", "document.getElementById('btn-mulai-duel').click();")

with open('scratch/run_test_acak_complete.py', 'w', encoding='utf-8') as f:
    f.write(c)

print("UPDATED_TEST_DUEL_ID")

