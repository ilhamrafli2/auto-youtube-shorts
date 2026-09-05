print("import os
from datetime import datetime

TOPIC = os.getenv("TOPIC", "Teknologi AI yang akan mengubah masa depan")

script = f"""
TOPIK: {TOPIC}

HOOK:
Tahukah kamu, teknologi ini bisa mengubah cara manusia hidup?

ISI:
{TOPIC} adalah salah satu perkembangan teknologi yang paling menarik saat ini.
Teknologi ini terus berkembang dan mulai digunakan di berbagai bidang.
Yang membuatnya menarik, kemampuannya semakin cepat dan semakin canggih.

PENUTUP:
Dan yang paling mengejutkan, ini baru permulaannya.
"""

print("=" * 50)
print("AUTO YOUTUBE SHORTS")
print("=" * 50)
print(script)
print("Generated:", datetime.now())")
